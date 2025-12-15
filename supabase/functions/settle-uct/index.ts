import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Minimum amount to settle
const MIN_SETTLEMENT = 1.0;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, amount, wallet_address } = await req.json();
    
    console.log(`Settlement request for user ${user.id}: action=${action}, amount=${amount}`);

    // Fetch current balance
    const { data: balance, error: balanceError } = await supabase
      .from('uct_balances')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (balanceError || !balance) {
      return new Response(
        JSON.stringify({ error: 'Balance not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (action) {
      case 'confirm_pending': {
        // STEP 1: Validate pending > 0
        if (balance.pending <= 0) {
          return new Response(
            JSON.stringify({ error: 'No UCT to claim', status: 'no_pending' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const amountClaimed = balance.pending;
        const newBalance = (balance.balance || 0) + amountClaimed;

        // Get wallet address for logging
        const { data: walletData } = await supabase
          .from('user_wallets')
          .select('wallet_address')
          .eq('user_id', user.id)
          .eq('is_primary', true)
          .maybeSingle();

        const walletAddress = walletData?.wallet_address || null;

        // STEP 2: Move pending → balance
        const { error: updateError } = await supabase
          .from('uct_balances')
          .update({
            balance: newBalance,
            pending: 0,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (updateError) throw updateError;

        // STEP 3: Log to focus_ledger
        await supabase.from('focus_ledger').insert({
          user_id: user.id,
          event_type: 'uct_claimed_offchain',
          payload: {
            wallet_address: walletAddress,
            amount_claimed: amountClaimed,
          },
          uct_reward: amountClaimed,
        });

        console.log(`UCT claimed off-chain: user=${user.id}, amount=${amountClaimed}, new_balance=${newBalance}`);

        // STEP 4: Return confirmation
        return new Response(
          JSON.stringify({
            success: true,
            claimed: amountClaimed,
            new_balance: newBalance,
            status: 'claim_confirmed',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'request_settlement': {
        // Create on-chain batch for settlement
        const settleAmount = amount || balance.available;
        
        if (settleAmount < MIN_SETTLEMENT) {
          return new Response(
            JSON.stringify({ error: `Minimum settlement is ${MIN_SETTLEMENT} UCT` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (settleAmount > balance.available) {
          return new Response(
            JSON.stringify({ error: 'Insufficient available balance' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get wallet address from profile or request
        let targetWallet = wallet_address;
        if (!targetWallet) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('wallet_address')
            .eq('id', user.id)
            .maybeSingle();
          targetWallet = profile?.wallet_address;
        }

        if (!targetWallet || !/^0x[a-fA-F0-9]{40}$/.test(targetWallet)) {
          return new Response(
            JSON.stringify({ error: 'Valid wallet address required for settlement' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check rate limit (max 3 settlements per hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { count } = await supabase
          .from('onchain_batches')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', oneHourAgo);

        if ((count || 0) >= 3) {
          return new Response(
            JSON.stringify({ error: 'Rate limit: max 3 settlements per hour' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Deduct from available balance first (prevent double-spend)
        const { error: deductError } = await supabase
          .from('uct_balances')
          .update({
            available: balance.available - settleAmount,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (deductError) throw deductError;

        // Create batch record
        const { data: batch, error: batchError } = await supabase
          .from('onchain_batches')
          .insert({
            user_id: user.id,
            amount: settleAmount,
            wallet_address: targetWallet,
            status: 'pending',
            network: 'base-sepolia',
          })
          .select()
          .single();

        if (batchError) {
          // Rollback the deduction
          await supabase
            .from('uct_balances')
            .update({
              available: balance.available,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);
          throw batchError;
        }

        // TODO: In production, this would trigger actual on-chain minting
        // For now, simulate successful mint after a delay
        console.log(`Settlement batch created: ${batch.id}, amount: ${settleAmount} UCT to ${targetWallet}`);

        // Simulate on-chain confirmation (mock for testnet)
        const mockTxHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
        
        await supabase
          .from('onchain_batches')
          .update({
            status: 'confirmed',
            tx_hash: mockTxHash,
            confirmed_at: new Date().toISOString(),
          })
          .eq('id', batch.id);

        // Update on_chain balance
        await supabase
          .from('uct_balances')
          .update({
            on_chain: balance.on_chain + settleAmount,
            last_settlement_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        // Create ledger entry
        await supabase.from('focus_ledger').insert({
          user_id: user.id,
          event_type: 'settlement',
          payload: {
            amount: settleAmount,
            wallet_address: targetWallet,
            tx_hash: mockTxHash,
            batch_id: batch.id,
          },
          uct_reward: -settleAmount, // Negative because it's leaving available
        });

        return new Response(
          JSON.stringify({
            success: true,
            action: 'request_settlement',
            batch_id: batch.id,
            amount: settleAmount,
            tx_hash: mockTxHash,
            wallet_address: targetWallet,
            network: 'base-sepolia',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_balance': {
        return new Response(
          JSON.stringify({
            success: true,
            balance: {
              available: balance.available,
              pending: balance.pending,
              on_chain: balance.on_chain,
              lifetime_earned: balance.lifetime_earned,
              wallet_address: balance.wallet_address,
            },
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use: confirm_pending, request_settlement, or get_balance' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Settlement error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
