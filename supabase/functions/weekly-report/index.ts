import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';
import { WeeklyReportEmail } from './_templates/weekly-report.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const cronSecret = Deno.env.get('CRON_SECRET');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: Verify CRON_SECRET to prevent unauthorized mass email triggers
    const authHeader = req.headers.get('authorization');
    const providedSecret = authHeader?.replace('Bearer ', '');
    
    if (!cronSecret) {
      console.error("CRON_SECRET not configured");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    if (!providedSecret || providedSecret !== cronSecret) {
      console.warn("Unauthorized attempt to trigger weekly-report function");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("CRON_SECRET verified, starting weekly report email campaign...");

    // Fetch all user profiles with email addresses (using service role bypasses RLS)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .not('email', 'is', null);

    if (profilesError) {
      console.error("Error fetching user profiles:", profilesError);
      throw profilesError;
    }

    if (!profiles || profiles.length === 0) {
      console.log("No users found with valid email addresses");
      return new Response(JSON.stringify({ message: "No users to send emails to" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${profiles.length} users to send weekly reports to`);

    // Build dashboard data for each user from individual tables
    const users = await Promise.all(profiles.map(async (profile) => {
      const today = new Date().toISOString().split('T')[0];
      
      // Get daily AI usage count
      const { count: dailySummaries } = await supabase
        .from('ai_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('type', 'summary')
        .gte('used_at', today);

      // Get tasks count
      const { count: tasksGenerated } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id);

      // Get token balance
      const { data: tokenData } = await supabase
        .from('tokens')
        .select('balance')
        .eq('user_id', profile.id)
        .single();

      // Get focus streak
      const { data: streakData } = await supabase
        .from('focus_streaks')
        .select('current_streak')
        .eq('user_id', profile.id)
        .single();

      return {
        user_id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        daily_summaries: dailySummaries || 0,
        tasks_generated: tasksGenerated || 0,
        tokens_earned: tokenData?.balance || 0,
        focus_streak: streakData?.current_streak || 0,
      };
    }));

    const emailPromises = users.map(async (user) => {
      try {
        const userName = user.full_name || user.email.split('@')[0];

        const html = await renderAsync(
          React.createElement(WeeklyReportEmail, {
            userName,
            daily_summaries: user.daily_summaries || 0,
            tasks_generated: user.tasks_generated || 0,
            tokens_earned: user.tokens_earned || 0,
            focus_streak: user.focus_streak || 0,
          })
        );

        const emailResult = await resend.emails.send({
          from: 'UnclutterAI <reports@resend.dev>',
          to: [user.email],
          subject: 'Your Weekly UnclutterAI Report',
          html,
        });

        console.log(`Email sent to ${user.email}:`, emailResult);
        return { success: true, email: user.email, result: emailResult };
      } catch (emailError) {
        console.error(`Failed to send email to ${user.email}:`, emailError);
        return { success: false, email: user.email, error: emailError.message };
      }
    });

    const results = await Promise.all(emailPromises);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`Weekly report campaign completed: ${successful} sent, ${failed} failed`);

    // Return sanitized response (don't expose email addresses in response)
    return new Response(JSON.stringify({
      message: "Weekly report campaign completed",
      successful,
      failed,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in weekly-report function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);