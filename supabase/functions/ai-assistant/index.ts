import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

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
    const { action, data } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    switch (action) {
      case 'summarize_message':
        return await summarizeMessage(data, openAIApiKey);
      case 'generate_tasks':
        return await generateTasks(data, openAIApiKey);
      case 'score_task':
        return await scoreTask(data, openAIApiKey);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
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
          content: `Please summarize this message:\n\nSubject: ${subject}\n\nContent: ${content}`
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
          content: `What should the user do next based on this message?\n\nSubject: ${subject}\n\nContent: ${content}`
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
          content: `Rate this task:\n\nTitle: ${title}\n\nDescription: ${description}`
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