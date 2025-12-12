import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Mail, Calendar, Send, Loader2, Coins } from 'lucide-react';
import { Agent, AgentPrice } from '@/hooks/useAgentMarketplace';

interface AgentCardProps {
  agent: Agent;
  onGetPrice: (agent: Agent) => Promise<AgentPrice>;
  onExecute: (agent: Agent, price: AgentPrice) => void;
  isExecuting: boolean;
}

const iconMap: Record<string, React.ReactNode> = {
  'mail-reply': <Mail className="w-5 h-5" />,
  'sparkles': <Sparkles className="w-5 h-5" />,
  'calendar': <Calendar className="w-5 h-5" />,
  'send': <Send className="w-5 h-5" />,
};

const complexityColors: Record<string, string> = {
  low: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  medium: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  high: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
};

export function AgentCard({ agent, onGetPrice, onExecute, isExecuting }: AgentCardProps) {
  const [price, setPrice] = useState<AgentPrice | null>(null);
  const [isPricing, setIsPricing] = useState(false);

  const handleGetPrice = async () => {
    setIsPricing(true);
    try {
      const priceData = await onGetPrice(agent);
      setPrice(priceData);
    } finally {
      setIsPricing(false);
    }
  };

  const handleExecute = () => {
    if (price) {
      onExecute(agent, price);
      setPrice(null);
    }
  };

  return (
    <Card className="p-4 bg-slate-900/60 border-white/10 hover:border-purple-500/30 transition-all">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/20 text-purple-300">
          {iconMap[agent.icon] || <Sparkles className="w-5 h-5" />}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-100 truncate">{agent.name}</h3>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${complexityColors[agent.base_complexity]}`}>
              {agent.base_complexity}
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mb-3">{agent.description}</p>
          
          {price ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 border border-white/5">
                <div className="flex items-center gap-1.5 text-amber-300">
                  <Coins className="w-4 h-4" />
                  <span className="font-bold">{price.cost_uct} UCT</span>
                </div>
                <span className="text-xs text-slate-400">~{price.estimated_time_mins}m</span>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 text-xs"
                  onClick={() => setPrice(null)}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1 text-xs bg-gradient-to-r from-purple-600 to-blue-600"
                  onClick={handleExecute}
                  disabled={isExecuting}
                >
                  {isExecuting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm'}
                </Button>
              </div>
            </div>
          ) : (
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full text-xs border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
              onClick={handleGetPrice}
              disabled={isPricing}
            >
              {isPricing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Coins className="w-3 h-3 mr-1" />}
              Get Price
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
