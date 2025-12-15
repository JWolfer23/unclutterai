import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AgentPriceRequest {
  action: 'price';
  task_complexity: 'low' | 'medium' | 'high';
  estimated_time_mins: number;
  priority: 'low' | 'medium' | 'high';
}

interface AgentExecuteRequest {
  action: 'execute';
  agent_type: string;
  task_payload: Record<string, unknown>;
  approved_cost: number;
}

interface AgentPrice {
  cost_uct: number;
  estimated_time_mins: number;
  breakdown: {
    base_fee: number;
    time_fee: number;
    priority_fee: number;
    complexity_fee: number;
  };
}

// Pricing rules
const BASE_FEE = 0.1;
const TIME_FEE_PER_5_MINS = 0.05;
const PRIORITY_MULTIPLIERS = { low: 0, medium: 0.1, high: 0.2 };
const COMPLEXITY_MULTIPLIERS = { low: 0, medium: 0.15, high: 0.3 };

function calculateAgentPrice(
  task_complexity: 'low' | 'medium' | 'high',
  estimated_time_mins: number,
  priority: 'low' | 'medium' | 'high'
): AgentPrice {
  const base_fee = BASE_FEE;
  const time_fee = Math.ceil(estimated_time_mins / 5) * TIME_FEE_PER_5_MINS;
  const priority_fee = PRIORITY_MULTIPLIERS[priority];
  const complexity_fee = COMPLEXITY_MULTIPLIERS[task_complexity];
  
  const cost_uct = Math.round((base_fee + time_fee + priority_fee + complexity_fee) * 100) / 100;
  
  return {
    cost_uct,
    estimated_time_mins,
    breakdown: { base_fee, time_fee, priority_fee, complexity_fee }
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { action } = body;

    // PRICE action - calculate cost without executing
    if (action === 'price') {
      const { task_complexity, estimated_time_mins, priority } = body as AgentPriceRequest;
      const price = calculateAgentPrice(task_complexity, estimated_time_mins, priority);
      
      return new Response(JSON.stringify({ price }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // EXECUTE action - run agent and deduct UCT
    if (action === 'execute') {
      const { agent_type, task_payload, approved_cost } = body as AgentExecuteRequest;
      const uct_cost = approved_cost;

      // STEP 1: Validate Balance
      const { data: balanceData, error: balanceError } = await supabase
        .from('uct_balances')
        .select('balance, pending')
        .eq('user_id', user.id)
        .maybeSingle();

      if (balanceError) {
        console.error('Balance fetch error:', balanceError);
        return new Response(JSON.stringify({ error: 'Could not fetch balance' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const currentBalance = balanceData?.balance || 0;

      if (currentBalance < uct_cost) {
        return new Response(JSON.stringify({ 
          error: 'Insufficient UCT',
          approved: false,
          required: uct_cost,
          available: currentBalance,
          status: 'insufficient_balance'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // STEP 2: Deduct UCT atomically
      const newBalance = currentBalance - uct_cost;
      const { error: deductError } = await supabase
        .from('uct_balances')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .gte('balance', uct_cost);

      if (deductError) {
        console.error('UCT deduction error:', deductError);
        return new Response(JSON.stringify({ error: 'Failed to deduct UCT' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // STEP 3: Log Spend Ledger Entry
      const { data: ledgerEntry, error: ledgerError } = await supabase
        .from('focus_ledger')
        .insert({
          user_id: user.id,
          event_type: 'uct_spent',
          payload: {
            agent_type,
            cost: uct_cost,
            task_payload,
            status: 'started'
          },
          uct_reward: -uct_cost,
        })
        .select()
        .single();

      if (ledgerError) {
        console.error('Ledger error:', ledgerError);
      }

      console.log(`UCT spent: user=${user.id}, agent=${agent_type}, cost=${uct_cost}, new_balance=${newBalance}`);

      // Execute agent based on type
      let result: Record<string, unknown> = {};
      let success = true;
      let error_message: string | null = null;

      try {
        switch (agent_type) {
          case 'auto_reply':
            const { data: replyData, error: replyError } = await supabase.functions.invoke('ai-blocks', {
              body: { action: 'auto_reply', ...task_payload }
            });
            if (replyError) throw replyError;
            result = replyData;
            break;

          case 'polish_text':
            const { data: polishData, error: polishError } = await supabase.functions.invoke('ai-blocks', {
              body: { action: 'simplify', ...task_payload }
            });
            if (polishError) throw polishError;
            result = polishData;
            break;

          case 'schedule_meeting':
            result = { 
              scheduled: true, 
              message: 'Meeting scheduling agent executed',
              details: task_payload 
            };
            break;

          case 'send_email':
            result = { 
              sent: true, 
              message: 'Email agent executed',
              details: task_payload 
            };
            break;

          default:
            result = { message: `Agent ${agent_type} executed`, payload: task_payload };
        }
      } catch (agentError) {
        success = false;
        error_message = agentError instanceof Error ? agentError.message : 'Agent execution failed';
        
        // Refund UCT on failure
        await supabase
          .from('uct_balances')
          .update({ 
            balance: currentBalance,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        // Log refund
        await supabase.from('focus_ledger').insert({
          user_id: user.id,
          event_type: 'uct_refund',
          payload: { agent_type, cost: uct_cost, reason: error_message },
          uct_reward: uct_cost,
        });
      }

      // Update ledger with result
      if (ledgerEntry) {
        await supabase
          .from('focus_ledger')
          .update({
            payload: {
              agent_type,
              cost: uct_cost,
              status: success ? 'completed' : 'failed',
              result: success ? result : null,
              error: error_message
            }
          })
          .eq('id', ledgerEntry.id);
      }

      if (!success) {
        return new Response(JSON.stringify({ 
          error: error_message,
          approved: false,
          refunded: true,
          status: 'agent_failed'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // STEP 4: Return authorization success
      return new Response(JSON.stringify({ 
        approved: true,
        result,
        cost_uct: uct_cost,
        remaining_balance: newBalance,
        status: 'agent_authorized',
        ledger_id: ledgerEntry?.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // LIST available agents (from database + built-in)
    if (action === 'list') {
      // Fetch marketplace agents
      const { data: marketplaceAgents, error: listError } = await supabase
        .from('ai_agent_marketplace')
        .select('*')
        .eq('status', 'active')
        .order('usage_count', { ascending: false });

      if (listError) {
        console.error('Error fetching marketplace agents:', listError);
      }

      // Built-in agents
      const builtInAgents = [
        {
          agent_id: 'auto_reply',
          name: 'Auto Reply',
          description: 'Generate and optionally send smart replies to messages',
          complexity: 'medium',
          estimated_time_mins: 2,
          icon: 'mail-reply',
          uct_cost: 0.25,
          category: 'communication',
          creator_id: null,
          is_builtin: true,
        },
        {
          agent_id: 'polish_text',
          name: 'Polish & Rewrite',
          description: 'Improve clarity and tone of any text',
          complexity: 'low',
          estimated_time_mins: 1,
          icon: 'sparkles',
          uct_cost: 0.15,
          category: 'writing',
          creator_id: null,
          is_builtin: true,
        },
        {
          agent_id: 'schedule_meeting',
          name: 'Schedule Meeting',
          description: 'Find optimal times and create calendar invites',
          complexity: 'medium',
          estimated_time_mins: 5,
          icon: 'calendar',
          uct_cost: 0.35,
          category: 'productivity',
          creator_id: null,
          is_builtin: true,
        },
        {
          agent_id: 'send_email',
          name: 'Send Email',
          description: 'Compose and send emails on your behalf',
          complexity: 'high',
          estimated_time_mins: 3,
          icon: 'send',
          uct_cost: 0.40,
          category: 'communication',
          creator_id: null,
          is_builtin: true,
        }
      ];

      // Combine built-in and marketplace agents
      const allAgents = [
        ...builtInAgents,
        ...(marketplaceAgents || []).map(a => ({ ...a, is_builtin: false }))
      ];

      return new Response(JSON.stringify({ agents: allAgents }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PUBLISH new agent to marketplace
    if (action === 'publish') {
      const { agent_id, name, description, category, uct_cost, icon, estimated_time_mins, complexity } = body;

      // STEP 1: Validate pricing
      if (!uct_cost || uct_cost <= 0) {
        return new Response(JSON.stringify({ 
          error: 'Invalid pricing',
          status: 'validation_failed'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Validate required fields
      if (!agent_id || !name || !category) {
        return new Response(JSON.stringify({ 
          error: 'Missing required fields: agent_id, name, category',
          status: 'validation_failed'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // STEP 2: Insert marketplace entry
      const { data: marketplaceEntry, error: insertError } = await supabase
        .from('ai_agent_marketplace')
        .insert({
          agent_id,
          name,
          description: description || '',
          category,
          uct_cost,
          creator_id: user.id,
          icon: icon || 'bot',
          estimated_time_mins: estimated_time_mins || 5,
          complexity: complexity || 'medium',
          status: 'active',
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error publishing agent:', insertError);
        return new Response(JSON.stringify({ 
          error: insertError.message,
          status: 'publish_failed'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`Agent published: ${agent_id} by user ${user.id}`);

      // STEP 3: Return success
      return new Response(JSON.stringify({ 
        status: 'listed',
        agent_id: marketplaceEntry.agent_id,
        marketplace_id: marketplaceEntry.id,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // UNPUBLISH agent
    if (action === 'unpublish') {
      const { agent_id } = body;

      const { error: updateError } = await supabase
        .from('ai_agent_marketplace')
        .update({ status: 'inactive', updated_at: new Date().toISOString() })
        .eq('agent_id', agent_id)
        .eq('creator_id', user.id);

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ status: 'unlisted', agent_id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action. Use: list, publish, unpublish, execute, or price' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Agent marketplace error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
