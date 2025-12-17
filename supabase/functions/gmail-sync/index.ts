import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode as hexDecode } from "https://deno.land/std@0.168.0/encoding/hex.ts";

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

// Decrypt token using Web Crypto API
async function decryptToken(encryptedHex: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
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

// Refresh access token if expired
async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();
  if (data.error) {
    console.error('Token refresh failed:', data.error);
    return null;
  }

  return { access_token: data.access_token, expires_in: data.expires_in };
}

// Score a message using AI
async function scoreMessage(message: { subject: string; from: string; snippet: string }): Promise<number> {
  try {
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      console.warn('LOVABLE_API_KEY not set, using default score');
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

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
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
    console.error('AI scoring error:', error);
    return 3;
  }
}

// Parse email headers
function parseEmailHeaders(headers: Array<{ name: string; value: string }>) {
  const result: Record<string, string> = {};
  for (const h of headers) {
    result[h.name.toLowerCase()] = h.value;
  }
  return result;
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('gmail-sync: Starting sync');

    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('gmail-sync: User authenticated:', user.id);

    // Get user's Gmail credentials
    const { data: credentials, error: credError } = await supabase
      .from('email_credentials')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'gmail')
      .eq('is_active', true)
      .single();

    if (credError || !credentials) {
      return new Response(
        JSON.stringify({ error: 'Gmail not connected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('gmail-sync: Found credentials for:', credentials.email_address);

    // Decrypt tokens
    const encryptionKey = Deno.env.get('TOKEN_ENCRYPTION_KEY');
    if (!encryptionKey) {
      return new Response(
        JSON.stringify({ error: 'Configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let accessToken = await decryptToken(credentials.access_token_encrypted, encryptionKey);
    const refreshToken = await decryptToken(credentials.refresh_token_encrypted, encryptionKey);

    // Check if token is expired and refresh if needed
    const tokenExpiry = new Date(credentials.token_expires_at);
    if (tokenExpiry < new Date()) {
      console.log('gmail-sync: Token expired, refreshing...');
      const newToken = await refreshAccessToken(refreshToken);
      if (!newToken) {
        // Mark credentials as inactive
        await supabase
          .from('email_credentials')
          .update({ is_active: false, sync_error: 'Token refresh failed' })
          .eq('id', credentials.id);

        return new Response(
          JSON.stringify({ error: 'Token refresh failed, please reconnect Gmail' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      accessToken = newToken.access_token;

      // Update stored token (encrypt first)
      const { encode: hexEncode } = await import("https://deno.land/std@0.168.0/encoding/hex.ts");
      
      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(encryptionKey.padEnd(32, '0').slice(0, 32)),
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        keyMaterial,
        encoder.encode(accessToken)
      );
      const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);
      const newAccessTokenEncrypted = new TextDecoder().decode(hexEncode(combined));

      await supabase
        .from('email_credentials')
        .update({
          access_token_encrypted: newAccessTokenEncrypted,
          token_expires_at: new Date(Date.now() + newToken.expires_in * 1000).toISOString(),
        })
        .eq('id', credentials.id);
    }

    // Fetch emails from Gmail API
    console.log('gmail-sync: Fetching messages from Gmail');
    const messagesResponse = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&labelIds=INBOX',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!messagesResponse.ok) {
      const errorText = await messagesResponse.text();
      console.error('gmail-sync: Gmail API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch emails' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const messagesData = await messagesResponse.json();
    const messageIds = messagesData.messages || [];

    console.log('gmail-sync: Found', messageIds.length, 'messages');

    // Get existing message IDs to avoid duplicates
    const { data: existingMessages } = await supabase
      .from('messages')
      .select('external_message_id')
      .eq('user_id', user.id)
      .eq('channel_type', 'gmail');

    const existingIds = new Set(existingMessages?.map(m => m.external_message_id) || []);

    // Fetch and store new messages
    let syncedCount = 0;
    for (const msg of messageIds.slice(0, 20)) { // Limit to 20 for performance
      if (existingIds.has(msg.id)) {
        continue;
      }

      // Fetch full message
      const fullMsgResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!fullMsgResponse.ok) continue;

      const fullMsg = await fullMsgResponse.json();
      const headers = parseEmailHeaders(fullMsg.payload?.headers || []);

      // Extract sender info
      const fromHeader = headers['from'] || '';
      const fromMatch = fromHeader.match(/^(.+?)\s*<(.+?)>$/) || [null, fromHeader, fromHeader];
      const senderName = fromMatch[1]?.trim().replace(/"/g, '') || 'Unknown';
      const senderEmail = fromMatch[2] || fromHeader;

      // Get message body snippet
      const snippet = fullMsg.snippet || '';
      const subject = headers['subject'] || '(No Subject)';

      // Score the message with AI
      const priorityScore = await scoreMessage({ subject, from: senderName, snippet });

      // Store in database
      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          user_id: user.id,
          external_message_id: msg.id,
          thread_id: fullMsg.threadId,
          channel_type: 'gmail',
          platform: 'gmail',
          type: 'email',
          sender_name: senderName,
          sender_email: senderEmail,
          sender_handle: senderEmail,
          subject,
          content: snippet,
          preview: snippet.slice(0, 200),
          priority_score: priorityScore,
          priority: priorityScore >= 4 ? 'high' : priorityScore >= 3 ? 'medium' : 'low',
          received_at: new Date(parseInt(fullMsg.internalDate)).toISOString(),
          labels: fullMsg.labelIds || [],
          is_read: !fullMsg.labelIds?.includes('UNREAD'),
        });

      if (!insertError) {
        syncedCount++;
      } else {
        console.error('gmail-sync: Insert error for message:', msg.id, insertError);
      }
    }

    // Update last sync time
    await supabase
      .from('email_credentials')
      .update({ last_sync_at: new Date().toISOString(), sync_error: null })
      .eq('id', credentials.id);

    console.log('gmail-sync: Synced', syncedCount, 'new messages');

    return new Response(
      JSON.stringify({ success: true, synced: syncedCount }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('gmail-sync error:', error);
    return new Response(
      JSON.stringify({ error: 'Sync failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
