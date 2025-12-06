/**
 * Focus Mode Micro-Copy System
 * Provides titles, identities, and encouragement messages for the gamification system
 */

export interface LevelInfo {
  title: string;
  identity: string;
}

export const getLevelTitle = (level: number): string => {
  if (level >= 20) return "Master of Focus";
  if (level >= 15) return "Deep Work Practitioner";
  if (level >= 10) return "Consistent Operator";
  if (level >= 5) return "Focused Beginner";
  return "Getting Started";
};

export const getLevelIdentity = (level: number): string => {
  if (level >= 20) return "You've built a rare ability — sustained, deliberate attention.";
  if (level >= 15) return "You're capable of extended, meaningful focus blocks.";
  if (level >= 10) return "You show up regularly and your focus is becoming a skill.";
  if (level >= 5) return "You're no longer dabbling — you're actively choosing focus.";
  return "You've taken the first step, building a tiny habit.";
};

export const getLevelInfo = (level: number): LevelInfo => ({
  title: getLevelTitle(level),
  identity: getLevelIdentity(level),
});

// Level-based encouragement messages
const LEVEL_ENCOURAGEMENTS: Record<string, string[]> = {
  "Getting Started": [
    "You've started something most people only talk about.",
    "Tiny focus reps now turn into big results later.",
  ],
  "Focused Beginner": [
    "You're no longer dabbling — you're training your focus like a muscle.",
    "Each session makes it easier to say yes to what matters and no to what doesn't.",
  ],
  "Consistent Operator": [
    "This is where real progress happens — consistent, repeatable focus.",
    "You're past motivation. You're running on systems.",
  ],
  "Deep Work Practitioner": [
    "You're doing what most people can't: deep, uninterrupted work.",
    "Your future self is going to thank you for this level of focus.",
  ],
  "Master of Focus": [
    "You've built a superpower most people never develop.",
    "Protect this level of focus — it's one of the most valuable skills in the modern world.",
  ],
};

export const getLevelEncouragement = (level: number, random = false): string => {
  const title = getLevelTitle(level);
  const messages = LEVEL_ENCOURAGEMENTS[title] || LEVEL_ENCOURAGEMENTS["Getting Started"];
  
  if (random) {
    const index = Math.floor(Math.random() * messages.length);
    return messages[index];
  }
  
  return messages[0];
};

// Streak-based encouragement messages
export const getStreakEncouragement = (currentStreak: number): string => {
  if (currentStreak >= 14) {
    return "This is elite behavior. Most people never get this far.";
  }
  if (currentStreak >= 7) {
    return "You've crossed into rare consistency. Keep going.";
  }
  if (currentStreak >= 3) {
    return "You're building serious momentum. Don't let it slip.";
  }
  return "Great start — come back tomorrow to lock in the habit.";
};

// Tier information
export interface TierInfo {
  name: string;
  color: string;
  sessionsRequired: number;
  bonusPercent: number;
}

export const TIER_DATA: TierInfo[] = [
  { name: "Bronze", color: "#C57A3B", sessionsRequired: 3, bonusPercent: 2 },
  { name: "Silver", color: "#C0C0C0", sessionsRequired: 5, bonusPercent: 5 },
  { name: "Gold", color: "#FFD700", sessionsRequired: 7, bonusPercent: 10 },
  { name: "Platinum", color: "#D8F3FF", sessionsRequired: 10, bonusPercent: 15 },
  { name: "Diamond", color: "#7FFFFF", sessionsRequired: 14, bonusPercent: 20 },
];

export const getTierInfo = (tier: string): TierInfo => {
  const found = TIER_DATA.find(t => t.name.toLowerCase() === tier.toLowerCase());
  return found || TIER_DATA[0];
};

// Level thresholds for explainer
export const LEVEL_THRESHOLDS = [
  { range: "1–4", title: "Getting Started", xpExample: "0 → 400 XP" },
  { range: "5–9", title: "Focused Beginner", xpExample: "400 → 2,500 XP" },
  { range: "10–14", title: "Consistent Operator", xpExample: "2,500 → 10,000 XP" },
  { range: "15–19", title: "Deep Work Practitioner", xpExample: "10,000 → 19,600 XP" },
  { range: "20+", title: "Master of Focus", xpExample: "40,000+ XP" },
];
