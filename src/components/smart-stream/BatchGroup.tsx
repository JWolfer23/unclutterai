import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Zap } from "lucide-react";
import { BatchGroup as BatchGroupType } from "@/hooks/useSmartStream";
import { StreamCard } from "./StreamCard";

interface BatchGroupProps {
  batch: BatchGroupType;
  onAction: (itemId: string, action: string) => void;
}

const priorityColors = {
  high: 'from-destructive/20 to-destructive/5 border-destructive/30',
  medium: 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/30',
  low: 'from-muted to-muted/50 border-border',
};

const priorityBadgeColors = {
  high: 'bg-destructive/20 text-destructive border-destructive/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-muted text-muted-foreground border-border',
};

export function BatchGroup({ batch, onAction }: BatchGroupProps) {
  const [isExpanded, setIsExpanded] = useState(batch.priority === 'high');

  const totalUCT = batch.items.reduce((sum, item) => sum + item.uct_reward, 0);

  const handleProcessBatch = () => {
    batch.items.forEach(item => {
      const primaryAction = item.action_buttons[0];
      if (primaryAction) {
        onAction(item.id, primaryAction);
      }
    });
  };

  return (
    <div className={`rounded-2xl border bg-gradient-to-b ${priorityColors[batch.priority]} overflow-hidden`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-secondary/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Badge className={`${priorityBadgeColors[batch.priority]} text-xs`}>
            {batch.priority === 'high' ? '🔥' : batch.priority === 'medium' ? '⚡' : '💤'}
          </Badge>
          <div>
            <h3 className="font-semibold text-foreground">{batch.purpose}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {batch.size} items • {totalUCT.toFixed(1)} UCT potential
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {batch.size}
          </Badge>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-3">
          {batch.items.map(item => (
            <StreamCard 
              key={item.id} 
              item={item} 
              onAction={onAction}
              compact
            />
          ))}
          
          {/* Process Batch Button */}
          <Button
            onClick={handleProcessBatch}
            className="w-full mt-3 bg-gradient-to-r from-primary to-blue-500 hover:opacity-90"
          >
            <Zap className="w-4 h-4 mr-2" />
            Process Batch ({batch.size} items)
          </Button>
        </div>
      )}
    </div>
  );
}
