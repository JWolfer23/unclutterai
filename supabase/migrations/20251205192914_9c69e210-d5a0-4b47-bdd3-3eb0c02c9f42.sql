-- Create focus_rewards_history table for reward transparency & analytics
CREATE TABLE IF NOT EXISTS public.focus_rewards_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.focus_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reward_value numeric NOT NULL DEFAULT 0,
  streak_value numeric NOT NULL DEFAULT 0,
  tier_value numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.focus_rewards_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for focus_rewards_history
CREATE POLICY "Users can view their own reward history"
ON public.focus_rewards_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reward history"
ON public.focus_rewards_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Deduplicate focus_streaks by keeping one row per user
DELETE FROM public.focus_streaks a
USING public.focus_streaks b
WHERE a.ctid < b.ctid
AND a.user_id = b.user_id;

-- Now add the primary key
ALTER TABLE public.focus_streaks 
ADD CONSTRAINT focus_streaks_pkey PRIMARY KEY (user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_start ON public.focus_sessions(user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_focus_rewards_history_user ON public.focus_rewards_history(user_id, created_at);

-- Analytics function: Get focus minutes today
CREATE OR REPLACE FUNCTION public.get_focus_minutes_today(p_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(actual_minutes), 0)::integer
  FROM focus_sessions
  WHERE user_id = p_user_id
  AND DATE(start_time) = CURRENT_DATE
  AND is_completed = true;
$$;

-- Analytics function: Get focus minutes this week
CREATE OR REPLACE FUNCTION public.get_focus_minutes_week(p_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(actual_minutes), 0)::integer
  FROM focus_sessions
  WHERE user_id = p_user_id
  AND start_time >= DATE_TRUNC('week', CURRENT_DATE)
  AND is_completed = true;
$$;

-- Analytics function: Get UCT earned this week
CREATE OR REPLACE FUNCTION public.get_uct_earned_week(p_user_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(uct_reward), 0)
  FROM focus_sessions
  WHERE user_id = p_user_id
  AND start_time >= DATE_TRUNC('week', CURRENT_DATE)
  AND is_completed = true;
$$;

-- Analytics function: Get UCT earned this month
CREATE OR REPLACE FUNCTION public.get_uct_earned_month(p_user_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(uct_reward), 0)
  FROM focus_sessions
  WHERE user_id = p_user_id
  AND start_time >= DATE_TRUNC('month', CURRENT_DATE)
  AND is_completed = true;
$$;

-- Analytics function: Get lifetime UCT earned
CREATE OR REPLACE FUNCTION public.get_lifetime_uct(p_user_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(uct_reward), 0)
  FROM focus_sessions
  WHERE user_id = p_user_id
  AND is_completed = true;
$$;

-- Analytics function: Get sessions this week count
CREATE OR REPLACE FUNCTION public.get_sessions_this_week(p_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM focus_sessions
  WHERE user_id = p_user_id
  AND start_time >= DATE_TRUNC('week', CURRENT_DATE)
  AND is_completed = true;
$$;

-- Analytics function: Get focus minutes by day (last 30 days)
CREATE OR REPLACE FUNCTION public.get_focus_minutes_by_day(p_user_id uuid)
RETURNS TABLE(day date, total_minutes bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT DATE(start_time) AS day,
         COALESCE(SUM(actual_minutes), 0) AS total_minutes
  FROM focus_sessions
  WHERE user_id = p_user_id
  AND start_time >= NOW() - INTERVAL '30 days'
  AND is_completed = true
  GROUP BY DATE(start_time)
  ORDER BY day ASC;
$$;

-- Analytics function: Get mode usage breakdown
CREATE OR REPLACE FUNCTION public.get_mode_usage_breakdown(p_user_id uuid)
RETURNS TABLE(mode text, session_count bigint, total_minutes bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT mode,
         COUNT(*) AS session_count,
         COALESCE(SUM(actual_minutes), 0) AS total_minutes
  FROM focus_sessions
  WHERE user_id = p_user_id
  AND is_completed = true
  GROUP BY mode;
$$;

-- Analytics function: Calculate weekly consistency tier
CREATE OR REPLACE FUNCTION public.get_weekly_tier(p_user_id uuid)
RETURNS TABLE(tier text, bonus_percent numeric, sessions_count integer)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_sessions integer;
BEGIN
  SELECT COUNT(*)::integer INTO v_sessions
  FROM focus_sessions
  WHERE user_id = p_user_id
  AND start_time >= DATE_TRUNC('week', CURRENT_DATE)
  AND is_completed = true;
  
  IF v_sessions >= 10 THEN
    RETURN QUERY SELECT 'platinum'::text, 0.15::numeric, v_sessions;
  ELSIF v_sessions >= 7 THEN
    RETURN QUERY SELECT 'gold'::text, 0.10::numeric, v_sessions;
  ELSIF v_sessions >= 5 THEN
    RETURN QUERY SELECT 'silver'::text, 0.05::numeric, v_sessions;
  ELSIF v_sessions >= 3 THEN
    RETURN QUERY SELECT 'bronze'::text, 0.02::numeric, v_sessions;
  ELSE
    RETURN QUERY SELECT 'none'::text, 0.0::numeric, v_sessions;
  END IF;
END;
$$;