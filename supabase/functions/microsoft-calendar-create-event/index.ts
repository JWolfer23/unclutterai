import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode as hexDecode, encode as hexEncode } from "https://deno.land/std@0.168.0/encoding/hex.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function decryptToken(encryptedHex: string, key: string): Promise<string> {
  const combined = hexDecode(encoder.encode(encryptedHex));
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key.padEnd(32, '0').slice(0, 32)),
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    keyMaterial,
    encrypted
  );

  return decoder.decode(decrypted);
}

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

async function refreshMicrosoftToken(
  refreshToken: string,
  supabase: any,
  credentialId: string,
  encryptionKey: string
): Promise<{ accessToken: string } | null> {
  const clientId = Deno.env.get("MICROSOFT_CLIENT_ID");
  const clientSecret = Deno.env.get("MICROSOFT_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    console.error("Microsoft OAuth not configured");
    return null;
  }

  const tokenResponse = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
      scope: "openid profile email Mail.Read Calendars.ReadWrite offline_access",
    }),
  });

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok || tokenData.error) {
    console.error("Token refresh failed:", tokenData.error);

    if (tokenData.error === "invalid_grant" || tokenData.error === "interaction_required") {
      await supabase
        .from("email_credentials")
        .update({
          is_active: false,
          sync_error: `Token revoked: ${tokenData.error_description || tokenData.error}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", credentialId);
    }

    return null;
  }

  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();
  const encryptedAccessToken = await encryptToken(tokenData.access_token, encryptionKey);
  const encryptedRefreshToken = tokenData.refresh_token
    ? await encryptToken(tokenData.refresh_token, encryptionKey)
    : null;

  const updateData: Record<string, any> = {
    access_token_encrypted: encryptedAccessToken,
    token_expires_at: expiresAt,
    sync_error: null,
    updated_at: new Date().toISOString(),
  };

  if (encryptedRefreshToken) {
    updateData.refresh_token_encrypted = encryptedRefreshToken;
  }

  await supabase.from("email_credentials").update(updateData).eq("id", credentialId);

  return { accessToken: tokenData.access_token };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("microsoft-calendar-create-event: Creating focus block");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { title, startTime, endTime, description } = body;

    if (!title || !startTime || !endTime) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: title, startTime, endTime" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const encryptionKey = Deno.env.get("TOKEN_ENCRYPTION_KEY");

    if (!encryptionKey) {
      return new Response(
        JSON.stringify({ error: "Configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Microsoft credentials
    const { data: credentials, error: credError } = await supabase
      .from("email_credentials")
      .select("*")
      .eq("user_id", user.id)
      .eq("provider", "microsoft")
      .eq("is_active", true)
      .single();

    if (credError || !credentials) {
      return new Response(
        JSON.stringify({ error: "Microsoft not connected", needsReconnect: true }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let accessToken = await decryptToken(credentials.access_token_encrypted, encryptionKey);
    const refreshToken = await decryptToken(credentials.refresh_token_encrypted, encryptionKey);

    // Check token expiry
    const tokenExpiry = credentials.token_expires_at ? new Date(credentials.token_expires_at) : new Date(0);
    const bufferTime = 5 * 60 * 1000;

    if (tokenExpiry.getTime() - bufferTime < Date.now()) {
      const refreshResult = await refreshMicrosoftToken(refreshToken, supabase, credentials.id, encryptionKey);
      if (!refreshResult) {
        return new Response(
          JSON.stringify({ error: "Token refresh failed", needsReconnect: true }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      accessToken = refreshResult.accessToken;
    }

    // Create event in Microsoft Calendar
    const eventPayload = {
      subject: title,
      body: {
        contentType: "text",
        content: description || "Focus block created by UnclutterAI"
      },
      start: {
        dateTime: new Date(startTime).toISOString().slice(0, -1), // Remove Z for Graph API
        timeZone: "UTC"
      },
      end: {
        dateTime: new Date(endTime).toISOString().slice(0, -1),
        timeZone: "UTC"
      },
      showAs: "busy",
      isReminderOn: true,
      reminderMinutesBeforeStart: 5,
      categories: ["Focus Block"]
    };

    console.log("Creating event:", JSON.stringify(eventPayload));

    const createResponse = await fetch("https://graph.microsoft.com/v1.0/me/events", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(eventPayload)
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error("Failed to create event:", createResponse.status, errorText);

      if (createResponse.status === 401) {
        await supabase
          .from("email_credentials")
          .update({
            is_active: false,
            sync_error: "Access denied by Microsoft. Please reconnect.",
            updated_at: new Date().toISOString(),
          })
          .eq("id", credentials.id);

        return new Response(
          JSON.stringify({ error: "Microsoft access denied", needsReconnect: true }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Failed to create calendar event" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const createdEvent = await createResponse.json();

    // Store in local calendar_events table
    const { error: insertError } = await supabase
      .from("calendar_events")
      .insert({
        user_id: user.id,
        external_event_id: createdEvent.id,
        provider: "outlook_calendar",
        title: title,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        is_all_day: false,
        show_as: "busy",
        is_cancelled: false
      });

    if (insertError) {
      console.error("Failed to store event locally:", insertError);
    }

    console.log("Focus block created successfully:", createdEvent.id);

    return new Response(
      JSON.stringify({
        success: true,
        eventId: createdEvent.id,
        webLink: createdEvent.webLink
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("microsoft-calendar-create-event error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create event", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
