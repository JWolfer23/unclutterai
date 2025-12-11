-- Create focus_ledger table for tracking focus-related events
CREATE TABLE public.focus_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  message_ids UUID[] DEFAULT '{}',
  uct_reward NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create action_plans table for storing generated action plans
CREATE TABLE public.action_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  urgent_tasks JSONB DEFAULT '[]'::jsonb,
  quick_wins JSONB DEFAULT '[]'::jsonb,
  auto_replies JSONB DEFAULT '[]'::jsonb,
  batch_recommendations JSONB DEFAULT '[]'::jsonb,
  uct_estimate NUMERIC DEFAULT 0,
  messages_processed INTEGER DEFAULT 0,
  ledger_id UUID REFERENCES public.focus_ledger(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.focus_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_plans ENABLE ROW LEVEL SECURITY;

-- RLS policies for focus_ledger
CREATE POLICY "Users can view their own ledger entries"
ON public.focus_ledger FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ledger entries"
ON public.focus_ledger FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS policies for action_plans
CREATE POLICY "Users can view their own action plans"
ON public.action_plans FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own action plans"
ON public.action_plans FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own action plans"
ON public.action_plans FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own action plans"
ON public.action_plans FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_focus_ledger_user_id ON public.focus_ledger(user_id);
CREATE INDEX idx_focus_ledger_event_type ON public.focus_ledger(event_type);
CREATE INDEX idx_focus_ledger_created_at ON public.focus_ledger(created_at DESC);
CREATE INDEX idx_action_plans_user_id ON public.action_plans(user_id);
CREATE INDEX idx_action_plans_created_at ON public.action_plans(created_at DESC);