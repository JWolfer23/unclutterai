import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Clock, 
  Mail,
  AlertCircle,
  TrendingUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ImportantMessage {
  id: string;
  sender_name: string;
  subject: string;
  ai_summary?: string;
  priority: 'low' | 'medium' | 'high';
  is_read: boolean;
  received_at: string;
  platform: string;
}

export default function CatchUpAssistant() {
  const { user } = useAuth();
  const [importantMessages, setImportantMessages] = useState<ImportantMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unsummarizedCount, setUnsummarizedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchImportantMessages = async () => {
      try {
        // Get latest 5 important messages (high priority or unread)
        const { data: messages, error } = await supabase
          .from('messages')
          .select('*')
          .eq('user_id', user.id)
          .or('priority.eq.high,is_read.eq.false')
          .order('received_at', { ascending: false })
          .limit(5);

        if (error) throw error;

        // Get total counts
        const { count: unreadTotal } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false);

        const { count: unsummarizedTotal } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .is('ai_summary', null);

        setImportantMessages(messages || []);
        setUnreadCount(unreadTotal || 0);
        setUnsummarizedCount(unsummarizedTotal || 0);
      } catch (error) {
        console.error('Error fetching important messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchImportantMessages();
  }, [user]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-muted text-muted-foreground';
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
            <div className="h-3 bg-muted rounded w-3/4"></div>
            <div className="h-3 bg-muted rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Catch-Up Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Mail className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-muted-foreground">Unread</span>
            </div>
            <div className="text-lg font-semibold text-blue-400">{unreadCount}</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <AlertCircle className="w-4 h-4 text-orange-400" />
              <span className="text-xs text-muted-foreground">Unsummarized</span>
            </div>
            <div className="text-lg font-semibold text-orange-400">{unsummarizedCount}</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-xs text-muted-foreground">Priority</span>
            </div>
            <div className="text-lg font-semibold text-green-400">
              {importantMessages.filter(m => m.priority === 'high').length}
            </div>
          </div>
        </div>

        {/* Important Messages Preview */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Latest Important Messages</h4>
          
          {importantMessages.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">All caught up! No urgent messages.</p>
            </div>
          ) : (
            importantMessages.map((message) => (
              <div 
                key={message.id}
                className="p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">{message.sender_name}</span>
                      <Badge className={`text-xs ${getPriorityColor(message.priority)}`}>
                        {message.priority}
                      </Badge>
                      {!message.is_read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    <p className="text-sm truncate mb-1">{message.subject}</p>
                    {message.ai_summary ? (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {message.ai_summary}
                      </p>
                    ) : (
                      <p className="text-xs text-orange-400">Needs summary</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatTimeAgo(message.received_at)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1">
            Review All
          </Button>
          <Button size="sm" className="flex-1">
            Start Catch-Up
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}