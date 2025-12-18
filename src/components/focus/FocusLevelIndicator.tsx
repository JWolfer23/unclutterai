import { Star } from "lucide-react";
import { useFocusAnalytics } from "@/hooks/useFocusAnalytics";

const LEVEL_TITLES: Record<number, string> = {
  1: "Getting Started",
  2: "Getting Started",
  3: "Getting Started",
  4: "Getting Started",
  5: "Focused Beginner",
  6: "Focused Beginner",
  7: "Focused Beginner",
  8: "Focused Beginner",
  9: "Focused Beginner",
  10: "Consistent Operator",
  11: "Consistent Operator",
  12: "Consistent Operator",
  13: "Consistent Operator",
  14: "Consistent Operator",
  15: "Deep Work Practitioner",
  16: "Deep Work Practitioner",
  17: "Deep Work Practitioner",
  18: "Deep Work Practitioner",
  19: "Deep Work Practitioner",
  20: "Master of Focus",
};

const getTitle = (level: number): string => {
  if (level >= 20) return "Master of Focus";
  return LEVEL_TITLES[level] || "Getting Started";
};

export const FocusLevelIndicator = () => {
  const { focusLevel, isLoading } = useFocusAnalytics();

  // Show explicit state even while loading - never block with "Loading..."

  // If still loading but timed out, show default state with indicator
  if (isLoading) {
    return (
      <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
        <Star className="w-4 h-4 text-slate-500" />
        <div className="text-sm">
          <span className="text-slate-400 font-medium">Level 1</span>
          <span className="text-slate-500 mx-2">—</span>
          <span className="text-slate-500">Getting Started</span>
        </div>
        <div className="text-xs text-slate-600">
          0/100 XP
        </div>
      </div>
    );
  }

  const level = focusLevel?.level || 1;
  const xpTotal = focusLevel?.xp_total || 0;
  const xpToNext = focusLevel?.xp_to_next || 100;
  const title = focusLevel?.title || getTitle(level);

  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
      <Star className="w-4 h-4 text-purple-400" />
      <div className="text-sm">
        <span className="text-white font-medium">Level {level}</span>
        <span className="text-slate-400 mx-2">—</span>
        <span className="text-slate-400">{title}</span>
      </div>
      <div className="text-xs text-slate-500">
        {xpTotal}/{xpToNext} XP
      </div>
    </div>
  );
};
