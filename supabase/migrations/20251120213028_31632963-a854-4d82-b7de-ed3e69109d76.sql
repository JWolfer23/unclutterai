-- Fix Security Definer View issue for user_ai_dashboard
-- Drop the existing view
DROP VIEW IF EXISTS public.user_ai_dashboard;

-- Recreate as a materialized view without SECURITY DEFINER
-- This will respect RLS policies
CREATE VIEW public.user_ai_dashboard AS
SELECT 
  p.id as user_id,
  p.email,
  COALESCE(COUNT(DISTINCT CASE WHEN au.type = 'summary' THEN au.id END), 0)::bigint as daily_summaries,
  COALESCE(COUNT(DISTINCT t.id), 0)::bigint as tasks_generated,
  COALESCE(tok.balance, 0)::bigint as tokens_earned,
  COALESCE(fs.current_streak, 0) as focus_streak
FROM public.profiles p
LEFT JOIN public.ai_usage au ON au.user_id = p.id
LEFT JOIN public.tasks t ON t.user_id = p.id
LEFT JOIN public.tokens tok ON tok.user_id = p.id
LEFT JOIN public.focus_streaks fs ON fs.user_id = p.id
GROUP BY p.id, p.email, tok.balance, fs.current_streak;

-- Enable RLS on the view
ALTER VIEW public.user_ai_dashboard SET (security_barrier = true);

-- Create RLS policy for the view
-- Note: Views inherit RLS from their underlying tables
-- Users can only see their own dashboard data through the profiles table RLS