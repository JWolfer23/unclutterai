import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
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

    // Create admin client for data fetching
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Create user client to verify auth
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
    const focusWindowMinutes = energyLevel === "high" ? 90 : energyLevel === "medium" ? 60 : 45;

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
      // Return fallback data if no AI key
      console.log("No LOVABLE_API_KEY, returning fallback data");
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
  "intelligence": {
    "market": ["1-2 relevant market/world insights"],
    "personal": "One personal/career relevance insight"
  },
  "firstAction": {
    "title": "Single recommended first action",
    "estimatedMinutes": 15,
    "reason": "Why this should be first"
  }
}

Rules:
- Maximum 3 priorities, sorted by impact
- Priorities should combine messages and tasks
- Be concise and actionable
- Intelligence should be relevant to a professional/executive`;

    const userPrompt = `User context:
- Messages (last 24h, unread, high priority): ${JSON.stringify(messagesContext)}
- Pending Tasks: ${JSON.stringify(tasksContext)}
- User's news interests: ${newsPrompt?.prompt_text || "General business and technology"}
- Current energy state: ${energyLevel}
- Focus streak: ${currentStreak} days

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
      // Extract JSON from response (handle markdown code blocks)
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
      intelligence: aiParsed.intelligence || { market: [], personal: "" },
      energy: {
        level: energyLevel,
        focusWindowMinutes,
        recoveryNeeded,
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
  recoveryNeeded: boolean
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
    intelligence: {
      market: ["Markets are active today - stay informed on key movements"],
      personal: "Focus on high-impact work during your peak energy hours",
    },
    energy: {
      level: energyLevel,
      focusWindowMinutes,
      recoveryNeeded,
    },
    firstAction: {
      title: priorities[0]?.title || "Review your inbox",
      estimatedMinutes: 15,
      reason: "Clear the highest priority first",
    },
  };
}
