import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as hexEncode } from "https://deno.land/std@0.168.0/encoding/hex.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple encryption using Web Crypto API
async function encryptToken(token: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  
  // Create key from secret
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key.padEnd(32, '0').slice(0, 32)),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  // Generate IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Encrypt
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    keyMaterial,
    data
  );
  
  // Combine IV + encrypted data and encode as hex
  const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return new TextDecoder().decode(hexEncode(combined));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    console.log('gmail-oauth-callback: Received callback');

    if (error) {
      console.error('gmail-oauth-callback: OAuth error:', error);
      return new Response(
        `<html><body><script>window.opener?.postMessage({type:'gmail-oauth-error',error:'${error}'},'*');window.close();</script></body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    if (!code || !state) {
      return new Response(
        `<html><body><script>window.opener?.postMessage({type:'gmail-oauth-error',error:'missing_params'},'*');window.close();</script></body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Decode state to get user_id
    let stateData;
    try {
      stateData = JSON.parse(atob(state));
    } catch {
      return new Response(
        `<html><body><script>window.opener?.postMessage({type:'gmail-oauth-error',error:'invalid_state'},'*');window.close();</script></body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    const userId = stateData.user_id;
    console.log('gmail-oauth-callback: Processing for user:', userId);

    // Exchange code for tokens
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const redirectUri = `https://aihlehujbzkkugzmcobn.supabase.co/functions/v1/gmail-oauth-callback`;

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('gmail-oauth-callback: Token exchange error:', tokenData.error);
      return new Response(
        `<html><body><script>window.opener?.postMessage({type:'gmail-oauth-error',error:'${tokenData.error}'},'*');window.close();</script></body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    console.log('gmail-oauth-callback: Token exchange successful');

    // Get user email from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userInfo = await userInfoResponse.json();
    const emailAddress = userInfo.email;

    console.log('gmail-oauth-callback: Got user email:', emailAddress);

    // Encrypt tokens
    const encryptionKey = Deno.env.get('TOKEN_ENCRYPTION_KEY');
    if (!encryptionKey) {
      console.error('gmail-oauth-callback: Missing TOKEN_ENCRYPTION_KEY');
      return new Response(
        `<html><body><script>window.opener?.postMessage({type:'gmail-oauth-error',error:'config_error'},'*');window.close();</script></body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    const accessTokenEncrypted = await encryptToken(tokenData.access_token, encryptionKey);
    const refreshTokenEncrypted = await encryptToken(tokenData.refresh_token || '', encryptionKey);

    // Store credentials in database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const tokenExpiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString();

    const { error: upsertError } = await supabase
      .from('email_credentials')
      .upsert({
        user_id: userId,
        provider: 'gmail',
        email_address: emailAddress,
        access_token_encrypted: accessTokenEncrypted,
        refresh_token_encrypted: refreshTokenEncrypted,
        token_expires_at: tokenExpiresAt,
        scopes: tokenData.scope?.split(' ') || [],
        is_active: true,
        sync_error: null,
      }, {
        onConflict: 'user_id,email_address',
      });

    if (upsertError) {
      console.error('gmail-oauth-callback: Database error:', upsertError);
      return new Response(
        `<html><body><script>window.opener?.postMessage({type:'gmail-oauth-error',error:'db_error'},'*');window.close();</script></body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    console.log('gmail-oauth-callback: Credentials stored successfully');

    // Return success page that posts message to opener
    return new Response(
      `<html>
        <body>
          <p>Gmail connected successfully! This window will close automatically.</p>
          <script>
            window.opener?.postMessage({type:'gmail-oauth-success',email:'${emailAddress}'},'*');
            setTimeout(() => window.close(), 1500);
          </script>
        </body>
      </html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  } catch (error) {
    console.error('gmail-oauth-callback error:', error);
    return new Response(
      `<html><body><script>window.opener?.postMessage({type:'gmail-oauth-error',error:'server_error'},'*');window.close();</script></body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  }
});
