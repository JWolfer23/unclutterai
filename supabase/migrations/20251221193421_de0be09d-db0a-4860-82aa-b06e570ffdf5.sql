-- Fix the Security Definer View issue by recreating without SECURITY DEFINER
-- The view should use SECURITY INVOKER (default) to respect RLS policies

DROP VIEW IF EXISTS public.uct_pricing_public;

-- Create view with explicit SECURITY INVOKER (the default, but explicit is better)
CREATE VIEW public.uct_pricing_public 
WITH (security_invoker = true) AS
SELECT 
  id,
  price,
  calculated_at,
  created_at
FROM public.uct_pricing
ORDER BY calculated_at DESC
LIMIT 1;

-- Re-grant access to the view
GRANT SELECT ON public.uct_pricing_public TO authenticated, anon;