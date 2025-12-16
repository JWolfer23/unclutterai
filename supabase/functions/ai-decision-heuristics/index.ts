import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DECISION_PROMPT = `You are the decision engine for a billionaire assistant. Your job is to score items and decide what deserves attention.

CORE QUESTION: "If this is ignored today, does something meaningful break?"
- If NO → it's noise
- If YES → surface it

For each item, score on these 5 axes (0-10):

1. CONSEQUENCE (what breaks if ignored?)
   - financial (10): Money at stake
   - relationship (8): Important person affected
   - opportunity (7): Time-sensitive opportunity
   - reputation (6): Public perception risk
   - none (0): Nothing meaningful breaks

2. TIME SENSITIVITY (when does it matter?)
   - deadline_today (10): Must happen today
   - waiting_on_user (7): Someone blocked on this
   - can_wait (3): Important but not urgent
   - no_deadline (0): Whenever

3. USER INTENT ALIGNMENT (does this match goals?)
   - matches_goals (10): Directly serves stated priorities
   - active_project (7): Part of current work
   - habit_related (4): Routine/maintenance
   - random (0): Unrelated distraction

4. SOURCE WEIGHT (who/what is asking?)
   - human_known (10): Known important contact
   - human_unknown (5): Unknown person
   - system (3): Automated notification
   - notification (1): Generic alert

5. COGNITIVE LOAD (how hard is this?)
   - quick_decision (2): Simple yes/no
   - deep_thinking (6): Needs focus
   - emotional_drain (9): Stressful/complex

FINAL CLASSIFICATION (nothing stays undecided):
- act_now: Score >= 7.5
- schedule: Score >= 5.0
- delegate: Score >= 3.0
- archive: Score >= 1.5
- ignore: Below 1.5

Respond with valid JSON only:
{
  "scores": {
    "consequence": "financial|relationship|opportunity|reputation|none",
    "consequenceScore": 0-10,
    "timeSensitivity": "deadline_today|waiting_on_user|can_wait|no_deadline",
    "timeScore": 0-10,
    "intentAlignment": "matches_goals|active_project|habit_related|random",
    "intentScore": 0-10,
    "sourceWeight": "human_known|human_unknown|system|notification",
    "sourceScore": 0-10,
    "cognitiveLoad": "quick_decision|deep_thinking|emotional_drain",
    "loadScore": 0-10
  },
  "breaksSomething": true/false,
  "reasoning": "One sentence explaining the classification"
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { item } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      // Fallback to simple heuristics if no AI available
      return new Response(JSON.stringify(fallbackScore(item)), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const itemDescription = formatItemForAI(item);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: DECISION_PROMPT },
          { role: 'user', content: itemDescription },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429 || response.status === 402) {
        // Rate limited or payment required - use fallback
        return new Response(JSON.stringify(fallbackScore(item)), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify(fallbackScore(item)), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = JSON.parse(jsonMatch[0]);
    
    // Calculate total score
    const totalScore = calculateTotalScore(result.scores);
    const classification = classifyByScore(totalScore);

    return new Response(JSON.stringify({
      ...result,
      totalScore,
      classification,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Decision heuristics error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function formatItemForAI(item: any): string {
  const parts = [
    `Type: ${item.type}`,
    `Title: ${item.title}`,
  ];
  
  if (item.content) parts.push(`Content: ${item.content.slice(0, 500)}`);
  if (item.sender) parts.push(`From: ${item.sender}${item.isVip ? ' (VIP)' : ''}`);
  if (item.dueDate) parts.push(`Due: ${item.dueDate}`);
  if (item.priority) parts.push(`Priority: ${item.priority}`);
  if (item.labels?.length) parts.push(`Labels: ${item.labels.join(', ')}`);
  
  return parts.join('\n');
}

// Fallback scoring when AI unavailable
function fallbackScore(item: any) {
  let consequenceScore = 3;
  let timeScore = 3;
  let intentScore = 5;
  let sourceScore = 5;
  let loadScore = 5;

  // Simple heuristics
  if (item.priority === 'high') {
    consequenceScore = 7;
    timeScore = 7;
  }
  if (item.isVip) {
    sourceScore = 9;
    consequenceScore = Math.max(consequenceScore, 7);
  }
  if (item.dueDate) {
    const due = new Date(item.dueDate);
    const now = new Date();
    if (due.toDateString() === now.toDateString()) {
      timeScore = 9;
    }
  }

  const scores = {
    consequence: item.priority === 'high' ? 'relationship' : 'none',
    consequenceScore,
    timeSensitivity: item.dueDate ? 'can_wait' : 'no_deadline',
    timeScore,
    intentAlignment: 'habit_related',
    intentScore,
    sourceWeight: item.isVip ? 'human_known' : 'human_unknown',
    sourceScore,
    cognitiveLoad: 'quick_decision',
    loadScore,
  };

  const totalScore = calculateTotalScore(scores);

  return {
    scores,
    totalScore,
    classification: classifyByScore(totalScore),
    breaksSomething: totalScore >= 5,
    reasoning: 'Scored using fallback heuristics.',
  };
}

function calculateTotalScore(scores: any): number {
  const WEIGHTS = {
    consequence: 0.30,
    timeSensitivity: 0.25,
    intentAlignment: 0.20,
    sourceWeight: 0.15,
    cognitiveLoad: 0.10,
  };

  return (
    scores.consequenceScore * WEIGHTS.consequence +
    scores.timeScore * WEIGHTS.timeSensitivity +
    scores.intentScore * WEIGHTS.intentAlignment +
    scores.sourceScore * WEIGHTS.sourceWeight +
    (10 - scores.loadScore) * WEIGHTS.cognitiveLoad
  );
}

function classifyByScore(totalScore: number): string {
  if (totalScore >= 7.5) return 'act_now';
  if (totalScore >= 5.0) return 'schedule';
  if (totalScore >= 3.0) return 'delegate';
  if (totalScore >= 1.5) return 'archive';
  return 'ignore';
}
