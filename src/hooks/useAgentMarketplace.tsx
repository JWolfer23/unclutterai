import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Agent {
  id: string;
  name: string;
  description: string;
  base_complexity: 'low' | 'medium' | 'high';
  estimated_time: number;
  icon: string;
}

export interface AgentPrice {
  cost_uct: number;
  estimated_time_mins: number;
  breakdown: {
    base_fee: number;
    time_fee: number;
    priority_fee: number;
    complexity_fee: number;
  };
}

export interface AgentExecutionResult {
  success: boolean;
  result: Record<string, unknown>;
  cost_uct: number;
  new_balance: number;
  ledger_id: string;
}

export function useAgentMarketplace() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available agents
  const { data: agents, isLoading: isLoadingAgents } = useQuery({
    queryKey: ['agents'],
    queryFn: async (): Promise<Agent[]> => {
      const { data, error } = await supabase.functions.invoke('agent-marketplace', {
        body: { action: 'list' }
      });
      if (error) throw error;
      return data.agents;
    },
  });

  // Get price for an agent task
  const priceMutation = useMutation({
    mutationFn: async ({
      task_complexity,
      estimated_time_mins,
      priority
    }: {
      task_complexity: 'low' | 'medium' | 'high';
      estimated_time_mins: number;
      priority: 'low' | 'medium' | 'high';
    }): Promise<AgentPrice> => {
      const { data, error } = await supabase.functions.invoke('agent-marketplace', {
        body: { 
          action: 'price',
          task_complexity,
          estimated_time_mins,
          priority
        }
      });
      if (error) throw error;
      return data.price;
    },
  });

  // Execute an agent
  const executeMutation = useMutation({
    mutationFn: async ({
      agent_type,
      task_payload,
      approved_cost
    }: {
      agent_type: string;
      task_payload: Record<string, unknown>;
      approved_cost: number;
    }): Promise<AgentExecutionResult> => {
      const { data, error } = await supabase.functions.invoke('agent-marketplace', {
        body: { 
          action: 'execute',
          agent_type,
          task_payload,
          approved_cost
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['uct-balance'] });
      toast({
        title: 'Agent completed',
        description: `Task executed successfully. ${data.cost_uct} UCT charged.`,
      });
    },
    onError: (error: Error & { refunded?: boolean }) => {
      toast({
        title: 'Agent failed',
        description: error.message + (error.refunded ? ' (UCT refunded)' : ''),
        variant: 'destructive',
      });
    },
  });

  return {
    agents,
    isLoadingAgents,
    
    getPrice: priceMutation.mutateAsync,
    isPricing: priceMutation.isPending,
    lastPrice: priceMutation.data,
    
    executeAgent: executeMutation.mutateAsync,
    isExecuting: executeMutation.isPending,
    lastResult: executeMutation.data,
  };
}
