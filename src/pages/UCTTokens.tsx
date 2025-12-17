import { useNavigate } from "react-router-dom";
import { ArrowLeft, Coins, Zap, Target, Flame, CheckCircle, Circle, TrendingUp } from "lucide-react";
import { useBetaUCT } from "@/hooks/useBetaUCT";
import { useFocusStreaks } from "@/hooks/useFocusStreaks";
import { UCT_REWARDS, UCT_LEVEL_NAMES, getNextLevelInfo } from "@/lib/uctBetaRules";

const UCTTokens = () => {
  const navigate = useNavigate();
  const { data: uctData, isLoading } = useBetaUCT();
  const { streakData } = useFocusStreaks();

  // Define perks based on level
  const perks = [
    { 
      label: "Skip schedule confirmations", 
      unlocked: uctData?.skipScheduleConfirm || false,
      unlockLevel: "Active (50 UCT)"
    },
    { 
      label: "Skip send confirmations", 
      unlocked: uctData?.skipSendConfirm || false,
      unlockLevel: "Power (200 UCT)"
    },
    { 
      label: "1.5x resolution speed", 
      unlocked: (uctData?.resolutionSpeedBoost || 1) >= 1.5,
      unlockLevel: "Power (200 UCT)"
    },
    { 
      label: "2x resolution speed", 
      unlocked: (uctData?.resolutionSpeedBoost || 1) >= 2,
      unlockLevel: "Elite (500 UCT)"
    },
  ];

  const earningMethods = [
    { label: "Focus Session (5-14 min)", value: `+${UCT_REWARDS.focus_session_short}` },
    { label: "Focus Session (15-29 min)", value: `+${UCT_REWARDS.focus_session_medium}` },
    { label: "Focus Session (30-59 min)", value: `+${UCT_REWARDS.focus_session_long}` },
    { label: "Focus Session (60+ min)", value: `+${UCT_REWARDS.focus_session_deep}` },
    { label: "Unclutter Loop Resolved", value: `+${UCT_REWARDS.loop_resolved}` },
    { label: "Loop Reply Sent", value: `+${UCT_REWARDS.loop_reply_sent}` },
    { label: "Loop Archived", value: `+${UCT_REWARDS.loop_archive}` },
    { label: "7-Day Streak", value: `+${UCT_REWARDS.streak_7_day}` },
  ];

  const nextLevelInfo = uctData ? getNextLevelInfo(uctData.balance) : null;

  return (
    <div className="min-h-screen bg-transparent text-white">
      {/* Header */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 pb-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </button>

        <div className="flex items-center gap-4 mb-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-blue-500 flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.5)]">
            <Coins className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Token Economy</h1>
            <p className="text-slate-400 text-sm">Beta • Off-chain rewards</p>
          </div>
        </div>
      </div>

      {/* Balance Card */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 mb-6">
        <div className="rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 p-6 text-center">
          <div className="text-sm text-slate-400 mb-2">Current Balance</div>
          <div className="text-5xl font-bold mb-2 bg-gradient-to-r from-violet-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
            {isLoading ? "..." : uctData?.balance?.toFixed(2) || "0.00"}
          </div>
          <div className="text-lg text-slate-300 mb-4">UCT</div>
          
          {/* Level Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${uctData?.levelColor || 'from-slate-400 to-slate-500'}`}>
            <span className="text-sm font-semibold text-white">
              {uctData?.levelName || 'Starter'} Level
            </span>
          </div>

          {/* Progress to next level */}
          {nextLevelInfo?.nextLevel && (
            <div className="mt-4 text-sm text-slate-400">
              <TrendingUp className="h-4 w-4 inline mr-1" />
              {nextLevelInfo.remaining.toFixed(2)} UCT to {UCT_LEVEL_NAMES[nextLevelInfo.nextLevel]}
            </div>
          )}

          {/* Streak */}
          {streakData && streakData.current_streak > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-400/30">
              <Flame className="h-4 w-4 text-orange-400" />
              <span className="text-xs font-medium text-orange-300">
                {streakData.current_streak} Day Streak
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Your Perks */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 mb-6">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Target className="h-5 w-5 text-purple-400" />
          Your Perks
        </h2>
        <div className="rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 p-4 space-y-3">
          {perks.map((perk, idx) => (
            <div key={idx} className="flex items-center gap-3">
              {perk.unlocked ? (
                <CheckCircle className="h-5 w-5 text-emerald-400" />
              ) : (
                <Circle className="h-5 w-5 text-slate-600" />
              )}
              <span className={perk.unlocked ? 'text-white' : 'text-slate-500'}>
                {perk.label}
              </span>
              {!perk.unlocked && (
                <span className="text-xs text-slate-600 ml-auto">
                  at {perk.unlockLevel}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* How to Earn */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 mb-6">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Zap className="h-5 w-5 text-cyan-400" />
          How to Earn
        </h2>
        <div className="rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 p-4">
          <div className="space-y-2">
            {earningMethods.map((method, idx) => (
              <div key={idx} className="flex items-center justify-between py-1">
                <span className="text-sm text-slate-300">{method.label}</span>
                <span className="text-sm font-medium text-emerald-400">{method.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-8">
        <div className="text-center text-xs text-slate-500 border-t border-white/5 pt-4">
          Beta UCT • No on-chain transactions • Balance stored locally
        </div>
      </div>
    </div>
  );
};

export default UCTTokens;