// AI Decision Heuristics - The brain of the billionaire assistant
// Core question: "If this is ignored today, does something meaningful break?"

export type ConsequenceType = 'financial' | 'relationship' | 'opportunity' | 'reputation' | 'none';
export type TimeSensitivity = 'deadline_today' | 'waiting_on_user' | 'can_wait' | 'no_deadline';
export type IntentAlignment = 'matches_goals' | 'active_project' | 'habit_related' | 'random';
export type SourceWeight = 'human_known' | 'human_unknown' | 'system' | 'notification';
export type CognitiveLoad = 'quick_decision' | 'deep_thinking' | 'emotional_drain';

export type FinalClassification = 'act_now' | 'schedule' | 'delegate' | 'archive' | 'ignore';

export interface DecisionScores {
  consequence: ConsequenceType;
  consequenceScore: number; // 0-10
  timeSensitivity: TimeSensitivity;
  timeScore: number; // 0-10
  intentAlignment: IntentAlignment;
  intentScore: number; // 0-10
  sourceWeight: SourceWeight;
  sourceScore: number; // 0-10
  cognitiveLoad: CognitiveLoad;
  loadScore: number; // 0-10 (lower is easier)
}

export interface DecisionResult {
  scores: DecisionScores;
  totalScore: number; // Weighted composite
  classification: FinalClassification;
  reasoning: string; // One sentence explanation
  breaksSomething: boolean; // Core question answer
}

export interface ItemToScore {
  id: string;
  type: 'message' | 'task' | 'notification' | 'reminder';
  title: string;
  content?: string;
  sender?: string;
  senderEmail?: string;
  isVip?: boolean;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  labels?: string[];
}

// Score weights for final calculation
const WEIGHTS = {
  consequence: 0.30,
  timeSensitivity: 0.25,
  intentAlignment: 0.20,
  sourceWeight: 0.15,
  cognitiveLoad: 0.10, // Inverted - higher load = lower priority
};

// Thresholds for classification
const THRESHOLDS = {
  actNow: 7.5,      // Score >= 7.5 → Act Now
  schedule: 5.0,    // Score >= 5.0 → Schedule
  delegate: 3.0,    // Score >= 3.0 → Delegate
  archive: 1.5,     // Score >= 1.5 → Archive
  // Below 1.5 → Ignore
};

export function calculateTotalScore(scores: DecisionScores): number {
  const consequenceValue = scores.consequenceScore * WEIGHTS.consequence;
  const timeValue = scores.timeScore * WEIGHTS.timeSensitivity;
  const intentValue = scores.intentScore * WEIGHTS.intentAlignment;
  const sourceValue = scores.sourceScore * WEIGHTS.sourceWeight;
  // Cognitive load is inverted: high load = penalty
  const loadValue = (10 - scores.loadScore) * WEIGHTS.cognitiveLoad;
  
  return consequenceValue + timeValue + intentValue + sourceValue + loadValue;
}

export function classifyByScore(totalScore: number): FinalClassification {
  if (totalScore >= THRESHOLDS.actNow) return 'act_now';
  if (totalScore >= THRESHOLDS.schedule) return 'schedule';
  if (totalScore >= THRESHOLDS.delegate) return 'delegate';
  if (totalScore >= THRESHOLDS.archive) return 'archive';
  return 'ignore';
}

// Display-friendly labels
export const CLASSIFICATION_LABELS: Record<FinalClassification, string> = {
  act_now: 'Act Now',
  schedule: 'Schedule',
  delegate: 'Delegate',
  archive: 'Archive',
  ignore: 'Ignore',
};

export const CLASSIFICATION_COLORS: Record<FinalClassification, string> = {
  act_now: 'text-red-400',
  schedule: 'text-yellow-400',
  delegate: 'text-blue-400',
  archive: 'text-white/40',
  ignore: 'text-white/20',
};
