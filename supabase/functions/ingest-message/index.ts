import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature',
};

// Supported source types
type MessageSource = 'gmail' | 'outlook' | 'whatsapp' | 'facebook' | 'instagram' | 'sms' | 'zapier';

interface NormalizedMessage {
  user_id: string;
  source: MessageSource;
  thread_id?: string;
  sender_name: string;
  sender_email?: string;
  sender_handle?: string;
  subject: string;
  body: string;
  received_at: string;
  raw_payload?: Record<string, unknown>;
}

interface AIEnrichment {
  ai_summary: string;
  priority_score: number;
  priority: 'low' | 'medium' | 'high';
}

// Validate webhook signature (HMAC-SHA256)
async function validateSignature(payload: string, signature: string | null, secret: string): Promise<boolean> {
  if (!signature) return false;
  
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return `sha256=${expectedSignature}` === signature || expectedSignature === signature;
}

// Normalize payloads from different providers
function normalizePayload(rawMessage: Record<string, unknown>, source: MessageSource): Partial<NormalizedMessage> {
  switch (source) {
    case 'gmail':
      return {
        sender_name: (rawMessage.from as string)?.split('<')[0]?.trim() || 'Unknown',
        sender_email: (rawMessage.from as string)?.match(/<(.+)>/)?.[1] || rawMessage.from as string,
        subject: rawMessage.subject as string || '(No Subject)',
        body: rawMessage.body as string || rawMessage.snippet as string || '',
        thread_id: rawMessage.threadId as string,
        received_at: rawMessage.internalDate 
          ? new Date(parseInt(rawMessage.internalDate as string)).toISOString()
          : new Date().toISOString(),
      };
      
    case 'outlook':
      return {
        sender_name: (rawMessage.from as any)?.emailAddress?.name || 'Unknown',
        sender_email: (rawMessage.from as any)?.emailAddress?.address,
        subject: rawMessage.subject as string || '(No Subject)',
        body: (rawMessage.body as any)?.content || rawMessage.bodyPreview as string || '',
        thread_id: rawMessage.conversationId as string,
        received_at: rawMessage.receivedDateTime as string || new Date().toISOString(),
      };
      
    case 'whatsapp':
      return {
        sender_name: (rawMessage.contacts as any)?.[0]?.profile?.name || rawMessage.from as string || 'Unknown',
        sender_handle: rawMessage.from as string,
        subject: 'WhatsApp Message',
        body: (rawMessage.messages as any)?.[0]?.text?.body || rawMessage.text as string || '',
        thread_id: (rawMessage.messages as any)?.[0]?.id,
        received_at: rawMessage.timestamp 
          ? new Date(parseInt(rawMessage.timestamp as string) * 1000).toISOString()
          : new Date().toISOString(),
      };
      
    case 'facebook':
    case 'instagram':
      return {
        sender_name: (rawMessage.sender as any)?.name || rawMessage.sender_id as string || 'Unknown',
        sender_handle: rawMessage.sender_id as string,
        subject: `${source === 'instagram' ? 'Instagram' : 'Facebook'} Message`,
        body: (rawMessage.message as any)?.text || rawMessage.text as string || '',
        thread_id: rawMessage.thread_id as string || rawMessage.mid as string,
        received_at: rawMessage.timestamp 
          ? new Date(parseInt(rawMessage.timestamp as string)).toISOString()
          : new Date().toISOString(),
      };
      
    case 'zapier':
    default:
      // Generic/Zapier format - expect pre-normalized fields
      return {
        sender_name: rawMessage.sender_name as string || rawMessage.sender as string || 'Unknown',
        sender_email: rawMessage.sender_email as string,
        sender_handle: rawMessage.sender_handle as string,
        subject: rawMessage.subject as string || '(No Subject)',
        body: rawMessage.body as string || rawMessage.content as string || '',
        thread_id: rawMessage.thread_id as string,
        received_at: rawMessage.received_at as string || rawMessage.timestamp as string || new Date().toISOString(),
      };
  }
}

// Map source to message type enum
function getMessageType(source: MessageSource): 'email' | 'text' | 'social' | 'voice' {
  switch (source) {
    case 'gmail':
    case 'outlook':
      return 'email';
    case 'whatsapp':
    case 'sms':
      return 'text';
    case 'facebook':
    case 'instagram':
      return 'social';
    default:
      return 'email';
  }
}

// AI enrichment using Lovable AI gateway
async function enrichWithAI(subject: string, body: string, sender: string): Promise<AIEnrichment> {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  
  if (!lovableApiKey) {
    console.warn('LOVABLE_API_KEY not set, using default enrichment');
    return {
      ai_summary: body.substring(0, 200) + (body.length > 200 ? '...' : ''),
      priority_score: 3,
      priority: 'medium',
    };
  }
  
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant that analyzes messages and provides:
1. A concise summary (max 100 words)
2. A priority score from 1-5 (1=low, 5=urgent)

Consider urgency indicators, sender importance, required actions, and time sensitivity.

Respond in JSON format only:
{"summary": "...", "priority_score": 1-5}`
          },
          {
            role: 'user',
            content: `Analyze this message:
From: ${sender}
Subject: ${subject}
Body: ${body.substring(0, 2000)}`
          }
        ],
        max_tokens: 300,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error('AI enrichment failed:', await response.text());
      throw new Error('AI enrichment failed');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const score = Math.min(5, Math.max(1, parseInt(parsed.priority_score) || 3));
      return {
        ai_summary: parsed.summary || body.substring(0, 200),
        priority_score: score,
        priority: score >= 4 ? 'high' : score >= 2 ? 'medium' : 'low',
      };
    }
    
    throw new Error('Invalid AI response format');
  } catch (error) {
    console.error('AI enrichment error:', error);
    return {
      ai_summary: body.substring(0, 200) + (body.length > 200 ? '...' : ''),
      priority_score: 3,
      priority: 'medium',
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const webhookSecret = Deno.env.get('WEBHOOK_SECRET');
    
    // Get raw body for signature validation
    const rawBody = await req.text();
    
    // Validate webhook signature if secret is configured
    if (webhookSecret) {
      const signature = req.headers.get('x-webhook-signature') || req.headers.get('x-hub-signature-256');
      const isValid = await validateSignature(rawBody, signature, webhookSecret);
      
      if (!isValid) {
        console.error('Invalid webhook signature');
        return new Response(
          JSON.stringify({ error: 'Invalid webhook signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    const payload = JSON.parse(rawBody);
    console.log('Received payload:', JSON.stringify(payload).substring(0, 500));
    
    // Extract required fields
    const { user_id, source, raw_message } = payload;
    
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!source || !['gmail', 'outlook', 'whatsapp', 'facebook', 'instagram', 'sms', 'zapier'].includes(source)) {
      return new Response(
        JSON.stringify({ error: 'Valid source is required (gmail, outlook, whatsapp, facebook, instagram, sms, zapier)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Normalize the payload based on source
    const messageData = raw_message || payload;
    const normalized = normalizePayload(messageData, source as MessageSource);
    
    // Enrich with AI
    const enrichment = await enrichWithAI(
      normalized.subject || '',
      normalized.body || '',
      normalized.sender_name || normalized.sender_email || 'Unknown'
    );
    
    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    // Generate external message ID for deduplication
    const externalId = payload.external_message_id || 
      payload.id || 
      (messageData as any)?.id || 
      `${source}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Check for duplicate
    const { data: existing } = await supabase
      .from('messages')
      .select('id')
      .eq('user_id', user_id)
      .eq('external_message_id', externalId)
      .maybeSingle();
    
    if (existing) {
      console.log('Duplicate message detected, skipping:', externalId);
      return new Response(
        JSON.stringify({ success: true, message: 'Duplicate message, skipped', id: existing.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Insert message
    const { data: inserted, error: insertError } = await supabase
      .from('messages')
      .insert({
        user_id,
        platform: source,
        type: getMessageType(source as MessageSource),
        channel_type: source,
        sender_name: normalized.sender_name || 'Unknown',
        sender_email: normalized.sender_email,
        sender_handle: normalized.sender_handle,
        subject: normalized.subject || '(No Subject)',
        content: normalized.body || '',
        preview: (normalized.body || '').substring(0, 200),
        thread_id: normalized.thread_id,
        external_message_id: externalId,
        received_at: normalized.received_at,
        ai_summary: enrichment.ai_summary,
        priority_score: enrichment.priority_score,
        priority: enrichment.priority,
        metadata: { raw: payload.raw_message || payload },
      })
      .select('id')
      .single();
    
    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to insert message', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Message ingested successfully:', inserted.id);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message_id: inserted.id,
        source,
        priority: enrichment.priority,
        priority_score: enrichment.priority_score,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Ingestion error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
