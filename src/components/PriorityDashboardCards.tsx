import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Coins, Trophy } from "lucide-react";
import { useFocusSessions } from "@/hooks/useFocusSessions";
import { useFocusStreaks } from "@/hooks/useFocusStreaks";
import { useTokens } from "@/hooks/useTokens";

interface PriorityDashboardCardsProps {
  onShowRecoveryDashboard: () => void;
}

const PriorityDashboardCards = ({ onShowRecoveryDashboard }: PriorityDashboardCardsProps) => {
  const { focusScore } = useFocusSessions();
  const { currentStreak } = useFocusStreaks();
  const { balance } = useTokens();

  // Calculate today's earnings (mock for now - could be tracked in a separate table)
  const todayEarnings = 47;

  return (
    <div className="w-full mb-6">
      {/* Priority Cards - Mobile first layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        {/* Focus Score Card - Primary emphasis */}
        <Card className="glass-card glass-card--primary">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="metric-icon metric-icon--focus">
                <TrendingUp className="metric-icon__glyph" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="card-title">Focus Score</h3>
                  <button
                    onClick={onShowRecoveryDashboard}
                    className="btn-primary text-xs px-3 py-1.5"
                  >
                    Schedule
                  </button>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="card-main bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                    {focusScore}%
                  </span>
                  <span className="text-sm text-green-400 font-semibold">
                    +3%
                  </span>
                </div>
                <p className="card-label mt-1">
                  {currentStreak > 0 ? `🔥 ${currentStreak} day streak` : "↗ Improving"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* UCT Tokens Card */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="metric-icon metric-icon--tokens">
                <Coins className="metric-icon__glyph" />
              </div>
              <div className="flex-1">
                <h3 className="card-title">UCT Tokens Earned</h3>
                <p className="card-main">{balance.toLocaleString()}</p>
                <p className="card-label mt-1">+{todayEarnings} today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Community Ranking Card */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="metric-icon metric-icon--community">
                <Trophy className="metric-icon__glyph" />
              </div>
              <div className="flex-1">
                <h3 className="card-title">Community Ranking</h3>
                <p className="card-main">Top {Math.ceil((100 - focusScore) / 5)}%</p>
                <p className="card-label mt-1">↗ {currentStreak > 0 ? `+${currentStreak}% this week` : '+2% this week'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PriorityDashboardCards;