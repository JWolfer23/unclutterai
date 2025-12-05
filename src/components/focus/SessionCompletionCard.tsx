import { Award, Coins, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useFocusAnalytics } from "@/hooks/useFocusAnalytics";
import { useFocusStreaks } from "@/hooks/useFocusStreaks";
import { useNavigate } from "react-router-dom";

interface SessionCompletionCardProps {
  tokensEarned: number;
  actualMinutes: number;
  sessionNote: string;
  onNoteChange: (value: string) => void;
  onSaveNote: () => void;
  noteSaved: boolean;
  selectedTask: string;
}

const TIER_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  none: { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-400' },
  bronze: { bg: 'bg-amber-600/10', border: 'border-amber-600/40', text: 'text-amber-600' },
  silver: { bg: 'bg-slate-300/10', border: 'border-slate-300/40', text: 'text-slate-300' },
  gold: { bg: 'bg-yellow-400/10', border: 'border-yellow-400/40', text: 'text-yellow-400' },
  platinum: { bg: 'bg-cyan-300/10', border: 'border-cyan-300/40', text: 'text-cyan-300' },
};

export const SessionCompletionCard = ({
  tokensEarned,
  actualMinutes,
  sessionNote,
  onNoteChange,
  onSaveNote,
  noteSaved,
  selectedTask,
}: SessionCompletionCardProps) => {
  const navigate = useNavigate();
  const { weeklyTier } = useFocusAnalytics();
  const { currentStreak } = useFocusStreaks();

  const tierKey = weeklyTier.tier.toLowerCase();
  const tierStyle = TIER_STYLES[tierKey] || TIER_STYLES.none;
  const tierLabel = tierKey === 'none' ? 'No Tier' : 
    tierKey.charAt(0).toUpperCase() + tierKey.slice(1);

  // Encouragement message based on streak
  const getEncouragement = () => {
    if (currentStreak < 3) {
      return "Great start — come back tomorrow to build your streak.";
    } else if (currentStreak < 7) {
      return "Nice run — you're building serious momentum.";
    } else {
      return "You're on fire — don't break this streak! 🔥";
    }
  };

  const modeNames: Record<string, string> = {
    learning: "Learning Mode",
    health: "Health Mode",
    career: "Career Mode",
    wealth: "Wealth Mode",
    general: "Focus Mode",
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Reward Summary Card */}
      <div className="glass-card glass-card--primary text-center">
        {/* Reward Summary */}
        <div className="relative mb-6">
          {/* Glow effect */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-yellow-400/20 blur-3xl" />
          </div>
          
          <Award className="w-16 h-16 text-yellow-400 mx-auto mb-4 relative z-10" />
          
          <div className="flex items-center justify-center gap-2 mb-2 relative z-10">
            <Coins className="w-8 h-8 text-yellow-400" />
            <span className="text-4xl font-bold text-yellow-400">
              +{tokensEarned.toFixed(2)}
            </span>
            <span className="text-lg text-slate-400">UCT earned</span>
          </div>
          
          <p className="text-slate-400">
            You focused for <span className="text-white font-semibold">{actualMinutes} minutes</span>
          </p>
        </div>

        {/* Tier Badge */}
        <div className="flex justify-center mb-4">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${tierStyle.bg} ${tierStyle.border} border`}>
            <Sparkles className={`w-4 h-4 ${tierStyle.text}`} />
            <span className={`text-sm font-semibold ${tierStyle.text}`}>
              Current Tier: {tierLabel}
            </span>
          </div>
        </div>

        {/* Encouragement */}
        <p className="text-sm text-slate-300 mb-6">
          {getEncouragement()}
        </p>

        <Button onClick={() => navigate("/")} className="btn-primary">
          Back to Dashboard
        </Button>
      </div>

      {/* Notes Section */}
      <div className="glass-card">
        <h2 className="text-xl font-semibold text-white mb-4">Session Notes</h2>
        
        <Textarea
          value={sessionNote}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="Reflect on what you learned, completed, or discovered during this session…"
          disabled={noteSaved}
          className="min-h-[150px] bg-white/5 border-purple-500/30 text-white placeholder:text-slate-500 mb-4"
        />

        {!noteSaved ? (
          <Button onClick={onSaveNote} className="btn-primary">
            Save Note
          </Button>
        ) : (
          <p className="text-emerald-400 text-sm font-medium">
            ✅ Note saved to {modeNames[selectedTask] || 'Focus Mode'}
          </p>
        )}
      </div>
    </div>
  );
};
