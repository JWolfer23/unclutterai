import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BURN_RATES = {
  batch_process: { base: 0.5, perItem: 0.02 },
  priority_override: { flat: 1.0 },
  extended_focus: { perHour: 0.25 },
  high_volume: { multiplier: 1.5 },
};

function calculateBurnCost(
  burnType: string,
  context?: { itemCount?: number; hours?: number; baseCost?: number }
): number {
  switch (burnType) {
    case 'batch_process':
      return BURN_RATES.batch_process.base + (context?.itemCount || 0) * BURN_RATES.batch_process.perItem;
    case 'priority_override':
      return BURN_RATES.priority_override.flat;
    case 'extended_focus':
      return (context?.hours || 1) * BURN_RATES.extended_focus.perHour;
    case 'high_volume':
      return (context?.baseCost || 1) * BURN_RATES.high_volume.multiplier;
    default:
      return 0;
  }
}

Deno.serve(async (req) => {
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

    const { action, burn_type, context } = await req.json();
    console.log(`[uct-burn] Action: ${action}, User: ${user.id}, Type: ${burn_type}`);

    switch (action) {
      case 'estimate': {
        if (!burn_type) {
          return new Response(JSON.stringify({ error: 'Burn type required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const cost = calculateBurnCost(burn_type, context);
        
        // Get user balance for affordability check
        const { data: balance } = await supabase
          .from('uct_balances')
          .select('balance')
          .eq('user_id', user.id)
          .single();

        const canAfford = (balance?.balance || 0) >= cost;

        return new Response(JSON.stringify({
          burn_type,
          estimated_cost: cost,
          available_balance: balance?.balance || 0,
          can_afford: canAfford,
          context,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'burn': {
        if (!burn_type) {
          return new Response(JSON.stringify({ error: 'Burn type required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const cost = calculateBurnCost(burn_type, context);

        // Check balance
        const { data: balance } = await supabase
          .from('uct_balances')
          .select('balance, total_burned')
          .eq('user_id', user.id)
          .single();

        if (!balance || (balance.balance || 0) < cost) {
          return new Response(JSON.stringify({ 
            error: 'Insufficient balance',
            required: cost,
            available: balance?.balance || 0
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Deduct from balance and add to total_burned
        const { error: updateError } = await supabase
          .from('uct_balances')
          .update({
            balance: (balance.balance || 0) - cost,
            total_burned: (balance.total_burned || 0) + cost,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (updateError) throw updateError;

        // Log to burn log
        const { error: logError } = await supabase.from('uct_burn_log').insert({
          user_id: user.id,
          amount: cost,
          burn_type,
          action_context: context || {},
        });

        if (logError) console.error('[uct-burn] Log error:', logError);

        // Log to focus_ledger
        await supabase.from('focus_ledger').insert({
          user_id: user.id,
          event_type: 'uct_burned',
          payload: { burn_type, amount: cost, context },
        });

        console.log(`[uct-burn] Burned ${cost} UCT for ${burn_type}`);

        return new Response(JSON.stringify({
          success: true,
          burned: cost,
          burn_type,
          new_balance: (balance.balance || 0) - cost,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_history': {
        const { data: history } = await supabase
          .from('uct_burn_log')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        const { data: balance } = await supabase
          .from('uct_balances')
          .select('total_burned')
          .eq('user_id', user.id)
          .single();

        return new Response(JSON.stringify({
          history: history || [],
          total_burned: balance?.total_burned || 0,
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
    console.error('[uct-burn] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
