import { useNavigate } from "react-router-dom";
import { ArrowLeft, Coins, TrendingUp, Award, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useTokens } from "@/hooks/useTokens";

const UCTTokens = () => {
  const navigate = useNavigate();
  const { balance, isLoading } = useTokens();

  const earningSources = [
    { icon: Zap, label: "Focus Sessions", tokens: 0, color: "from-purple-500 to-blue-500" },
    { icon: Award, label: "Learning Streaks", tokens: 0, color: "from-cyan-500 to-teal-500" },
    { icon: TrendingUp, label: "Health Habits", tokens: 0, color: "from-green-500 to-emerald-500" },
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
          <div className="metric-icon metric-icon--tokens">
            <Coins className="metric-icon__glyph" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">UCT Tokens Earned</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Central wallet for all gamified activity
            </p>
          </div>
        </div>
      </div>

      {/* Total Balance */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="glass-card--primary">
          <div className="text-center py-8">
            <div className="text-sm text-muted-foreground mb-2">Total Balance</div>
            <div className="text-5xl font-bold mb-2">
              {isLoading ? "..." : balance?.toLocaleString() || "0"}
            </div>
            <div className="text-sm text-muted-foreground">UCT Tokens</div>
          </div>
        </div>
      </div>

      {/* Earning Sources */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <h2 className="section-title mb-4">Earning Sources</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {earningSources.map((source, idx) => {
            const Icon = source.icon;
            return (
              <Card key={idx} className="glass-card">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${source.color} flex items-center justify-center`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{source.tokens}</div>
                    <div className="text-sm text-muted-foreground">{source.label}</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="glass-card">
          <div className="text-center py-8">
            <Coins className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Earn UCT Tokens</h3>
            <p className="text-muted-foreground max-w-md mx-auto text-sm">
              Complete focus sessions, maintain learning streaks, build healthy habits, and contribute to the community to earn rewards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UCTTokens;
