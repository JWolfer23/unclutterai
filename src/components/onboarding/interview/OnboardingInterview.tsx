import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Json } from "@/integrations/supabase/types";
import {
  InterviewArrival,
  InterviewWhatMatters,
  InterviewAttention,
  InterviewDecisionStyle,
  InterviewVoiceTone,
  InterviewTrustBoundary,
  InterviewClose,
} from "./index";

interface OnboardingInterviewProps {
  onComplete: () => void;
}

interface InterviewAnswers {
  priorities: string[];
  attentionPreference: string;
  decisionStyle: string;
  voiceTone: string;
  trustBoundaries: Record<string, boolean>;
}

type Screen = 
  | "arrival"
  | "whatMatters"
  | "attention"
  | "decisionStyle"
  | "voiceTone"
  | "trustBoundary"
  | "close";

const SCREENS: Screen[] = [
  "arrival",
  "whatMatters",
  "attention",
  "decisionStyle",
  "voiceTone",
  "trustBoundary",
  "close",
];

export const OnboardingInterview = ({ onComplete }: OnboardingInterviewProps) => {
  const { user } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>("arrival");
  const [answers, setAnswers] = useState<InterviewAnswers>({
    priorities: [],
    attentionPreference: "",
    decisionStyle: "",
    voiceTone: "",
    trustBoundaries: {},
  });

  const goToNext = () => {
    const currentIndex = SCREENS.indexOf(currentScreen);
    if (currentIndex < SCREENS.length - 1) {
      setCurrentScreen(SCREENS[currentIndex + 1]);
    }
  };

  // Save preferences to database
  const savePreferences = async () => {
    if (!user) return;

    const preferencesData: Json = {
      assistant_interview: {
        priorities: answers.priorities,
        attention_preference: answers.attentionPreference,
        decision_style: answers.decisionStyle,
        voice_tone: answers.voiceTone,
        trust_boundaries: answers.trustBoundaries,
      },
    };

    try {
      await supabase
        .from("profiles")
        .update({ preferences: preferencesData })
        .eq("id", user.id);
    } catch (error) {
      console.error("Error saving preferences:", error);
    }
  };

  const handleComplete = async () => {
    await savePreferences();
    onComplete();
  };

  // Progress indicator
  const currentIndex = SCREENS.indexOf(currentScreen);
  const progress = ((currentIndex + 1) / SCREENS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-slate-900 text-white relative">
      {/* Progress bar */}
      {currentScreen !== "arrival" && currentScreen !== "close" && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-white/10 z-50">
          <div
            className="h-full bg-gradient-to-r from-primary to-purple-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Screens */}
      {currentScreen === "arrival" && (
        <InterviewArrival onBegin={goToNext} />
      )}

      {currentScreen === "whatMatters" && (
        <InterviewWhatMatters
          onNext={(selected) => {
            setAnswers((prev) => ({ ...prev, priorities: selected }));
            goToNext();
          }}
        />
      )}

      {currentScreen === "attention" && (
        <InterviewAttention
          onNext={(preference) => {
            setAnswers((prev) => ({ ...prev, attentionPreference: preference }));
            goToNext();
          }}
        />
      )}

      {currentScreen === "decisionStyle" && (
        <InterviewDecisionStyle
          onNext={(style) => {
            setAnswers((prev) => ({ ...prev, decisionStyle: style }));
            goToNext();
          }}
        />
      )}

      {currentScreen === "voiceTone" && (
        <InterviewVoiceTone
          onNext={(tone) => {
            setAnswers((prev) => ({ ...prev, voiceTone: tone }));
            goToNext();
          }}
        />
      )}

      {currentScreen === "trustBoundary" && (
        <InterviewTrustBoundary
          onNext={(boundaries) => {
            setAnswers((prev) => ({ ...prev, trustBoundaries: boundaries }));
            goToNext();
          }}
        />
      )}

      {currentScreen === "close" && (
        <InterviewClose onComplete={handleComplete} />
      )}
    </div>
  );
};

export default OnboardingInterview;
