import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Coins, 
  TrendingUp, 
  Timer,
  Trophy,
  Plus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface TokenStats {
  balance: number;
  todayEarned: number;
  weeklyEarned: number;
  rank: string;
}

interface TokenTransaction {
  id: string;
  amount: number;
  type: 'earned' | 'redeemed';
  source: string;
  timestamp: string;
}

export default function TokenBalance() {
  const { user } = useAuth();
  const [stats, setStats] = useState<TokenStats>({
    balance: 0,
    todayEarned: 0,
    weeklyEarned: 0,
    rank: 'Beginner'
  });
  const [recentTransactions, setRecentTransactions] = useState<TokenTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchTokenData = async () => {
      try {
        // Get current balance from profile or tokens table
        const { data: profile } = await supabase
          .from('profiles')
          .select('preferences')
          .eq('id', user.id)
          .single();

        // Get token balance from tokens table
        const { data: tokenData } = await supabase
          .from('tokens')
          .select('balance')
          .eq('user_id', user.id)
          .single();

        // Get recent token transactions (mock data for MVP)
        const mockTransactions: TokenTransaction[] = [
          {
            id: '1',
            amount: 25,
            type: 'earned',
            source: 'Focus Session (2h)',
            timestamp: new Date().toISOString()
          },
          {
            id: '2',
            amount: 15,
            type: 'earned',
            source: 'Message Summary',
            timestamp: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: '3',
            amount: 50,
            type: 'redeemed',
            source: 'Premium Features',
            timestamp: new Date(Date.now() - 7200000).toISOString()
          }
        ];

        const balance = tokenData?.balance || 0;
        
        // Calculate earnings (mock calculations for MVP)
        const todayEarned = 40;
        const weeklyEarned = 280;
        
        // Determine rank based on balance
        let rank = 'Beginner';
        if (balance >= 10000) rank = 'Expert';
        else if (balance >= 5000) rank = 'Advanced';
        else if (balance >= 1000) rank = 'Intermediate';

        setStats({
          balance,
          todayEarned,
          weeklyEarned,
          rank
        });
        
        setRecentTransactions(mockTransactions);
      } catch (error) {
        console.error('Error fetching token data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokenData();
  }, [user]);

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'Expert':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'Advanced':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Intermediate':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-8 bg-muted rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Balance Card */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-token-primary" />
            UCT Token Balance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Balance */}
          <div className="text-center">
            <div className="text-4xl font-bold text-token-primary mb-2">
              {stats.balance.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">UCT Tokens</div>
            <Badge className={`mt-2 ${getRankColor(stats.rank)}`}>
              <Trophy className="w-3 h-3 mr-1" />
              {stats.rank}
            </Badge>
          </div>

          {/* Earnings Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Plus className="w-4 h-4 text-green-400" />
                <span className="text-xs text-muted-foreground">Today</span>
              </div>
              <div className="text-lg font-semibold text-green-400">+{stats.todayEarned}</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-muted-foreground">This Week</span>
              </div>
              <div className="text-lg font-semibold text-blue-400">+{stats.weeklyEarned}</div>
            </div>
          </div>

          {/* Earning Methods */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Earn More Tokens</h4>
            <div className="grid gap-2">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-primary" />
                  <span className="text-sm">Focus Sessions</span>
                </div>
                <span className="text-sm text-primary font-medium">+25 UCT/hour</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-primary" />
                  <span className="text-sm">Message Summaries</span>
                </div>
                <span className="text-sm text-primary font-medium">+15 UCT each</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Coins className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No transactions yet</p>
              </div>
            ) : (
              recentTransactions.map((transaction) => (
                <div 
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      transaction.type === 'earned' 
                        ? 'bg-green-500/20' 
                        : 'bg-red-500/20'
                    }`}>
                      {transaction.type === 'earned' ? (
                        <Plus className="w-4 h-4 text-green-400" />
                      ) : (
                        <Coins className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{transaction.source}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimeAgo(transaction.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className={`font-semibold ${
                    transaction.type === 'earned' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {transaction.type === 'earned' ? '+' : '-'}{transaction.amount}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}