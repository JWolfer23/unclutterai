import { useMemo, useCallback } from 'react';
import { useFocusStats } from '@/hooks/useFocusStats';
import { useFocusStreaks } from '@/hooks/useFocusStreaks';
import { useUserDashboard } from '@/hooks/useUserDashboard';

interface AssistantAnalysis {
  focusSummary: string;
  streakStatus: string;
  recommendations: string[];
  nextAction: string;
}

interface Priority {
  title: string;
  reason: string;
  urgency: 'high' | 'medium' | 'low';
}

export const useAssistantIntelligence = () => {
  const { todayMinutes, weekMinutes, weekUCT, recentSessions, isLoading: focusLoading } = useFocusStats();
  const { currentStreak, longestStreak, isLoading: streakLoading } = useFocusStreaks();
  const { dashboardData, isLoading: dashboardLoading } = useUserDashboard();

  const isLoading = focusLoading || streakLoading || dashboardLoading;

  const analyzeStats = useCallback((): AssistantAnalysis => {
    const avgDaily = weekMinutes ? Math.round(weekMinutes / 7) : 0;
    const todayVsAvg = avgDaily > 0 ? Math.round((todayMinutes / avgDaily) * 100) : 0;
    
    const focusSummary = todayMinutes > 0
      ? `${todayMinutes} minutes focused today (${todayVsAvg}% of your daily average).`
      : 'No focus time logged today.';

    const streakStatus = currentStreak > 0
      ? `${currentStreak}-day streak active. Longest: ${longestStreak} days.`
      : 'No active streak. Start a focus session to begin.';

    const recommendations: string[] = [];
    
    if (todayMinutes < avgDaily && avgDaily > 0) {
      recommendations.push(`You're ${avgDaily - todayMinutes} minutes below your daily average.`);
    }
    
    if (currentStreak > 0 && currentStreak === longestStreak) {
      recommendations.push("You're at your longest streak. One more session extends your record.");
    }

    if (weekUCT < 5) {
      recommendations.push('Complete more focus sessions to increase UCT earnings.');
    }

    const nextAction = recommendations.length > 0
      ? recommendations[0]
      : 'Your focus metrics are on track. Continue current pace.';

    return {
      focusSummary,
      streakStatus,
      recommendations,
      nextAction,
    };
  }, [todayMinutes, weekMinutes, weekUCT, currentStreak, longestStreak]);

  const suggestPriorities = useCallback((): Priority[] => {
    const priorities: Priority[] = [];

    // Check streak status
    if (currentStreak > 0) {
      priorities.push({
        title: 'Maintain your streak',
        reason: `Day ${currentStreak} of your focus streak. One session today keeps it alive.`,
        urgency: 'high',
      });
    }

    // Check pending tasks
    const tasksCount = dashboardData?.tasks_generated ?? 0;
    if (tasksCount > 0) {
      priorities.push({
        title: `${tasksCount} pending tasks`,
        reason: 'Tasks awaiting completion from previous sessions.',
        urgency: tasksCount > 3 ? 'high' : 'medium',
      });
    }

    // Focus deficit
    const avgDaily = weekMinutes ? Math.round(weekMinutes / 7) : 60;
    if (todayMinutes < avgDaily * 0.5) {
      priorities.push({
        title: 'Start a focus session',
        reason: `Only ${todayMinutes} minutes today. Below your typical ${avgDaily}-minute average.`,
        urgency: 'medium',
      });
    }

    return priorities.length > 0 ? priorities : [{
      title: 'No urgent priorities',
      reason: 'Your metrics are healthy. Continue at your current pace.',
      urgency: 'low',
    }];
  }, [currentStreak, dashboardData, todayMinutes, weekMinutes]);

  const explainFocusState = useCallback((): string => {
    const analysis = analyzeStats();
    const parts = [analysis.focusSummary, analysis.streakStatus];
    
    if (analysis.recommendations.length > 0) {
      parts.push(`Recommendation: ${analysis.nextAction}`);
    }

    return parts.join(' ');
  }, [analyzeStats]);

  const generatePlan = useCallback((goal: string): string => {
    const analysis = analyzeStats();
    const priorities = suggestPriorities();
    
    let plan = `To achieve "${goal}":\n\n`;
    
    // Add context from current state
    plan += `Current state: ${analysis.focusSummary}\n`;
    
    // Add prioritized steps
    plan += '\nRecommended steps:\n';
    priorities.forEach((p, i) => {
      plan += `${i + 1}. ${p.title} — ${p.reason}\n`;
    });

    return plan;
  }, [analyzeStats, suggestPriorities]);

  const getContextualData = useMemo(() => ({
    todayMinutes,
    weekMinutes,
    weekUCT,
    currentStreak,
    longestStreak,
    recentSessionsCount: recentSessions?.length ?? 0,
    tasksGenerated: dashboardData?.tasks_generated ?? 0,
    tokensEarned: dashboardData?.tokens_earned ?? 0,
  }), [todayMinutes, weekMinutes, weekUCT, currentStreak, longestStreak, recentSessions, dashboardData]);

  return {
    analyzeStats,
    suggestPriorities,
    explainFocusState,
    generatePlan,
    getContextualData,
    isLoading,
  };
};
