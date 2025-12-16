import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Allowed origins for CORS
const allowedOrigins = [
  'https://c60e33de-49ec-4dd9-ac69-f86f4e5a2b40.lovableproject.com',
  'https://lovable.dev',
  /^https:\/\/.*\.lovable\.app$/,
  /^https:\/\/.*\.lovableproject\.com$/,
  'http://localhost:5173',
  'http://localhost:3000',
];

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return allowedOrigins.some(allowed => 
    typeof allowed === 'string' ? allowed === origin : allowed.test(origin)
  );
}

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = isAllowedOrigin(origin) ? origin! : '';
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// ============================================================
// SECURITY RULES - UCT TOKEN CLAIMING
// ============================================================
// 1. ALL token balance validation happens server-side only
// 2. ONLY this backend function can mint tokens
// 3. Claim record created as "pending" BEFORE minting
// 4. Database constraints prevent negative balances
// 5. Wallet addresses are validated (EVM format: 0x + 40 hex chars)
// 6. Rate limiting: max 3 claims per hour per user
// 7. All claims tracked in tokens_claims table
// ============================================================

const MAX_CLAIMS_PER_HOUR = 3;

// Validate EVM wallet address format
function isValidEVMAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  if (address.length !== 42) return false;
  if (!address.startsWith('0x')) return false;
  const hexPart = address.slice(2);
  return /^[0-9a-fA-F]{40}$/.test(hexPart);
}

// Mock blockchain transaction (replace with real implementation when UCT contract is deployed)
async function sendToBlockchain(walletAddress: string, amount: number): Promise<{ txHash: string; success: boolean }> {
  console.log(`[MOCK] Sending ${amount} UCT to ${walletAddress} on Base Sepolia`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Generate mock transaction hash
  const txHash = `0x${Array.from({ length: 64 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('')}`;
  
  console.log(`[MOCK] Transaction successful: ${txHash}`);
  
  return { txHash, success: true };
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Reject requests from disallowed origins
  if (!isAllowedOrigin(origin)) {
    console.warn(`[SECURITY] Blocked request from disallowed origin: ${origin}`);
    return new Response(
      JSON.stringify({ error: 'Forbidden' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // ============================================================
    // STEP 1: Authenticate user (server-side only)
    // ============================================================
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[SECURITY] No authorization header');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('[SECURITY] Invalid authentication:', userError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[CLAIM] Processing for user: ${user.id}`);

    // ============================================================
    // STEP 2: Rate limiting (3 claims per hour) using tokens_claims
    // ============================================================
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: recentClaims, error: claimsError } = await supabase
      .from('tokens_claims')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', oneHourAgo);

    if (claimsError) {
      console.error('[ERROR] Failed to check rate limit:', claimsError);
    }

    const claimCount = recentClaims?.length || 0;
    if (claimCount >= MAX_CLAIMS_PER_HOUR) {
      console.warn(`[SECURITY] Rate limit exceeded for user ${user.id}: ${claimCount} claims in last hour`);
      return new Response(
        JSON.stringify({ 
          error: 'Too many claim requests. Please wait before trying again.',
          retry_after_minutes: 60
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================================
    // STEP 3: Check for pending claims (prevent double-claim)
    // ============================================================
    const { data: pendingClaims, error: pendingError } = await supabase
      .from('tokens_claims')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'pending');

    if (pendingError) {
      console.error('[ERROR] Failed to check pending claims:', pendingError);
    }

    if (pendingClaims && pendingClaims.length > 0) {
      return new Response(
        JSON.stringify({ error: 'A claim is already in progress. Please wait for it to complete.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================================
    // STEP 4: Fetch wallet address from database (not from client)
    // ============================================================
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('wallet_address')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('[ERROR] Profile fetch failed:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify wallet' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profile?.wallet_address) {
      console.warn('[SECURITY] No wallet connected for user:', user.id);
      return new Response(
        JSON.stringify({ error: 'No wallet connected. Please connect your wallet first.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate wallet address format (EVM: 0x + 40 hex characters)
    if (!isValidEVMAddress(profile.wallet_address)) {
      console.error('[SECURITY] Invalid wallet address format:', profile.wallet_address);
      return new Response(
        JSON.stringify({ error: 'Invalid wallet address format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================================
    // STEP 5: Fetch token balance from database (not from client)
    // ============================================================
    const { data: tokenData, error: tokenError } = await supabase
      .from('tokens')
      .select('balance')
      .eq('user_id', user.id)
      .maybeSingle();

    if (tokenError) {
      console.error('[ERROR] Token fetch failed:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify balance' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentBalance = tokenData?.balance || 0;
    console.log(`[CLAIM] Current balance: ${currentBalance}`);

    // ============================================================
    // STEP 6: Validate there are tokens to claim
    // ============================================================
    if (currentBalance <= 0) {
      return new Response(
        JSON.stringify({ error: 'No earned UCT available to claim' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Claim entire balance
    const claimAmount = currentBalance;
    console.log(`[CLAIM] Processing claim: ${claimAmount} UCT for user ${user.id}`);

    // ============================================================
    // STEP 7: Create pending claim record
    // ============================================================
    const { data: claimRecord, error: createClaimError } = await supabase
      .from('tokens_claims')
      .insert({
        user_id: user.id,
        amount: claimAmount,
        status: 'pending',
        wallet_address: profile.wallet_address,
        network: 'base-sepolia'
      })
      .select()
      .single();

    if (createClaimError) {
      console.error('[ERROR] Failed to create claim record:', createClaimError);
      return new Response(
        JSON.stringify({ error: 'Failed to initiate claim. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[CLAIM] Created pending claim: ${claimRecord.id}`);

    // ============================================================
    // STEP 8: Deduct balance (optimistic lock)
    // ============================================================
    const { error: deductError } = await supabase
      .from('tokens')
      .update({
        balance: 0,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('balance', currentBalance); // Optimistic lock

    if (deductError) {
      console.error('[ERROR] Failed to deduct balance:', deductError);
      
      // Mark claim as failed
      await supabase
        .from('tokens_claims')
        .update({ status: 'failed', error_message: 'Balance deduction failed' })
        .eq('id', claimRecord.id);
      
      return new Response(
        JSON.stringify({ error: 'Failed to process claim. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[CLAIM] Balance deducted: ${claimAmount} UCT`);

    // ============================================================
    // STEP 9: Send to blockchain
    // ============================================================
    let txResult;
    try {
      txResult = await sendToBlockchain(profile.wallet_address, claimAmount);
    } catch (blockchainError) {
      console.error('[ERROR] Blockchain error:', blockchainError);
      
      // Rollback: restore balance and mark claim as failed
      await supabase
        .from('tokens')
        .update({
          balance: claimAmount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
      
      await supabase
        .from('tokens_claims')
        .update({ 
          status: 'failed', 
          error_message: 'Blockchain transaction failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', claimRecord.id);
      
      return new Response(
        JSON.stringify({ error: 'Blockchain transaction failed. Your balance has been restored.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!txResult.success) {
      // Rollback on failure
      await supabase
        .from('tokens')
        .update({
          balance: claimAmount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
      
      await supabase
        .from('tokens_claims')
        .update({ 
          status: 'failed', 
          error_message: 'Transaction unsuccessful',
          updated_at: new Date().toISOString()
        })
        .eq('id', claimRecord.id);
      
      return new Response(
        JSON.stringify({ error: 'Blockchain transaction failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================================
    // STEP 10: Mark claim as completed with tx hash
    // ============================================================
    const { error: completeError } = await supabase
      .from('tokens_claims')
      .update({
        status: 'completed',
        tx_hash: txResult.txHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', claimRecord.id);

    if (completeError) {
      console.error('[ERROR] Failed to update claim status:', completeError);
      // Non-critical - claim succeeded but status update failed
    }

    // Get total claimed for this user
    const { data: claimedData } = await supabase
      .from('tokens_claims')
      .select('amount')
      .eq('user_id', user.id)
      .eq('status', 'completed');

    const totalClaimed = claimedData?.reduce((sum, c) => sum + c.amount, 0) || 0;

    console.log(`[CLAIM] Success: ${claimAmount} UCT claimed, tx: ${txResult.txHash}`);

    // ============================================================
    // STEP 11: Return success
    // ============================================================
    return new Response(
      JSON.stringify({
        success: true,
        claim_id: claimRecord.id,
        amount_claimed: claimAmount,
        tx_hash: txResult.txHash,
        wallet_address: profile.wallet_address,
        network: 'base-sepolia',
        explorer_url: `https://sepolia.basescan.org/tx/${txResult.txHash}`,
        new_balance: 0,
        total_claimed: totalClaimed,
        message: `Successfully sent ${claimAmount} UCT to your wallet`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ERROR] Unexpected claim error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
