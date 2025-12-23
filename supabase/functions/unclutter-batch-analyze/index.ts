import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LoopAnalysis {
  messageId: string;
  suggestedAction: 'done' | 'schedule' | 'delegate' | 'archive' | 'ignore';
  confidence: number;
  reasoning: string;
  draftReply?: string;
  relatedLoopIds?: string[];
  pattern?: string;
  research?: string;
}

interface BatchAnalysisResult {
  analyses: LoopAnalysis[];
  patterns: Pattern[];
  groups: LoopGroup[];
}

interface Pattern {
  id: string;
  type: string;
  description: string;
  messageIds: string[];
}

interface LoopGroup {
  id: string;
  reason: string;
  messageIds: string[];
  suggestedBatchAction?: 'done' | 'archive' | 'ignore';
}

serve(async (req) => {
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

    const { messageIds } = await req.json();
    
    if (!messageIds || messageIds.length === 0) {
      return new Response(JSON.stringify({ analyses: [], patterns: [], groups: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Batch analyzing ${messageIds.length} messages for user: ${user.id}`);

    // Fetch full message content for analysis
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('id, subject, sender_name, sender_email, content, received_at, priority_score')
      .eq('user_id', user.id)
      .in('id', messageIds);

    if (messagesError) {
      throw messagesError;
    }

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ analyses: [], patterns: [], groups: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      // Return basic analysis without AI
      const basicAnalyses: LoopAnalysis[] = messages.map(msg => ({
        messageId: msg.id,
        suggestedAction: 'done' as const,
        confidence: 0.5,
        reasoning: 'AI analysis unavailable'
      }));
      
      return new Response(JSON.stringify({ 
        analyses: basicAnalyses, 
        patterns: [], 
        groups: [] 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Build batch context for AI analysis
    const messageContext = messages.map((msg, idx) => 
      `[${idx + 1}] ID: ${msg.id}
From: ${msg.sender_name} <${msg.sender_email || 'unknown'}>
Subject: ${msg.subject}
Content: ${(msg.content || '').substring(0, 300)}
---`
    ).join('\n');

    // Single AI call for batch analysis
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: `You are an email triage assistant. Analyze the batch of emails and return JSON with:
1. analyses: For each email, suggest an action (done/schedule/delegate/archive/ignore), confidence (0-1), brief reasoning, and optionally a draft reply
2. patterns: Identify recurring patterns (e.g., "newsletter", "meeting requests", "follow-ups")
3. groups: Group similar emails that could be processed together

Be decisive. Default to simpler actions. Newsletters → archive. FYI emails → done. Only schedule if action is truly needed later.

Return ONLY valid JSON in this exact format:
{
  "analyses": [{"messageId": "id", "suggestedAction": "done", "confidence": 0.9, "reasoning": "brief reason", "draftReply": "optional reply"}],
  "patterns": [{"id": "p1", "type": "newsletter", "description": "Marketing newsletters", "messageIds": ["id1", "id2"]}],
  "groups": [{"id": "g1", "reason": "Same sender", "messageIds": ["id1", "id2"], "suggestedBatchAction": "archive"}]
}`
          },
          { 
            role: "user", 
            content: `Analyze these ${messages.length} emails:\n\n${messageContext}` 
          }
        ],
      }),
    });

    if (!response.ok) {
      console.error('AI batch analysis failed:', response.status);
      // Return basic analysis
      const basicAnalyses: LoopAnalysis[] = messages.map(msg => ({
        messageId: msg.id,
        suggestedAction: 'done' as const,
        confidence: 0.5,
        reasoning: 'Analysis unavailable'
      }));
      
      return new Response(JSON.stringify({ 
        analyses: basicAnalyses, 
        patterns: [], 
        groups: [] 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || '';
    
    // Parse JSON from AI response
    let result: BatchAnalysisResult = { analyses: [], patterns: [], groups: [] };
    
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const jsonStr = jsonMatch[1] || content;
      result = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback to basic analysis
      result.analyses = messages.map(msg => ({
        messageId: msg.id,
        suggestedAction: 'done' as const,
        confidence: 0.5,
        reasoning: 'Unable to parse analysis'
      }));
    }

    // Ensure all message IDs have an analysis
    const analyzedIds = new Set(result.analyses.map(a => a.messageId));
    for (const msg of messages) {
      if (!analyzedIds.has(msg.id)) {
        result.analyses.push({
          messageId: msg.id,
          suggestedAction: 'done',
          confidence: 0.5,
          reasoning: 'Default recommendation'
        });
      }
    }

    console.log(`Batch analysis complete: ${result.analyses.length} analyses, ${result.patterns.length} patterns, ${result.groups.length} groups`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in unclutter-batch-analyze:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
