import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Bot, Loader2, ArrowLeft } from 'lucide-react';
import { useAgentMarketplace, Agent, AgentPrice } from '@/hooks/useAgentMarketplace';
import { useUCTBalance } from '@/hooks/useUCTBalance';
import { AgentCard } from './AgentCard';

interface AgentMarketplaceProps {
  onBack?: () => void;
}

export function AgentMarketplace({ onBack }: AgentMarketplaceProps) {
  const { agents, isLoadingAgents, getPrice, executeAgent, isExecuting } = useAgentMarketplace();
  const { availableBalance } = useUCTBalance();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [taskInput, setTaskInput] = useState('');
  const [pendingPrice, setPendingPrice] = useState<AgentPrice | null>(null);

  const handleGetPrice = async (agent: Agent): Promise<AgentPrice> => {
    const price = await getPrice({
      task_complexity: agent.base_complexity,
      estimated_time_mins: agent.estimated_time,
      priority: 'medium'
    });
    return price;
  };

  const handleExecute = async (agent: Agent, price: AgentPrice) => {
    setSelectedAgent(agent);
    setPendingPrice(price);
  };

  const handleConfirmExecute = async () => {
    if (!selectedAgent || !pendingPrice) return;
    
    await executeAgent({
      agent_type: selectedAgent.id,
      task_payload: { input: taskInput },
      approved_cost: pendingPrice.cost_uct
    });
    
    setSelectedAgent(null);
    setPendingPrice(null);
    setTaskInput('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="text-slate-400">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Bot className="w-6 h-6 text-purple-400" />
              AI Agents
            </h1>
            <p className="text-sm text-slate-400">Automate tasks with UCT</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Balance</p>
            <p className="text-lg font-bold text-amber-300">{availableBalance.toFixed(2)} UCT</p>
          </div>
        </div>

        {/* Agent Grid */}
        {isLoadingAgents ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
          </div>
        ) : (
          <div className="grid gap-3">
            {agents?.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onGetPrice={handleGetPrice}
                onExecute={handleExecute}
                isExecuting={isExecuting}
              />
            ))}
          </div>
        )}

        {/* Execution Dialog */}
        <Dialog open={!!selectedAgent} onOpenChange={() => setSelectedAgent(null)}>
          <DialogContent className="bg-slate-900 border-white/10">
            <DialogHeader>
              <DialogTitle className="text-slate-100">
                Run {selectedAgent?.name}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Task Details</label>
                <Textarea
                  placeholder="Describe what you want the agent to do..."
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  className="bg-slate-800/50 border-white/10 text-slate-100 min-h-[100px]"
                />
              </div>
              
              {pendingPrice && (
                <Card className="p-3 bg-amber-500/10 border-amber-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">Cost</span>
                    <span className="font-bold text-amber-300">{pendingPrice.cost_uct} UCT</span>
                  </div>
                  {availableBalance < pendingPrice.cost_uct && (
                    <p className="text-xs text-rose-400 mt-2">Insufficient balance</p>
                  )}
                </Card>
              )}
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setSelectedAgent(null)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600"
                  onClick={handleConfirmExecute}
                  disabled={isExecuting || !taskInput || (pendingPrice && availableBalance < pendingPrice.cost_uct)}
                >
                  {isExecuting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Execute Agent
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
