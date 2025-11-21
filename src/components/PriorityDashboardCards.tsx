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
      <div className="flex flex-col md:flex-row gap-4 w-full">
        {/* Focus Score Card - Primary emphasis */}
        <Card className="glass-card glass-card--primary flex-1">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="card-title">Focus Score</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onShowRecoveryDashboard}
                    className="ml-2 h-7 px-3 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-white/5"
                  >
                    Schedule
                  </Button>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="card-main bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                    {focusScore}%
                  </span>
                  <span className="text-sm text-green-400">
                    +3%
                  </span>
                </div>
                <p className="card-label">
                  {currentStreak > 0 ? `🔥 ${currentStreak} day streak` : "↗ Improving"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* UCT Tokens Card */}
        <Card className="glass-card flex-1">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center">
                <Coins className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="card-title">UCT Tokens Earned</h3>
                <p className="card-main">{balance.toLocaleString()}</p>
                <p className="card-label">+{todayEarnings} today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Community Ranking Card */}
        <Card className="glass-card flex-1">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="card-title">Community Ranking</h3>
                <p className="card-main">Top {Math.ceil((100 - focusScore) / 5)}%</p>
                <p className="card-label">↗ {currentStreak > 0 ? `+${currentStreak}% this week` : '+2% this week'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PriorityDashboardCards;