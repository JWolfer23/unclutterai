import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('score-message: Starting');

    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { message_ids } = body;

    if (!message_ids || !Array.isArray(message_ids) || message_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: 'message_ids array required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('score-message: Scoring', message_ids.length, 'messages');

    // Fetch messages to score
    const { data: messages, error: fetchError } = await supabase
      .from('messages')
      .select('id, sender_name, subject, preview')
      .eq('user_id', user.id)
      .in('id', message_ids);

    if (fetchError || !messages) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch messages' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'AI not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: { id: string; score: number }[] = [];

    for (const message of messages) {
      const prompt = `Analyze this email and assign a priority score from 1-5:
- 5: Urgent/time-sensitive (meetings today, deadlines, emergencies)
- 4: Important/action required (tasks, requests from key people)
- 3: Normal priority (regular correspondence)
- 2: Low priority (newsletters, FYI messages)
- 1: Very low priority (promotions, marketing)

From: ${message.sender_name}
Subject: ${message.subject}
Preview: ${message.preview}

Respond with ONLY a single digit 1-5.`;

      try {
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 5,
            temperature: 0.1,
          }),
        });

        const data = await response.json();
        const scoreText = data.choices?.[0]?.message?.content?.trim();
        const score = parseInt(scoreText, 10);
        
        const finalScore = (score >= 1 && score <= 5) ? score : 3;
        results.push({ id: message.id, score: finalScore });

        // Update message in database
        const priority = finalScore >= 4 ? 'high' : finalScore >= 3 ? 'medium' : 'low';
        await supabase
          .from('messages')
          .update({ priority_score: finalScore, priority })
          .eq('id', message.id);

      } catch (error) {
        console.error('score-message: AI error for message', message.id, error);
        results.push({ id: message.id, score: 3 });
      }
    }

    console.log('score-message: Completed scoring', results.length, 'messages');

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('score-message error:', error);
    return new Response(
      JSON.stringify({ error: 'Scoring failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
