import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

const STAKE_TIERS = {
  tier_1: { amount: 500, capability: 'auto_close_emails' },
  tier_2: { amount: 1500, capability: 'auto_schedule' },
  tier_3: { amount: 3000, capability: 'full_autonomy' },
};

const UNSTAKE_COOLDOWN_DAYS = 7;

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, tier_id, stake_id } = await req.json();
    console.log(`[uct-stake] Action: ${action}, User: ${user.id}, Tier: ${tier_id}`);

    switch (action) {
      case 'stake': {
        const tier = STAKE_TIERS[tier_id as keyof typeof STAKE_TIERS];
        if (!tier) {
          return new Response(JSON.stringify({ error: 'Invalid tier' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check user has sufficient balance
        const { data: balance } = await supabase
          .from('uct_balances')
          .select('balance, staked')
          .eq('user_id', user.id)
          .single();

        if (!balance || (balance.balance || 0) < tier.amount) {
          return new Response(JSON.stringify({ 
            error: 'Insufficient balance', 
            required: tier.amount,
            available: balance?.balance || 0 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check if user already has this tier staked
        const { data: existingStake } = await supabase
          .from('uct_stakes')
          .select('id')
          .eq('user_id', user.id)
          .eq('stake_tier', tier_id)
          .eq('status', 'active')
          .single();

        if (existingStake) {
          return new Response(JSON.stringify({ error: 'Tier already staked' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Create stake record and update balance atomically
        const { error: stakeError } = await supabase.from('uct_stakes').insert({
          user_id: user.id,
          amount: tier.amount,
          stake_tier: tier_id,
          capability: tier.capability,
          status: 'active',
        });

        if (stakeError) throw stakeError;

        // Update balance: move from available to staked
        const { error: updateError } = await supabase
          .from('uct_balances')
          .update({
            balance: (balance.balance || 0) - tier.amount,
            staked: (balance.staked || 0) + tier.amount,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (updateError) throw updateError;

        // Log to focus_ledger
        await supabase.from('focus_ledger').insert({
          user_id: user.id,
          event_type: 'uct_staked',
          payload: { tier_id, amount: tier.amount, capability: tier.capability },
        });

        console.log(`[uct-stake] Successfully staked ${tier.amount} UCT for ${tier.capability}`);

        return new Response(JSON.stringify({ 
          success: true, 
          staked: tier.amount,
          capability: tier.capability 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'unstake_request': {
        if (!stake_id) {
          return new Response(JSON.stringify({ error: 'Stake ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const unlocks_at = new Date();
        unlocks_at.setDate(unlocks_at.getDate() + UNSTAKE_COOLDOWN_DAYS);

        const { error } = await supabase
          .from('uct_stakes')
          .update({ 
            status: 'unstaking',
            unlocks_at: unlocks_at.toISOString()
          })
          .eq('id', stake_id)
          .eq('user_id', user.id)
          .eq('status', 'active');

        if (error) throw error;

        console.log(`[uct-stake] Unstake requested, unlocks at ${unlocks_at.toISOString()}`);

        return new Response(JSON.stringify({ 
          success: true, 
          unlocks_at: unlocks_at.toISOString() 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'unstake_complete': {
        if (!stake_id) {
          return new Response(JSON.stringify({ error: 'Stake ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get stake record
        const { data: stake } = await supabase
          .from('uct_stakes')
          .select('*')
          .eq('id', stake_id)
          .eq('user_id', user.id)
          .eq('status', 'unstaking')
          .single();

        if (!stake) {
          return new Response(JSON.stringify({ error: 'No unstaking stake found' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check cooldown has passed
        if (stake.unlocks_at && new Date(stake.unlocks_at) > new Date()) {
          return new Response(JSON.stringify({ 
            error: 'Cooldown not complete',
            unlocks_at: stake.unlocks_at 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Update stake status
        await supabase
          .from('uct_stakes')
          .update({ status: 'unstaked' })
          .eq('id', stake_id);

        // Return to available balance
        const { data: balance } = await supabase
          .from('uct_balances')
          .select('balance, staked')
          .eq('user_id', user.id)
          .single();

        await supabase
          .from('uct_balances')
          .update({
            balance: (balance?.balance || 0) + stake.amount,
            staked: Math.max(0, (balance?.staked || 0) - stake.amount),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        // Log to focus_ledger
        await supabase.from('focus_ledger').insert({
          user_id: user.id,
          event_type: 'uct_unstaked',
          payload: { stake_id, amount: stake.amount, capability: stake.capability },
        });

        console.log(`[uct-stake] Unstake complete, ${stake.amount} UCT returned`);

        return new Response(JSON.stringify({ 
          success: true, 
          returned: stake.amount 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'revoke': {
        // System-triggered trust revocation (temporary)
        if (!stake_id) {
          return new Response(JSON.stringify({ error: 'Stake ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { reason } = await req.json();

        await supabase
          .from('uct_stakes')
          .update({ 
            status: 'revoked',
            revoked_at: new Date().toISOString(),
            revoked_reason: reason || 'Trust boundary exceeded',
          })
          .eq('id', stake_id)
          .eq('user_id', user.id);

        console.log(`[uct-stake] Stake revoked: ${reason}`);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_stakes': {
        const { data: stakes } = await supabase
          .from('uct_stakes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        const activeStakes = stakes?.filter(s => s.status === 'active') || [];
        const capabilities = activeStakes.map(s => s.capability);
        const totalStaked = activeStakes.reduce((sum, s) => sum + (s.amount || 0), 0);

        // Calculate autonomy level (highest tier)
        let autonomyLevel = 0;
        if (capabilities.includes('full_autonomy')) autonomyLevel = 3;
        else if (capabilities.includes('auto_schedule')) autonomyLevel = 2;
        else if (capabilities.includes('auto_close_emails')) autonomyLevel = 1;

        return new Response(JSON.stringify({
          stakes: stakes || [],
          activeStakes,
          capabilities,
          totalStaked,
          autonomyLevel,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('[uct-stake] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
