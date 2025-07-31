import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const AI_USAGE_LIMITS = {
  summary: 25,
  task_generation: 15,
  scoring: 15,
};

// Enhanced rate limiting with IP tracking
const rateLimitMap = new Map<string, { count: number; resetTime: number; ips: Set<string> }>()

const checkRateLimit = (identifier: string, ipAddress?: string, maxRequests: number = 20, windowMs: number = 60000): boolean => {
  const now = Date.now()
  const current = rateLimitMap.get(identifier)
  
  if (!current || now > current.resetTime) {
    const newEntry = { 
      count: 1, 
      resetTime: now + windowMs,
      ips: new Set(ipAddress ? [ipAddress] : [])
    }
    rateLimitMap.set(identifier, newEntry)
    return true
  }
  
  if (current.count >= maxRequests) {
    return false
  }
  
  // Track unique IPs for additional security
  if (ipAddress) {
    current.ips.add(ipAddress)
    // Block if too many different IPs are used
    if (current.ips.size > 3) {
      console.warn(`Suspicious activity: Multiple IPs for ${identifier}`)
      return false
    }
  }
  
  current.count++
  return true
}

// Input sanitization
const sanitizeInput = (input: string, maxLength: number = 5000): string => {
  if (typeof input !== 'string') return ''
  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .trim()
    .substring(0, maxLength)
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authentication first
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Authentication failed:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown'

    // Enhanced rate limiting check
    if (!checkRateLimit(user.id, clientIP, 20, 60000)) { // 20 requests per minute per user
      return new Response(
        JSON.stringify({ 
          error: 'RATE_LIMIT_EXCEEDED',
          message: "Too many requests. Please try again later."
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, data } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Validate and sanitize input data
    if (!data || typeof data !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid request data' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Ensure user ID matches authenticated user
    if (data.userId && data.userId !== user.id) {
      return new Response(
        JSON.stringify({ error: 'User ID mismatch' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Set user ID from authenticated user
    data.userId = user.id;

    // Check rate limits before processing
    const rateLimitType = action === 'summarize_message' ? 'summary' : 
                         action === 'generate_tasks' ? 'task_generation' : 'scoring';
    
    const isAllowed = await checkRateLimit(data.userId, rateLimitType);
    if (!isAllowed) {
      return new Response(
        JSON.stringify({ 
          error: 'RATE_LIMIT_EXCEEDED',
          message: "You've reached your daily AI usage limit. Please check back tomorrow or upgrade."
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result;
    switch (action) {
      case 'summarize_message':
        result = await summarizeMessage(data, openAIApiKey);
        break;
      case 'generate_tasks':
        result = await generateTasks(data, openAIApiKey);
        break;
      case 'score_task':
        result = await scoreTask(data, openAIApiKey);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Record usage after successful AI call
    await recordUsage(data.userId, rateLimitType);
    
    return result;
  } catch (error) {
    console.error('AI Assistant Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function summarizeMessage(data: any, apiKey: string) {
  const { messageId, content, subject } = data;

  // Sanitize inputs
  const sanitizedContent = sanitizeInput(content, 10000)
  const sanitizedSubject = sanitizeInput(subject, 200)

  if (!sanitizedContent) {
    throw new Error('Invalid content after sanitization')
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant that creates concise, actionable summaries of messages. Focus on key points and next steps. Keep summaries under 3 sentences.'
        },
        {
          role: 'user',
          content: `Please summarize this message:\n\nSubject: ${sanitizedSubject}\n\nContent: ${sanitizedContent}`
        }
      ],
      temperature: 0.3,
      max_tokens: 150
    }),
  });

  const result = await response.json();
  const summary = result.choices[0].message.content;

  // Update message with AI summary
  const { error } = await supabase
    .from('messages')
    .update({ ai_summary: summary })
    .eq('id', messageId);

  if (error) throw error;

  return new Response(
    JSON.stringify({ summary }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function generateTasks(data: any, apiKey: string) {
  const { messageId, content, subject, userId } = data;

  // Sanitize inputs
  const sanitizedContent = sanitizeInput(content, 10000)
  const sanitizedSubject = sanitizeInput(subject, 200)

  if (!sanitizedContent) {
    throw new Error('Invalid content after sanitization')
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an AI task generator. Based on a message, create 1-3 specific, actionable tasks. Return ONLY a JSON array of objects with "title", "description", "priority" (high/medium/low), "urgency" (high/medium/low), "importance" (high/medium/low), and "score" (1-10 based on impact and urgency). No other text.'
        },
        {
          role: 'user',
          content: `What should the user do next based on this message?\n\nSubject: ${sanitizedSubject}\n\nContent: ${sanitizedContent}`
        }
      ],
      temperature: 0.4,
      max_tokens: 500
    }),
  });

  const result = await response.json();
  let tasks;
  
  try {
    tasks = JSON.parse(result.choices[0].message.content);
  } catch (e) {
    // Fallback if AI doesn't return valid JSON
    tasks = [{
      title: "Review message",
      description: "Review and respond to the message",
      priority: "medium",
      urgency: "medium", 
      importance: "medium",
      score: 5
    }];
  }

  // Insert tasks into database
  const taskInserts = tasks.map((task: any) => ({
    user_id: userId,
    message_id: messageId,
    title: task.title,
    description: task.description,
    priority: task.priority,
    urgency: task.urgency,
    importance: task.importance,
    score: task.score,
    status: 'pending'
  }));

  const { data: insertedTasks, error } = await supabase
    .from('tasks')
    .insert(taskInserts)
    .select();

  if (error) throw error;

  return new Response(
    JSON.stringify({ tasks: insertedTasks }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function scoreTask(data: any, apiKey: string) {
  const { taskId, title, description } = data;

  // Sanitize inputs
  const sanitizedTitle = sanitizeInput(title, 200)
  const sanitizedDescription = sanitizeInput(description, 1000)

  if (!sanitizedTitle) {
    throw new Error('Invalid title after sanitization')
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an AI task scorer. Rate tasks on impact and urgency. Return ONLY a JSON object with "score" (1-10), "urgency" (high/medium/low), "importance" (high/medium/low), and "reasoning" (brief explanation). No other text.'
        },
        {
          role: 'user',
          content: `Rate this task:\n\nTitle: ${sanitizedTitle}\n\nDescription: ${sanitizedDescription}`
        }
      ],
      temperature: 0.3,
      max_tokens: 200
    }),
  });

  const result = await response.json();
  let scoring;
  
  try {
    scoring = JSON.parse(result.choices[0].message.content);
  } catch (e) {
    scoring = { score: 5, urgency: "medium", importance: "medium", reasoning: "Auto-scored" };
  }

  // Update task with AI scoring
  const { error } = await supabase
    .from('tasks')
    .update({
      score: scoring.score,
      urgency: scoring.urgency,
      importance: scoring.importance
    })
    .eq('id', taskId);

  if (error) throw error;

  return new Response(
    JSON.stringify(scoring),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function checkRateLimit(userId: string, type: string): Promise<boolean> {
  // Get usage from last 24 hours
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const { data, error } = await supabase
    .from("ai_usage")
    .select("id")
    .eq("user_id", userId)
    .eq("type", type)
    .gte("used_at", twentyFourHoursAgo.toISOString());

  if (error) {
    console.error('Rate limit check error:', error);
    return false; // Fail safe - deny access on error
  }

  const currentUsage = data?.length || 0;
  const limit = AI_USAGE_LIMITS[type as keyof typeof AI_USAGE_LIMITS];
  
  console.log(`Rate limit check: ${type} - ${currentUsage}/${limit} used`);
  
  return currentUsage < limit;
}

async function recordUsage(userId: string, type: string): Promise<void> {
  const { error } = await supabase
    .from("ai_usage")
    .insert({
      user_id: userId,
      type: type,
      used_at: new Date().toISOString()
    });

  if (error) {
    console.error('Failed to record usage:', error);
  }
}