import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Clock, 
  Send, 
  Users, 
  Zap,
  Calendar,
  ChevronRight
} from "lucide-react";
import { StreamItem } from "@/hooks/useSmartStream";

interface StreamCardProps {
  item: StreamItem;
  onAction: (itemId: string, action: string) => void;
  compact?: boolean;
}

const priorityColors = {
  high: 'bg-destructive/20 text-destructive border-destructive/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-muted text-muted-foreground border-border',
};

const priorityLabels = {
  high: '🔥 High',
  medium: '⚡ Medium',
  low: '💤 Low',
};

export function StreamCard({ item, onAction, compact = false }: StreamCardProps) {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'claim': return <CheckCircle2 className="w-3 h-3" />;
      case 'complete': return <Zap className="w-3 h-3" />;
      case 'schedule': return <Calendar className="w-3 h-3" />;
      case 'delegate': return <Users className="w-3 h-3" />;
      case 'send': return <Send className="w-3 h-3" />;
      default: return <ChevronRight className="w-3 h-3" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'claim': return 'Claim';
      case 'complete': return 'Do Now';
      case 'schedule': return 'Schedule';
      case 'delegate': return 'Delegate';
      case 'send': return 'Send';
      default: return action;
    }
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Badge className={`${priorityColors[item.priority]} text-xs shrink-0`}>
            {priorityLabels[item.priority]}
          </Badge>
          <span className="text-sm font-medium text-foreground truncate">{item.title}</span>
        </div>
        <div className="flex items-center gap-2">
          {item.uct_reward > 0 && (
            <span className="text-xs text-muted-foreground">+{item.uct_reward.toFixed(1)} UCT</span>
          )}
          {item.action_buttons.slice(0, 1).map(action => (
            <Button
              key={action}
              size="sm"
              variant="ghost"
              className="h-7 px-2"
              onClick={() => onAction(item.id, action)}
            >
              {getActionIcon(action)}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl bg-card/50 border border-border/50 hover:border-primary/30 transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Badge className={`${priorityColors[item.priority]} text-xs`}>
            {priorityLabels[item.priority]}
          </Badge>
          {item.type === 'auto_reply' && (
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
              ✉️ Reply
            </Badge>
          )}
        </div>
        {item.sender && (
          <span className="text-xs text-muted-foreground truncate max-w-[120px]">
            {item.sender}
          </span>
        )}
      </div>

      {/* Title & Subtitle */}
      <h4 className="font-semibold text-foreground mb-1 line-clamp-1">{item.title}</h4>
      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{item.subtitle}</p>

      {/* Meta Row */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
        {item.due_tag && (
          <div className={`flex items-center gap-1 ${
            item.due_tag === 'Overdue' ? 'text-destructive' : 
            item.due_tag === 'Due today' ? 'text-yellow-400' : ''
          }`}>
            <Clock className="w-3 h-3" />
            <span>{item.due_tag}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <span>⚡ Effort:</span>
          <div className="flex gap-0.5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div 
                key={i} 
                className={`w-1.5 h-1.5 rounded-full ${
                  i < item.effort ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>
        {item.uct_reward > 0 && (
          <div className="flex items-center gap-1 text-yellow-400">
            <span>🪙</span>
            <span>+{item.uct_reward.toFixed(1)} UCT</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {item.action_buttons.map(action => (
          <Button
            key={action}
            size="sm"
            variant={action === 'complete' || action === 'send' ? 'default' : 'outline'}
            className={`h-7 text-xs ${
              action === 'complete' || action === 'send' 
                ? 'bg-gradient-to-r from-primary to-blue-500' 
                : 'border-border/50'
            }`}
            onClick={() => onAction(item.id, action)}
          >
            {getActionIcon(action)}
            <span className="ml-1">{getActionLabel(action)}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
