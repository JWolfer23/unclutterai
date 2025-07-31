import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';
import { WeeklyReportEmail } from './_templates/weekly-report.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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
    console.log("Starting weekly report email campaign...");

    // Fetch all users with their dashboard data
    const { data: users, error } = await supabase
      .from('user_ai_dashboard')
      .select('*')
      .not('email', 'is', null);

    if (error) {
      console.error("Error fetching user dashboard data:", error);
      throw error;
    }

    if (!users || users.length === 0) {
      console.log("No users found with valid email addresses");
      return new Response(JSON.stringify({ message: "No users to send emails to" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${users.length} users to send weekly reports to`);

    const emailPromises = users.map(async (user) => {
      try {
        // Get user profile for name
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.user_id)
          .single();

        const userName = profile?.full_name || user.email.split('@')[0];

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

    return new Response(JSON.stringify({
      message: "Weekly report campaign completed",
      successful,
      failed,
      results
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in weekly-report function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);