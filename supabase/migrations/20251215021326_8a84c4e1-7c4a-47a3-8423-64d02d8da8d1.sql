-- Create UCT pricing table for demand-based pricing
CREATE TABLE public.uct_pricing (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  price numeric NOT NULL DEFAULT 1.0,
  demand_score numeric NOT NULL DEFAULT 0,
  price_multiplier numeric NOT NULL DEFAULT 1.0,
  total_uct_spent_24h numeric DEFAULT 0,
  total_active_users integer DEFAULT 0,
  avg_focus_sessions numeric DEFAULT 0,
  calculated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.uct_pricing ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read current price
CREATE POLICY "Anyone can read UCT pricing"
ON public.uct_pricing
FOR SELECT
USING (true);

-- Create index for latest price lookup
CREATE INDEX idx_uct_pricing_calculated_at ON public.uct_pricing(calculated_at DESC);