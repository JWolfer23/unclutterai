-- Create sender_trust table for tracking trust levels per sender-user pair
CREATE TABLE public.sender_trust (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sender_email TEXT NOT NULL,
  trust_level NUMERIC(3,2) NOT NULL DEFAULT 0.5 CHECK (trust_level >= 0 AND trust_level <= 1),
  interaction_count INTEGER NOT NULL DEFAULT 0,
  open_count INTEGER NOT NULL DEFAULT 0,
  reply_count INTEGER NOT NULL DEFAULT 0,
  is_vip BOOLEAN NOT NULL DEFAULT false,
  auto_send_allowed BOOLEAN NOT NULL DEFAULT false,
  last_interaction TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, sender_email)
);

-- Enable RLS on sender_trust
ALTER TABLE public.sender_trust ENABLE ROW LEVEL SECURITY;

-- RLS policies for sender_trust
CREATE POLICY "Users can view their own sender trust" 
  ON public.sender_trust FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sender trust" 
  ON public.sender_trust FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sender trust" 
  ON public.sender_trust FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sender trust" 
  ON public.sender_trust FOR DELETE 
  USING (auth.uid() = user_id);

-- Create auto_send_logs table for auditing auto-sent replies
CREATE TABLE public.auto_send_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  message_id UUID REFERENCES public.messages(id),
  reply_subject TEXT,
  reply_body TEXT NOT NULL,
  uct_fee NUMERIC(5,2) NOT NULL DEFAULT 0,
  trust_level NUMERIC(3,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  tx_hash TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on auto_send_logs
ALTER TABLE public.auto_send_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for auto_send_logs
CREATE POLICY "Users can view their own auto send logs" 
  ON public.auto_send_logs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own auto send logs" 
  ON public.auto_send_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Add spam_guard columns to messages table
ALTER TABLE public.messages 
  ADD COLUMN IF NOT EXISTS spam_guard_result JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_spam BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_archived_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for spam filtering
CREATE INDEX IF NOT EXISTS idx_messages_is_spam ON public.messages(user_id, is_spam);
CREATE INDEX IF NOT EXISTS idx_sender_trust_lookup ON public.sender_trust(user_id, sender_email);
CREATE INDEX IF NOT EXISTS idx_auto_send_logs_user ON public.auto_send_logs(user_id, created_at DESC);

-- Trigger for updated_at on sender_trust
CREATE TRIGGER update_sender_trust_updated_at
  BEFORE UPDATE ON public.sender_trust
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();