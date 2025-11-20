
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useAIAssistant } from "@/hooks/useAIAssistant";
import { useAIUsage } from "@/hooks/useAIUsage";
import { 
  CheckSquare, 
  ExternalLink, 
  Clock,
  Sparkles,
  Mail,
  MessageSquare,
  Twitter,
  Phone,
  Target
} from "lucide-react";

interface Task {
  id: string;
  summary: string;
  source: string;
  platform: string;
  timestamp: string;
  messageId: number;
  urgency: 'high' | 'medium' | 'low';
  completed: boolean;
}

interface TasksSectionProps {
  onViewSource: (messageId: number) => void;
  onTaskComplete: (taskId: string) => void;
}

const TasksSection = ({ onViewSource, onTaskComplete }: TasksSectionProps) => {
  const { scoreTask, isProcessing } = useAIAssistant();
  const { getUsageText, isLimitReached } = useAIUsage();
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "task-1",
      summary: "Schedule Q4 budget review meeting",
      source: "Sarah Chen",
      platform: "Gmail",
      timestamp: "2 hours ago",
      messageId: 1,
      urgency: "high",
      completed: false
    },
    {
      id: "task-2",
      summary: "Prepare Q4 reports for review",
      source: "Sarah Chen", 
      platform: "Gmail",
      timestamp: "2 hours ago",
      messageId: 1,
      urgency: "high",
      completed: false
    },
    {
      id: "task-3",
      summary: "Read AI breakthrough article",
      source: "TechCrunch",
      platform: "Twitter",
      timestamp: "6 hours ago",
      messageId: 3,
      urgency: "medium",
      completed: false
    },
    {
      id: "task-4",
      summary: "Share article with team",
      source: "TechCrunch",
      platform: "Twitter", 
      timestamp: "6 hours ago",
      messageId: 3,
      urgency: "medium",
      completed: false
    },
    {
      id: "task-5",
      summary: "Call mom back",
      source: "Mom",
      platform: "WhatsApp",
      timestamp: "1 day ago",
      messageId: 4,
      urgency: "low",
      completed: false
    }
  ]);

  const activeTasks = tasks.filter(task => !task.completed);

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'gmail':
        return <Mail className="w-3 h-3" />;
      case 'imessage':
        return <MessageSquare className="w-3 h-3" />;
      case 'twitter':
        return <Twitter className="w-3 h-3" />;
      case 'whatsapp':
        return <Phone className="w-3 h-3" />;
      default:
        return <MessageSquare className="w-3 h-3" />;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleTaskComplete = (taskId: string) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, completed: true } : task
      )
    );
    onTaskComplete(taskId);
  };

  const handleScoreTask = (taskId: string, summary: string) => {
    scoreTask({
      taskId,
      title: summary,
      description: summary
    });
  };

  const generateSummary = () => {
    const sortedTasks = activeTasks.sort((a, b) => {
      const urgencyOrder = { high: 3, medium: 2, low: 1 };
      return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
    });

    const summary = sortedTasks.map((task, index) => 
      `${index + 1}. ${task.summary} (${task.platform})`
    ).join('\n');

    alert(`Current Tasks Summary:\n\n${summary}`);
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-purple-600" />
            <span>Tasks</span>
            <Badge variant="secondary" className="text-xs">
              {activeTasks.length}
            </Badge>
          </CardTitle>
          <Button 
            size="sm" 
            variant="outline"
            onClick={generateSummary}
            className="text-xs"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Summarise All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeTasks.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <CheckSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No pending tasks</p>
          </div>
        ) : (
          activeTasks.map((task) => (
            <div 
              key={task.id}
              className="flex items-start space-x-3 p-3 bg-gray-50/50 rounded-lg hover:bg-gray-100/50 transition-colors"
            >
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => handleTaskComplete(task.id)}
                className="mt-0.5"
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {task.summary}
                  </p>
                  <Badge className={`text-xs ${getUrgencyColor(task.urgency)}`}>
                    {task.urgency}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-2 text-xs text-gray-600 mb-2">
                  <div className="flex items-center space-x-1">
                    {getPlatformIcon(task.platform)}
                    <span>{task.platform}</span>
                  </div>
                  <span>•</span>
                  <span>{task.source}</span>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{task.timestamp}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    {getUsageText('scoring')}
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleScoreTask(task.id, task.summary)}
                      disabled={isProcessing || isLimitReached('scoring')}
                      className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 flex-shrink-0"
                    >
                      <Target className="w-3 h-3 mr-1" />
                      Score
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onViewSource(task.messageId)}
                      className="h-7 px-2 text-xs text-purple-600 hover:text-purple-700 flex-shrink-0"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default TasksSection;
