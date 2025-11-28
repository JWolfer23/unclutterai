import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Brain, Smile, Battery, Heart, TrendingUp, Moon, Sparkles, Plug } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const HealthMode = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("mental");

  // Top tile metrics
  const clarityScore = 85;
  const focusRecoveryRatio = "3:1";
  const currentMood = "😊";

  // Sample nudges for low clarity
  const mindfulNudges = [
    "Focus Mode session soon?",
    "Try a 2-minute reset.",
    "What lifted your energy today?",
    "Pause and breathe for 1 minute.",
    "You've been crushing focus mode. Ready to reflect?"
  ];

  return (
    <div className="min-h-screen bg-transparent text-white">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="metric-icon metric-icon--community">
            <Brain className="metric-icon__glyph" />
          </div>
          <div>
            <h1 className="text-3xl font-sora font-bold tracking-tight bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Health Mode
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Your mental clarity engine — protect attention, restore energy, build resilience
            </p>
          </div>
        </div>
      </div>

      {/* Top Tiles */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Clarity Score */}
          <div className="learning-stat-card group hover:scale-[1.02] transition-transform duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-2 border-emerald-400/30 flex items-center justify-center">
                <Brain className="w-7 h-7 learning-icon text-emerald-400" />
              </div>
            </div>
            <div className="text-4xl font-bold font-sora mb-1 bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
              {clarityScore}
            </div>
            <div className="text-sm text-slate-300 font-medium">Clarity Score</div>
            <div className="mt-2 text-xs text-emerald-400">Based on mood, sleep, focus & journaling</div>
          </div>

          {/* Focus:Recovery Ratio */}
          <div className="learning-stat-card group hover:scale-[1.02] transition-transform duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-400/30 flex items-center justify-center">
                <Battery className="w-7 h-7 learning-icon text-purple-400" />
              </div>
            </div>
            <div className="text-4xl font-bold font-sora mb-1 bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
              {focusRecoveryRatio}
            </div>
            <div className="text-sm text-slate-300 font-medium">Focus:Recovery Ratio</div>
            <div className="mt-2 text-xs text-purple-400">Pulled from Focus Mode & journal cues</div>
          </div>

          {/* Mood Snapshot */}
          <div className="learning-stat-card group hover:scale-[1.02] transition-transform duration-300 cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-400/30 flex items-center justify-center">
                <Smile className="w-7 h-7 learning-icon text-yellow-400" />
              </div>
            </div>
            <div className="text-5xl mb-1">
              {currentMood}
            </div>
            <div className="text-sm text-slate-300 font-medium">Mood Snapshot</div>
            <div className="mt-2 text-xs text-yellow-400">Tap to update your mood</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="learning-tabs w-full justify-start mb-8 overflow-x-auto">
            <TabsTrigger value="mental" className="learning-tab-trigger flex items-center gap-2">
              <Brain className="w-4 h-4" />
              <span>Mental Energy</span>
            </TabsTrigger>
            <TabsTrigger value="mood" className="learning-tab-trigger flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>Mood & Emotion</span>
            </TabsTrigger>
            <TabsTrigger value="sleep" className="learning-tab-trigger flex items-center gap-2">
              <Moon className="w-4 h-4" />
              <span>Sleep & Recharge</span>
            </TabsTrigger>
            <TabsTrigger value="nudges" className="learning-tab-trigger flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Mindful Nudges</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="learning-tab-trigger flex items-center gap-2">
              <Plug className="w-4 h-4" />
              <span>Integrations</span>
            </TabsTrigger>
          </TabsList>

          {/* Mental Energy Tab */}
          <TabsContent value="mental" className="animate-fade-in">
            <div className="learning-panel p-12">
              <div className="text-center">
                <Brain className="w-16 h-16 mx-auto mb-6 learning-icon text-emerald-400" />
                <h3 className="text-2xl font-sora font-semibold mb-3 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  Mental Energy
                </h3>
                <p className="text-slate-300 mb-6 max-w-lg mx-auto">
                  Track clarity score trends, identify fatigue markers, and receive burnout warnings
                </p>
                <div className="mt-8 p-4 bg-emerald-500/10 border border-emerald-400/30 rounded-2xl">
                  <p className="text-sm text-emerald-300">
                    💡 Your clarity score is strong. Keep up the balanced focus and recovery rhythm!
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Mood & Emotion Tab */}
          <TabsContent value="mood" className="animate-fade-in">
            <div className="learning-panel p-12">
              <div className="text-center">
                <Heart className="w-16 h-16 mx-auto mb-6 learning-icon text-pink-400" />
                <h3 className="text-2xl font-sora font-semibold mb-3 bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
                  Mood & Emotion
                </h3>
                <p className="text-slate-300 mb-6 max-w-lg mx-auto">
                  Journal your feelings, tag emotions, and view mood trends over time
                </p>
                <div className="mt-8 p-4 bg-pink-500/10 border border-pink-400/30 rounded-2xl">
                  <p className="text-sm text-pink-300">
                    ✨ You've felt most positive after focus blocks and reading sessions.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Sleep & Recharge Tab */}
          <TabsContent value="sleep" className="animate-fade-in">
            <div className="learning-panel p-12">
              <div className="text-center">
                <Moon className="w-16 h-16 mx-auto mb-6 learning-icon text-indigo-400" />
                <h3 className="text-2xl font-sora font-semibold mb-3 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Sleep & Recharge
                </h3>
                <p className="text-slate-300 mb-6 max-w-lg mx-auto">
                  Sync with Apple Health, WHOOP, Oura for sleep phases, HRV, and rest data
                </p>
                <button className="btn-primary mt-4">
                  Connect Wearable
                </button>
              </div>
            </div>
          </TabsContent>

          {/* Mindful Nudges Tab */}
          <TabsContent value="nudges" className="animate-fade-in">
            <div className="learning-panel p-12">
              <div className="text-center">
                <Sparkles className="w-16 h-16 mx-auto mb-6 learning-icon text-yellow-400" />
                <h3 className="text-2xl font-sora font-semibold mb-3 bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">
                  Mindful Nudges
                </h3>
                <p className="text-slate-300 mb-6 max-w-lg mx-auto">
                  AI-generated suggestions to breathe, rest, reflect, or recharge
                </p>
                <div className="mt-8 space-y-3 max-w-md mx-auto">
                  {mindfulNudges.slice(0, 3).map((nudge, idx) => (
                    <div key={idx} className="p-4 bg-yellow-500/10 border border-yellow-400/30 rounded-xl text-left">
                      <p className="text-sm text-yellow-200">{nudge}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="animate-fade-in">
            <div className="learning-panel p-12">
              <div className="text-center">
                <Plug className="w-16 h-16 mx-auto mb-6 learning-icon text-cyan-400" />
                <h3 className="text-2xl font-sora font-semibold mb-3 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Integrations
                </h3>
                <p className="text-slate-300 mb-6 max-w-lg mx-auto">
                  Connect wearables and apps for privacy-first health analytics
                </p>
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  {["Apple Health", "WHOOP", "Oura Ring"].map((device, idx) => (
                    <div key={idx} className="p-4 bg-cyan-500/10 border border-cyan-400/30 rounded-xl">
                      <p className="text-sm font-semibold text-cyan-200">{device}</p>
                      <button className="mt-2 text-xs text-cyan-400 hover:text-cyan-300">Connect</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default HealthMode;
