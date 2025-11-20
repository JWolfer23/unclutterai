-- Fix Security Definer View by setting security_invoker = true
-- This makes the view run with the permissions of the querying user, not the view creator
ALTER VIEW public.user_ai_dashboard SET (security_invoker = true);