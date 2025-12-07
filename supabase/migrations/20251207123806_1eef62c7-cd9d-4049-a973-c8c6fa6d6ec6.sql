-- Create UCT claim history table
CREATE TABLE public.uct_claim_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  wallet_address text NOT NULL,
  tx_hash text,
  status text NOT NULL DEFAULT 'pending',
  network text NOT NULL DEFAULT 'base-sepolia',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.uct_claim_history ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own claim history"
ON public.uct_claim_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own claims"
ON public.uct_claim_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_uct_claims_user_id ON public.uct_claim_history(user_id);
CREATE INDEX idx_uct_claims_status ON public.uct_claim_history(status);