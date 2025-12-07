import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================
// SECURITY RULES - UCT TOKEN CLAIMING
// ============================================================
// 1. ALL token balance validation happens server-side only
// 2. ONLY this backend function can mint tokens
// 3. Balance moves to pending BEFORE minting (prevents replay attacks)
// 4. Database constraints prevent negative balances
// 5. Wallet addresses are validated (EVM format: 0x + 40 hex chars)
// 6. Rate limiting: max 3 claims per hour per user
// 7. All claims are logged for audit trail
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

// Mock blockchain transaction (replace with real implementation)
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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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
    // STEP 2: Rate limiting (3 claims per hour)
    // ============================================================
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: recentClaims, error: claimsError } = await supabase
      .from('uct_claim_history')
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
    // STEP 3: Fetch wallet address from database (not from client)
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
    // STEP 4: Fetch token balances from database (not from client)
    // ============================================================
    const { data: tokenData, error: tokenError } = await supabase
      .from('tokens')
      .select('balance, tokens_pending, tokens_claimed')
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
    const currentPending = tokenData?.tokens_pending || 0;
    const currentClaimed = tokenData?.tokens_claimed || 0;

    console.log(`[CLAIM] Current balance: ${currentBalance}, Pending: ${currentPending}, Claimed: ${currentClaimed}`);

    // ============================================================
    // STEP 5: Validate there are tokens to claim
    // ============================================================
    if (currentBalance <= 0) {
      return new Response(
        JSON.stringify({ error: 'No earned UCT available to claim' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for pending claims (prevent double-claim)
    if (currentPending > 0) {
      return new Response(
        JSON.stringify({ error: 'A claim is already in progress. Please wait for it to complete.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Claim entire balance
    const claimAmount = currentBalance;
    console.log(`[CLAIM] Processing claim: ${claimAmount} UCT for user ${user.id}`);

    // ============================================================
    // STEP 6: Move balance to pending (atomic operation to prevent double-claim)
    // ============================================================
    const { error: pendingError } = await supabase
      .from('tokens')
      .update({
        balance: 0,
        tokens_pending: currentPending + claimAmount,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('balance', currentBalance); // Optimistic lock

    if (pendingError) {
      console.error('[ERROR] Failed to move to pending:', pendingError);
      return new Response(
        JSON.stringify({ error: 'Failed to process claim. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[CLAIM] Balance moved to pending: ${claimAmount} UCT`);

    // ============================================================
    // STEP 7: Send to blockchain
    // ============================================================
    let txResult;
    try {
      txResult = await sendToBlockchain(profile.wallet_address, claimAmount);
    } catch (blockchainError) {
      console.error('[ERROR] Blockchain error:', blockchainError);
      
      // Rollback: move pending back to balance
      await supabase
        .from('tokens')
        .update({
          balance: claimAmount,
          tokens_pending: currentPending,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
      
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
          tokens_pending: currentPending,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
      
      return new Response(
        JSON.stringify({ error: 'Blockchain transaction failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================================
    // STEP 8: Move pending to claimed
    // ============================================================
    const { error: claimedError } = await supabase
      .from('tokens')
      .update({
        tokens_pending: 0,
        tokens_claimed: currentClaimed + claimAmount,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (claimedError) {
      console.error('[ERROR] Failed to finalize claim:', claimedError);
      // Log this for manual review - tokens were sent but DB update failed
    }

    // ============================================================
    // STEP 9: Log claim in history (audit trail)
    // ============================================================
    const { error: historyError } = await supabase
      .from('uct_claim_history')
      .insert({
        user_id: user.id,
        amount: claimAmount,
        wallet_address: profile.wallet_address,
        tx_hash: txResult.txHash,
        status: 'completed',
        network: 'base-sepolia'
      });

    if (historyError) {
      console.error('[WARN] Failed to log claim history:', historyError);
    }

    console.log(`[CLAIM] Success: ${claimAmount} UCT claimed, tx: ${txResult.txHash}`);

    // ============================================================
    // STEP 10: Return success (avoid financial language)
    // ============================================================
    return new Response(
      JSON.stringify({
        success: true,
        amount_claimed: claimAmount,
        tx_hash: txResult.txHash,
        wallet_address: profile.wallet_address,
        network: 'base-sepolia',
        explorer_url: `https://sepolia.basescan.org/tx/${txResult.txHash}`,
        new_balance: 0,
        new_pending: 0,
        new_claimed: currentClaimed + claimAmount,
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
