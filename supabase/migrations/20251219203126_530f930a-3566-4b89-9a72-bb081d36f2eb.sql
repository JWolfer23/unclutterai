-- Create onboarding missions table
CREATE TABLE public.onboarding_missions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  mission_id text NOT NULL,
  completed_at timestamp with time zone,
  uct_awarded numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, mission_id)
);

-- Enable RLS
ALTER TABLE public.onboarding_missions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own missions"
ON public.onboarding_missions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own missions"
ON public.onboarding_missions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own missions"
ON public.onboarding_missions
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_onboarding_missions_user_id ON public.onboarding_missions(user_id);

-- Create function to award UCT on mission completion
CREATE OR REPLACE FUNCTION public.complete_onboarding_mission(
  p_user_id uuid,
  p_mission_id text,
  p_uct_reward numeric DEFAULT 10
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_already_completed boolean;
  v_result jsonb;
BEGIN
  -- Check if already completed
  SELECT completed_at IS NOT NULL INTO v_already_completed
  FROM onboarding_missions
  WHERE user_id = p_user_id AND mission_id = p_mission_id;

  IF v_already_completed THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_completed');
  END IF;

  -- Insert or update mission as completed
  INSERT INTO onboarding_missions (user_id, mission_id, completed_at, uct_awarded)
  VALUES (p_user_id, p_mission_id, now(), p_uct_reward)
  ON CONFLICT (user_id, mission_id)
  DO UPDATE SET completed_at = now(), uct_awarded = p_uct_reward, updated_at = now()
  WHERE onboarding_missions.completed_at IS NULL;

  -- Award UCT to user balance
  INSERT INTO uct_balances (user_id, balance, pending)
  VALUES (p_user_id, p_uct_reward, 0)
  ON CONFLICT (user_id)
  DO UPDATE SET balance = uct_balances.balance + p_uct_reward, updated_at = now();

  -- Log the reward in focus_ledger
  INSERT INTO focus_ledger (user_id, event_type, uct_reward, payload)
  VALUES (p_user_id, 'onboarding_mission', p_uct_reward, jsonb_build_object('mission_id', p_mission_id));

  RETURN jsonb_build_object('success', true, 'uct_awarded', p_uct_reward);
END;
$$;