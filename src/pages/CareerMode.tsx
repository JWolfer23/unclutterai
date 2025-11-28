import { useNavigate } from "react-router-dom";
import { ArrowLeft, Briefcase, Target, TrendingUp, FileText, Compass, Lightbulb, Search, BookOpen, Sparkles, Rocket } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

const CareerMode = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("map");

  const topMetrics = [
    {
      icon: Compass,
      label: "Career Vision",
      value: "Product Designer",
      sublabel: "Your chosen path",
      gradient: "from-blue-500 via-cyan-400 to-blue-600"
    },
    {
      icon: Target,
      label: "Active Applications",
      value: "0",
      sublabel: "In progress",
      gradient: "from-amber-500 via-yellow-400 to-amber-600"
    },
    {
      icon: TrendingUp,
      label: "Skill Growth",
      value: "0",
      sublabel: "From Learning Mode",
      gradient: "from-emerald-500 via-teal-400 to-emerald-600"
    },
    {
      icon: Rocket,
      label: "Next Milestone",
      value: "Not set",
      sublabel: "Define your goal",
      gradient: "from-violet-500 via-purple-400 to-violet-600"
    }
  ];

  return (
    <div className="min-h-screen bg-transparent text-white pb-12">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </button>

        <div className="flex items-center gap-4 mb-3">
          <div className="learning-icon">
            <Briefcase className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-4xl font-sora font-bold bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
              Career Mode
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              Your path, powered by AI — clarity, growth, and momentum
            </p>
          </div>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {topMetrics.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <div key={idx} className="learning-stat-card group cursor-pointer">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${metric.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-1">
                  {metric.value}
                </div>
                <div className="text-sm font-medium text-slate-200">{metric.label}</div>
                <div className="text-xs text-slate-400 mt-0.5">{metric.sublabel}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="learning-tabs">
            <TabsTrigger value="map" className="learning-tab-trigger">
              <Compass className="h-4 w-4" />
              Career Map
            </TabsTrigger>
            <TabsTrigger value="resume" className="learning-tab-trigger">
              <FileText className="h-4 w-4" />
              Resume Toolkit
            </TabsTrigger>
            <TabsTrigger value="skills" className="learning-tab-trigger">
              <Lightbulb className="h-4 w-4" />
              Skill Up
            </TabsTrigger>
            <TabsTrigger value="jobs" className="learning-tab-trigger">
              <Search className="h-4 w-4" />
              Job Hunt
            </TabsTrigger>
            <TabsTrigger value="wisdom" className="learning-tab-trigger">
              <BookOpen className="h-4 w-4" />
              Career Wisdom
            </TabsTrigger>
          </TabsList>

          {/* Career Map Tab */}
          <TabsContent value="map" className="learning-panel animate-fade-in">
            <div className="space-y-6">
              <div className="flex items-start gap-3 mb-6">
                <div className="learning-icon">
                  <Compass className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-sora font-semibold text-white mb-1">
                    Your Career Roadmap
                  </h3>
                  <p className="text-sm text-slate-300">
                    Visual path from where you are → where you're going
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-blue-500/10 border border-blue-400/30 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-blue-300" />
                  <h4 className="font-semibold text-blue-200">Career Clarity Generator</h4>
                </div>
                <p className="text-sm text-slate-300 mb-4">
                  Based on your strengths, experiences, and goals — here are 3 optimized paths. Tap to explore each one in detail.
                </p>
                <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl text-sm font-medium transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25">
                  Generate Career Paths
                </button>
              </div>

              <div className="text-center py-8 text-slate-400">
                <p className="text-sm italic">"Keep going. You're 3 steps away from your next breakthrough."</p>
              </div>
            </div>
          </TabsContent>

          {/* Resume Toolkit Tab */}
          <TabsContent value="resume" className="learning-panel animate-fade-in">
            <div className="space-y-6">
              <div className="flex items-start gap-3 mb-6">
                <div className="learning-icon">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-sora font-semibold text-white mb-1">
                    Smart Resume Builder
                  </h3>
                  <p className="text-sm text-slate-300">
                    Generate and edit resumes, cover letters, and portfolio blurbs
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-5 hover:border-blue-400/40 transition-colors cursor-pointer">
                  <FileText className="h-8 w-8 text-blue-400 mb-3" />
                  <h4 className="font-semibold text-white mb-2">Resume Generator</h4>
                  <p className="text-sm text-slate-400">
                    Pulls from LinkedIn, PDFs, or raw job history. Customize tone: concise, creative, executive.
                  </p>
                </div>

                <div className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-5 hover:border-amber-400/40 transition-colors cursor-pointer">
                  <Sparkles className="h-8 w-8 text-amber-400 mb-3" />
                  <h4 className="font-semibold text-white mb-2">Cover Letter AI</h4>
                  <p className="text-sm text-slate-400">
                    Uses job link, resume, and tone preference. "Make it punchy and ambitious."
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-amber-500/10 border border-amber-400/30 rounded-2xl p-6">
                <p className="text-sm text-slate-300 text-center">
                  💡 Upload your existing resume or LinkedIn profile to get started with AI-powered optimization
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Skill Up Tab */}
          <TabsContent value="skills" className="learning-panel animate-fade-in">
            <div className="space-y-6">
              <div className="flex items-start gap-3 mb-6">
                <div className="learning-icon">
                  <Lightbulb className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-sora font-semibold text-white mb-1">
                    Skill Growth Tracker
                  </h3>
                  <p className="text-sm text-slate-300">
                    AI-linked to Learning Mode — highlight what to learn to move forward
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-emerald-500/10 border border-emerald-400/30 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-emerald-300" />
                  <h4 className="font-semibold text-emerald-200">Skills from Learning Mode</h4>
                </div>
                <p className="text-sm text-slate-300 mb-4">
                  Your learning sources and goals automatically sync here. See which skills are growing and what's recommended next.
                </p>
                <div className="text-sm text-slate-400 text-center py-4">
                  📚 Complete learning goals in Learning Mode to track skill growth here
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Job Hunt Tab */}
          <TabsContent value="jobs" className="learning-panel animate-fade-in">
            <div className="space-y-6">
              <div className="flex items-start gap-3 mb-6">
                <div className="learning-icon">
                  <Search className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-sora font-semibold text-white mb-1">
                    Job Tracker
                  </h3>
                  <p className="text-sm text-slate-300">
                    Integrated search with filters + prompt-based smart suggestions
                  </p>
                </div>
              </div>

              <div className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-5">
                <h4 className="font-semibold text-white mb-4">Active Applications</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-500/5 border border-blue-400/20 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-white">Status Tracking</p>
                      <p className="text-xs text-slate-400">Applied • Interviewed • Ghosted</p>
                    </div>
                    <Target className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-amber-500/5 border border-amber-400/20 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-white">Follow-Up Reminders</p>
                      <p className="text-xs text-slate-400">AI reminds you to check in or reflect</p>
                    </div>
                    <Sparkles className="h-5 w-5 text-amber-400" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-emerald-500/5 border border-emerald-400/20 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-white">Notes per Opportunity</p>
                      <p className="text-xs text-slate-400">Track insights and next steps</p>
                    </div>
                    <FileText className="h-5 w-5 text-emerald-400" />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Career Wisdom Tab */}
          <TabsContent value="wisdom" className="learning-panel animate-fade-in">
            <div className="space-y-6">
              <div className="flex items-start gap-3 mb-6">
                <div className="learning-icon">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-sora font-semibold text-white mb-1">
                    Career Strategies
                  </h3>
                  <p className="text-sm text-slate-300">
                    Curated career strategies, salary guides, and growth hacks by goal
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-400/30 rounded-xl p-5">
                  <Rocket className="h-8 w-8 text-violet-400 mb-3" />
                  <h4 className="font-semibold text-white mb-2">Growth Hacks</h4>
                  <p className="text-sm text-slate-400">
                    Proven tactics to accelerate your career trajectory
                  </p>
                </div>

                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-400/30 rounded-xl p-5">
                  <Target className="h-8 w-8 text-blue-400 mb-3" />
                  <h4 className="font-semibold text-white mb-2">Salary Guides</h4>
                  <p className="text-sm text-slate-400">
                    Market rates and negotiation strategies by role
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-amber-500/10 border border-amber-400/30 rounded-2xl p-6 text-center">
                <p className="text-sm text-slate-300 italic">
                  "Career Mode turns stress into structure. It shows you what to do next."
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CareerMode;
