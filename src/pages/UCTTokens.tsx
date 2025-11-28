import { useNavigate } from "react-router-dom";
import { ArrowLeft, Coins, Target, Zap, Flame, BookOpen, Calendar, Brain, Mic, Rocket, Palette, BarChart3, Clock, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTokens } from "@/hooks/useTokens";
import { useFocusStreaks } from "@/hooks/useFocusStreaks";

const UCTTokens = () => {
  const navigate = useNavigate();
  const { balance, isLoading } = useTokens();
  const { streakData } = useFocusStreaks();

  const earningActivities = [
    { icon: Zap, label: "Focus Session Completed", value: "+5-10", color: "from-emerald-500 to-cyan-500" },
    { icon: Target, label: "Set Goal (Learning, Health, etc.)", value: "+15-25", color: "from-purple-500 to-pink-500" },
    { icon: Brain, label: "Work on Goal via Focus Mode", value: "+10-15", color: "from-blue-500 to-cyan-500" },
    { icon: Flame, label: "Daily Streaks", value: "+5/day", color: "from-orange-500 to-red-500" },
    { icon: Sparkles, label: "AI Reflection Summary", value: "+5", color: "from-violet-500 to-purple-500" },
    { icon: BookOpen, label: "Finish Module/Book", value: "+50", color: "from-indigo-500 to-blue-500" },
    { icon: Calendar, label: "Weekly Check-In", value: "+20", color: "from-teal-500 to-emerald-500" },
  ];

  const rewards = [
    { icon: Brain, label: "Advanced AI Mode", cost: "150 UCT/wk", note: "Better reasoning", locked: balance < 150 },
    { icon: Mic, label: "Voice Assistant Mode", cost: "100 UCT/wk", note: "Audio commands", locked: balance < 100 },
    { icon: Sparkles, label: "Custom AI Agent", cost: "500 UCT/mo", note: "Personalized AI", locked: balance < 500 },
    { icon: Rocket, label: "Pro Mode Unlock", cost: "1000 UCT/mo", note: "All features", locked: balance < 1000 },
    { icon: Palette, label: "Image Generation Studio", cost: "200 UCT/50", note: "Creative", locked: balance < 200 },
    { icon: BarChart3, label: "Deep Analytics + History", cost: "250 UCT", note: "Premium users", locked: balance < 250 },
    { icon: Clock, label: "AI Time Credits", cost: "Varies", note: "Optional exchange", locked: false },
  ];

  return (
    <div className="min-h-screen bg-transparent text-white">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
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
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-blue-100 to-cyan-200 bg-clip-text text-transparent">
              UCT Tokens Earned
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Clarity is currency. Trade your attention for power.
            </p>
          </div>
        </div>
      </div>

      {/* Current Balance - Prominent Display */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="learning-panel relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-blue-500/10" />
          <div className="relative text-center py-12">
            <div className="text-sm font-semibold text-slate-400 mb-3 tracking-wide uppercase">Total Balance</div>
            <div className="text-7xl font-bold mb-4 bg-gradient-to-r from-violet-400 via-purple-400 to-blue-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(139,92,246,0.5)]">
              {isLoading ? "..." : balance?.toLocaleString() || "0"}
            </div>
            <div className="text-lg text-slate-300 font-medium">UCT Tokens</div>
            
            {streakData && streakData.current_streak > 0 && (
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-400/30">
                <Flame className="h-5 w-5 text-orange-400" />
                <span className="text-sm font-semibold text-orange-300">
                  {streakData.current_streak} Day Streak • +5 UCT/day
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* How to Earn UCT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
          📈 How to Earn UCT
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {earningActivities.map((activity, idx) => {
            const Icon = activity.icon;
            return (
              <div key={idx} className="learning-stat-card group hover:scale-[1.02] transition-transform">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${activity.color} flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.3)] group-hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-shadow`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-200 mb-1">{activity.label}</div>
                    <div className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                      {activity.value}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rewards Catalog */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
          🎁 Rewards Catalog
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rewards.map((reward, idx) => {
            const Icon = reward.icon;
            return (
              <div key={idx} className={`learning-panel relative overflow-hidden ${reward.locked ? 'opacity-60' : ''}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-xl ${reward.locked ? 'bg-slate-700' : 'bg-gradient-to-br from-violet-500 to-blue-500'} flex items-center justify-center ${!reward.locked && 'shadow-[0_0_20px_rgba(139,92,246,0.4)]'}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-base font-semibold text-slate-100 mb-0.5">{reward.label}</div>
                      <div className="text-xs text-slate-400">{reward.note}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-violet-400 mb-2">{reward.cost}</div>
                    <Button 
                      size="sm" 
                      disabled={reward.locked}
                      className={reward.locked ? 'bg-slate-700 text-slate-400' : 'bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600'}
                    >
                      {reward.locked ? 'Locked' : 'Redeem'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pro Boost Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="learning-panel relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-orange-500/10" />
          <div className="relative p-8 text-center">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-amber-400" />
            <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              🌟 Pro Boost Unlocked
            </h3>
            <p className="text-slate-300 mb-4 max-w-2xl mx-auto">
              Pro users earn <span className="font-bold text-amber-400">2x UCT</span> on all activities, receive <span className="font-bold text-amber-400">+500 UCT monthly bonus</span>, and get early access to new features.
            </p>
            <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold px-8">
              Upgrade to Pro
            </Button>
          </div>
        </div>
      </div>

      {/* Privacy & Trust Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="text-center text-sm text-slate-500 border-t border-white/5 pt-6">
          🔐 All actions are private. UCT is your personal growth currency.
        </div>
      </div>
    </div>
  );
};

export default UCTTokens;
