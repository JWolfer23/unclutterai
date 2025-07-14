import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Coins, Trophy, TrendingUp, Gift, CreditCard, ArrowRightLeft } from "lucide-react";

const UCTRewards = () => {
  // Mock data - replace with real data later
  const tokenBalance = 2847;
  const earningStreak = 12;
  const nextMilestone = 3000;
  const progress = (tokenBalance / nextMilestone) * 100;

  const earningActivities = [
    { name: "Focus Sessions Completed", earned: 450, icon: Trophy, color: "bg-blue-500" },
    { name: "Messages Caught Up On", earned: 820, icon: TrendingUp, color: "bg-green-500" },
    { name: "Distraction Reduction", earned: 680, icon: Coins, color: "bg-purple-500" },
    { name: "Data Contributions", earned: 897, icon: Gift, color: "bg-orange-500" },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Balance Overview */}
      <Card className="animate-fade-in">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-500" />
            UCT Balance
          </CardTitle>
          <CardDescription>UnclutterAI Token rewards</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{tokenBalance.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">UCT Tokens</div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress to next milestone</span>
              <span>{nextMilestone.toLocaleString()} UCT</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="flex items-center justify-center gap-2 p-3 bg-accent rounded-lg">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">{earningStreak} day earning streak!</span>
          </div>
        </CardContent>
      </Card>

      {/* Earning Activities */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle>Earning Breakdown</CardTitle>
          <CardDescription>How you've earned your tokens</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {earningActivities.map((activity) => (
              <div key={activity.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${activity.color} bg-opacity-20`}>
                    <activity.icon className="h-4 w-4" style={{ color: activity.color.replace('bg-', '').replace('-500', '') }} />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{activity.name}</div>
                    <div className="text-xs text-muted-foreground">+{activity.earned} UCT</div>
                  </div>
                </div>
                <Badge variant="secondary">{activity.earned}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Use Cases */}
      <Card className="md:col-span-2 animate-fade-in">
        <CardHeader>
          <CardTitle>Use Your Tokens</CardTitle>
          <CardDescription>Redeem, gift, or trade your UCT tokens</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button className="h-auto p-4 flex flex-col items-center gap-2">
              <CreditCard className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Redeem for Premium</div>
                <div className="text-xs text-muted-foreground">1000 UCT = 1 month</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Gift className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Send as Gift</div>
                <div className="text-xs text-muted-foreground">Share with friends</div>
              </div>
            </Button>
            
            <Button variant="outline" disabled className="h-auto p-4 flex flex-col items-center gap-2 opacity-50">
              <ArrowRightLeft className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Swap</div>
                <div className="text-xs text-muted-foreground">Coming soon</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UCTRewards;