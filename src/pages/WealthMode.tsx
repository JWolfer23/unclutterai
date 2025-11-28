import { useNavigate } from "react-router-dom";
import { ArrowLeft, DollarSign, TrendingUp, PiggyBank, Wallet, Target, BookOpen, Newspaper, BarChart3, Sparkles, ArrowUpRight, Link } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

const WealthMode = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Top metric tiles
  const wealthMetrics = [
    { 
      icon: Wallet, 
      label: "Net Worth", 
      value: "$0", 
      subtext: "Manual tracking",
      gradient: "from-emerald-400 to-cyan-400" 
    },
    { 
      icon: Target, 
      label: "Savings Goal", 
      value: "0%", 
      subtext: "No goals set",
      gradient: "from-blue-400 to-purple-400" 
    },
    { 
      icon: TrendingUp, 
      label: "Monthly Cash Flow", 
      value: "$0", 
      subtext: "Income - Expenses",
      gradient: "from-violet-400 to-pink-400" 
    },
    { 
      icon: Sparkles, 
      label: "Wealth Clarity Score", 
      value: "—", 
      subtext: "AI financial health",
      gradient: "from-amber-400 to-orange-400" 
    },
  ];

  return (
    <div className="min-h-screen bg-transparent text-white pb-12">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </button>

        <div className="flex items-center gap-4 mb-8 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center border border-emerald-400/30 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <DollarSign className="h-8 w-8 learning-icon" />
          </div>
          <div>
            <h1 className="text-4xl font-bold font-sora bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Wealth Mode
            </h1>
            <p className="text-slate-300 text-base mt-1">
              Financial clarity for the AI age
            </p>
          </div>
        </div>
      </div>

      {/* Top Metrics Tiles */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
          {wealthMetrics.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <div 
                key={idx} 
                className="learning-stat-card group hover:scale-[1.02] transition-all duration-300"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex flex-col gap-3">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${metric.gradient} flex items-center justify-center shadow-lg`}>
                    <Icon className="h-7 w-7 text-white learning-icon" />
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-white mb-1 group-hover:scale-105 transition-transform">{metric.value}</div>
                    <div className="text-sm font-medium text-slate-200">{metric.label}</div>
                    <div className="text-xs text-slate-400 mt-1">{metric.subtext}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="learning-tabs w-full justify-start overflow-x-auto">
            <TabsTrigger value="dashboard" className="learning-tab-trigger flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="goals" className="learning-tab-trigger flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span>Goals</span>
            </TabsTrigger>
            <TabsTrigger value="learn" className="learning-tab-trigger flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>Learn</span>
            </TabsTrigger>
            <TabsTrigger value="market" className="learning-tab-trigger flex items-center gap-2">
              <Newspaper className="h-4 w-4" />
              <span>Market Pulse</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="mt-6">
            <div className="learning-panel p-8 text-center animate-fade-in">
              <BarChart3 className="h-16 w-16 mx-auto mb-6 learning-icon" />
              <h3 className="text-2xl font-bold font-sora mb-3 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Financial Dashboard
              </h3>
              <p className="text-slate-300 mb-6 max-w-md mx-auto">
                Clean overview of your net worth, goals, and financial trends
              </p>
              <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-2xl p-4 max-w-lg mx-auto">
                <p className="text-emerald-200 text-sm">
                  💡 <strong>AI Insight:</strong> "You saved $420 this week — 84% of your weekly goal. Keep it up!"
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals" className="mt-6">
            <div className="learning-panel p-8 text-center animate-fade-in">
              <Target className="h-16 w-16 mx-auto mb-6 learning-icon" />
              <h3 className="text-2xl font-bold font-sora mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Financial Goals
              </h3>
              <p className="text-slate-300 mb-6 max-w-md mx-auto">
                Set and track goals: save $10k, pay off debt, invest $1k/month
              </p>
              <div className="space-y-4 max-w-lg mx-auto">
                <div className="bg-purple-500/10 border border-purple-400/30 rounded-2xl p-4 text-left">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-purple-200 font-semibold">Save $10,000</span>
                    <span className="text-purple-300 text-sm">0%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-400 to-purple-400 w-0"></div>
                  </div>
                  <p className="text-slate-400 text-xs mt-2">Link to Focus Mode for savings habits</p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Learn Tab */}
          <TabsContent value="learn" className="mt-6">
            <div className="learning-panel p-8 text-center animate-fade-in">
              <BookOpen className="h-16 w-16 mx-auto mb-6 learning-icon" />
              <h3 className="text-2xl font-bold font-sora mb-3 bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                Financial Education
              </h3>
              <p className="text-slate-300 mb-6 max-w-md mx-auto">
                Personalized modules on investing, saving, crypto, and budgeting
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                {['Investing Basics', 'Crypto 101', 'Smart Budgeting', 'Debt Management'].map((topic, idx) => (
                  <div key={idx} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-purple-400/40 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-violet-300" />
                      </div>
                      <div className="text-left">
                        <p className="text-white font-semibold text-sm">{topic}</p>
                        <p className="text-slate-400 text-xs">Coming soon</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Market Pulse Tab */}
          <TabsContent value="market" className="mt-6">
            <div className="learning-panel p-8 text-center animate-fade-in">
              <Newspaper className="h-16 w-16 mx-auto mb-6 learning-icon" />
              <h3 className="text-2xl font-bold font-sora mb-3 bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                Market Pulse
              </h3>
              <p className="text-slate-300 mb-6 max-w-md mx-auto">
                AI-curated financial news: crypto, S&P 500, macro trends
              </p>
              <div className="bg-amber-500/10 border border-amber-400/30 rounded-2xl p-5 max-w-lg mx-auto">
                <div className="flex items-start gap-3 mb-4">
                  <ArrowUpRight className="h-5 w-5 text-emerald-400 mt-1" />
                  <div className="text-left">
                    <p className="text-amber-200 font-semibold mb-1">📈 Markets Rally</p>
                    <p className="text-slate-300 text-sm">S&P 500 up 1.2%, Bitcoin crosses $45k</p>
                  </div>
                </div>
                <button className="w-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/40 text-amber-100 py-2 px-4 rounded-xl text-sm font-semibold hover:from-amber-500/30 hover:to-orange-500/30 transition-all">
                  Customize News Prompt
                </button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Integrations Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 text-center backdrop-blur-sm">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Link className="h-5 w-5 text-cyan-400" />
            <h4 className="text-white font-semibold">Connect Your Accounts</h4>
          </div>
          <p className="text-slate-400 text-sm mb-4">Sync with Plaid, Coinbase, banks, or enter manually</p>
          <button className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white py-2 px-6 rounded-xl text-sm font-semibold hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all">
            Coming Soon
          </button>
        </div>
      </div>
    </div>
  );
};

export default WealthMode;
