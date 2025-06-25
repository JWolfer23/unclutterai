import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Mail, 
  MessageSquare, 
  Phone, 
  CheckSquare, 
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronRight,
  User,
  Twitter,
  Mic
} from "lucide-react";
import TasksSection from "./TasksSection";

interface StatsOverviewProps {
  onMessageTypeFilter?: (type: string | null) => void;
  onViewMessage?: (messageId: number) => void;
}

const StatsOverview = ({ onMessageTypeFilter, onViewMessage }: StatsOverviewProps) => {
  const [isUnreadExpanded, setIsUnreadExpanded] = useState(false);

  const unreadBreakdown = [
    {
      type: "text",
      label: "Text",
      count: 8,
      icon: <MessageSquare className="w-3 h-3" />,
      color: "text-blue-600"
    },
    {
      type: "email", 
      label: "Email",
      count: 12,
      icon: <Mail className="w-3 h-3" />,
      color: "text-purple-600"
    },
    {
      type: "social",
      label: "DMs",
      count: 3,
      icon: <User className="w-3 h-3" />,
      color: "text-green-600"
    },
    {
      type: "social",
      label: "Social Media", 
      count: 1,
      icon: <Twitter className="w-3 h-3" />,
      color: "text-indigo-600"
    },
    {
      type: "voice",
      label: "Voice Messages",
      count: 0,
      icon: <Mic className="w-3 h-3" />,
      color: "text-orange-600"
    }
  ];

  // Remove Focus Score from main stats array since it's now separate
  const stats = [
    {
      label: "Unread",
      value: "24",
      icon: <Mail className="w-4 h-4" />,
      change: "+12%",
      trend: "up",
      color: "text-purple-600",
      expandable: true
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

  const handleMessageTypeClick = (type: string) => {
    if (onMessageTypeFilter) {
      onMessageTypeFilter(type);
    }
  };

  const handleTaskComplete = (taskId: string) => {
    // This could be used to update message states or trigger other actions
    console.log(`Task ${taskId} completed`);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-md border-white/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats.map((stat, index) => (
            <div key={index}>
              <div 
                className={`flex items-center justify-between p-3 bg-gray-50/50 rounded-lg ${
                  stat.expandable ? 'cursor-pointer hover:bg-gray-100/50 transition-colors' : ''
                }`}
                onClick={stat.expandable ? () => setIsUnreadExpanded(!isUnreadExpanded) : undefined}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center ${stat.color}`}>
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 flex items-center space-x-1">
                      <span>{stat.label}</span>
                      {stat.expandable && (
                        <div className="transition-transform duration-200">
                          {isUnreadExpanded ? (
                            <ChevronDown className="w-3 h-3 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-gray-400" />
                          )}
                        </div>
                      )}
                    </p>
                    <p className="font-semibold text-gray-900">{stat.value}</p>
                  </div>
                </div>
                <div className={`flex items-center space-x-1 text-xs ${getTrendColor(stat.trend)}`}>
                  {getTrendIcon(stat.trend)}
                  <span>{stat.change}</span>
                </div>
              </div>
              
              {/* Expanded breakdown for Unread */}
              {stat.expandable && isUnreadExpanded && (
                <div className="mt-2 ml-4 space-y-2 animate-fade-in">
                  {unreadBreakdown.map((item, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-2 bg-white/60 rounded-md cursor-pointer hover:bg-purple-50/60 transition-colors group"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMessageTypeClick(item.type);
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <div className={`w-5 h-5 rounded-md bg-gray-50 flex items-center justify-center ${item.color} group-hover:bg-white transition-colors`}>
                          {item.icon}
                        </div>
                        <span className="text-xs text-gray-600">{item.label}</span>
                      </div>
                      <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full group-hover:bg-purple-100 transition-colors">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <TasksSection 
        onViewSource={onViewMessage || (() => {})}
        onTaskComplete={handleTaskComplete}
      />
    </div>
  );
};

export default StatsOverview;
