import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  Brain, 
  Zap, 
  Target,
  Users,
  Clock,
  CheckSquare
} from "lucide-react";
import { BetaIndicator } from "@/components/beta";
import { BETA_PHRASES } from "@/lib/betaMessaging";

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
      <Card className="glass-card bg-gradient-to-br from-purple-500/10 to-indigo-500/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <span>AI Assistant</span>
            </div>
            <BetaIndicator variant="badge" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
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
      <Card className="glass-card">
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

      {/* AI Status - Beta Training Indicator */}
      <Card className="glass-card bg-gradient-to-br from-primary/5 to-primary/10 border-primary/10">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-primary/60 rounded-full animate-pulse"></div>
            <div>
              <p className="text-sm font-medium text-foreground/80">{BETA_PHRASES.training.primary}</p>
              <p className="text-xs text-muted-foreground">{BETA_PHRASES.training.secondary}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIAssistant;
