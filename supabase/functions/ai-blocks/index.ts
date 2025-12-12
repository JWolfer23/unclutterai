import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type AIAction = 'simplify' | 'signal_score' | 'thread_sense' | 'auto_reply' | 'cluster_topics' | 'batch_brain' | 'spam_guard' | 'relationship_intel';

interface SimplifyInput {
  subject: string;
  body: string;
  sender: string;
  metadata?: Record<string, unknown>;
}

interface SimplifyOutput {
  one_sentence_summary: string;
  key_points: string[];
  hidden_context: string[];
  what_this_means: string;
  suggested_action: 'reply' | 'schedule' | 'ignore' | 'archive' | 'create_task';
  tone: 'urgent' | 'irritated' | 'casual' | 'automated' | 'neutral' | 'trap';
  extracted_dates: string[];
  tags: string[];
  confidence: number;
}

interface SignalScoreInput {
  ai_summary: string;
  body: string;
  sender: string;
  user_profile?: {
    vips?: string[];
    priorities?: string[];
  };
  relationship_intel?: {
    relationship: string;
    importance: number;
  };
}

interface RelationshipIntelInput {
  sender_email: string;
  sender_name?: string;
  conversation_history?: Array<{
    subject: string;
    direction: 'sent' | 'received';
    timestamp: string;
  }>;
  vip_contacts?: string[];
  domain?: string;
}

interface RelationshipIntelOutput {
  relationship: 'family' | 'client' | 'vendor' | 'newsletter' | 'acquaintance' | 'drainer' | 'unknown';
  importance: number;
  notes: string[];
  confidence: number;
  signals: {
    is_vip_match: boolean;
    domain_match: string;
    frequency: string;
    money_keywords: boolean;
    sentiment_history: string;
  };
}

interface SignalScoreOutput {
  urgency: number;
  effort: number;
  impact: number;
  relationship: number;
}

interface ThreadSenseInput {
  thread_messages: Array<{
    role: 'user' | 'other';
    content: string;
    sender: string;
    timestamp: string;
  }>;
  user_role_in_thread: string;
}

interface ThreadSenseOutput {
  action: 'reply_now' | 'no_reply_needed' | 'followup_needed';
  explanation: string;
  who_should_act: 'you' | 'them' | 'delegate';
}

interface AutoReplyInput {
  original_message: {
    subject: string;
    body: string;
    sender: string;
  };
  desired_action: 'request_more_time' | 'decline' | 'confirm' | 'clarify' | 'short_ack';
  constraints?: {
    max_words?: number;
    tone?: 'polite' | 'firm' | 'casual' | 'professional';
  };
}

interface AutoReplyOutput {
  subject: string;
  body: string;
  tone: 'polite' | 'firm' | 'casual' | 'professional';
  confidence: number;
}

// System prompts for each AI block
const SYSTEM_PROMPTS = {
  simplify: `You are UnclutterAI's message analyst. Output strict JSON only.

Produce JSON:
{
  "one_sentence_summary": "<concise summary>",
  "key_points": ["...","..."],
  "hidden_context": ["deadline: YYYY-MM-DD", "sentiment: irritated", ...],
  "what_this_means": "<short practical explanation>",
  "suggested_action": "<reply|schedule|ignore|archive|create_task>",
  "tone": "<urgent|irritated|casual|automated|neutral|trap>",
  "extracted_dates": [ "YYYY-MM-DD", ... ],
  "tags": ["invoice","client","meeting","spam?"],
  "confidence": 0.0-1.0
}

Rules:
- If you detect an explicit date/time, put it in extracted_dates.
- If body contains financial request, tag "payment".
- Keep outputs terse and machine-parseable.
- Return ONLY valid JSON, no markdown or explanation.`,

  signal_score: `You are UnclutterAI's signal scorer. Compute numeric urgency, effort, impact, relationship scores (0-10).

Output JSON only:
{"urgency": x, "effort": y, "impact": z, "relationship": w}

Rules:
- Urgency increases with explicit deadlines, threat language, "ASAP" (0-10)
- Effort = estimated minutes of work converted into 0-10 scale (0=no work, 10=hours of work)
- Relationship base from VIP detection, then ADD relationship boost based on type:
  - family: +3, client: +3, vendor: +1, newsletter: -2, drainer: -3, acquaintance: 0
- Impact estimates alignment with user's priorities (0-10)
- Return ONLY valid JSON, no markdown or explanation.`,

  relationship_intel: `You are UnclutterAI's Relationship Intelligence analyzer.
Classify the relationship type and importance based on conversation history.

Input: sender_email, sender_name, conversation_history, vip_contacts, domain

Output JSON only:
{
  "relationship": "family|client|vendor|newsletter|acquaintance|drainer|unknown",
  "importance": 0-10,
  "notes": ["client tier 1", "high response rate", "money-related communication"],
  "confidence": 0.0-1.0,
  "signals": {
    "is_vip_match": true|false,
    "domain_match": "company|personal|newsletter|unknown",
    "frequency": "high|medium|low",
    "money_keywords": true|false,
    "sentiment_history": "positive|neutral|negative|mixed"
  }
}

Rules:
- VIP list matches → relationship likely "family" or "client", importance +3
- Domain matches company domains (salesforce.com, stripe.com) → likely "vendor"
- Newsletter/noreply domains → "newsletter", importance 1-3
- Money-related keywords (invoice, payment, contract) → likely "client", importance +2
- Guilt-tripping or draining patterns → "drainer", importance 1-2
- High reply frequency from user → higher importance
- Return ONLY valid JSON.`,

  thread_sense: `You are UnclutterAI's thread analyzer. Inspect thread text and determine whether action is needed.

Output JSON only:
{"action": "reply_now" | "no_reply_needed" | "followup_needed", "explanation": "...", "who_should_act": "you" | "them" | "delegate"}

Rules:
- "reply_now" if the thread is waiting on user's response
- "no_reply_needed" if the thread is concluded or informational
- "followup_needed" if user should check back later
- Return ONLY valid JSON, no markdown or explanation.`,

  auto_reply: `You are UnclutterAI's reply drafter. Draft a reply based on tone and goal.

Output JSON only:
{"subject": "...", "body": "...", "tone": "polite" | "firm" | "casual" | "professional", "confidence": 0-1}

Rules:
- Keep reply ≤ max_words constraint if provided
- Include a clear call-to-action if needed
- Match the requested tone
- Return ONLY valid JSON, no markdown or explanation.`,

  batch_brain: `You are UnclutterAI's Batch Brain. Group messages into cognitive-friendly batches.

Input: Array of messages with { id, subject, summary, sender, urgency, effort, tags }
Output JSON:
{
  "batches": [
    { "size": 3, "messages": ["id1", "id2", "id3"], "purpose": "respond to clients", "priority": "high" },
    { "size": 5, "messages": [...], "purpose": "admin/HR tasks", "priority": "medium" }
  ]
}

Rules:
- Prefer grouping by contact/project
- Balance urgency and effort within each batch
- Keep batch sizes between 3-10 messages
- Assign priority: "high" | "medium" | "low" based on urgency scores
- Return ONLY valid JSON.`,

  spam_guard: `You are UnclutterAI's SpamGuard+ detector.
Flag messages that are emotional manipulation, guilt-trap, or low-value.

Input: { ai_summary, body, sender_domain, sender_name }
Output JSON:
{
  "is_spam": true|false,
  "reason": "guilt_invoke|pyramid|promo|low_value|phishing|manipulation|safe",
  "confidence": 0.0-1.0,
  "details": "explanation of detection",
  "recommended_action": "archive|quarantine|block|allow"
}

Rules:
- Newsletter list + no personalization → likely low_value
- Language contains "you must", "urgent action", "limited time", "send money" → high-risk
- Guilt language ("I'm disappointed", "after everything I did") → guilt_invoke
- Pyramid/MLM indicators ("opportunity", "passive income", "be your own boss") → pyramid
- Phishing indicators ("verify account", "suspended", "click to confirm") → phishing
- Return ONLY valid JSON.`
};

// Call Lovable AI Gateway
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
      max_tokens: 1000,
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

// Parse JSON from AI response
function parseAIJson<T>(content: string): T {
  // Extract JSON from potential markdown code blocks
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || content.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]).trim() : content.trim();
  
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('Failed to parse AI response:', content);
    throw new Error('Invalid AI response format');
  }
}

// Handler: AI_Simplify
async function handleSimplify(input: SimplifyInput): Promise<SimplifyOutput> {
  const userPrompt = `Analyze this message:
From: ${input.sender}
Subject: ${input.subject}
Body: ${input.body.substring(0, 3000)}
${input.metadata ? `Metadata: ${JSON.stringify(input.metadata)}` : ''}`;

  const response = await callAI(SYSTEM_PROMPTS.simplify, userPrompt, 0.1);
  return parseAIJson<SimplifyOutput>(response);
}

// Handler: AI_SignalScore
async function handleSignalScore(input: SignalScoreInput): Promise<SignalScoreOutput> {
  const relationshipBoost = input.relationship_intel ? getRelationshipBoost(input.relationship_intel.relationship, input.relationship_intel.importance) : 0;
  
  const userPrompt = `Score this message:
Summary: ${input.ai_summary}
Body: ${input.body.substring(0, 2000)}
Sender: ${input.sender}
${input.user_profile?.vips ? `VIP contacts: ${input.user_profile.vips.join(', ')}` : ''}
${input.user_profile?.priorities ? `User priorities: ${input.user_profile.priorities.join(', ')}` : ''}
${input.relationship_intel ? `Relationship type: ${input.relationship_intel.relationship}, importance: ${input.relationship_intel.importance}` : ''}`;

  const response = await callAI(SYSTEM_PROMPTS.signal_score, userPrompt, 0.1);
  const result = parseAIJson<SignalScoreOutput>(response);
  
  // Apply relationship boost
  result.relationship = Math.min(10, Math.max(0, (result.relationship || 0) + relationshipBoost));
  
  return result;
}

// Helper to calculate relationship boost
function getRelationshipBoost(relationship: string, importance: number): number {
  const baseBoost: Record<string, number> = {
    family: 3,
    client: 3,
    vendor: 1,
    newsletter: -2,
    drainer: -3,
    acquaintance: 0,
    unknown: 0,
  };
  const base = baseBoost[relationship] || 0;
  // Add small bonus for high importance
  const importanceBonus = importance >= 8 ? 1 : importance >= 6 ? 0.5 : 0;
  return base + importanceBonus;
}

// Handler: AI_RelationshipIntel
async function handleRelationshipIntel(input: RelationshipIntelInput): Promise<RelationshipIntelOutput> {
  const historyText = input.conversation_history?.length 
    ? input.conversation_history.map(h => `[${h.direction}] ${h.subject} (${h.timestamp})`).join('\n')
    : 'No conversation history available';
  
  const userPrompt = `Analyze relationship for sender:
Email: ${input.sender_email}
Name: ${input.sender_name || 'Unknown'}
Domain: ${input.domain || 'Unknown'}
VIP contacts: ${input.vip_contacts?.join(', ') || 'None'}

Conversation history (last 90 days):
${historyText}`;

  const response = await callAI(SYSTEM_PROMPTS.relationship_intel, userPrompt, 0.2);
  return parseAIJson<RelationshipIntelOutput>(response);
}

// Handler: AI_ThreadSense
async function handleThreadSense(input: ThreadSenseInput): Promise<ThreadSenseOutput> {
  const threadText = input.thread_messages
    .map(m => `[${m.role}] ${m.sender} (${m.timestamp}): ${m.content}`)
    .join('\n\n');

  const userPrompt = `Analyze this thread:
User's role: ${input.user_role_in_thread}

Thread messages:
${threadText.substring(0, 4000)}`;

  const response = await callAI(SYSTEM_PROMPTS.thread_sense, userPrompt, 0.2);
  return parseAIJson<ThreadSenseOutput>(response);
}

// Handler: AI_AutoReply
async function handleAutoReply(input: AutoReplyInput): Promise<AutoReplyOutput> {
  const userPrompt = `Draft a reply:
Original message from: ${input.original_message.sender}
Subject: ${input.original_message.subject}
Body: ${input.original_message.body.substring(0, 2000)}

Desired action: ${input.desired_action}
${input.constraints?.max_words ? `Max words: ${input.constraints.max_words}` : ''}
${input.constraints?.tone ? `Preferred tone: ${input.constraints.tone}` : ''}`;

  const response = await callAI(SYSTEM_PROMPTS.auto_reply, userPrompt, 0.3);
  return parseAIJson<AutoReplyOutput>(response);
}

// Record AI usage
async function recordUsage(supabase: any, userId: string, type: string): Promise<void> {
  try {
    await supabase.from('ai_usage').insert({
      user_id: userId,
      type: `ai_block_${type}`,
      used_at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('Failed to record AI usage:', e);
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Verify authorization
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client and verify user
    const supabase = createClient(supabaseUrl, supabaseKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, data } = await req.json();
    
    if (!action || !['simplify', 'signal_score', 'thread_sense', 'auto_reply', 'batch_brain', 'spam_guard', 'relationship_intel'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use: simplify, signal_score, thread_sense, auto_reply, batch_brain, spam_guard, or relationship_intel' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!data) {
      return new Response(
        JSON.stringify({ error: 'Missing data payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing AI block: ${action} for user: ${user.id}`);

    let result: any;

    switch (action as AIAction) {
      case 'simplify':
        if (!data.subject || !data.body || !data.sender) {
          return new Response(
            JSON.stringify({ error: 'simplify requires: subject, body, sender' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await handleSimplify(data as SimplifyInput);
        break;

      case 'signal_score':
        if (!data.ai_summary || !data.body || !data.sender) {
          return new Response(
            JSON.stringify({ error: 'signal_score requires: ai_summary, body, sender' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await handleSignalScore(data as SignalScoreInput);
        break;

      case 'thread_sense':
        if (!data.thread_messages || !data.user_role_in_thread) {
          return new Response(
            JSON.stringify({ error: 'thread_sense requires: thread_messages[], user_role_in_thread' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await handleThreadSense(data as ThreadSenseInput);
        break;

      case 'auto_reply':
        if (!data.original_message || !data.desired_action) {
          return new Response(
            JSON.stringify({ error: 'auto_reply requires: original_message, desired_action' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await handleAutoReply(data);
        break;

      case 'batch_brain':
        if (!data.messages || !Array.isArray(data.messages)) {
          return new Response(
            JSON.stringify({ error: 'batch_brain requires: messages[]' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const batchPrompt = `Group these messages into cognitive batches:
${JSON.stringify(data.messages, null, 2)}`;
        const batchResponse = await callAI(SYSTEM_PROMPTS.batch_brain, batchPrompt, 0.2);
        result = parseAIJson(batchResponse);
        break;

      case 'spam_guard':
        if (!data.body) {
          return new Response(
            JSON.stringify({ error: 'spam_guard requires: body (and optionally ai_summary, sender_domain, sender_name)' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const spamPrompt = `Analyze this message for spam/manipulation:
Summary: ${data.ai_summary || 'N/A'}
Sender: ${data.sender_name || 'Unknown'} (${data.sender_domain || 'unknown domain'})
Body: ${data.body.substring(0, 2000)}`;
        const spamResponse = await callAI(SYSTEM_PROMPTS.spam_guard, spamPrompt, 0.1);
        result = parseAIJson(spamResponse);
        break;
        
      case 'relationship_intel':
        if (!data.sender_email) {
          return new Response(
            JSON.stringify({ error: 'relationship_intel requires: sender_email' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await handleRelationshipIntel(data as RelationshipIntelInput);
        break;
    }

    // Record usage
    await recordUsage(supabase, user.id, action);

    console.log(`AI block ${action} completed successfully`);

    return new Response(
      JSON.stringify({ success: true, action, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AI blocks error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
