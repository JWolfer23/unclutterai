-- Fix security vulnerability: make view respect RLS policies
ALTER VIEW user_ai_dashboard SET (security_invoker = true);