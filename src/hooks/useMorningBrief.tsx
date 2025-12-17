import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMessages } from "@/hooks/useMessages";
import { useTasks } from "@/hooks/useTasks";
import { useFocusAnalytics } from "@/hooks/useFocusAnalytics";
import { useFocusStreaks } from "@/hooks/useFocusStreaks";
import { useAssistantProfile } from "@/hooks/useAssistantProfile";

export type ScreenNumber = 1 | 2 | 3 | 4 | 5;

export interface PriorityItem {
  id: string;
  sourceType: "email" | "task" | "calendar";
  title: string;
  reason: "Time-sensitive" | "Revenue impact" | "Decision required" | "Strategic opportunity";
  sourceId?: string;
}

export interface IntelligenceData {
  market: string[];
  personal: string;
  learning?: string;
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
  intelligence: IntelligenceData;
  energy: EnergyState;
  firstAction: FirstAction;
}

const MORNING_BRIEF_SHOWN_KEY = "last_morning_brief_date";

export const useMorningBrief = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenNumber>(1);
  const [briefData, setBriefData] = useState<MorningBriefData | null>(null);
  const queryClient = useQueryClient();
  const { profile, shouldInterrupt } = useAssistantProfile();

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
    enabled: false, // Don't auto-fetch, we'll trigger manually
    staleTime: 1000 * 60 * 60 * 6, // Cache for 6 hours
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
    
    // Check assistant profile interruption preference
    // Morning brief is considered "informational" level
    const profileAllows = shouldInterrupt('informational');
    
    return isWithinMorningWindow && notShownToday && profileAllows;
  };

  // Handle priority item actions
  const handlePriorityAction = (
    priorityId: string,
    action: "handle" | "schedule" | "delegate" | "dismiss"
  ) => {
    if (!briefData) return;

    if (action === "dismiss") {
      setBriefData({
        ...briefData,
        priorities: briefData.priorities.filter((p) => p.id !== priorityId),
      });
    }
    // Other actions can be handled by parent component
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

    // Navigation
    nextScreen,
    prevScreen,
    goToScreen,

    // Actions
    generateBrief: generateBrief.mutate,
    handlePriorityAction,
    completeBrief,

    // Checks
    shouldAutoShow,
    wasBriefShownToday,
    markBriefShown,
  };
};
