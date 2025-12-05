import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useFocusAnalytics } from "@/hooks/useFocusAnalytics";
import { FocusTierBadge } from "./FocusTierBadge";

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

export const FocusLevelCard = () => {
  const { focusLevel, isLoading } = useFocusAnalytics();

  if (isLoading) {
    return (
      <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-4 w-24 bg-white/10" />
            <Skeleton className="h-10 w-20 bg-white/10" />
            <Skeleton className="h-3 w-32 bg-white/10" />
            <Skeleton className="h-2 w-full bg-white/10" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const level = focusLevel?.level || 1;
  const xpTotal = focusLevel?.xp_total || 0;
  const xpToNext = focusLevel?.xp_to_next || 100;
  const title = focusLevel?.title || getTitle(level);
  const progressPercent = Math.min((xpTotal / xpToNext) * 100, 100);

  return (
    <Card className="bg-black/40 border-white/10 backdrop-blur-xl hover:border-purple-500/30 transition-all duration-200 relative overflow-hidden">
      {/* Soft glow accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-teal-400 to-purple-500" />
      
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Level Icon */}
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-teal-500/20 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
            <Star className="w-6 h-6 text-purple-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-medium mb-1">
              Focus Level
            </p>
            
            {/* Level Number */}
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-bold text-white">Level {level}</span>
            </div>
            
            {/* Title */}
            <p className="text-sm text-slate-400 mb-4">{title}</p>
            
            {/* XP Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-teal-400" />
                  XP Progress
                </span>
                <span className="text-slate-300">{xpTotal} / {xpToNext} XP</span>
              </div>
              <div className="relative h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            
            {/* Tier Badge */}
            <div className="mt-4">
              <FocusTierBadge level={level} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
