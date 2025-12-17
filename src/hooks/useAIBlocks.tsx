import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

// Input/Output types for AI blocks
export interface SimplifyInput {
  subject: string;
  body: string;
  sender: string;
  metadata?: Record<string, unknown>;
}

export interface SimplifyOutput {
  one_sentence_summary: string;
  key_points: string[];
  hidden_context: string[];
  what_this_means: string;
  suggested_action: 'reply' | 'schedule' | 'ignore' | 'archive' | 'create_task';
  tone: 'urgent' | 'irritated' | 'casual' | 'automated' | 'neutral' | 'trap';
  extracted_dates: string[];
  tags: string[];
  confidence: number;
}

export interface SignalScoreInput {
  ai_summary: string;
  body: string;
  sender: string;
  user_profile?: {
    vips?: string[];
    priorities?: string[];
  };
  relationship_intel?: {
    relationship: string;
    importance: number;
  };
}

export interface SignalScoreOutput {
  urgency: number;
  effort: number;
  impact: number;
  relationship: number;
}

export interface RelationshipIntelInput {
  sender_email: string;
  sender_name?: string;
  conversation_history?: Array<{
    subject: string;
    direction: 'sent' | 'received';
    timestamp: string;
  }>;
  vip_contacts?: string[];
  domain?: string;
}

export interface RelationshipIntelOutput {
  relationship: 'family' | 'client' | 'vendor' | 'newsletter' | 'acquaintance' | 'drainer' | 'unknown';
  importance: number;
  notes: string[];
  confidence: number;
  signals: {
    is_vip_match: boolean;
    domain_match: string;
    frequency: string;
    money_keywords: boolean;
    sentiment_history: string;
  };
}

export interface ThreadMessage {
  role: 'user' | 'other';
  content: string;
  sender: string;
  timestamp: string;
}

export interface ThreadSenseInput {
  thread_messages: ThreadMessage[];
  user_role_in_thread: string;
}

export interface ThreadSenseOutput {
  action: 'reply_now' | 'no_reply_needed' | 'followup_needed';
  explanation: string;
  who_should_act: 'you' | 'them' | 'delegate';
}

export interface AutoReplyInput {
  original_message: {
    subject: string;
    body: string;
    sender: string;
  };
  desired_action: 'request_more_time' | 'decline' | 'confirm' | 'clarify' | 'short_ack';
  constraints?: {
    max_words?: number;
    tone?: 'polite' | 'firm' | 'casual' | 'professional';
  };
}

export interface AutoReplyOutput {
  subject: string;
  body: string;
  tone: 'polite' | 'firm' | 'casual' | 'professional';
  confidence: number;
}

export interface SpamGuardInput {
  body: string;
  ai_summary?: string;
  sender_domain?: string;
  sender_name?: string;
}

export interface SpamGuardOutput {
  is_spam: boolean;
  reason: 'guilt_invoke' | 'pyramid' | 'promo' | 'low_value' | 'phishing' | 'manipulation' | 'safe';
  confidence: number;
  details: string;
  recommended_action: 'archive' | 'quarantine' | 'block' | 'allow';
}

type AIBlockAction = 'simplify' | 'signal_score' | 'thread_sense' | 'auto_reply' | 'spam_guard' | 'relationship_intel';

async function invokeAIBlock<T>(action: AIBlockAction, data: unknown): Promise<T> {
  const { data: result, error } = await supabase.functions.invoke('ai-blocks', {
    body: { action, data }
  });

  if (error) {
    console.error(`AI block ${action} error:`, error);
    throw new Error(error.message || `Failed to execute ${action}`);
  }

  if (!result?.success) {
    throw new Error(result?.error || `AI block ${action} failed`);
  }

  return result.result as T;
}

export function useAIBlocks() {
  const queryClient = useQueryClient();

  // AI_Simplify - Message summarizer + extraction
  const simplifyMutation = useMutation({
    mutationFn: (input: SimplifyInput) => invokeAIBlock<SimplifyOutput>('simplify', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-usage'] });
    },
    onError: (error: Error) => {
      if (error.message.includes('Rate limit')) {
        toast.error("Rate limit exceeded. Please try again later.");
      } else if (error.message.includes('usage limit')) {
        toast.error("AI usage limit reached. Please add credits.");
      } else {
        toast.error(`Analysis failed: ${error.message}`);
      }
    },
  });

  // AI_SignalScore - Numeric urgency/effort/impact/relationship scores
  const signalScoreMutation = useMutation({
    mutationFn: (input: SignalScoreInput) => invokeAIBlock<SignalScoreOutput>('signal_score', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-usage'] });
    },
    onError: (error: Error) => {
      if (error.message.includes('Rate limit')) {
        toast.error("Rate limit exceeded. Please try again later.");
      } else {
        toast.error(`Scoring failed: ${error.message}`);
      }
    },
  });

  // AI_ThreadSense - Thread action analysis
  const threadSenseMutation = useMutation({
    mutationFn: (input: ThreadSenseInput) => invokeAIBlock<ThreadSenseOutput>('thread_sense', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-usage'] });
    },
    onError: (error: Error) => {
      if (error.message.includes('Rate limit')) {
        toast.error("Rate limit exceeded. Please try again later.");
      } else {
        toast.error(`Thread analysis failed: ${error.message}`);
      }
    },
  });

  // AI_AutoReply - Draft reply generator
  const autoReplyMutation = useMutation({
    mutationFn: (input: AutoReplyInput) => invokeAIBlock<AutoReplyOutput>('auto_reply', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-usage'] });
    },
    onError: (error: Error) => {
      if (error.message.includes('Rate limit')) {
        toast.error("Rate limit exceeded. Please try again later.");
      } else {
        toast.error(`Reply generation failed: ${error.message}`);
      }
    },
  });

  // AI_SpamGuard - Spam detection
  const spamGuardMutation = useMutation({
    mutationFn: (input: SpamGuardInput) => invokeAIBlock<SpamGuardOutput>('spam_guard', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-usage'] });
    },
    onError: (error: Error) => {
      if (error.message.includes('Rate limit')) {
        toast.error("Rate limit exceeded. Please try again later.");
      } else {
        toast.error(`Spam detection failed: ${error.message}`);
      }
    },
  });

  // AI_RelationshipIntel - Relationship classification
  const relationshipIntelMutation = useMutation({
    mutationFn: (input: RelationshipIntelInput) => invokeAIBlock<RelationshipIntelOutput>('relationship_intel', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-usage'] });
      queryClient.invalidateQueries({ queryKey: ['sender-relationships'] });
    },
    onError: (error: Error) => {
      if (error.message.includes('Rate limit')) {
        toast.error("Rate limit exceeded. Please try again later.");
      } else {
        toast.error(`Relationship analysis failed: ${error.message}`);
      }
    },
  });

  return {
    // Mutation functions
    simplifyMessage: simplifyMutation.mutateAsync,
    scoreSignal: signalScoreMutation.mutateAsync,
    analyzeThread: threadSenseMutation.mutateAsync,
    draftReply: autoReplyMutation.mutateAsync,
    detectSpam: spamGuardMutation.mutateAsync,
    analyzeRelationship: relationshipIntelMutation.mutateAsync,

    // Sync mutation wrappers (for fire-and-forget)
    simplify: simplifyMutation.mutate,
    score: signalScoreMutation.mutate,
    analyze: threadSenseMutation.mutate,
    draft: autoReplyMutation.mutate,
    spamGuard: spamGuardMutation.mutate,
    relationshipIntel: relationshipIntelMutation.mutate,

    // Loading states
    isSimplifying: simplifyMutation.isPending,
    isScoring: signalScoreMutation.isPending,
    isAnalyzing: threadSenseMutation.isPending,
    isDrafting: autoReplyMutation.isPending,
    isDetectingSpam: spamGuardMutation.isPending,
    isAnalyzingRelationship: relationshipIntelMutation.isPending,
    isProcessing: 
      simplifyMutation.isPending || 
      signalScoreMutation.isPending || 
      threadSenseMutation.isPending || 
      autoReplyMutation.isPending ||
      spamGuardMutation.isPending ||
      relationshipIntelMutation.isPending,

    // Results (for accessing last result)
    simplifyResult: simplifyMutation.data,
    scoreResult: signalScoreMutation.data,
    threadResult: threadSenseMutation.data,
    replyResult: autoReplyMutation.data,
    spamResult: spamGuardMutation.data,
    relationshipResult: relationshipIntelMutation.data,

    // Error states
    simplifyError: simplifyMutation.error,
    scoreError: signalScoreMutation.error,
    threadError: threadSenseMutation.error,
    replyError: autoReplyMutation.error,
    spamError: spamGuardMutation.error,
    relationshipError: relationshipIntelMutation.error,
  };
}
