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
      throw new Error('Not authenticated');
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

    // Generate summary using OpenAI
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a professional news curator and analyst. Provide concise, balanced, and insightful news summaries based on the user\'s request. Format your response in markdown with clear sections and bullet points for readability.'
          },
          {
            role: 'user',
            content: promptText
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

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
