import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnrichedMessage {
  id: string;
  subject: string;
  body: string;
  sender: string;
  ai_summary?: string;
  urgency: number;
  effort: number;
  impact: number;
  relationship: number;
  extracted_dates: string[];
  tags: string[];
  suggested_action: string;
  cluster?: string;
}

interface ActionPlanTask {
  title: string;
  description: string;
  message_ids: string[];
  due_date: string | null;
  priority: number;
  effort: number;
}

interface AutoReplyDraft {
  message_id: string;
  draft: {
    subject: string;
    body: string;
    tone: string;
  };
}

interface BatchRecommendation {
  batch_size: number;
  messages: string[];
  goal: string;
}

interface ActionPlan {
  urgent_tasks: ActionPlanTask[];
  quick_wins: ActionPlanTask[];
  auto_replies: AutoReplyDraft[];
  batch_recommendations: BatchRecommendation[];
  uct_reward_estimate: number;
  messages_processed: number;
  ledger_id: string;
  action_plan_id: string;
}

// System prompts
const SIMPLIFY_PROMPT = `You are UnclutterAI's message analyst. Output strict JSON only.

Produce JSON:
{
  "one_sentence_summary": "<concise summary>",
  "key_points": ["..."],
  "suggested_action": "reply|schedule|ignore|archive|create_task",
  "tone": "urgent|irritated|casual|automated|neutral",
  "extracted_dates": ["YYYY-MM-DD"],
  "tags": ["invoice","client","meeting"],
  "confidence": 0.0-1.0
}

Return ONLY valid JSON.`;

const SIGNAL_SCORE_PROMPT = `You are UnclutterAI's signal scorer. Output strict JSON only.

{"urgency": 0-10, "effort": 0-10, "impact": 0-10, "relationship": 0-10}

Rules:
- Urgency: 0=no rush, 10=immediate action needed
- Effort: 0=no work, 10=hours of work
- Impact: 0=trivial, 10=critical to goals
- Relationship: 0=unknown sender, 10=VIP/family

Return ONLY valid JSON.`;

const CLUSTER_PROMPT = `You are UnclutterAI's topic clusterer. Group messages by project/theme.

Output JSON only:
{
  "clusters": [
    { "topic": "Project Name", "message_ids": ["id1", "id2"], "priority": "high|medium|low" }
  ]
}

Return ONLY valid JSON.`;

const TASK_GENERATOR_PROMPT = `You are UnclutterAI's Action Plan generator.

Produce JSON:
{
  "urgent_tasks": [{"title":"...","description":"...","message_ids":["..."],"due_date":"YYYY-MM-DD or null","priority":1-5,"effort":1-10}],
  "quick_wins": [{"title":"...","description":"...","message_ids":["..."],"due_date":null,"priority":1-5,"effort":1-10}],
  "batch_recommendations": [{"batch_size":5,"messages":["..."],"goal":"..."}],
  "auto_replies": [{"message_id":"...","draft":{"subject":"...","body":"...","tone":"polite|professional|casual"}}],
  "uct_reward_estimate": 12.5
}

Rules:
- urgent_tasks: pick up to 3 items with urgency>=7 and impact>=6
- quick_wins: pick up to 7 items with effort<=2
- Group by project using keywords/subject lines
- auto_replies only for messages where suggested_action is "reply"
- uct_reward_estimate = (tasks_created * 0.5) + (messages_processed * 0.2) + 1.0

Return ONLY valid JSON.`;

async function callAI(systemPrompt: string, userPrompt: string, temperature: number = 0.1): Promise<string> {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  
  if (!lovableApiKey) {
    throw new Error('LOVABLE_API_KEY not configured');
  }
  
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI Gateway error:', response.status, errorText);
    
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    if (response.status === 402) {
      throw new Error('AI usage limit reached. Please add credits.');
    }
    throw new Error(`AI Gateway error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

function parseAIJson<T>(content: string): T {
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || content.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]).trim() : content.trim();
  
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('Failed to parse AI response:', content);
    throw new Error('Invalid AI response format');
  }
}

// Process messages in batches
async function enrichMessages(messages: any[]): Promise<EnrichedMessage[]> {
  const enriched: EnrichedMessage[] = [];
  
  // Process in batches of 5 for performance
  const batchSize = 5;
  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);
    
    const batchResults = await Promise.all(
      batch.map(async (msg) => {
        try {
          // Call AI_Simplify
          const simplifyPrompt = `From: ${msg.sender_name || msg.sender_email}\nSubject: ${msg.subject}\nBody: ${(msg.content || '').substring(0, 2000)}`;
          const simplifyResult = await callAI(SIMPLIFY_PROMPT, simplifyPrompt, 0.1);
          const simplified = parseAIJson<any>(simplifyResult);
          
          // Call AI_SignalScore
          const scorePrompt = `Summary: ${simplified.one_sentence_summary}\nBody: ${(msg.content || '').substring(0, 1000)}\nSender: ${msg.sender_name || msg.sender_email}`;
          const scoreResult = await callAI(SIGNAL_SCORE_PROMPT, scorePrompt, 0.1);
          const scored = parseAIJson<any>(scoreResult);
          
          return {
            id: msg.id,
            subject: msg.subject,
            body: msg.content || '',
            sender: msg.sender_name || msg.sender_email || 'Unknown',
            ai_summary: simplified.one_sentence_summary,
            urgency: scored.urgency || 0,
            effort: scored.effort || 0,
            impact: scored.impact || 0,
            relationship: scored.relationship || 0,
            extracted_dates: simplified.extracted_dates || [],
            tags: simplified.tags || [],
            suggested_action: simplified.suggested_action || 'ignore',
          };
        } catch (e) {
          console.error('Error enriching message:', msg.id, e);
          return {
            id: msg.id,
            subject: msg.subject,
            body: msg.content || '',
            sender: msg.sender_name || msg.sender_email || 'Unknown',
            urgency: 0,
            effort: 0,
            impact: 0,
            relationship: 0,
            extracted_dates: [],
            tags: [],
            suggested_action: 'ignore',
          };
        }
      })
    );
    
    enriched.push(...batchResults);
  }
  
  return enriched;
}

// Cluster messages by topic
async function clusterMessages(messages: EnrichedMessage[]): Promise<EnrichedMessage[]> {
  if (messages.length === 0) return messages;
  
  const clusterInput = messages.map(m => ({
    id: m.id,
    subject: m.subject,
    summary: m.ai_summary || m.subject,
    tags: m.tags,
  }));
  
  try {
    const clusterPrompt = `Cluster these messages by topic:\n${JSON.stringify(clusterInput, null, 2)}`;
    const clusterResult = await callAI(CLUSTER_PROMPT, clusterPrompt, 0.2);
    const clusters = parseAIJson<{ clusters: { topic: string; message_ids: string[] }[] }>(clusterResult);
    
    // Apply cluster assignments
    for (const cluster of clusters.clusters) {
      for (const msgId of cluster.message_ids) {
        const msg = messages.find(m => m.id === msgId);
        if (msg) {
          msg.cluster = cluster.topic;
        }
      }
    }
  } catch (e) {
    console.error('Error clustering messages:', e);
  }
  
  return messages;
}

// Generate action plan
async function generateActionPlan(enrichedMessages: EnrichedMessage[]): Promise<{
  urgent_tasks: ActionPlanTask[];
  quick_wins: ActionPlanTask[];
  auto_replies: AutoReplyDraft[];
  batch_recommendations: BatchRecommendation[];
  uct_reward_estimate: number;
}> {
  const taskInput = enrichedMessages.map(m => ({
    id: m.id,
    subject: m.subject,
    ai_summary: m.ai_summary,
    urgency: m.urgency,
    effort: m.effort,
    impact: m.impact,
    relationship: m.relationship,
    extracted_dates: m.extracted_dates,
    tags: m.tags,
    suggested_action: m.suggested_action,
    cluster: m.cluster,
  }));
  
  const taskPrompt = `Generate an action plan for these messages:\n${JSON.stringify(taskInput, null, 2)}`;
  const taskResult = await callAI(TASK_GENERATOR_PROMPT, taskPrompt, 0.2);
  return parseAIJson(taskResult);
}

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

    console.log(`Starting instant catch-up for user: ${user.id}`);

    // 1. Fetch unread messages (limit 50)
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_read', false)
      .order('received_at', { ascending: false })
      .limit(50);
    
    if (msgError) {
      throw new Error(`Failed to fetch messages: ${msgError.message}`);
    }

    console.log(`Found ${messages?.length || 0} unread messages`);

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          action_plan: {
            urgent_tasks: [],
            quick_wins: [],
            auto_replies: [],
            batch_recommendations: [],
            uct_reward_estimate: 0,
            messages_processed: 0,
            ledger_id: null,
            action_plan_id: null,
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Enrich messages with AI_Simplify and AI_SignalScore
    console.log('Enriching messages with AI...');
    const enrichedMessages = await enrichMessages(messages);

    // 3. Cluster messages by topic
    console.log('Clustering messages by topic...');
    const clusteredMessages = await clusterMessages(enrichedMessages);

    // 4. Generate action plan with tasks
    console.log('Generating action plan...');
    const actionPlanResult = await generateActionPlan(clusteredMessages);

    // 5. Insert tasks into tasks table
    const tasksToInsert = [
      ...actionPlanResult.urgent_tasks.map(t => ({
        user_id: user.id,
        title: t.title,
        description: t.description,
        priority: t.priority >= 4 ? 'high' : t.priority >= 3 ? 'medium' : 'low',
        due_date: t.due_date,
        urgency: 'high',
        importance: 'high',
        score: t.priority,
        metadata: { message_ids: t.message_ids, source: 'instant_catchup' },
      })),
      ...actionPlanResult.quick_wins.map(t => ({
        user_id: user.id,
        title: t.title,
        description: t.description,
        priority: 'medium',
        due_date: null,
        urgency: 'low',
        importance: 'medium',
        score: t.priority,
        metadata: { message_ids: t.message_ids, source: 'instant_catchup' },
      })),
    ];

    let insertedTasks: any[] = [];
    if (tasksToInsert.length > 0) {
      const { data: tasks, error: taskError } = await supabase
        .from('tasks')
        .insert(tasksToInsert)
        .select();
      
      if (taskError) {
        console.error('Error inserting tasks:', taskError);
      } else {
        insertedTasks = tasks || [];
      }
    }

    // 6. Create focus_ledger entry
    const { data: ledgerEntry, error: ledgerError } = await supabase
      .from('focus_ledger')
      .insert({
        user_id: user.id,
        event_type: 'instant_catchup',
        payload: {
          summary: `Processed ${messages.length} unread messages`,
          urgent_count: actionPlanResult.urgent_tasks.length,
          quick_wins_count: actionPlanResult.quick_wins.length,
          auto_replies_count: actionPlanResult.auto_replies.length,
        },
        message_ids: messages.map(m => m.id),
        uct_reward: actionPlanResult.uct_reward_estimate,
      })
      .select()
      .single();

    if (ledgerError) {
      console.error('Error creating ledger entry:', ledgerError);
    }

    // 7. Save action plan
    const { data: actionPlanEntry, error: planError } = await supabase
      .from('action_plans')
      .insert({
        user_id: user.id,
        urgent_tasks: actionPlanResult.urgent_tasks,
        quick_wins: actionPlanResult.quick_wins,
        auto_replies: actionPlanResult.auto_replies,
        batch_recommendations: actionPlanResult.batch_recommendations,
        uct_estimate: actionPlanResult.uct_reward_estimate,
        messages_processed: messages.length,
        ledger_id: ledgerEntry?.id || null,
      })
      .select()
      .single();

    if (planError) {
      console.error('Error saving action plan:', planError);
    }

    // 8. Update UCT balance
    const { data: existingTokens } = await supabase
      .from('tokens')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    const currentBalance = existingTokens?.balance || 0;
    const newBalance = currentBalance + actionPlanResult.uct_reward_estimate;

    await supabase
      .from('tokens')
      .upsert({
        user_id: user.id,
        balance: newBalance,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    // 9. Record AI usage
    await supabase.from('ai_usage').insert({
      user_id: user.id,
      type: 'instant_catchup',
      used_at: new Date().toISOString(),
    });

    console.log(`Instant catch-up completed. UCT earned: ${actionPlanResult.uct_reward_estimate}`);

    // Map tasks to include inserted IDs
    const urgentTasksWithIds = actionPlanResult.urgent_tasks.map((t, i) => ({
      ...t,
      id: insertedTasks[i]?.id,
    }));
    
    const quickWinsWithIds = actionPlanResult.quick_wins.map((t, i) => ({
      ...t,
      id: insertedTasks[actionPlanResult.urgent_tasks.length + i]?.id,
    }));

    const actionPlan: ActionPlan = {
      urgent_tasks: urgentTasksWithIds,
      quick_wins: quickWinsWithIds,
      auto_replies: actionPlanResult.auto_replies,
      batch_recommendations: actionPlanResult.batch_recommendations,
      uct_reward_estimate: actionPlanResult.uct_reward_estimate,
      messages_processed: messages.length,
      ledger_id: ledgerEntry?.id || '',
      action_plan_id: actionPlanEntry?.id || '',
    };

    return new Response(
      JSON.stringify({ success: true, action_plan: actionPlan }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Instant catch-up error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
