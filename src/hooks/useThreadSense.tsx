import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type ThreadAction = 'reply_now' | 'no_reply_needed' | 'followup_needed';
export type WhoShouldAct = 'you' | 'them' | 'delegate';

export interface ThreadSenseResult {
  action: ThreadAction;
  explanation: string;
  who_should_act: WhoShouldAct;
}

export interface ThreadStatus {
  thread_id: string;
  action: ThreadAction;
  who_should_act: WhoShouldAct;
  explanation: string;
  analyzed_at: string;
}

export function useThreadSense() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Analyze a single thread
  const analyzeThreadMutation = useMutation({
    mutationFn: async (threadId: string): Promise<ThreadSenseResult> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Fetch all messages in this thread
      const { data: messages, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('received_at', { ascending: true });

      if (fetchError) throw fetchError;
      if (!messages || messages.length === 0) {
        throw new Error('No messages found in thread');
      }

      // Get user's email to determine role
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email || '';

      // Format thread messages for AI
      const threadMessages = messages.map(m => ({
        role: m.sender_email === userEmail ? 'user' as const : 'other' as const,
        content: `Subject: ${m.subject}\n${m.content?.substring(0, 500) || ''}`,
        sender: m.sender_name || m.sender_email || 'Unknown',
        timestamp: m.received_at || m.created_at || '',
      }));

      const { data, error } = await supabase.functions.invoke('ai-blocks', {
        body: {
          action: 'thread_sense',
          data: {
            thread_messages: threadMessages,
            user_role_in_thread: 'participant',
          },
        },
      });

      if (error) throw error;
      return data.result as ThreadSenseResult;
    },
    onError: (error) => {
      console.error('Error analyzing thread:', error);
      toast({
        title: 'Thread analysis failed',
        description: error instanceof Error ? error.message : 'Could not analyze thread',
        variant: 'destructive',
      });
    },
  });

  // Analyze threads with pending action
  const analyzeActiveThreadsMutation = useMutation({
    mutationFn: async (): Promise<ThreadStatus[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get unique thread IDs from recent unread messages
      const { data: messages } = await supabase
        .from('messages')
        .select('thread_id')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .not('thread_id', 'is', null);

      const uniqueThreads = [...new Set(messages?.map(m => m.thread_id).filter(Boolean) || [])];
      const results: ThreadStatus[] = [];

      // Analyze each thread (limit to 10 for performance)
      for (const threadId of uniqueThreads.slice(0, 10)) {
        if (!threadId) continue;
        try {
          const result = await analyzeThreadMutation.mutateAsync(threadId);
          results.push({
            thread_id: threadId,
            action: result.action,
            who_should_act: result.who_should_act,
            explanation: result.explanation,
            analyzed_at: new Date().toISOString(),
          });
        } catch (e) {
          console.error(`Failed to analyze thread ${threadId}:`, e);
        }
      }

      return results;
    },
    onSuccess: (results) => {
      const actionNeeded = results.filter(r => r.action === 'reply_now').length;
      if (actionNeeded > 0) {
        toast({
          title: 'Threads analyzed',
          description: `${actionNeeded} threads need your reply`,
        });
      }
    },
  });

  // Get thread status for a message
  const getThreadStatus = (threadId: string | null): ThreadAction | null => {
    if (!threadId) return null;
    // This would typically come from cached results or a dedicated query
    return null;
  };

  return {
    // Single thread analysis
    analyzeThread: analyzeThreadMutation.mutateAsync,
    isAnalyzingThread: analyzeThreadMutation.isPending,
    threadResult: analyzeThreadMutation.data,
    
    // Batch thread analysis
    analyzeActiveThreads: analyzeActiveThreadsMutation.mutateAsync,
    isAnalyzingActiveThreads: analyzeActiveThreadsMutation.isPending,
    activeThreadResults: analyzeActiveThreadsMutation.data,
    
    // Lookup
    getThreadStatus,
  };
}

// Thread action config for UI
export const THREAD_ACTION_CONFIG: Record<ThreadAction, { icon: string; color: string; label: string; description: string }> = {
  reply_now: { 
    icon: '💬', 
    color: 'text-amber-400', 
    label: 'Reply Now', 
    description: 'Ball is in your court' 
  },
  no_reply_needed: { 
    icon: '✅', 
    color: 'text-emerald-400', 
    label: 'No Reply Needed', 
    description: 'Thread is complete' 
  },
  followup_needed: { 
    icon: '⏰', 
    color: 'text-blue-400', 
    label: 'Follow Up', 
    description: 'Check back later' 
  },
};

export const WHO_SHOULD_ACT_CONFIG: Record<WhoShouldAct, { label: string; color: string }> = {
  you: { label: 'Your turn', color: 'text-amber-400' },
  them: { label: 'Waiting on them', color: 'text-emerald-400' },
  delegate: { label: 'Can delegate', color: 'text-blue-400' },
};
