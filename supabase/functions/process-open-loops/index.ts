import "https://deno.land/x/xhr@0.1.0/mod.ts";
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

interface OpenLoop {
  id: string;
  type: 'email' | 'task' | 'draft';
  source_id: string;
  summary: string;
  action_required: string | null;
  deadline_sensitivity: 'urgent' | 'soon' | 'flexible' | 'none';
  emotional_weight?: 'heavy' | 'neutral' | 'light';
  suggested_action: 'reply' | 'schedule' | 'ignore' | 'archive' | 'create_task';
  effort_estimate: number;
  group: 'quick_closes' | 'decisions_needed' | 'waiting_on_others' | 'noise';
  original_data?: any;
}

async function simplifyWithAI(items: any[]): Promise<OpenLoop[]> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY || items.length === 0) {
    // Fallback: create basic loops without AI
    return items.map((item, index) => ({
      id: `loop-${index}`,
      type: item.type || 'email',
      source_id: item.id,
      summary: item.subject || item.title || 'Untitled item',
      action_required: item.content?.substring(0, 100) || null,
      deadline_sensitivity: item.priority === 'high' ? 'urgent' : 
                           item.priority === 'medium' ? 'soon' : 'flexible',
      emotional_weight: 'neutral',
      suggested_action: item.is_spam ? 'archive' : 'reply',
      effort_estimate: 2,
      group: 'quick_closes',
      original_data: item
    }));
  }

  try {
    const prompt = `Analyze these items and for each, provide a JSON array with objects containing:
- summary: 1 sentence describing the item
- action_required: what needs to be done (or null)
- deadline_sensitivity: "urgent", "soon", "flexible", or "none"
- emotional_weight: "heavy", "neutral", or "light"
- suggested_action: "reply", "schedule", "ignore", "archive", or "create_task"
- effort_estimate: 0-10 scale

Items:
${JSON.stringify(items.slice(0, 20), null, 2)}

Return ONLY valid JSON array.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an AI that analyzes communication items and suggests actions. Return only valid JSON." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`AI request failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '[]';
    
    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const analyzed = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return items.map((item, index) => {
      const analysis = analyzed[index] || {};
      return {
        id: `loop-${item.id}`,
        type: item.type || 'email',
        source_id: item.id,
        summary: analysis.summary || item.subject || item.title || 'Item needs review',
        action_required: analysis.action_required || null,
        deadline_sensitivity: analysis.deadline_sensitivity || 'flexible',
        emotional_weight: analysis.emotional_weight || 'neutral',
        suggested_action: analysis.suggested_action || 'reply',
        effort_estimate: analysis.effort_estimate || 2,
        group: 'quick_closes', // Will be set in grouping phase
        original_data: item
      };
    });
  } catch (error) {
    console.error('AI simplification error:', error);
    // Fallback to basic processing
    return items.map((item, index) => ({
      id: `loop-${item.id}`,
      type: item.type || 'email',
      source_id: item.id,
      summary: item.subject || item.title || 'Item needs review',
      action_required: null,
      deadline_sensitivity: 'flexible',
      emotional_weight: 'neutral',
      suggested_action: 'reply',
      effort_estimate: 2,
      group: 'quick_closes',
      original_data: item
    }));
  }
}

function groupLoops(loops: OpenLoop[]): OpenLoop[] {
  return loops.map(loop => {
    let group: OpenLoop['group'] = 'quick_closes';

    if (loop.suggested_action === 'ignore' || loop.original_data?.is_spam) {
      group = 'noise';
    } else if (loop.suggested_action === 'create_task' || loop.deadline_sensitivity === 'urgent') {
      group = 'decisions_needed';
    } else if (loop.suggested_action === 'schedule' && loop.deadline_sensitivity !== 'urgent') {
      group = 'waiting_on_others';
    } else if (loop.effort_estimate <= 2 && ['reply', 'archive'].includes(loop.suggested_action)) {
      group = 'quick_closes';
    }

    return { ...loop, group };
  });
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action } = await req.json();

    if (action !== 'scan') {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Processing open loops for user: ${user.id}`);

    // SCAN PHASE: Fetch unread messages and incomplete tasks
    const [messagesResult, tasksResult] = await Promise.all([
      supabase
        .from('messages')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .eq('is_archived', false)
        .order('received_at', { ascending: false })
        .limit(50),
      supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(20)
    ]);

    const messages = (messagesResult.data || []).map(m => ({ ...m, type: 'email' }));
    const tasks = (tasksResult.data || []).map(t => ({ ...t, type: 'task' }));
    const allItems = [...messages, ...tasks];

    console.log(`Found ${messages.length} unread messages, ${tasks.length} pending tasks`);

    if (allItems.length === 0) {
      return new Response(JSON.stringify({
        loops: [],
        groups: {
          quick_closes: [],
          decisions_needed: [],
          waiting_on_others: [],
          noise: []
        },
        total_count: 0,
        estimated_clear_time_minutes: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // COMPRESSION PHASE: AI simplifies each item
    const compressedLoops = await simplifyWithAI(allItems);

    // GROUPING PHASE: Categorize loops
    const groupedLoops = groupLoops(compressedLoops);

    // Build inventory
    const groups = {
      quick_closes: groupedLoops.filter(l => l.group === 'quick_closes'),
      decisions_needed: groupedLoops.filter(l => l.group === 'decisions_needed'),
      waiting_on_others: groupedLoops.filter(l => l.group === 'waiting_on_others'),
      noise: groupedLoops.filter(l => l.group === 'noise')
    };

    const totalEffort = groupedLoops.reduce((sum, l) => sum + l.effort_estimate, 0);
    const estimatedMinutes = Math.ceil(totalEffort * 0.5); // 0.5 min per effort point

    const inventory = {
      loops: groupedLoops,
      groups,
      total_count: groupedLoops.length,
      estimated_clear_time_minutes: estimatedMinutes
    };

    console.log(`Inventory ready: ${inventory.total_count} loops, ~${estimatedMinutes} min`);

    return new Response(JSON.stringify(inventory), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in process-open-loops:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
