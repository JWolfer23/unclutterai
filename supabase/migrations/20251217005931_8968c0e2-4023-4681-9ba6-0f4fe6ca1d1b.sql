-- Add staked and total_burned columns to uct_balances
ALTER TABLE public.uct_balances 
ADD COLUMN IF NOT EXISTS staked numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_burned numeric DEFAULT 0;

-- Create uct_stakes table for tracking stake commitments
CREATE TABLE IF NOT EXISTS public.uct_stakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  stake_tier text NOT NULL,
  capability text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  revoked_at timestamptz,
  revoked_reason text,
  unlocks_at timestamptz
);

-- Create uct_burn_log table for tracking burn operations
CREATE TABLE IF NOT EXISTS public.uct_burn_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  burn_type text NOT NULL,
  action_context jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.uct_stakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uct_burn_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for uct_stakes
CREATE POLICY "Users can view their own stakes" ON public.uct_stakes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stakes" ON public.uct_stakes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stakes" ON public.uct_stakes
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for uct_burn_log
CREATE POLICY "Users can view their own burn log" ON public.uct_burn_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own burn log" ON public.uct_burn_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_uct_stakes_user_status ON public.uct_stakes(user_id, status);
CREATE INDEX IF NOT EXISTS idx_uct_burn_log_user_created ON public.uct_burn_log(user_id, created_at DESC);