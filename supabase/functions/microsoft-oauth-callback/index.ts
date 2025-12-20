import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { encode as hexEncode } from "https://deno.land/std@0.168.0/encoding/hex.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AES-GCM encryption matching gmail-sync security pattern
const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function encryptToken(token: string, key: string): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key.padEnd(32, '0').slice(0, 32)),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    keyMaterial,
    encoder.encode(token)
  );

  const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return decoder.decode(hexEncode(combined));
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const stateParam = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    // Handle OAuth errors
    if (error) {
      console.error('Microsoft OAuth error:', error, errorDescription);
      const errorRedirect = new URL('https://aihlehujbzkkugzmcobn.lovableproject.com');
      errorRedirect.searchParams.set('microsoft_error', error);
      errorRedirect.searchParams.set('microsoft_error_description', errorDescription || 'OAuth failed');
      return Response.redirect(errorRedirect.toString(), 302);
    }

    if (!code || !stateParam) {
      console.error('Missing code or state parameter');
      return new Response('Missing required parameters', { status: 400 });
    }

    // Decode state to get user_id and redirect URL
    let state: { user_id: string; redirect_url: string };
    try {
      state = JSON.parse(atob(stateParam));
    } catch (e) {
      console.error('Failed to decode state:', e);
      return new Response('Invalid state parameter', { status: 400 });
    }

    const { user_id, redirect_url } = state;
    console.log('Processing Microsoft OAuth callback for user:', user_id);

    // Get credentials
    const clientId = Deno.env.get('MICROSOFT_CLIENT_ID')!;
    const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET')!;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const encryptionKey = Deno.env.get('TOKEN_ENCRYPTION_KEY');

    if (!encryptionKey) {
      console.error('TOKEN_ENCRYPTION_KEY not configured');
      const errorRedirect = new URL(redirect_url);
      errorRedirect.searchParams.set('microsoft_error', 'configuration_error');
      return Response.redirect(errorRedirect.toString(), 302);
    }

    const redirectUri = `${supabaseUrl}/functions/v1/microsoft-oauth-callback`;

    // Exchange code for tokens
    console.log('Exchanging authorization code for tokens...');
    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      const errorRedirect = new URL(redirect_url);
      errorRedirect.searchParams.set('microsoft_error', 'token_exchange_failed');
      return Response.redirect(errorRedirect.toString(), 302);
    }

    const tokens = await tokenResponse.json();
    console.log('Token exchange successful');

    // Get user info from Microsoft Graph
    console.log('Fetching user profile from Microsoft Graph...');
    const userInfoResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      console.error('Failed to fetch user info:', await userInfoResponse.text());
      const errorRedirect = new URL(redirect_url);
      errorRedirect.searchParams.set('microsoft_error', 'user_info_failed');
      return Response.redirect(errorRedirect.toString(), 302);
    }

    const userInfo = await userInfoResponse.json();
    const emailAddress = userInfo.mail || userInfo.userPrincipalName;
    console.log('Got Microsoft user email:', emailAddress);

    // Store credentials in database using service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Encrypt tokens using AES-GCM before storage
    const encryptedAccessToken = await encryptToken(tokens.access_token, encryptionKey);
    const encryptedRefreshToken = await encryptToken(tokens.refresh_token || '', encryptionKey);

    // Calculate token expiry
    const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000)).toISOString();

    // Upsert email credentials
    const { error: dbError } = await supabase
      .from('email_credentials')
      .upsert({
        user_id: user_id,
        provider: 'microsoft',
        email_address: emailAddress,
        access_token_encrypted: encryptedAccessToken,
        refresh_token_encrypted: encryptedRefreshToken,
        token_expires_at: expiresAt,
        scopes: ['Mail.Read', 'Calendars.ReadWrite'],
        is_active: true,
        last_sync_at: null,
        sync_error: null,
      }, {
        onConflict: 'user_id,provider,email_address',
        ignoreDuplicates: false
      });

    if (dbError) {
      console.error('Failed to store credentials:', dbError);
      // Try insert with different conflict strategy
      const { error: insertError } = await supabase
        .from('email_credentials')
        .insert({
          user_id: user_id,
          provider: 'microsoft',
          email_address: emailAddress,
          access_token_encrypted: encryptedAccessToken,
          refresh_token_encrypted: encryptedRefreshToken,
          token_expires_at: expiresAt,
          scopes: ['Mail.Read', 'Calendars.ReadWrite'],
          is_active: true,
        });
      
      if (insertError) {
        console.error('Insert also failed:', insertError);
        const errorRedirect = new URL(redirect_url);
        errorRedirect.searchParams.set('microsoft_error', 'storage_failed');
        return Response.redirect(errorRedirect.toString(), 302);
      }
    }

    console.log('Microsoft credentials stored successfully for user:', user_id);

    // Redirect back to frontend with success
    const successRedirect = new URL(redirect_url);
    successRedirect.searchParams.set('microsoft_connected', 'true');
    successRedirect.searchParams.set('microsoft_email', emailAddress);

    return Response.redirect(successRedirect.toString(), 302);

  } catch (error) {
    console.error('Error in microsoft-oauth-callback:', error);
    const errorRedirect = new URL('https://aihlehujbzkkugzmcobn.lovableproject.com');
    errorRedirect.searchParams.set('microsoft_error', 'internal_error');
    return Response.redirect(errorRedirect.toString(), 302);
  }
});
