import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Coins, Trophy, Calendar } from "lucide-react";

interface DashboardCardsProps {
  onScheduleFocus?: () => void;
}

const DashboardCards = ({ onScheduleFocus }: DashboardCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Focus Score Card */}
      <Card className="shadow-card hover:shadow-card-hover transition-all duration-200 border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-purple/10">
              <Brain className="w-6 h-6 text-purple" />
            </div>
            <Button 
              size="sm" 
              variant="outline"
              onClick={onScheduleFocus}
              className="text-xs"
            >
              <Calendar className="w-3 h-3 mr-1" />
              Schedule
            </Button>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-muted-foreground">Focus Score</h3>
            <p className="text-3xl font-bold text-foreground">87%</p>
            <p className="text-xs text-muted-foreground">+5% from yesterday</p>
          </div>
        </CardContent>
      </Card>

      {/* UCT Tokens Card */}
      <Card className="shadow-card hover:shadow-card-hover transition-all duration-200 border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-orange/10">
              <Coins className="w-6 h-6 text-orange" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-muted-foreground">UCT Tokens Earned</h3>
            <p className="text-3xl font-bold text-foreground">1,247</p>
            <p className="text-xs text-green font-medium">+47 today</p>
          </div>
        </CardContent>
      </Card>

      {/* Community Ranking Card */}
      <Card className="shadow-card hover:shadow-card-hover transition-all duration-200 border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-green/10">
              <Trophy className="w-6 h-6 text-green" />
            </div>
            <div className="text-xs text-green font-medium">↑ +2%</div>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-muted-foreground">Community Ranking</h3>
            <p className="text-3xl font-bold text-foreground">Top 12%</p>
            <p className="text-xs text-muted-foreground">This week</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardCards;