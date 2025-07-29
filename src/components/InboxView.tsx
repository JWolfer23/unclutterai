import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Mail, 
  MessageSquare, 
  Twitter, 
  Phone, 
  Search,
  Sparkles,
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface Message {
  id: string;
  sender_name: string;
  subject: string;
  content: string;
  preview?: string;
  platform: string;
  received_at: string;
  is_read: boolean;
  priority: 'low' | 'medium' | 'high';
  ai_summary?: string;
}

export default function InboxView() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchMessages = async () => {
      try {
        let query = supabase
          .from('messages')
          .select('*')
          .eq('user_id', user.id)
          .order('received_at', { ascending: false });

        if (selectedPlatform) {
          query = query.eq('platform', selectedPlatform);
        }

        const { data, error } = await query;
        
        if (error) throw error;
        setMessages(data || []);
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast({
          title: "Error",
          description: "Failed to load messages",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [user, selectedPlatform]);

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'gmail':
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'whatsapp':
        return <Phone className="w-4 h-4" />;
      case 'twitter':
      case 'x':
        return <Twitter className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

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

  const handleSummarize = async (messageId: string) => {
    try {
      // For MVP, we'll use a simple placeholder summary
      // In production, this would call an AI service
      const summary = "AI summary: This message contains important information that requires your attention.";
      
      const { error } = await supabase
        .from('messages')
        .update({ ai_summary: summary })
        .eq('id', messageId);

      if (error) throw error;

      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, ai_summary: summary } : msg
      ));

      toast({
        title: "Summary Generated",
        description: "AI summary has been created for this message",
      });
    } catch (error) {
      console.error('Error generating summary:', error);
      toast({
        title: "Error",
        description: "Failed to generate summary",
        variant: "destructive"
      });
    }
  };

  const filteredMessages = messages.filter(message =>
    message.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.sender_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const platforms = [...new Set(messages.map(m => m.platform))];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="bg-card border-border">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Inbox
            <Badge variant="secondary" className="ml-auto">
              {filteredMessages.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedPlatform === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPlatform(null)}
              >
                All
              </Button>
              {platforms.map(platform => (
                <Button
                  key={platform}
                  variant={selectedPlatform === platform ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPlatform(platform)}
                  className="flex items-center gap-1"
                >
                  {getPlatformIcon(platform)}
                  {platform}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages List */}
      <div className="space-y-3">
        {filteredMessages.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No messages found</p>
            </CardContent>
          </Card>
        ) : (
          filteredMessages.map((message) => (
            <Card key={message.id} className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      {getPlatformIcon(message.platform)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">{message.sender_name}</h3>
                        <Badge className={`text-xs ${getPriorityColor(message.priority)}`}>
                          {message.priority}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                          <Clock className="w-3 h-3" />
                          {new Date(message.received_at).toLocaleDateString()}
                        </div>
                      </div>
                      <h4 className="font-semibold text-sm mb-2 line-clamp-1">{message.subject}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {message.preview || message.content.substring(0, 150) + "..."}
                      </p>
                      
                      {message.ai_summary ? (
                        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-primary">AI Summary</span>
                          </div>
                          <p className="text-sm">{message.ai_summary}</p>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSummarize(message.id)}
                          className="flex items-center gap-2"
                        >
                          <Sparkles className="w-3 h-3" />
                          Summarize
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}