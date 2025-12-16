import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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

// UCT fee structure
const UCT_FEE_SHORT = 0.05; // ≤50 words
const UCT_FEE_LONG = 0.2;   // >50 words
const TRUST_THRESHOLD = 0.8;

interface AutoResponseRequest {
  message_id: string;
  desired_action: 'request_more_time' | 'decline' | 'confirm' | 'clarify' | 'short_ack';
  auto_send?: boolean;
  constraints?: {
    max_words?: number;
    tone?: 'polite' | 'firm' | 'casual' | 'professional';
  };
}

// Call AI_AutoReply block
async function callAutoReply(
  subject: string,
  body: string,
  sender: string,
  desiredAction: string,
  constraints?: { max_words?: number; tone?: string }
): Promise<{ subject: string; body: string; tone: string; confidence: number }> {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  
  if (!lovableApiKey) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  const systemPrompt = `You are UnclutterAI's reply drafter. Draft a reply based on tone and goal.

Output JSON only:
{"subject": "...", "body": "...", "tone": "polite" | "firm" | "casual" | "professional", "confidence": 0-1}

Rules:
- Keep reply ≤ max_words constraint if provided
- Include a clear call-to-action if needed
- Match the requested tone
- Return ONLY valid JSON, no markdown or explanation.`;

  const userPrompt = `Draft a reply:
Original message from: ${sender}
Subject: ${subject}
Body: ${body.substring(0, 2000)}

Desired action: ${desiredAction}
${constraints?.max_words ? `Max words: ${constraints.max_words}` : ''}
${constraints?.tone ? `Preferred tone: ${constraints.tone}` : ''}`;

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
      temperature: 0.3,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI Gateway error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  
  // Parse JSON
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || content.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]).trim() : content.trim();
  
  return JSON.parse(jsonStr);
}

// Calculate word count
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Reject requests from disallowed origins
  if (!isAllowedOrigin(origin)) {
    console.warn(`[SECURITY] Blocked request from disallowed origin: ${origin}`);
    return new Response(
      JSON.stringify({ error: 'Forbidden' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
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

    const body: AutoResponseRequest = await req.json();
    const { message_id, desired_action, auto_send = false, constraints } = body;

    if (!message_id || !desired_action) {
      return new Response(
        JSON.stringify({ error: 'message_id and desired_action are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the message
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', message_id)
      .eq('user_id', user.id)
      .single();

    if (msgError || !message) {
      return new Response(
        JSON.stringify({ error: 'Message not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate reply draft
    const senderEmail = message.sender_email || message.sender_name;
    const draft = await callAutoReply(
      message.subject,
      message.content,
      senderEmail,
      desired_action,
      constraints
    );

    const wordCount = countWords(draft.body);
    const uctFee = wordCount <= 50 ? UCT_FEE_SHORT : UCT_FEE_LONG;

    // If auto_send is requested, check eligibility
    let autoSendResult = {
      eligible: false,
      reason: 'auto_send not requested',
      sent: false,
    };

    if (auto_send) {
      // Get sender trust level
      const { data: trustData } = await supabase
        .from('sender_trust')
        .select('trust_level, auto_send_allowed')
        .eq('user_id', user.id)
        .eq('sender_email', senderEmail)
        .single();

      const trustLevel = trustData?.trust_level || 0;
      const autoSendAllowed = trustData?.auto_send_allowed || false;

      // Get user's UCT balance
      const { data: tokenData } = await supabase
        .from('tokens')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      const balance = tokenData?.balance || 0;

      // Check eligibility
      if (trustLevel >= TRUST_THRESHOLD && balance >= uctFee && autoSendAllowed) {
        autoSendResult.eligible = true;
        autoSendResult.reason = 'Eligible for auto-send';

        // Deduct UCT fee
        const { error: deductError } = await supabase
          .from('tokens')
          .update({ balance: balance - uctFee, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);

        if (!deductError) {
          // Log auto-send
          await supabase.from('auto_send_logs').insert({
            user_id: user.id,
            message_id,
            reply_subject: draft.subject,
            reply_body: draft.body,
            uct_fee: uctFee,
            trust_level: trustLevel,
            status: 'sent',
          });

          // Log to focus_ledger for blockchain-readiness
          await supabase.from('focus_ledger').insert({
            user_id: user.id,
            event_type: 'auto_send',
            uct_reward: -uctFee,
            message_ids: [message_id],
            payload: {
              reply_hash: btoa(draft.body.substring(0, 100)),
              trust_level: trustLevel,
              word_count: wordCount,
            },
          });

          autoSendResult.sent = true;
        } else {
          autoSendResult.reason = 'Failed to deduct UCT';
        }
      } else {
        if (trustLevel < TRUST_THRESHOLD) {
          autoSendResult.reason = `Trust level ${trustLevel.toFixed(2)} below threshold ${TRUST_THRESHOLD}`;
        } else if (balance < uctFee) {
          autoSendResult.reason = `Insufficient UCT balance (${balance} < ${uctFee})`;
        } else if (!autoSendAllowed) {
          autoSendResult.reason = 'Auto-send not enabled for this sender';
        }
      }
    }

    // Record AI usage
    await supabase.from('ai_usage').insert({
      user_id: user.id,
      type: 'auto_response',
      used_at: new Date().toISOString(),
    });

    console.log(`Auto-response generated for message ${message_id}, auto_send: ${autoSendResult.sent}`);

    return new Response(
      JSON.stringify({
        success: true,
        draft,
        word_count: wordCount,
        uct_fee: uctFee,
        auto_send: autoSendResult,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Auto-response error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
