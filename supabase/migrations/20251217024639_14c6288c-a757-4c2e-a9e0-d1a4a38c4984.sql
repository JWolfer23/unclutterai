-- Create assistant_action_log table
CREATE TABLE public.assistant_action_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  what TEXT NOT NULL,
  why TEXT,
  context JSONB DEFAULT '{}',
  is_undoable BOOLEAN DEFAULT false,
  undone_at TIMESTAMPTZ,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assistant_action_log ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own action logs"
ON public.assistant_action_log
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own action logs"
ON public.assistant_action_log
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own action logs"
ON public.assistant_action_log
FOR UPDATE
USING (auth.uid() = user_id);

-- Index for efficient queries
CREATE INDEX idx_action_log_user_created ON public.assistant_action_log(user_id, created_at DESC);