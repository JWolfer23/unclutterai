import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: Only allow cron-triggered calls with CRON_SECRET
    // This prevents unauthorized users from triggering mass emails
    const authHeader = req.headers.get('Authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');
    
    if (!cronSecret) {
      console.error('CRON_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('Unauthorized attempt to trigger scheduled news');
      return new Response(
        JSON.stringify({ error: 'Unauthorized. This endpoint is cron-triggered only.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Cron-triggered scheduled news delivery');

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resend = new Resend(resendApiKey);
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get users with email delivery enabled
    const schedulesQuery = supabaseAdmin
      .from('news_schedules')
      .select('*, profiles!inner(email)')
      .eq('is_enabled', true)
      .contains('channels', ['email']);

    const { data: schedules, error: schedulesError } = await schedulesQuery;

    if (schedulesError) {
      console.error('Error fetching schedules:', schedulesError);
      throw schedulesError;
    }

    console.log(`Found ${schedules?.length || 0} schedules with email enabled`);

    const results = [];
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    for (const schedule of schedules || []) {
      try {
        const userEmail = (schedule.profiles as any)?.email;
        if (!userEmail) {
          console.log(`No email for user ${schedule.user_id}, skipping`);
          continue;
        }

        // Get user's active prompt
        const { data: activePrompt } = await supabaseAdmin
          .from('news_prompts')
          .select('prompt_text')
          .eq('user_id', schedule.user_id)
          .eq('is_active', true)
          .single();

        const promptText = activePrompt?.prompt_text || `Provide a balanced and insightful summary of the most important global events from the past day.
Include:
• U.S. and global stock markets, inflation data, and major economic reports
• Crypto market trends and major blockchain news
• Key geopolitical updates
• Notable scientific, environmental, and cultural developments`;

        // Generate news summary using Lovable AI
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
                content: 'You are a professional news curator. Provide a concise, well-formatted news summary. Use clear headers and bullet points. Keep it scannable for email reading.'
              },
              {
                role: 'user',
                content: promptText
              }
            ],
          }),
        });

        if (!aiResponse.ok) {
          console.error(`AI generation failed for user ${schedule.user_id}`);
          continue;
        }

        const aiData = await aiResponse.json();
        const summaryText = aiData.choices[0].message.content;

        // Convert markdown to simple HTML for email
        const htmlContent = summaryText
          .replace(/^## (.+)$/gm, '<h2 style="color: #8B5CF6; margin-top: 20px;">$1</h2>')
          .replace(/^### (.+)$/gm, '<h3 style="color: #A78BFA; margin-top: 15px;">$1</h3>')
          .replace(/^• (.+)$/gm, '<li style="margin: 5px 0;">$1</li>')
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\n/g, '<br>');

        // Send email
        const emailResponse = await resend.emails.send({
          from: "UnclutterAI News <onboarding@resend.dev>",
          to: [userEmail],
          subject: `📰 Your ${schedule.frequency === 'daily' ? 'Daily' : 'Weekly'} News Summary`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f0f0f; color: #e5e5e5; padding: 40px 20px; margin: 0;">
              <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 30px; border: 1px solid rgba(139, 92, 246, 0.3);">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #8B5CF6; font-size: 24px; margin: 0;">UnclutterAI</h1>
                  <p style="color: #a0a0a0; font-size: 14px; margin: 5px 0 0 0;">Your AI-Curated News Summary</p>
                </div>
                <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; border: 1px solid rgba(255,255,255,0.1);">
                  ${htmlContent}
                </div>
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
                  <p style="color: #666; font-size: 12px; margin: 0;">
                    You're receiving this because you enabled email delivery in UnclutterAI.
                    <br>Manage your preferences in the app.
                  </p>
                </div>
              </div>
            </body>
            </html>
          `,
        });

        console.log(`Email sent to ${userEmail}:`, emailResponse);

        // Save summary to database
        await supabaseAdmin.from('news_summaries').insert({
          user_id: schedule.user_id,
          summary_text: summaryText,
        });

        results.push({ userId: schedule.user_id, email: userEmail, status: 'sent' });
      } catch (userError: any) {
        console.error(`Error processing user ${schedule.user_id}:`, userError);
        results.push({ userId: schedule.user_id, status: 'error', error: userError.message });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-scheduled-news function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
