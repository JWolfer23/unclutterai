import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useTokens } from "./useTokens";
import { useAIUsage } from "./useAIUsage";

export const useAIAssistant = () => {
  const queryClient = useQueryClient();
  const { awardSummaryTokens } = useTokens();
  const { refetch: refetchUsage } = useAIUsage();

  const summarizeMessage = useMutation({
    mutationFn: async ({ messageId, content, subject }: { messageId: string; content: string; subject: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          action: 'summarize_message',
          data: { messageId, content, subject, userId: user.id }
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['ai-usage'] });
      awardSummaryTokens(1);
      toast({
        title: "✨ Message Summarized",
        description: "AI summary generated successfully",
      });
    },
    onError: (error: any) => {
      if (error.message?.includes('RATE_LIMIT_EXCEEDED')) {
        toast({
          title: "Daily Limit Reached",
          description: "You've reached your daily AI usage limit. Please check back tomorrow or upgrade.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to summarize message: " + error.message,
          variant: "destructive",
        });
      }
    },
  });

  const generateTasks = useMutation({
    mutationFn: async ({ messageId, content, subject, userId }: { 
      messageId: string; 
      content: string; 
      subject: string; 
      userId: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          action: 'generate_tasks',
          data: { messageId, content, subject, userId }
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['ai-usage'] });
      toast({
        title: "🎯 Tasks Generated",
        description: `Created ${data.tasks?.length || 0} action items`,
      });
    },
    onError: (error: any) => {
      if (error.message?.includes('RATE_LIMIT_EXCEEDED')) {
        toast({
          title: "Daily Limit Reached",
          description: "You've reached your daily AI usage limit. Please check back tomorrow or upgrade.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to generate tasks: " + error.message,
          variant: "destructive",
        });
      }
    },
  });

  const scoreTask = useMutation({
    mutationFn: async ({ taskId, title, description }: { 
      taskId: string; 
      title: string; 
      description: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          action: 'score_task',
          data: { taskId, title, description, userId: user.id }
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['ai-usage'] });
      toast({
        title: "📊 Task Scored",
        description: "AI scoring completed",
      });
    },
    onError: (error: any) => {
      if (error.message?.includes('RATE_LIMIT_EXCEEDED')) {
        toast({
          title: "Daily Limit Reached",
          description: "You've reached your daily AI usage limit. Please check back tomorrow or upgrade.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to score task: " + error.message,
          variant: "destructive",
        });
      }
    },
  });

  return {
    summarizeMessage: summarizeMessage.mutate,
    generateTasks: generateTasks.mutate,
    scoreTask: scoreTask.mutate,
    isProcessing: summarizeMessage.isPending || generateTasks.isPending || scoreTask.isPending,
  };
};