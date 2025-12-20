import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode as hexDecode, encode as hexEncode } from "https://deno.land/std@0.168.0/encoding/hex.ts";

// Allowed origins for CORS - matching gmail-sync security pattern
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

// AES-GCM encryption matching gmail-sync security pattern
const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function decryptToken(encryptedHex: string, key: string): Promise<string> {
  // Decode hex to bytes
  const combined = hexDecode(encoder.encode(encryptedHex));

  // Extract IV and encrypted data
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);

  // Create key from secret
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key.padEnd(32, '0').slice(0, 32)),
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  // Decrypt
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

// Refresh Microsoft access token
async function refreshMicrosoftToken(
  refreshToken: string,
  supabase: any,
  credentialId: string,
  encryptionKey: string
): Promise<{ accessToken: string; expiresAt: string } | null> {
  const clientId = Deno.env.get("MICROSOFT_CLIENT_ID");
  const clientSecret = Deno.env.get("MICROSOFT_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    console.error("Microsoft OAuth not configured");
    return null;
  }

  console.log("microsoft-sync: Refreshing expired token...");

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
    console.error("microsoft-sync: Token refresh failed:", tokenData.error, tokenData.error_description);

    // Mark credential as inactive if token is revoked
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

  // Store new tokens with AES-GCM encryption
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

  console.log("microsoft-sync: Token refreshed successfully");

  return { accessToken: tokenData.access_token, expiresAt };
}

// Score a message using AI (same as Gmail)
async function scoreMessage(message: { subject: string; from: string; snippet: string }): Promise<number> {
  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      console.warn("LOVABLE_API_KEY not set, using default score");
      return 3;
    }

    const prompt = `Analyze this email and assign a priority score from 1-5:
- 5: Urgent/time-sensitive (meetings today, deadlines, emergencies)
- 4: Important/action required (tasks, requests from key people)
- 3: Normal priority (regular correspondence)
- 2: Low priority (newsletters, FYI messages)
- 1: Very low priority (promotions, marketing)

From: ${message.from}
Subject: ${message.subject}
Preview: ${message.snippet}

Respond with ONLY a single digit 1-5.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 5,
        temperature: 0.1,
      }),
    });

    const data = await response.json();
    const scoreText = data.choices?.[0]?.message?.content?.trim();
    const score = parseInt(scoreText, 10);

    if (score >= 1 && score <= 5) {
      return score;
    }
    return 3;
  } catch (error) {
    console.error("AI scoring error:", error);
    return 3;
  }
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Reject requests from non-allowed origins
  if (!isAllowedOrigin(origin)) {
    return new Response(
      JSON.stringify({ error: "Forbidden" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    console.log("microsoft-sync: Starting sync");

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
    const encryptionKey = Deno.env.get("TOKEN_ENCRYPTION_KEY");

    if (!encryptionKey) {
      return new Response(
        JSON.stringify({ error: "Configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    console.log("microsoft-sync: User authenticated:", user.id);

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

    console.log("microsoft-sync: Found credentials for:", credentials.email_address);

    // Decrypt tokens using AES-GCM
    let accessToken = await decryptToken(credentials.access_token_encrypted, encryptionKey);
    const refreshToken = await decryptToken(credentials.refresh_token_encrypted, encryptionKey);

    // Check if token is expired (with 5 minute buffer)
    const tokenExpiry = credentials.token_expires_at ? new Date(credentials.token_expires_at) : new Date(0);
    const bufferTime = 5 * 60 * 1000; // 5 minutes

    if (tokenExpiry.getTime() - bufferTime < Date.now()) {
      const refreshResult = await refreshMicrosoftToken(refreshToken, supabase, credentials.id, encryptionKey);

      if (!refreshResult) {
        return new Response(
          JSON.stringify({ error: "Token refresh failed, please reconnect Microsoft", needsReconnect: true }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      accessToken = refreshResult.accessToken;
    }

    // Fetch unread emails from Microsoft Graph
    // Using $filter to get unread messages, $select to limit fields, $top for limit
    console.log("microsoft-sync: Fetching unread messages from Microsoft Graph");

    const graphUrl = new URL("https://graph.microsoft.com/v1.0/me/messages");
    graphUrl.searchParams.set("$filter", "isRead eq false");
    graphUrl.searchParams.set("$select", "id,conversationId,subject,bodyPreview,from,receivedDateTime,isRead");
    graphUrl.searchParams.set("$orderby", "receivedDateTime desc");
    graphUrl.searchParams.set("$top", "50");

    const messagesResponse = await fetch(graphUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!messagesResponse.ok) {
      const errorText = await messagesResponse.text();
      console.error("microsoft-sync: Microsoft Graph API error:", messagesResponse.status, errorText);

      // Check if it's an auth error
      if (messagesResponse.status === 401) {
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
        JSON.stringify({ error: "Failed to fetch emails from Microsoft" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const messagesData = await messagesResponse.json();
    const messages = messagesData.value || [];

    console.log("microsoft-sync: Found", messages.length, "unread messages");

    // Get existing message IDs to avoid duplicates
    const { data: existingMessages } = await supabase
      .from("messages")
      .select("external_message_id")
      .eq("user_id", user.id)
      .eq("channel_type", "outlook");

    const existingIds = new Set(existingMessages?.map((m: any) => m.external_message_id) || []);

    // Process and store new messages
    let syncedCount = 0;

    for (const msg of messages) {
      // Skip if already exists
      if (existingIds.has(msg.id)) {
        continue;
      }

      // Extract sender info from Microsoft Graph format
      const senderInfo = msg.from?.emailAddress || {};
      const senderName = senderInfo.name || "Unknown";
      const senderEmail = senderInfo.address || "";

      // Get message preview/snippet
      const snippet = msg.bodyPreview || "";
      const subject = msg.subject || "(No Subject)";

      // Score the message with AI
      const priorityScore = await scoreMessage({ subject, from: senderName, snippet });

      // Normalize to internal message format (same as Gmail)
      const normalizedMessage = {
        user_id: user.id,
        external_message_id: msg.id,
        thread_id: msg.conversationId, // Microsoft uses conversationId for threading
        channel_type: "outlook",
        platform: "outlook",
        type: "email",
        sender_name: senderName,
        sender_email: senderEmail,
        sender_handle: senderEmail,
        subject,
        content: snippet,
        preview: snippet.slice(0, 200),
        priority_score: priorityScore,
        priority: priorityScore >= 4 ? "high" : priorityScore >= 3 ? "medium" : "low",
        received_at: msg.receivedDateTime,
        is_read: msg.isRead || false,
        labels: [], // Microsoft doesn't have Gmail-style labels by default
      };

      // Store in database
      const { error: insertError } = await supabase.from("messages").insert(normalizedMessage);

      if (!insertError) {
        syncedCount++;
      } else {
        console.error("microsoft-sync: Insert error for message:", msg.id, insertError);
      }
    }

    // Update last sync time
    await supabase
      .from("email_credentials")
      .update({
        last_sync_at: new Date().toISOString(),
        sync_error: null,
      })
      .eq("id", credentials.id);

    console.log("microsoft-sync: Synced", syncedCount, "new messages");

    return new Response(
      JSON.stringify({
        success: true,
        synced: syncedCount,
        total: messages.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("microsoft-sync error:", error);
    return new Response(
      JSON.stringify({ error: "Sync failed", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
