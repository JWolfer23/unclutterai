import "https://deno.land/x/xhr@0.1.0/mod.ts";
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

interface Loop {
  id: string;
  messageId: string;
  subject: string;
  sender: string;
  senderEmail: string;
  summary: string;
  receivedAt: string;
}

async function generateSummary(message: any): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    // Fallback: use subject or truncated content
    return message.subject || message.content?.substring(0, 80) || 'Message requires attention';
  }

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: "Summarize this email in exactly one sentence. Focus on what the sender needs or the key information. Be concise." 
          },
          { 
            role: "user", 
            content: `From: ${message.sender_name} <${message.sender_email || ''}>
Subject: ${message.subject}
Content: ${message.content?.substring(0, 500) || 'No content'}` 
          }
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`AI request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || message.subject || 'Message requires attention';
  } catch (error) {
    console.error('Summary generation error:', error);
    return message.subject || 'Message requires attention';
  }
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
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Scanning unread emails for user: ${user.id}`);

    // Fetch unread, non-archived emails from ALL providers (Gmail, Outlook)
    // Source-agnostic: we don't filter by channel_type
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('id, subject, sender_name, sender_email, content, received_at, priority_score, channel_type')
      .eq('user_id', user.id)
      .eq('is_read', false)
      .eq('is_archived', false)
      .eq('is_spam', false)
      .limit(50);

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      throw messagesError;
    }

    console.log(`Found ${messages?.length || 0} unread messages from all providers`);

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ loops: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Sort by urgency (priority_score descending) + received time (recent first)
    // This creates a unified, source-agnostic ordering
    const sortedMessages = [...messages].sort((a, b) => {
      // Higher priority_score = more urgent (priority first)
      const priorityDiff = (b.priority_score || 3) - (a.priority_score || 3);
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by received time (most recent first)
      return new Date(b.received_at).getTime() - new Date(a.received_at).getTime();
    });

    // Limit to 30 for processing
    const messagesToProcess = sortedMessages.slice(0, 30);

    // Generate summaries for each message
    // Note: We intentionally do NOT expose channel_type to the frontend
    const loops: Loop[] = await Promise.all(
      messagesToProcess.map(async (msg) => ({
        id: `loop-${msg.id}`,
        messageId: msg.id,
        subject: msg.subject,
        sender: msg.sender_name,
        senderEmail: msg.sender_email || '',
        summary: await generateSummary(msg),
        receivedAt: msg.received_at
      }))
    );

    console.log(`Generated ${loops.length} loop summaries (source-agnostic)`);

    return new Response(JSON.stringify({ loops }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in unclutter-scan:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
