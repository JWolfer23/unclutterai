import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Brain, 
  Zap, 
  Target,
  TrendingUp,
  Users,
  Clock,
  CheckSquare
} from "lucide-react";

const AIAssistant = () => {
  const suggestions = [
    {
      type: "priority",
      icon: <Target className="w-4 h-4" />,
      title: "High Priority Detected",
      description: "3 urgent emails need immediate attention",
      action: "Review Now"
    },
    {
      type: "task",
      icon: <CheckSquare className="w-4 h-4" />,
      title: "8 Tasks Extracted",
      description: "AI found actionable items in your messages",
      action: "View Tasks"
    },
    {
      type: "insight",
      icon: <Brain className="w-4 h-4" />,
      title: "Communication Insight",
      description: "You respond 2x faster to internal emails",
      action: "Learn More"
    }
  ];

  const quickActions = [
    { label: "Summarize All", icon: <Sparkles className="w-4 h-4" /> },
    { label: "Draft Responses", icon: <Zap className="w-4 h-4" /> },
    { label: "Schedule Replies", icon: <Clock className="w-4 h-4" /> },
    { label: "Bulk Actions", icon: <Users className="w-4 h-4" /> }
  ];

  return (
    <div className="space-y-6">
      {/* Collapsed AI Assistant Summary */}
      <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">3 Urgent • 8 Tasks • Insight Available</p>
                <p className="text-xs text-gray-600">AI Assistant summary</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="text-xs">
              View Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Collapsed Quick Actions */}
      <Card className="bg-white/80 backdrop-blur-md border-white/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">Quick Actions</h3>
          </div>
          <div className="flex justify-between space-x-2">
            <Button variant="ghost" size="sm" className="text-xs flex-1">
              <Sparkles className="w-3 h-3 mr-1" />
              Summarize All
            </Button>
            <Button variant="ghost" size="sm" className="text-xs flex-1">
              <Zap className="w-3 h-3 mr-1" />
              Draft Responses
            </Button>
            <Button variant="ghost" size="sm" className="text-xs px-3">
              ⋯
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIAssistant;
