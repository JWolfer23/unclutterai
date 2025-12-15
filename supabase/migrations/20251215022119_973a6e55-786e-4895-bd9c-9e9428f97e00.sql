-- Create UCT metrics daily snapshot table
CREATE TABLE public.uct_metrics_daily (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metrics_json jsonb NOT NULL,
  total_uct_earned numeric DEFAULT 0,
  total_uct_spent numeric DEFAULT 0,
  total_uct_decayed numeric DEFAULT 0,
  avg_uct_per_user numeric DEFAULT 0,
  daily_active_earners integer DEFAULT 0,
  agent_revenue_uct numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.uct_metrics_daily ENABLE ROW LEVEL SECURITY;

-- Only admins can view metrics
CREATE POLICY "Admins can view metrics"
ON public.uct_metrics_daily
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Create index for date lookups
CREATE INDEX idx_uct_metrics_created_at ON public.uct_metrics_daily(created_at DESC);