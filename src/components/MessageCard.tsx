import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAIAssistant } from "@/hooks/useAIAssistant";
import { useAuth } from "@/hooks/useAuth";
import { 
  Mail, 
  MessageSquare, 
  Phone, 
  Twitter, 
  Instagram, 
  Linkedin,
  Reply,
  Archive,
  Trash2,
  CheckSquare,
  Clock,
  Sparkles,
  AlertCircle,
  TrendingUp,
  ListTodo,
  FileText
} from "lucide-react";

interface Message {
  id: number;
  type: string;
  from: string;
  avatar: string;
  subject: string;
  preview: string;
  content?: string;
  time: string;
  priority: string;
  platform: string;
  tasks: string[];
  sentiment: string;
  ai_summary?: string;
}

interface MessageCardProps {
  message: Message;
  onClick: () => void;
  isSelected: boolean;
}

const MessageCard = ({ message, onClick, isSelected }: MessageCardProps) => {
  const { summarizeMessage, generateTasks, isProcessing } = useAIAssistant();
  const { user } = useAuth();

  const handleSummarize = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (message.content && !message.ai_summary) {
      summarizeMessage({
        messageId: message.id.toString(),
        content: message.content,
        subject: message.subject
      });
    }
  };

  const handleGenerateTasks = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (message.content && user?.id) {
      generateTasks({
        messageId: message.id.toString(),
        content: message.content,
        subject: message.subject,
        userId: user.id
      });
    }
  };
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'text':
        return <MessageSquare className="w-4 h-4" />;
      case 'social':
        return <Twitter className="w-4 h-4" />;
      case 'voice':
        return <Phone className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="w-3 h-3 text-green-600" />;
      case 'negative':
        return <AlertCircle className="w-3 h-3 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-white/20 ${
        isSelected 
          ? 'bg-purple-50/80 border-purple-200 shadow-md' 
          : 'bg-white/60 hover:bg-white/80'
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          <Avatar className="w-12 h-12 border-2 border-white/50">
            <AvatarImage src={message.avatar} alt={message.from} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-500 text-white">
              {message.from.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900 truncate">{message.from}</h3>
                <Badge variant="outline" className="text-xs">
                  {getTypeIcon(message.type)}
                  <span className="ml-1">{message.platform}</span>
                </Badge>
                {getSentimentIcon(message.sentiment)}
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={`text-xs ${getPriorityColor(message.priority)}`}>
                  {message.priority}
                </Badge>
                <span className="text-xs text-gray-500 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {message.time}
                </span>
              </div>
            </div>

            <h4 className="font-medium text-gray-800 mb-1 truncate">{message.subject}</h4>
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">{message.preview}</p>

            {/* AI Summary */}
            {message.ai_summary && (
              <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-1 mb-1">
                  <FileText className="w-3 h-3 text-blue-600" />
                  <span className="text-xs font-medium text-blue-600">AI Summary</span>
                </div>
                <p className="text-xs text-blue-800">{message.ai_summary}</p>
              </div>
            )}

            {/* AI-Generated Tasks */}
            {message.tasks.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center space-x-1 mb-2">
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  <span className="text-xs font-medium text-purple-600">AI Extracted Tasks</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {message.tasks.map((task, index) => (
                    <Badge key={index} variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                      <CheckSquare className="w-3 h-3 mr-1" />
                      {task}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <Button size="sm" variant="ghost" className="h-8 px-3 text-xs">
                  <Reply className="w-3 h-3 mr-1" />
                  Reply
                </Button>
                {!message.ai_summary && message.content && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 px-3 text-xs" 
                    onClick={handleSummarize}
                    disabled={isProcessing}
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    Summarize
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 px-3 text-xs"
                  onClick={handleGenerateTasks}
                  disabled={isProcessing || !message.content}
                >
                  <ListTodo className="w-3 h-3 mr-1" />
                  Tasks
                </Button>
              </div>
              <div className="flex space-x-1">
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <Archive className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MessageCard;
