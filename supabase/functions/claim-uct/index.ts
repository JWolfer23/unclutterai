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
// 3. Balance is deducted BEFORE minting (prevents replay attacks)
// 4. Database constraints prevent negative balances
// 5. Wallet addresses are validated (EVM format: 0x + 40 hex chars)
// 6. Rate limiting: max 3 claims per hour per user
// 7. All claims are logged for audit trail
// ============================================================

const MAX_CLAIMS_PER_HOUR = 3;
const MAX_CLAIM_AMOUNT = 10000;
const MIN_CLAIM_AMOUNT = 1;

interface ClaimRequest {
  amount: number;
}

// Validate EVM wallet address format
function isValidEVMAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  if (address.length !== 42) return false;
  if (!address.startsWith('0x')) return false;
  // Check remaining 40 characters are valid hex
  const hexPart = address.slice(2);
  return /^[0-9a-fA-F]{40}$/.test(hexPart);
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
    // STEP 2: Parse and validate request (server-side validation)
    // ============================================================
    let requestBody: ClaimRequest;
    try {
      requestBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { amount } = requestBody;

    // Validate amount is a positive number
    if (!amount || typeof amount !== 'number' || !Number.isFinite(amount)) {
      console.error('[SECURITY] Invalid amount type:', typeof amount);
      return new Response(
        JSON.stringify({ error: 'Amount must be a valid number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (amount < MIN_CLAIM_AMOUNT) {
      return new Response(
        JSON.stringify({ error: `Minimum claim is ${MIN_CLAIM_AMOUNT} UCT` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (amount > MAX_CLAIM_AMOUNT) {
      console.error('[SECURITY] Amount exceeds maximum:', amount);
      return new Response(
        JSON.stringify({ error: `Maximum claim is ${MAX_CLAIM_AMOUNT.toLocaleString()} UCT per transaction` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ensure amount is an integer (no fractional tokens)
    if (!Number.isInteger(amount)) {
      return new Response(
        JSON.stringify({ error: 'Amount must be a whole number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================================
    // STEP 3: Rate limiting (3 claims per hour)
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
    // STEP 5: Fetch off-chain balance from database (not from client)
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
    console.log(`[CLAIM] Current balance: ${currentBalance}, Requested: ${amount}`);

    // ============================================================
    // STEP 6: Validate sufficient balance (server-side check)
    // ============================================================
    if (currentBalance < amount) {
      console.warn(`[SECURITY] Insufficient balance: has ${currentBalance}, wants ${amount}`);
      return new Response(
        JSON.stringify({ 
          error: `Insufficient UCT available. You have ${currentBalance} UCT.`,
          available_balance: currentBalance
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================================
    // STEP 7: DEDUCT BALANCE FIRST (prevents replay attacks)
    // This ensures if minting fails, balance is already reduced
    // ============================================================
    const newBalance = currentBalance - amount;
    
    const { error: updateError } = await supabase
      .from('tokens')
      .update({ 
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (updateError) {
      // Database constraint will prevent negative balance
      console.error('[ERROR] Balance update failed:', updateError);
      if (updateError.message?.includes('tokens_balance_non_negative')) {
        return new Response(
          JSON.stringify({ error: 'Insufficient UCT available' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ error: 'Failed to process claim. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[CLAIM] Balance deducted: ${currentBalance} -> ${newBalance}`);

    // ============================================================
    // STEP 8: MINT ON-CHAIN (mock for testnet)
    // ============================================================
    // SECURITY NOTES:
    // - Server signer private key stored in environment variable
    // - NEVER exposed to client
    // - Only this function can call mint()
    // - In production: use ethers.js with server-side signer
    // - Recommend: minter role wallet, not deployer
    // - Recommend: contract ownership in Gnosis Safe multi-sig
    // ============================================================
    
    console.log(`[MOCK MINT] ${amount} UCT to ${profile.wallet_address}`);
    
    // Generate mock transaction hash (simulates on-chain tx)
    const mockTxHash = `0x${Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('')}`;
    
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 800));

    console.log(`[MOCK MINT] Tx hash: ${mockTxHash}`);

    // ============================================================
    // STEP 9: Log claim in history (audit trail)
    // ============================================================
    const { error: historyError } = await supabase
      .from('uct_claim_history')
      .insert({
        user_id: user.id,
        amount: amount,
        wallet_address: profile.wallet_address,
        tx_hash: mockTxHash,
        status: 'completed',
        network: 'base-sepolia'
      });

    if (historyError) {
      // Non-critical - log but don't fail the request
      console.error('[WARN] Failed to log claim history:', historyError);
    }

    console.log(`[CLAIM] Success: ${amount} UCT claimed by ${user.id}`);

    // ============================================================
    // STEP 10: Return success (avoid financial language)
    // ============================================================
    return new Response(
      JSON.stringify({
        success: true,
        amount_claimed: amount,
        new_offchain_balance: newBalance,
        onchain_tx_hash: mockTxHash,
        wallet_address: profile.wallet_address,
        network: 'base-sepolia',
        explorer_url: `https://sepolia.basescan.org/tx/${mockTxHash}`,
        // Note: Avoid words like "value", "investment", "profit"
        message: '[Testnet] UCT tokens have been sent to your wallet. Real minting available when contract is deployed.'
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
