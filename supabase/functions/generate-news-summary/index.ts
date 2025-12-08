import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated. Please log in to generate news summaries.' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { promptId } = await req.json();

    // Get the user's prompt
    let promptText = `Provide a balanced and insightful summary of the most important global events from the past week.
Include:
• U.S. and global stock markets, inflation data, and major economic reports
• Crypto market trends and major blockchain news
• Key geopolitical updates (Gaza-Israel, Ukraine-Russia, China-Taiwan, etc.)
• Notable scientific, environmental, and cultural developments
• Major policy or tech shifts shaping the world this week.`;

    if (promptId) {
      const { data: prompt } = await supabaseClient
        .from('news_prompts')
        .select('prompt_text')
        .eq('id', promptId)
        .single();

      if (prompt) {
        promptText = prompt.prompt_text;
      }
    }

    // Generate summary using Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
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
          {
            role: 'system',
            content: 'You are a professional news curator and analyst. Provide concise, balanced, and insightful news summaries based on the user\'s request. Format your response in markdown with clear sections and bullet points for readability. Use headers (##) for main topics and bullet points for key details.'
          },
          {
            role: 'user',
            content: promptText
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI usage limit reached. Please add credits to continue.' }),
          {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to generate news summary' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await response.json();
    const summaryText = data.choices[0].message.content;

    // Save the summary to database
    const { data: savedSummary, error: saveError } = await supabaseClient
      .from('news_summaries')
      .insert({
        user_id: user.id,
        prompt_id: promptId || null,
        summary_text: summaryText,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving summary:', saveError);
    }

    return new Response(
      JSON.stringify({ 
        summary: summaryText,
        summaryId: savedSummary?.id 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in generate-news-summary function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
