import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ClaimRequest {
  amount: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('User auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing claim for user: ${user.id}`);

    // Parse request body
    const { amount }: ClaimRequest = await req.json();

    // Validate amount
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      console.error('Invalid amount:', amount);
      return new Response(
        JSON.stringify({ error: 'Amount must be a positive number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (amount > 10000) {
      console.error('Amount too large:', amount);
      return new Response(
        JSON.stringify({ error: 'Maximum claim amount is 10,000 UCT per transaction' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch user's wallet address
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('wallet_address')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.wallet_address) {
      console.error('Wallet not found:', profileError);
      return new Response(
        JSON.stringify({ error: 'No wallet connected. Please connect your wallet first.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch user's off-chain UCT balance
    const { data: tokenData, error: tokenError } = await supabase
      .from('tokens')
      .select('balance')
      .eq('user_id', user.id)
      .maybeSingle();

    const currentBalance = tokenData?.balance || 0;
    console.log(`Current off-chain balance: ${currentBalance}, Requested: ${amount}`);

    if (currentBalance < amount) {
      return new Response(
        JSON.stringify({ 
          error: `Insufficient balance. You have ${currentBalance} UCT available.`,
          available_balance: currentBalance
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // === MOCK ON-CHAIN MINTING ===
    // In production, this would call the ERC-20 contract's mint() function
    // using a server-side signer with minting permissions
    console.log(`[MOCK] Minting ${amount} UCT to wallet: ${profile.wallet_address}`);
    
    // Generate mock transaction hash
    const mockTxHash = `0x${Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('')}`;
    
    console.log(`[MOCK] Transaction hash: ${mockTxHash}`);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // === BURN VIRTUAL UCT (reduce off-chain balance) ===
    const newBalance = currentBalance - amount;
    
    const { error: updateError } = await supabase
      .from('tokens')
      .update({ 
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Failed to update balance:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to process claim. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the claim in history
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
      console.error('Failed to log claim history:', historyError);
      // Non-critical error, continue
    }

    console.log(`Claim successful: ${amount} UCT to ${profile.wallet_address}`);

    return new Response(
      JSON.stringify({
        success: true,
        amount_claimed: amount,
        new_offchain_balance: newBalance,
        onchain_tx_hash: mockTxHash,
        wallet_address: profile.wallet_address,
        network: 'base-sepolia',
        explorer_url: `https://sepolia.basescan.org/tx/${mockTxHash}`,
        message: '[TESTNET] Mock minting successful. Real minting will be enabled when UCT contract is deployed.'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Claim UCT error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
