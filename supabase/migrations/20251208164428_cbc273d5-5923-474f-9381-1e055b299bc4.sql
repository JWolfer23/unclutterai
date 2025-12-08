-- Drop the obsolete get_user_weekly_stats function that references the deleted user_ai_dashboard view
DROP FUNCTION IF EXISTS public.get_user_weekly_stats();