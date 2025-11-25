import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Coins, Trophy } from "lucide-react";
import { useFocusSessions } from "@/hooks/useFocusSessions";
import { useFocusStreaks } from "@/hooks/useFocusStreaks";
import { useTokens } from "@/hooks/useTokens";
import { dashboardCard, cardHover, fadeInUp } from "@/ui/styles";

interface PriorityDashboardCardsProps {
  onShowRecoveryDashboard: () => void;
}

const PriorityDashboardCards = ({
  onShowRecoveryDashboard,
}: PriorityDashboardCardsProps) => {
  const { focusScore } = useFocusSessions();
  const { currentStreak } = useFocusStreaks();
  const { balance } = useTokens();

  // TODO: wire this to real data when ready
  const todayEarnings = 47;

  const communityPercent = Math.max(
    1,
    Math.min(99, Math.ceil((100 - focusScore) / 5))
  );

  return (
    <div className="w-full mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        {/* Focus Score Card - Primary emphasis */}
        <Card
          className={`${dashboardCard} ${cardHover} ${fadeInUp} md:col-span-1`}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              {/* Icon block */}
              <div className="metric-icon metric-icon--focus">
                <TrendingUp className="metric-icon__glyph" />
              </div>

              {/* Text block */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2 gap-3">
                  <h3 className="card-title">Focus Score</h3>
                  <Button
                    size="sm"
                    onClick={onShowRecoveryDashboard}
                    className="btn-primary text-[11px] px-3 py-1.5"
                  >
                    Schedule
                  </Button>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="card-main bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {focusScore}%
                  </span>
                  <span className="text-sm text-purple-400 font-semibold">
                    +3%
                  </span>
                </div>

                <p className="card-label mt-1">
                  {currentStreak > 0
                    ? `🔥 ${currentStreak} day streak`
                    : "↗ Improving"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* UCT Tokens Card */}
        <Card className={`${dashboardCard} ${cardHover} ${fadeInUp}`}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="metric-icon metric-icon--tokens">
                <Coins className="metric-icon__glyph" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="card-title">UCT Tokens Earned</h3>
                <p className="card-main">
                  {balance.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="card-label mt-1">+{todayEarnings} today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Community Ranking Card */}
        <Card className={`${dashboardCard} ${cardHover} ${fadeInUp}`}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="metric-icon metric-icon--community">
                <Trophy className="metric-icon__glyph" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="card-title">Community Ranking</h3>
                <p className="card-main">Top {communityPercent}%</p>
                <p className="card-label mt-1">
                  ↗{" "}
                  {currentStreak > 0
                    ? `+${currentStreak}% this week`
                    : "+2% this week"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PriorityDashboardCards;
