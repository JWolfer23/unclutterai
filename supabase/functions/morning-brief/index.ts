import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";

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

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Generating morning brief for user: ${user.id}`);

    // Fetch user's unread high-priority messages from last 24 hours
    const { data: messages } = await supabaseAdmin
      .from("messages")
      .select("id, subject, sender_name, priority_score, platform, received_at")
      .eq("user_id", user.id)
      .eq("is_read", false)
      .gte("priority_score", 3)
      .gte("received_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order("priority_score", { ascending: false })
      .limit(10);

    // Fetch user's pending tasks
    const { data: tasks } = await supabaseAdmin
      .from("tasks")
      .select("id, title, urgency, importance, due_date, status")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .order("urgency", { ascending: false })
      .limit(10);

    // Fetch focus analytics for energy calculation
    const { data: focusMinutesToday } = await supabaseAdmin
      .rpc("get_focus_minutes_today", { p_user_id: user.id });

    const { data: streakData } = await supabaseAdmin
      .from("focus_streaks")
      .select("current_streak, longest_streak")
      .eq("user_id", user.id)
      .maybeSingle();

    // Fetch calendar events for today (from Outlook)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const { data: calendarEvents } = await supabaseAdmin
      .from("calendar_events")
      .select("id, title, start_time, end_time, show_as, location, is_all_day, provider")
      .eq("user_id", user.id)
      .eq("is_cancelled", false)
      .gte("start_time", startOfToday.toISOString())
      .lte("start_time", endOfToday.toISOString())
      .order("start_time", { ascending: true });

    // Build calendar context
    const outlookCalendarEvents = calendarEvents?.filter(e => 
      e.provider === 'outlook_calendar' || e.provider === 'outlook'
    ) || [];
    
    const busyMeetings = outlookCalendarEvents.filter(e => 
      e.show_as === 'busy' || e.show_as === 'tentative'
    );

    const totalMeetingMinutes = busyMeetings.reduce((acc, event) => {
      const start = new Date(event.start_time);
      const end = new Date(event.end_time);
      return acc + (end.getTime() - start.getTime()) / (1000 * 60);
    }, 0);

    const calendarContext = {
      totalMeetings: outlookCalendarEvents.length,
      busyMeetings: busyMeetings.length,
      totalMeetingMinutes,
      meetings: outlookCalendarEvents.slice(0, 5).map(e => ({
        title: e.title,
        startTime: e.start_time,
        endTime: e.end_time,
        showAs: e.show_as,
        location: e.location
      })),
      source: 'outlook_calendar'
    };

    // Fetch user's news prompt for intelligence
    const { data: newsPrompt } = await supabaseAdmin
      .from("news_prompts")
      .select("prompt_text")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    // Calculate energy state based on focus data
    const currentStreak = streakData?.current_streak || 0;
    const focusToday = focusMinutesToday || 0;
    
    let energyLevel: "low" | "medium" | "high" = "medium";
    if (currentStreak >= 7 && focusToday > 30) {
      energyLevel = "high";
    } else if (currentStreak < 2 && focusToday < 15) {
      energyLevel = "low";
    }

    const recoveryNeeded = currentStreak === 0 && focusToday === 0;
    
    // Adjust focus window based on meeting load
    let focusWindowMinutes = energyLevel === "high" ? 90 : energyLevel === "medium" ? 60 : 45;
    if (busyMeetings.length > 4) {
      focusWindowMinutes = Math.min(focusWindowMinutes, 30); // Heavy meeting day
    }

    // Build context for AI
    const messagesContext = messages?.map((m) => ({
      subject: m.subject,
      sender: m.sender_name,
      priority: m.priority_score,
      platform: m.platform,
    })) || [];

    const tasksContext = tasks?.map((t) => ({
      title: t.title,
      urgency: t.urgency,
      importance: t.importance,
      dueDate: t.due_date,
    })) || [];

    // Call AI to generate priorities and intelligence
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.log("No LOVABLE_API_KEY, returning fallback data");
      return new Response(JSON.stringify(generateFallbackBrief(
        messagesContext,
        tasksContext,
        energyLevel,
        focusWindowMinutes,
        recoveryNeeded,
        calendarContext
      )), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a billionaire's executive assistant. Analyze the user's messages and tasks to generate a morning brief.
    
Return a JSON object with this exact structure:
{
  "priorities": [
    {
      "id": "unique-id",
      "sourceType": "email" | "task",
      "title": "One-line summary",
      "reason": "Time-sensitive" | "Revenue impact" | "Decision required" | "Strategic opportunity",
      "sourceId": "original-id"
    }
  ],
  "insight": "One relevant insight about their day, work, or industry",
  "firstAction": {
    "title": "Single recommended first action",
    "estimatedMinutes": 15,
    "reason": "Why this should be first"
  }
}

Rules:
- Maximum 3 priorities, sorted by impact
- Priorities should combine messages and tasks
- insight must be a single sentence (not an array)
- Consider calendar meetings when suggesting first action timing
- Be concise and actionable`;

    const calendarSummary = calendarContext.busyMeetings > 0 
      ? `Today's calendar: ${calendarContext.busyMeetings} meetings (${Math.round(calendarContext.totalMeetingMinutes)} min total). Next meetings: ${calendarContext.meetings.slice(0, 3).map(m => `"${m.title}" at ${new Date(m.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`).join(', ')}`
      : 'No meetings scheduled for today';

    const userPrompt = `User context:
- Messages (last 24h, unread, high priority): ${JSON.stringify(messagesContext)}
- Pending Tasks: ${JSON.stringify(tasksContext)}
- Calendar (from outlook_calendar): ${calendarSummary}
- User's news interests: ${newsPrompt?.prompt_text || "General business and technology"}
- Current energy state: ${energyLevel}
- Focus streak: ${currentStreak} days
- Available focus window: ${focusWindowMinutes} minutes

Generate the morning brief JSON.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI API error:", aiResponse.status);
      return new Response(JSON.stringify(generateFallbackBrief(
        messagesContext,
        tasksContext,
        energyLevel,
        focusWindowMinutes,
        recoveryNeeded
      )), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "";

    // Parse AI response
    let aiParsed;
    try {
      const jsonMatch = aiContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                        aiContent.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, aiContent];
      aiParsed = JSON.parse(jsonMatch[1] || aiContent);
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      return new Response(JSON.stringify(generateFallbackBrief(
        messagesContext,
        tasksContext,
        energyLevel,
        focusWindowMinutes,
        recoveryNeeded
      )), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build final response
    const currentHour = new Date().getHours();
    const greeting = currentHour < 12 ? "Good Morning" : currentHour < 17 ? "Good Afternoon" : "Good Evening";

    const briefData = {
      greeting,
      priorities: aiParsed.priorities || [],
      insight: aiParsed.insight || "Focus on high-impact work during your peak energy hours.",
      energy: {
        level: energyLevel,
        focusWindowMinutes,
        recoveryNeeded,
      },
      calendar: {
        totalMeetings: calendarContext.totalMeetings,
        busyMeetings: calendarContext.busyMeetings,
        totalMeetingMinutes: calendarContext.totalMeetingMinutes,
        meetings: calendarContext.meetings,
        source: calendarContext.source
      },
      firstAction: aiParsed.firstAction || {
        title: "Review your priorities",
        estimatedMinutes: 10,
        reason: "Start with clarity",
      },
    };

    console.log("Morning brief generated successfully");

    return new Response(JSON.stringify(briefData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating morning brief:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generateFallbackBrief(
  messages: any[],
  tasks: any[],
  energyLevel: string,
  focusWindowMinutes: number,
  recoveryNeeded: boolean,
  calendarContext?: {
    totalMeetings: number;
    busyMeetings: number;
    totalMeetingMinutes: number;
    meetings: any[];
    source: string;
  }
) {
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Good Morning" : currentHour < 17 ? "Good Afternoon" : "Good Evening";

  // Create priorities from messages and tasks
  const priorities = [];
  
  // Add top message
  if (messages.length > 0) {
    const topMessage = messages[0];
    priorities.push({
      id: `msg-${Date.now()}`,
      sourceType: "email",
      title: topMessage.subject || "Important message",
      reason: topMessage.priority >= 4 ? "Time-sensitive" : "Decision required",
    });
  }

  // Add top task
  if (tasks.length > 0) {
    const topTask = tasks[0];
    priorities.push({
      id: `task-${Date.now()}`,
      sourceType: "task",
      title: topTask.title || "Important task",
      reason: topTask.urgency === "high" ? "Time-sensitive" : "Strategic opportunity",
    });
  }

  // Add a generic priority if none
  if (priorities.length === 0) {
    priorities.push({
      id: `default-${Date.now()}`,
      sourceType: "task",
      title: "Plan your day's priorities",
      reason: "Strategic opportunity",
    });
  }

  return {
    greeting,
    priorities: priorities.slice(0, 3),
    insight: "Focus on high-impact work during your peak energy hours.",
    energy: {
      level: energyLevel,
      focusWindowMinutes,
      recoveryNeeded,
    },
    calendar: calendarContext || {
      totalMeetings: 0,
      busyMeetings: 0,
      totalMeetingMinutes: 0,
      meetings: [],
      source: 'outlook_calendar'
    },
    firstAction: {
      title: priorities[0]?.title || "Review your inbox",
      estimatedMinutes: 15,
      reason: "Clear the highest priority first",
    },
  };
}
