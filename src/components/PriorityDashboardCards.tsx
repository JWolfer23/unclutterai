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
        {/* Focus Score Card */}
        <Card className="glass-card flex-1 bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Focus Score</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onShowRecoveryDashboard}
                    className="ml-2 h-7 px-3 text-xs border-purple-300 text-purple-700 hover:bg-purple-100"
                  >
                    Schedule
                  </Button>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-purple-700">
                    {focusScore}%
                  </span>
                  <span className="text-sm text-gray-500">
                    +3%
                  </span>
                </div>
                <p className="text-xs text-purple-600 font-medium">
                  {currentStreak > 0 ? `🔥 ${currentStreak} day streak` : "↗ Improving"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* UCT Tokens Card */}
        <Card className="glass-card flex-1 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                <Coins className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">UCT Tokens Earned</h3>
                <p className="text-2xl font-bold text-amber-700">{balance.toLocaleString()}</p>
                <p className="text-xs text-amber-600 font-medium">+{todayEarnings} today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Community Ranking Card */}
        <Card className="glass-card flex-1 bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Community Ranking</h3>
                <p className="text-2xl font-bold text-emerald-700">Top {Math.ceil((100 - focusScore) / 5)}%</p>
                <p className="text-xs text-emerald-600 font-medium">↗ {currentStreak > 0 ? `+${currentStreak}% this week` : '+2% this week'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PriorityDashboardCards;