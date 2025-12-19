// Focus Mode Hooks - Complete backend logic for rewards, streaks & analytics
export { useFocusSessions } from '../useFocusSessions';
export { useFocusStreaks } from '../useFocusStreaks';
export { useFocusStats } from '../useFocusStats';
export { useFocusRewards } from '../useFocusRewards';
export { useFocusAnalytics } from '../useFocusAnalytics';
export { useRewardHistory } from '../useRewardHistory';
export { useFocusProtection } from '../useFocusProtection';
export { useAssistantInterruption } from '../useAssistantInterruption';
export { useEyesFreeVoice } from '../useEyesFreeVoice';

// Types
export type { RewardCalculation, CompleteSessionParams } from '../useFocusRewards';
export type { DailyFocusData, ModeUsageData, WeeklyTierData } from '../useFocusAnalytics';
export type { RewardHistoryEntry } from '../useRewardHistory';
export type { QueuedItem, FocusSummary } from '../useFocusProtection';
export type { UrgencyLevel, InterruptionRequest, InterruptionResult } from '../useAssistantInterruption';
export type { UseEyesFreeVoiceReturn } from '../useEyesFreeVoice';
export type { EyesFreeOutput, VoiceOutputType } from '@/lib/eyesFreeMode';
