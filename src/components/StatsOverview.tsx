
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Mail, 
  MessageSquare, 
  Phone, 
  CheckSquare, 
  Clock,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";

const StatsOverview = () => {
  const stats = [
    {
      label: "Unread",
      value: "24",
      icon: <Mail className="w-4 h-4" />,
      change: "+12%",
      trend: "up",
      color: "text-purple-600"
    },
    {
      label: "Tasks",
      value: "8",
      icon: <CheckSquare className="w-4 h-4" />,
      change: "+5",
      trend: "up",
      color: "text-green-600"
    },
    {
      label: "Avg Response",
      value: "2.3h",
      icon: <Clock className="w-4 h-4" />,
      change: "-15%",
      trend: "down",
      color: "text-orange-600"
    },
    {
      label: "Focus Score",
      value: "87%",
      icon: <TrendingUp className="w-4 h-4" />,
      change: "0%",
      trend: "neutral",
      color: "text-indigo-600"
    }
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-3 h-3 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-3 h-3 text-red-600" />;
      default:
        return <Minus className="w-3 h-3 text-gray-400" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur-md border-white/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.map((stat, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center ${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
            <div className={`flex items-center space-x-1 text-xs ${getTrendColor(stat.trend)}`}>
              {getTrendIcon(stat.trend)}
              <span>{stat.change}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default StatsOverview;
