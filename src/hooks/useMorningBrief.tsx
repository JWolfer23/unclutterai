import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAssistantProfile } from "@/hooks/useAssistantProfile";

export type ScreenNumber = 1 | 2 | 3 | 4 | 5;

export interface PriorityItem {
  id: string;
  sourceType: "email" | "task" | "calendar";
  title: string;
  reason: "Time-sensitive" | "Revenue impact" | "Decision required" | "Strategic opportunity";
  sourceId?: string;
}

export interface EnergyState {
  level: "low" | "medium" | "high";
  focusWindowMinutes: number;
  recoveryNeeded: boolean;
}

export interface FirstAction {
  title: string;
  estimatedMinutes: number;
  reason: string;
  sourceId?: string;
}

export interface MorningBriefData {
  greeting: string;
  priorities: PriorityItem[];
  insight: string;
  energy: EnergyState;
  firstAction: FirstAction;
}

const MORNING_BRIEF_SHOWN_KEY = "last_morning_brief_date";

export const useMorningBrief = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenNumber>(1);
  const [currentPriorityIndex, setCurrentPriorityIndex] = useState(0);
  const [briefData, setBriefData] = useState<MorningBriefData | null>(null);
  const queryClient = useQueryClient();
  const { shouldInterrupt } = useAssistantProfile();

  // Get current hour for greeting
  const currentHour = new Date().getHours();
  const getGreeting = () => {
    if (currentHour < 12) return "Good Morning";
    if (currentHour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // Fetch brief data from edge function
  const { data: generatedBrief, isLoading, error, refetch } = useQuery({
    queryKey: ["morning-brief"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("morning-brief", {
        body: { userId: user.id },
      });

      if (error) throw error;
      return data as MorningBriefData;
    },
    enabled: false,
    staleTime: 1000 * 60 * 60 * 6,
  });

  // Generate brief mutation
  const generateBrief = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("morning-brief", {
        body: { userId: user.id },
      });

      if (error) throw error;
      return data as MorningBriefData;
    },
    onSuccess: (data) => {
      setBriefData(data);
      setCurrentPriorityIndex(0);
      queryClient.setQueryData(["morning-brief"], data);
    },
  });

  // Navigation
  const nextScreen = () => {
    if (currentScreen < 5) {
      setCurrentScreen((prev) => (prev + 1) as ScreenNumber);
    }
  };

  const prevScreen = () => {
    if (currentScreen > 1) {
      setCurrentScreen((prev) => (prev - 1) as ScreenNumber);
    }
  };

  const goToScreen = (screen: ScreenNumber) => {
    setCurrentScreen(screen);
  };

  // Priority navigation (one at a time)
  const getCurrentPriority = (): PriorityItem | null => {
    const data = briefData || generatedBrief;
    if (!data?.priorities || data.priorities.length === 0) return null;
    if (currentPriorityIndex >= data.priorities.length) return null;
    return data.priorities[currentPriorityIndex];
  };

  const getTotalPriorities = (): number => {
    const data = briefData || generatedBrief;
    return data?.priorities?.length || 0;
  };

  const advancePriority = () => {
    const total = getTotalPriorities();
    if (currentPriorityIndex < total - 1) {
      setCurrentPriorityIndex((prev) => prev + 1);
    } else {
      // All priorities processed, go to next screen
      nextScreen();
    }
  };

  // Check if brief was shown today
  const wasBriefShownToday = () => {
    const lastShown = localStorage.getItem(MORNING_BRIEF_SHOWN_KEY);
    const today = new Date().toDateString();
    return lastShown === today;
  };

  // Mark brief as shown today
  const markBriefShown = () => {
    const today = new Date().toDateString();
    localStorage.setItem(MORNING_BRIEF_SHOWN_KEY, today);
  };

  // Should auto-show (first open between 5 AM and 12 PM, not shown today, and profile allows)
  const shouldAutoShow = () => {
    const currentHour = new Date().getHours();
    const isWithinMorningWindow = currentHour >= 5 && currentHour < 12;
    const notShownToday = !wasBriefShownToday();
    const profileAllows = shouldInterrupt('informational');
    return isWithinMorningWindow && notShownToday && profileAllows;
  };

  // Complete the brief
  const completeBrief = () => {
    markBriefShown();
  };

  return {
    // State
    currentScreen,
    briefData: briefData || generatedBrief,
    isLoading: isLoading || generateBrief.isPending,
    error,
    greeting: getGreeting(),

    // Priority state
    currentPriorityIndex,
    currentPriority: getCurrentPriority(),
    totalPriorities: getTotalPriorities(),

    // Navigation
    nextScreen,
    prevScreen,
    goToScreen,
    advancePriority,

    // Actions
    generateBrief: generateBrief.mutate,
    completeBrief,

    // Checks
    shouldAutoShow,
    wasBriefShownToday,
    markBriefShown,
  };
};
