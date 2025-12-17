import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, GraduationCap, BookOpen, Target, Award, Calendar, Brain, FileText, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useLearning } from "@/hooks/useLearning";
import { SourcesDrawer } from "@/components/learning/SourcesDrawer";
import { GoalsSection } from "@/components/learning/GoalsSection";
import { LearningFocusMode } from "@/components/learning/LearningFocusMode";
import { NotesVault } from "@/components/learning/NotesVault";
import { LearningScheduleDrawer } from "@/components/learning/LearningScheduleDrawer";
import { toast } from "@/components/ui/sonner";

const LearningMode = () => {
  const navigate = useNavigate();
  const { sources, goals, notes, streak, isLoading } = useLearning();
  const [sourcesDrawerOpen, setSourcesDrawerOpen] = useState(false);
  const [scheduleDrawerOpen, setScheduleDrawerOpen] = useState(false);
  const [learningPlanOpen, setLearningPlanOpen] = useState(false);
  const [dailyGoalsOpen, setDailyGoalsOpen] = useState(false);
  const [learningPrompt, setLearningPrompt] = useState("");
  const [generatingPlan, setGeneratingPlan] = useState(false);

  const activeTopics = sources?.filter((s) => s.is_active).length || 0;
  const activeMilestones = goals?.filter((g) => !g.is_completed).length || 0;
  const totalNotes = notes?.length || 0;

  const dailyGoals = goals?.filter((g) => !g.is_completed && g.goal_type === 'daily') || [];

  const handleGeneratePlan = async () => {
    if (!learningPrompt.trim()) {
      toast.error("Please describe your learning goals");
      return;
    }
    setGeneratingPlan(true);
    // Simulate AI generation - in production, call your AI edge function
    setTimeout(() => {
      toast.success("Learning plan generated! Check the Goals tab.");
      setGeneratingPlan(false);
      setLearningPlanOpen(false);
      setLearningPrompt("");
    }, 2000);
  };

  const learningStats = [
    { 
      icon: Sparkles, 
      label: "Generate Learning Plan", 
      value: activeTopics.toString(), 
      gradient: "from-cyan-400 via-blue-400 to-blue-500", 
      glow: "rgba(6, 182, 212, 0.4)",
      onClick: () => setLearningPlanOpen(true),
      clickable: true
    },
    { 
      icon: Target, 
      label: "Daily Goals", 
      value: dailyGoals.length.toString(), 
      gradient: "from-purple-400 via-purple-500 to-pink-500", 
      glow: "rgba(139, 92, 246, 0.4)",
      onClick: () => setDailyGoalsOpen(true),
      clickable: true
    },
    { 
      icon: Award, 
      label: "Daily Streak", 
      value: streak?.current_streak?.toString() || "0", 
      gradient: "from-yellow-400 via-orange-400 to-orange-500", 
      glow: "rgba(251, 146, 60, 0.4)",
      clickable: false
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

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
          <div className="metric-icon learning-icon animate-pulse" style={{ background: "linear-gradient(135deg, hsl(189, 94%, 60%), hsl(217, 91%, 60%))" }}>
            <GraduationCap className="metric-icon__glyph" />
          </div>
          <div>
            <h1 className="text-4xl font-bold font-sora tracking-tight bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Learning Mode
            </h1>
            <p className="text-slate-300 text-sm mt-1 font-medium">
              Track subjects, earn streaks, and grow daily
            </p>
          </div>
        </div>
      </div>

      {/* Stats - Premium Floating Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {learningStats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                onClick={stat.clickable ? stat.onClick : undefined}
                className={`learning-stat-card group hover:scale-[1.02] transition-all duration-300 ${stat.clickable ? 'cursor-pointer' : ''}`}
                style={{
                  boxShadow: `0 0 40px -10px ${stat.glow}, 0 20px 40px -10px rgba(0, 0, 0, 0.6)`,
                }}
              >
                <div className="flex items-center gap-4">
                  <div 
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center relative`}
                    style={{
                      boxShadow: `0 0 30px ${stat.glow}`,
                    }}
                  >
                    <Icon className="h-8 w-8 text-white learning-icon" />
                  </div>
                  <div className="flex-1">
                    <div className={`text-5xl font-bold font-sora bg-gradient-to-br ${stat.gradient} bg-clip-text text-transparent`}>
                      {stat.value}
                    </div>
                    <div className="text-sm text-slate-300 font-medium mt-1">{stat.label}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content - Premium Pill Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <Tabs defaultValue="sources" className="w-full">
          {/* Pill-Style Tabs */}
          <div className="learning-tabs mb-8">
            <TabsList className="grid w-full grid-cols-5 bg-transparent p-0 h-auto gap-2">
              <TabsTrigger 
                value="sources" 
                className="learning-tab-trigger data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/30 data-[state=active]:to-blue-500/30 data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/50 flex items-center gap-2"
              >
                <BookOpen className="h-4 w-4 learning-icon" />
                <span className="hidden sm:inline font-semibold">Sources</span>
              </TabsTrigger>
              <TabsTrigger 
                value="goals" 
                className="learning-tab-trigger data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/30 data-[state=active]:to-blue-500/30 data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/50 flex items-center gap-2"
              >
                <Target className="h-4 w-4 learning-icon" />
                <span className="hidden sm:inline font-semibold">Goals</span>
              </TabsTrigger>
              <TabsTrigger 
                value="focus" 
                className="learning-tab-trigger data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/30 data-[state=active]:to-blue-500/30 data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/50 flex items-center gap-2"
              >
                <Brain className="h-4 w-4 learning-icon" />
                <span className="hidden sm:inline font-semibold">Focus</span>
              </TabsTrigger>
              <TabsTrigger 
                value="notes" 
                className="learning-tab-trigger data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/30 data-[state=active]:to-blue-500/30 data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/50 flex items-center gap-2"
              >
                <FileText className="h-4 w-4 learning-icon" />
                <span className="hidden sm:inline font-semibold">Notes</span>
              </TabsTrigger>
              <TabsTrigger 
                value="schedule" 
                className="learning-tab-trigger data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/30 data-[state=active]:to-blue-500/30 data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/50 flex items-center gap-2"
              >
                <Calendar className="h-4 w-4 learning-icon" />
                <span className="hidden sm:inline font-semibold">Schedule</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Content - Premium Panels */}
          <TabsContent value="sources">
            <div className="learning-panel p-8 animate-fade-in">
              <div className="text-center space-y-6">
                <div className="relative inline-block">
                  <BookOpen className="h-16 w-16 mx-auto text-white learning-icon animate-pulse" 
                    style={{ filter: 'drop-shadow(0 0 20px rgba(139, 92, 246, 0.8))' }} 
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-bold font-sora bg-gradient-to-r from-purple-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent mb-3">
                    Learning Sources
                  </h3>
                  <p className="text-sm text-slate-300 mb-6 max-w-md mx-auto">
                    Add courses, books, PDFs, and other learning materials to track your progress
                  </p>
                </div>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setSourcesDrawerOpen(true)}
                    className="btn-primary px-8 py-3 text-base font-semibold shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 transition-all"
                  >
                    Manage Sources
                  </button>
                </div>
                {sources && sources.length > 0 && (
                  <div className="mt-8 text-center">
                    <div className="inline-block px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-400/40">
                      <p className="text-sm text-emerald-300 font-semibold">
                        {sources.length} {sources.length === 1 ? 'source' : 'sources'} added
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="goals">
            <div className="learning-panel p-6 animate-fade-in">
              <GoalsSection />
            </div>
          </TabsContent>

          <TabsContent value="focus">
            <div className="learning-panel p-6 animate-fade-in">
              <LearningFocusMode />
            </div>
          </TabsContent>

          <TabsContent value="notes">
            <div className="learning-panel p-6 animate-fade-in">
              <NotesVault />
            </div>
          </TabsContent>

          <TabsContent value="schedule">
            <div className="learning-panel p-8 animate-fade-in">
              <div className="text-center space-y-6">
                <div className="relative inline-block">
                  <Calendar className="h-16 w-16 mx-auto text-white learning-icon animate-pulse" 
                    style={{ filter: 'drop-shadow(0 0 20px rgba(139, 92, 246, 0.8))' }} 
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-bold font-sora bg-gradient-to-r from-purple-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent mb-3">
                    Learning Schedule
                  </h3>
                  <p className="text-sm text-slate-300 mb-6 max-w-md mx-auto">
                    Set up your study reminders and get notifications for your learning sessions
                  </p>
                </div>
                <button
                  onClick={() => setScheduleDrawerOpen(true)}
                  className="btn-primary px-8 py-3 text-base font-semibold shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 transition-all"
                >
                  Configure Schedule
                </button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Drawers */}
      <SourcesDrawer open={sourcesDrawerOpen} onOpenChange={setSourcesDrawerOpen} />
      <LearningScheduleDrawer open={scheduleDrawerOpen} onOpenChange={setScheduleDrawerOpen} />

      {/* Generate Learning Plan Dialog */}
      <Dialog open={learningPlanOpen} onOpenChange={setLearningPlanOpen}>
        <DialogContent className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border-purple-500/30 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold font-sora bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-cyan-400" />
              Generate Learning Plan with AI
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-semibold text-slate-300 mb-2 block">
                Describe your learning goals and interests
              </label>
              <Textarea
                value={learningPrompt}
                onChange={(e) => setLearningPrompt(e.target.value)}
                placeholder="e.g., I want to learn web development, focusing on React and TypeScript. I have 2 hours per day and want to build a portfolio website..."
                className="min-h-[200px] bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500"
                disabled={generatingPlan}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setLearningPlanOpen(false)}
                disabled={generatingPlan}
                className="border-slate-700 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleGeneratePlan}
                disabled={generatingPlan}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold shadow-lg shadow-purple-500/50"
              >
                {generatingPlan ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Plan
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Daily Goals Dialog */}
      <Dialog open={dailyGoalsOpen} onOpenChange={setDailyGoalsOpen}>
        <DialogContent className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border-purple-500/30 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold font-sora bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
              <Target className="h-6 w-6 text-purple-400" />
              Today's Daily Goals
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {dailyGoals.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-16 w-16 mx-auto text-slate-600 mb-4" />
                <p className="text-slate-400 mb-4">No daily goals yet. Create some goals to get started!</p>
                <Button
                  onClick={() => {
                    setDailyGoalsOpen(false);
                    // Navigate to Goals tab
                    const goalsTab = document.querySelector('[value="goals"]') as HTMLElement;
                    goalsTab?.click();
                  }}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                >
                  Create Goals
                </Button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {dailyGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className="learning-panel p-4 hover:border-purple-500/50 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white mb-1">{goal.title}</h4>
                        {goal.description && (
                          <p className="text-sm text-slate-400 mb-2">{goal.description}</p>
                        )}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-800/50 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                              style={{
                                width: `${Math.min(100, (goal.current_value / goal.target_value) * 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                            {goal.current_value}/{goal.target_value}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LearningMode;
