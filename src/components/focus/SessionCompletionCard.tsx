import { Award, Coins, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useFocusAnalytics } from "@/hooks/useFocusAnalytics";
import { useFocusStreaks } from "@/hooks/useFocusStreaks";
import { useNavigate } from "react-router-dom";
import { FocusTierBadge } from "./FocusTierBadge";
import { LevelUpAnimation, InlineLevelGlow } from "./LevelUpAnimation";
import { FocusSystemExplainerModal } from "./FocusSystemExplainerModal";
import { 
  getLevelIdentity, 
  getLevelEncouragement, 
  getStreakEncouragement 
} from "@/lib/focusMicroCopy";

interface XPData {
  xp_earned: number;
  xp_total: number;
  xp_to_next: number;
  level: number;
  leveled_up: boolean;
  title: string;
}

interface SessionCompletionCardProps {
  tokensEarned: number;
  actualMinutes: number;
  sessionNote: string;
  onNoteChange: (value: string) => void;
  onSaveNote: () => void;
  noteSaved: boolean;
  selectedTask: string;
  xpData?: XPData;
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
  xpData,
}: SessionCompletionCardProps) => {
  const navigate = useNavigate();
  const { weeklyTier, focusLevel } = useFocusAnalytics();
  const { currentStreak } = useFocusStreaks();

  const tierKey = weeklyTier.tier.toLowerCase();
  const tierStyle = TIER_STYLES[tierKey] || TIER_STYLES.none;
  const tierLabel = tierKey === 'none' ? 'No Tier' : 
    tierKey.charAt(0).toUpperCase() + tierKey.slice(1);

  // Use xpData if provided, otherwise fall back to focusLevel
  const level = xpData?.level || focusLevel?.level || 1;
  const xpTotal = xpData?.xp_total || focusLevel?.xp_total || 0;
  const xpToNext = xpData?.xp_to_next || focusLevel?.xp_to_next || 100;
  const xpEarned = xpData?.xp_earned || 0;
  const leveledUp = xpData?.leveled_up || false;
  const title = xpData?.title || focusLevel?.title || "Getting Started";
  const xpProgressPercent = Math.min((xpTotal / xpToNext) * 100, 100);

  // Get micro-copy messages
  const levelIdentity = getLevelIdentity(level);
  const levelEncouragement = getLevelEncouragement(level, true);
  const streakEncouragement = getStreakEncouragement(currentStreak);

  const modeNames: Record<string, string> = {
    learning: "Learning Mode",
    health: "Health Mode",
    career: "Career Mode",
    wealth: "Wealth Mode",
    general: "Focus Mode",
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 relative">
      {/* Level Up Animation */}
      <LevelUpAnimation show={leveledUp} newLevel={level} />

      {/* Reward Summary Card */}
      <div className="glass-card glass-card--primary text-center">
        {/* UCT Reward Summary */}
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

        {/* XP Block */}
        <div className="relative mb-6 p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-teal-500/10 border border-purple-500/20">
          {/* XP glow effect */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-24 h-24 rounded-full bg-purple-500/20 blur-2xl" />
          </div>
          
          <div className="relative z-10">
            {/* XP Earned with glow animation */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <Star className={`w-6 h-6 text-purple-400 ${leveledUp ? 'animate-pulse' : ''}`} />
              <span 
                className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-teal-400 bg-clip-text text-transparent"
                style={{ 
                  textShadow: leveledUp 
                    ? "0 0 30px rgba(168, 85, 247, 0.8)" 
                    : "0 0 20px rgba(168, 85, 247, 0.5)" 
                }}
              >
                +{xpEarned} XP
              </span>
            </div>
            
            {/* Level & Title with inline animation */}
            <div className="flex items-center justify-center mb-4">
              <InlineLevelGlow level={level} leveledUp={leveledUp} title={title} />
            </div>
            
            {/* XP Progress Bar */}
            <div className="space-y-2">
              <div className="relative h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-teal-400 rounded-full transition-all duration-700"
                  style={{ width: `${xpProgressPercent}%` }}
                />
              </div>
              <p className="text-xs text-slate-400">XP: {xpTotal} / {xpToNext}</p>
            </div>
          </div>
        </div>

        {/* Tier Badge */}
        <div className="flex justify-center gap-3 mb-4">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${tierStyle.bg} ${tierStyle.border} border`}>
            <Sparkles className={`w-4 h-4 ${tierStyle.text}`} />
            <span className={`text-sm font-semibold ${tierStyle.text}`}>
              Current Tier: {tierLabel}
            </span>
          </div>
        </div>
        
        {/* Focus Level Badge */}
        <div className="flex justify-center mb-4">
          <FocusTierBadge level={level} />
        </div>

        {/* Level Identity */}
        <p className="text-xs text-slate-400 italic mb-2">
          {levelIdentity}
        </p>

        {/* Encouragement Messages */}
        <div className="space-y-1 mb-4">
          <p className="text-sm text-slate-300">
            {levelEncouragement}
          </p>
          <p className="text-xs text-slate-400">
            {streakEncouragement}
          </p>
        </div>

        {/* Learn More Link */}
        <div className="flex justify-center mb-4">
          <FocusSystemExplainerModal />
        </div>

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
