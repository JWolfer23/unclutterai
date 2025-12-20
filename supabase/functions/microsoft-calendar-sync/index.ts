import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// XOR-based decryption (matching the OAuth callback encryption)
const ENCRYPTION_KEY = Deno.env.get("TOKEN_ENCRYPTION_KEY") || "default-key-change-in-production";

function xorDecrypt(encoded: string, key: string): string {
  const text = atob(encoded);
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

function xorEncrypt(text: string, key: string): string {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result);
}

// Refresh Microsoft access token
async function refreshMicrosoftToken(
  refreshToken: string,
  supabase: any,
  credentialId: string
): Promise<{ accessToken: string; expiresAt: string } | null> {
  const clientId = Deno.env.get("MICROSOFT_CLIENT_ID");
  const clientSecret = Deno.env.get("MICROSOFT_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    console.error("Microsoft OAuth not configured");
    return null;
  }

  console.log("microsoft-calendar-sync: Refreshing expired token...");

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
    console.error("microsoft-calendar-sync: Token refresh failed:", tokenData.error);

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

  // Store new tokens
  const encryptedAccessToken = xorEncrypt(tokenData.access_token, ENCRYPTION_KEY);
  const encryptedRefreshToken = tokenData.refresh_token
    ? xorEncrypt(tokenData.refresh_token, ENCRYPTION_KEY)
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

  return { accessToken: tokenData.access_token, expiresAt };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("microsoft-calendar-sync: Starting calendar sync");

    // Verify user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("microsoft-calendar-sync: User authenticated:", user.id);

    // Get user's Microsoft credentials
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

    console.log("microsoft-calendar-sync: Found credentials for:", credentials.email_address);

    // Decrypt tokens
    let accessToken = xorDecrypt(credentials.access_token_encrypted, ENCRYPTION_KEY);
    const refreshToken = xorDecrypt(credentials.refresh_token_encrypted, ENCRYPTION_KEY);

    // Check if token is expired (with 5 minute buffer)
    const tokenExpiry = credentials.token_expires_at ? new Date(credentials.token_expires_at) : new Date(0);
    const bufferTime = 5 * 60 * 1000;

    if (tokenExpiry.getTime() - bufferTime < Date.now()) {
      const refreshResult = await refreshMicrosoftToken(refreshToken, supabase, credentials.id);

      if (!refreshResult) {
        return new Response(
          JSON.stringify({ error: "Token refresh failed, please reconnect Microsoft", needsReconnect: true }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      accessToken = refreshResult.accessToken;
    }

    // Calculate date range: today to 7 days from now
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfWeek = new Date(startOfToday);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    endOfWeek.setHours(23, 59, 59, 999);

    // Fetch calendar events from Microsoft Graph
    console.log("microsoft-calendar-sync: Fetching events from", startOfToday.toISOString(), "to", endOfWeek.toISOString());

    const graphUrl = new URL("https://graph.microsoft.com/v1.0/me/calendarview");
    graphUrl.searchParams.set("startDateTime", startOfToday.toISOString());
    graphUrl.searchParams.set("endDateTime", endOfWeek.toISOString());
    graphUrl.searchParams.set("$select", "id,subject,start,end,isAllDay,showAs,location,organizer,isCancelled");
    graphUrl.searchParams.set("$orderby", "start/dateTime asc");
    graphUrl.searchParams.set("$top", "100");

    const eventsResponse = await fetch(graphUrl.toString(), {
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        Prefer: 'outlook.timezone="UTC"'
      },
    });

    if (!eventsResponse.ok) {
      const errorText = await eventsResponse.text();
      console.error("microsoft-calendar-sync: Microsoft Graph API error:", eventsResponse.status, errorText);

      if (eventsResponse.status === 401) {
        await supabase
          .from("email_credentials")
          .update({
            is_active: false,
            sync_error: "Access denied by Microsoft. Please reconnect.",
            updated_at: new Date().toISOString(),
          })
          .eq("id", credentials.id);

        return new Response(
          JSON.stringify({ error: "Microsoft access denied, please reconnect", needsReconnect: true }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Failed to fetch calendar events" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const eventsData = await eventsResponse.json();
    const events = eventsData.value || [];

    console.log("microsoft-calendar-sync: Found", events.length, "calendar events");

    // Delete old events for this user/provider before inserting fresh data
    await supabase
      .from("calendar_events")
      .delete()
      .eq("user_id", user.id)
      .eq("provider", "outlook");

    // Process and store events
    let syncedCount = 0;
    const eventsToInsert = [];

    for (const event of events) {
      // Extract event data
      const startTime = event.start?.dateTime 
        ? new Date(event.start.dateTime + (event.start.timeZone === 'UTC' ? 'Z' : '')).toISOString()
        : null;
      const endTime = event.end?.dateTime 
        ? new Date(event.end.dateTime + (event.end.timeZone === 'UTC' ? 'Z' : '')).toISOString()
        : null;

      if (!startTime || !endTime) {
        console.log("microsoft-calendar-sync: Skipping event without valid times:", event.id);
        continue;
      }

      // Map Microsoft showAs to our format
      // Microsoft values: free, tentative, busy, oof (out of office), workingElsewhere, unknown
      const showAs = event.showAs || 'busy';

      eventsToInsert.push({
        user_id: user.id,
        external_event_id: event.id,
        provider: "outlook",
        title: event.subject || "(No Title)",
        start_time: startTime,
        end_time: endTime,
        is_all_day: event.isAllDay || false,
        show_as: showAs,
        location: event.location?.displayName || null,
        organizer_name: event.organizer?.emailAddress?.name || null,
        organizer_email: event.organizer?.emailAddress?.address || null,
        is_cancelled: event.isCancelled || false,
      });
    }

    // Bulk insert events
    if (eventsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("calendar_events")
        .insert(eventsToInsert);

      if (insertError) {
        console.error("microsoft-calendar-sync: Insert error:", insertError);
      } else {
        syncedCount = eventsToInsert.length;
      }
    }

    console.log("microsoft-calendar-sync: Synced", syncedCount, "calendar events");

    // Calculate today's events for immediate context
    const todayEnd = new Date(startOfToday);
    todayEnd.setHours(23, 59, 59, 999);
    
    const todayEvents = eventsToInsert.filter(e => {
      const eventStart = new Date(e.start_time);
      return eventStart >= startOfToday && eventStart <= todayEnd && !e.is_cancelled;
    });

    const busyTodayEvents = todayEvents.filter(e => e.show_as === 'busy' || e.show_as === 'tentative');

    return new Response(
      JSON.stringify({
        success: true,
        synced: syncedCount,
        todayEventCount: todayEvents.length,
        hasMeetingsToday: busyTodayEvents.length > 0,
        todayMeetings: todayEvents.map(e => ({
          title: e.title,
          startTime: e.start_time,
          endTime: e.end_time,
          showAs: e.show_as,
        })),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("microsoft-calendar-sync error:", error);
    return new Response(
      JSON.stringify({ error: "Calendar sync failed", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
