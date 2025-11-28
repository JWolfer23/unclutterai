import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, GraduationCap, BookOpen, Target, Award, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLearning } from "@/hooks/useLearning";
import { SourcesDrawer } from "@/components/learning/SourcesDrawer";
import { GoalsSection } from "@/components/learning/GoalsSection";
import { LearningFocusMode } from "@/components/learning/LearningFocusMode";
import { NotesVault } from "@/components/learning/NotesVault";
import { LearningScheduleDrawer } from "@/components/learning/LearningScheduleDrawer";

const LearningMode = () => {
  const navigate = useNavigate();
  const { sources, goals, notes, streak, isLoading } = useLearning();
  const [sourcesDrawerOpen, setSourcesDrawerOpen] = useState(false);
  const [scheduleDrawerOpen, setScheduleDrawerOpen] = useState(false);

  const activeTopics = sources?.filter((s) => s.is_active).length || 0;
  const activeMilestones = goals?.filter((g) => !g.is_completed).length || 0;
  const totalNotes = notes?.length || 0;

  const learningStats = [
    { icon: BookOpen, label: "Active Topics", value: activeTopics.toString(), color: "from-cyan-500 to-blue-500" },
    { icon: Target, label: "Active Goals", value: activeMilestones.toString(), color: "from-purple-500 to-pink-500" },
    { icon: Award, label: "Daily Streak", value: streak?.current_streak?.toString() || "0", color: "from-yellow-500 to-orange-500" },
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
          <div className="metric-icon" style={{ background: "linear-gradient(135deg, hsl(189, 94%, 60%), hsl(217, 91%, 60%))" }}>
            <GraduationCap className="metric-icon__glyph" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Learning Mode</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Track subjects, earn streaks, and grow daily
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {learningStats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Card key={idx} className="glass-card">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Main Content - Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <Tabs defaultValue="sources" className="w-full">
          <TabsList className="grid w-full grid-cols-5 glass-card mb-6">
            <TabsTrigger value="sources" className="text-xs sm:text-sm">
              📚 Sources
            </TabsTrigger>
            <TabsTrigger value="goals" className="text-xs sm:text-sm">
              🎯 Goals
            </TabsTrigger>
            <TabsTrigger value="focus" className="text-xs sm:text-sm">
              🧘 Focus
            </TabsTrigger>
            <TabsTrigger value="notes" className="text-xs sm:text-sm">
              📝 Notes
            </TabsTrigger>
            <TabsTrigger value="schedule" className="text-xs sm:text-sm">
              📅 Schedule
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sources">
            <Card className="glass-card p-6">
              <div className="text-center space-y-4">
                <BookOpen className="h-12 w-12 mx-auto text-purple-300" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Learning Sources</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    Add courses, books, PDFs, and other learning materials
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => setSourcesDrawerOpen(true)}
                    className="btn-primary"
                  >
                    Manage Sources
                  </button>
                </div>
                {sources && sources.length > 0 && (
                  <div className="mt-6 text-left">
                    <p className="text-sm text-slate-300 mb-2">Recent sources: {sources.length}</p>
                    <p className="text-xs text-slate-500">Click "Manage Sources" to view and edit all sources</p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="goals">
            <Card className="glass-card p-6">
              <GoalsSection />
            </Card>
          </TabsContent>

          <TabsContent value="focus">
            <Card className="glass-card p-6">
              <LearningFocusMode />
            </Card>
          </TabsContent>

          <TabsContent value="notes">
            <Card className="glass-card p-6">
              <NotesVault />
            </Card>
          </TabsContent>

          <TabsContent value="schedule">
            <Card className="glass-card p-6">
              <div className="text-center space-y-4">
                <Calendar className="h-12 w-12 mx-auto text-purple-300" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Learning Schedule</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    Set up your study reminders and notifications
                  </p>
                </div>
                <button
                  onClick={() => setScheduleDrawerOpen(true)}
                  className="btn-primary"
                >
                  Configure Schedule
                </button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Drawers */}
      <SourcesDrawer open={sourcesDrawerOpen} onOpenChange={setSourcesDrawerOpen} />
      <LearningScheduleDrawer open={scheduleDrawerOpen} onOpenChange={setScheduleDrawerOpen} />
    </div>
  );
};

export default LearningMode;