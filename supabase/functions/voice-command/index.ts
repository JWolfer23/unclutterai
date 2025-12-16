import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PARSER_PROMPT = `You are a voice command parser for a productivity assistant. Parse the user's voice command and extract:
1. action - the specific action to take
2. category - communication, tasks, unclutter, morning, intelligence, focus, or unknown
3. object - what the action applies to (optional)
4. context - additional details like time, recipient, or content (optional)
5. requiresConfirmation - true ONLY if: money involved, sending external messages, or deleting 10+ items
6. confirmationReason - 'money', 'external_send', or 'bulk_delete' if confirmation needed
7. bulkCount - number of items if bulk operation

Available actions:
- summarize_messages, read_priority, reply, archive, remind (communication)
- whats_next, schedule, create_task, what_can_wait (tasks)
- clear_unread, summarize_tabs, close_low_priority, whats_unresolved (unclutter)
- run_morning_brief, whats_important_today, start_focus (morning/focus)
- explain_simply, is_important, whats_the_risk (intelligence)

Respond with valid JSON only. Example:
{"action":"create_task","category":"tasks","context":"follow up with Jack","requiresConfirmation":false}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'No text provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      // Fallback to simple pattern matching
      const parsed = parseCommandLocally(text.toLowerCase());
      return new Response(
        JSON.stringify(parsed),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: PARSER_PROMPT },
          { role: 'user', content: text }
        ],
      }),
    });

    if (!response.ok) {
      console.error('AI gateway error:', response.status);
      const parsed = parseCommandLocally(text.toLowerCase());
      return new Response(
        JSON.stringify(parsed),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      const parsed = parseCommandLocally(text.toLowerCase());
      return new Response(
        JSON.stringify(parsed),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return new Response(
        JSON.stringify(parsed),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const parsed = parseCommandLocally(text.toLowerCase());
    return new Response(
      JSON.stringify(parsed),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Voice command error:', error);
    return new Response(
      JSON.stringify({ 
        action: 'unknown', 
        category: 'unknown', 
        requiresConfirmation: false 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function parseCommandLocally(text: string) {
  // Simple pattern matching fallback
  if (text.includes('summarize') && text.includes('message')) {
    return { action: 'summarize_messages', category: 'communication', requiresConfirmation: false };
  }
  if (text.includes('priority') || text.includes('important')) {
    return { action: 'read_priority', category: 'communication', requiresConfirmation: false };
  }
  if (text.includes('archive')) {
    return { action: 'archive', category: 'communication', requiresConfirmation: false };
  }
  if (text.includes('what') && text.includes('next')) {
    return { action: 'whats_next', category: 'tasks', requiresConfirmation: false };
  }
  if (text.includes('create') && text.includes('task')) {
    const context = text.replace(/create\s*task:?\s*/i, '').trim();
    return { action: 'create_task', category: 'tasks', context, requiresConfirmation: false };
  }
  if (text.includes('morning') && text.includes('brief')) {
    return { action: 'run_morning_brief', category: 'morning', requiresConfirmation: false };
  }
  if (text.includes('focus') || text.includes('start focus')) {
    return { action: 'start_focus', category: 'focus', requiresConfirmation: false };
  }
  if (text.includes('clear') && text.includes('unread')) {
    return { action: 'clear_unread', category: 'unclutter', requiresConfirmation: false };
  }
  if (text.includes('unresolved') || text.includes('open loops')) {
    return { action: 'whats_unresolved', category: 'unclutter', requiresConfirmation: false };
  }
  if (text.includes('what') && text.includes('today')) {
    return { action: 'whats_important_today', category: 'morning', requiresConfirmation: false };
  }

  return { action: 'unknown', category: 'unknown', requiresConfirmation: false };
}
