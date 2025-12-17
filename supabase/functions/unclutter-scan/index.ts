import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Fetch unread, non-archived emails only
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('id, subject, sender_name, sender_email, content, received_at')
      .eq('user_id', user.id)
      .eq('is_read', false)
      .eq('is_archived', false)
      .order('received_at', { ascending: false })
      .limit(30);

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      throw messagesError;
    }

    console.log(`Found ${messages?.length || 0} unread messages`);

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ loops: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate summaries for each message
    const loops: Loop[] = await Promise.all(
      messages.map(async (msg) => ({
        id: `loop-${msg.id}`,
        messageId: msg.id,
        subject: msg.subject,
        sender: msg.sender_name,
        senderEmail: msg.sender_email || '',
        summary: await generateSummary(msg),
        receivedAt: msg.received_at
      }))
    );

    console.log(`Generated ${loops.length} loop summaries`);

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
