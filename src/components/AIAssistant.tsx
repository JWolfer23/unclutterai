
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
      {/* AI Insights */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span>AI Assistant</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                  {suggestion.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 text-sm">{suggestion.title}</h4>
                  <p className="text-xs text-gray-600 mt-1">{suggestion.description}</p>
                  <Button size="sm" variant="ghost" className="h-7 px-2 mt-2 text-xs">
                    {suggestion.action}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-white/80 backdrop-blur-md border-white/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {quickActions.map((action, index) => (
            <Button 
              key={index}
              variant="ghost" 
              className="w-full justify-start h-10 text-sm"
            >
              {action.icon}
              <span className="ml-2">{action.label}</span>
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* AI Status */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200/50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <div>
              <p className="text-sm font-medium text-green-800">AI is Learning</p>
              <p className="text-xs text-green-600">Processing 23 new messages...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIAssistant;
