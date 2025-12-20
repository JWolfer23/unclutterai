import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user with Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('User authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting Microsoft OAuth flow for user:', user.id);

    // Get Microsoft OAuth credentials
    const clientId = Deno.env.get('MICROSOFT_CLIENT_ID');
    if (!clientId) {
      console.error('MICROSOFT_CLIENT_ID not configured');
      return new Response(
        JSON.stringify({ error: 'Microsoft OAuth not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body for redirect URL
    const body = await req.json().catch(() => ({}));
    const frontendUrl = body.redirectUrl || Deno.env.get('FRONTEND_URL') || 'https://aihlehujbzkkugzmcobn.lovableproject.com';
    
    // Build Microsoft OAuth authorization URL using Microsoft identity platform v2
    const redirectUri = `${supabaseUrl}/functions/v1/microsoft-oauth-callback`;
    
    // Scopes: Mail.Read and Calendars.ReadWrite for delegated permissions
    const scopes = [
      'openid',
      'profile',
      'email',
      'offline_access', // Required for refresh token
      'Mail.Read',
      'Calendars.ReadWrite'
    ].join(' ');

    // State includes user_id and frontend redirect for security
    const state = JSON.stringify({
      user_id: user.id,
      redirect_url: frontendUrl
    });
    const encodedState = btoa(state);

    const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('state', encodedState);
    authUrl.searchParams.set('response_mode', 'query');
    authUrl.searchParams.set('prompt', 'consent'); // Always show consent to ensure all scopes granted

    console.log('Generated Microsoft OAuth URL for user:', user.id);

    return new Response(
      JSON.stringify({ authUrl: authUrl.toString() }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in microsoft-oauth-start:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
