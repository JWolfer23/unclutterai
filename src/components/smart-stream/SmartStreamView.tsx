import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Calendar, Zap, Users, Target } from "lucide-react";
import { useSmartStream, StreamFilter } from "@/hooks/useSmartStream";
import { StreamCard } from "./StreamCard";
import { BatchGroup } from "./BatchGroup";

interface SmartStreamViewProps {
  defaultFilter?: StreamFilter;
  compact?: boolean;
  maxItems?: number;
}

const filterConfig = {
  today: { label: 'Today', icon: Target, color: 'text-destructive' },
  quick_wins: { label: 'Quick Wins', icon: Zap, color: 'text-yellow-400' },
  deep_work: { label: 'Deep Work', icon: Calendar, color: 'text-blue-400' },
  people: { label: 'People', icon: Users, color: 'text-green-400' },
};

export function SmartStreamView({ 
  defaultFilter = 'today', 
  compact = false,
  maxItems 
}: SmartStreamViewProps) {
  const [activeFilter, setActiveFilter] = useState<StreamFilter>(defaultFilter);
  
  const { 
    items, 
    batches, 
    isLoading, 
    isGeneratingBatches,
    generateBatches,
    handleAction 
  } = useSmartStream(activeFilter);

  const displayItems = maxItems ? items.slice(0, maxItems) : items;
  const totalUCT = items.reduce((sum, item) => sum + item.uct_reward, 0);

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      {!compact && (
        <div className="flex items-center gap-2 flex-wrap">
          {(Object.keys(filterConfig) as StreamFilter[]).map((filter) => {
            const config = filterConfig[filter];
            const Icon = config.icon;
            const isActive = activeFilter === filter;
            
            return (
              <Button
                key={filter}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter(filter)}
                className={`${isActive ? 'bg-gradient-to-r from-primary to-blue-500' : 'border-border/50'}`}
              >
                <Icon className={`w-4 h-4 mr-1.5 ${isActive ? '' : config.color}`} />
                {config.label}
              </Button>
            );
          })}
          
          {/* Generate Batches Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={generateBatches}
            disabled={isGeneratingBatches || items.length === 0}
            className="ml-auto border-primary/50 text-primary hover:bg-primary/10"
          >
            {isGeneratingBatches ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-1.5" />
            )}
            {isGeneratingBatches ? 'Creating...' : 'Smart Batches'}
          </Button>
        </div>
      )}

      {/* Stats Summary */}
      {!compact && (
        <div className="flex items-center gap-4 p-3 rounded-xl bg-secondary/30 border border-border/50">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Items:</span>
            <Badge variant="secondary">{items.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Batches:</span>
            <Badge variant="secondary">{batches.length}</Badge>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-muted-foreground">Potential:</span>
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
              🪙 +{totalUCT.toFixed(1)} UCT
            </Badge>
          </div>
        </div>
      )}

      {/* Empty State - shown while loading or when truly empty */}
      {isLoading && items.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm">No items require attention right now.</p>
        </div>
      )}

      {/* Batches (if generated) */}
      {batches.length > 0 && !compact && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            🧠 Cognitive Batches
          </h3>
          {batches.map(batch => (
            <BatchGroup 
              key={batch.id} 
              batch={batch} 
              onAction={handleAction}
            />
          ))}
        </div>
      )}

      {/* Stream Items */}
      {!isLoading && displayItems.length > 0 && (
        <div className="space-y-3">
          {!compact && batches.length > 0 && (
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mt-6">
              📋 All Items
            </h3>
          )}
          {displayItems.map(item => (
            <StreamCard 
              key={item.id} 
              item={item} 
              onAction={handleAction}
              compact={compact}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && items.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm">Clear. Nothing requires attention.</p>
        </div>
      )}

      {/* Show More */}
      {maxItems && items.length > maxItems && (
        <Button variant="ghost" className="w-full text-muted-foreground">
          +{items.length - maxItems} more items
        </Button>
      )}
    </div>
  );
}
