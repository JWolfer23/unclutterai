import { useNavigate } from "react-router-dom";
import { ArrowLeft, GraduationCap, BookOpen, Target, Award } from "lucide-react";
import { Card } from "@/components/ui/card";

const LearningMode = () => {
  const navigate = useNavigate();

  const learningStats = [
    { icon: BookOpen, label: "Active Topics", value: "0", color: "from-cyan-500 to-blue-500" },
    { icon: Target, label: "Daily Streak", value: "0", color: "from-purple-500 to-pink-500" },
    { icon: Award, label: "Milestones", value: "0", color: "from-yellow-500 to-orange-500" },
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
          Back to modes
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="glass-card">
          <div className="text-center py-12">
            <GraduationCap className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Track your learning journey with AI-powered micro-lessons, subject tracking, and milestone rewards with UCT tokens.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningMode;
