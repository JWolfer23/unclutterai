-- Drop the existing view that exposes all users' data
DROP VIEW IF EXISTS public.user_ai_dashboard;

-- Create a security definer function that only returns the current user's dashboard
CREATE OR REPLACE FUNCTION public.get_user_ai_dashboard()
RETURNS TABLE (
  user_id uuid,
  email text,
  daily_summaries bigint,
  tasks_generated bigint,
  tokens_earned bigint,
  focus_streak integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id AS user_id,
    p.email,
    COALESCE((
      SELECT COUNT(*) 
      FROM ai_usage 
      WHERE user_id = auth.uid() 
      AND type = 'summary' 
      AND DATE(used_at) = CURRENT_DATE
    ), 0) AS daily_summaries,
    COALESCE((
      SELECT COUNT(*) 
      FROM tasks 
      WHERE user_id = auth.uid()
    ), 0) AS tasks_generated,
    COALESCE((
      SELECT balance::bigint 
      FROM tokens 
      WHERE user_id = auth.uid()
    ), 0) AS tokens_earned,
    COALESCE((
      SELECT current_streak 
      FROM focus_streaks 
      WHERE user_id = auth.uid()
    ), 0) AS focus_streak
  FROM profiles p
  WHERE p.id = auth.uid();
$$;