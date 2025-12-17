import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { action } = body;

    // EXPORT: Generate complete data export for user
    if (action === 'export') {
      console.log(`Data export requested for user: ${user.id}`);

      // Collect all user data from all tables
      const exportData: Record<string, unknown> = {
        export_date: new Date().toISOString(),
        user_id: user.id,
        email: user.email,
      };

      // Profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      exportData.profile = profile;

      // Messages (with PII note)
      const { data: messages } = await supabase
        .from('messages')
        .select('id, subject, sender_name, sender_email, platform, priority, created_at, is_archived')
        .eq('user_id', user.id);
      exportData.messages = messages;
      exportData.messages_count = messages?.length || 0;

      // Focus sessions
      const { data: sessions } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id);
      exportData.focus_sessions = sessions;

      // Focus streaks
      const { data: streaks } = await supabase
        .from('focus_streaks')
        .select('*')
        .eq('user_id', user.id);
      exportData.focus_streaks = streaks;

      // UCT balances
      const { data: balance } = await supabase
        .from('uct_balances')
        .select('*')
        .eq('user_id', user.id)
        .single();
      exportData.uct_balance = balance;

      // Focus ledger (transaction history)
      const { data: ledger } = await supabase
        .from('focus_ledger')
        .select('event_type, uct_reward, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1000);
      exportData.focus_ledger = ledger;

      // Tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id);
      exportData.tasks = tasks;

      // Learning data
      const { data: learningGoals } = await supabase
        .from('learning_goals')
        .select('*')
        .eq('user_id', user.id);
      exportData.learning_goals = learningGoals;

      const { data: learningNotes } = await supabase
        .from('learning_notes')
        .select('*')
        .eq('user_id', user.id);
      exportData.learning_notes = learningNotes;

      // News preferences
      const { data: newsPrompts } = await supabase
        .from('news_prompts')
        .select('*')
        .eq('user_id', user.id);
      exportData.news_prompts = newsPrompts;

      // Token claims history
      const { data: claims } = await supabase
        .from('tokens_claims')
        .select('*')
        .eq('user_id', user.id);
      exportData.token_claims = claims;

      // Log the export request
      await supabase.from('telemetry_events').insert({
        user_id: user.id,
        event_type: 'gdpr',
        event_name: 'data_export',
        payload: { tables_exported: Object.keys(exportData).length },
        success: true,
      });

      return new Response(JSON.stringify(exportData), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="unclutter-data-export-${new Date().toISOString().split('T')[0]}.json"`
        },
      });
    }

    // DELETE: Complete account and data deletion (GDPR Right to Erasure)
    if (action === 'delete') {
      const { confirmation } = body;
      
      if (confirmation !== 'DELETE_MY_ACCOUNT') {
        return new Response(JSON.stringify({ 
          error: 'Confirmation required',
          message: 'Please provide confirmation: "DELETE_MY_ACCOUNT"'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`Account deletion requested for user: ${user.id}`);

      // Delete in order to respect foreign key constraints
      const deletionOrder = [
        'telemetry_events',
        'ai_feedback',
        'qa_test_runs',
        'focus_session_notes',
        'focus_rewards_history',
        'interruptions',
        'focus_sessions',
        'focus_streaks',
        'focus_levels',
        'focus_ledger',
        'onchain_batches',
        'uct_balances',
        'tokens_claims',
        'uct_claim_history',
        'tokens',
        'auto_send_logs',
        'sender_trust',
        'tasks',
        'action_plans',
        'messages',
        'email_credentials',
        'learning_notes',
        'learning_sources',
        'learning_goals',
        'learning_schedules',
        'learning_streaks',
        'news_summaries',
        'news_prompts',
        'news_schedules',
        'ai_usage',
        'profiles',
      ];

      // Track deletion results server-side only (never expose to client)
      const deletionResults: Record<string, string> = {};
      let hasErrors = false;

      for (const table of deletionOrder) {
        try {
          const { error } = await supabase
            .from(table)
            .delete()
            .eq('user_id', user.id);
          
          if (error) {
            // Try with 'id' column for profiles table
            if (table === 'profiles') {
              const { error: profileError } = await supabase
                .from('profiles')
                .delete()
                .eq('id', user.id);
              deletionResults[table] = profileError ? `error` : 'deleted';
              if (profileError) hasErrors = true;
            } else {
              deletionResults[table] = 'error';
              hasErrors = true;
            }
          } else {
            deletionResults[table] = 'deleted';
          }
        } catch (e) {
          deletionResults[table] = 'error';
          hasErrors = true;
        }
      }

      // Finally delete the auth user
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(user.id);

      // Log detailed results server-side for debugging (never sent to client)
      console.log(`Account deletion completed for user ${user.id}:`, {
        deletion_results: deletionResults,
        auth_deleted: !authDeleteError,
        has_errors: hasErrors || !!authDeleteError,
      });

      // Return only generic success/failure to client (no schema exposure)
      const success = !authDeleteError && !hasErrors;
      return new Response(JSON.stringify({
        success,
        message: success 
          ? 'Your account and all associated data have been permanently deleted.'
          : 'Account deletion encountered issues. Please contact support for assistance.',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ANONYMIZE: Remove PII but keep aggregated data
    if (action === 'anonymize') {
      console.log(`Data anonymization requested for user: ${user.id}`);

      // Anonymize profile
      await supabase
        .from('profiles')
        .update({
          full_name: null,
          email: null,
          avatar_url: null,
          wallet_address: null,
        })
        .eq('id', user.id);

      // Anonymize messages (remove sender PII)
      await supabase
        .from('messages')
        .update({
          sender_name: 'Anonymous',
          sender_email: null,
          sender_avatar: null,
          content: '[Content removed for privacy]',
        })
        .eq('user_id', user.id);

      // Remove email credentials
      await supabase
        .from('email_credentials')
        .delete()
        .eq('user_id', user.id);

      // Log anonymization
      await supabase.from('telemetry_events').insert({
        user_id: user.id,
        event_type: 'gdpr',
        event_name: 'data_anonymized',
        success: true,
      });

      return new Response(JSON.stringify({
        success: true,
        message: 'Personal data has been anonymized. Account structure preserved.',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('GDPR compliance error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

