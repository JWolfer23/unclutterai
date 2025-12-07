-- Drop the tokens_pending and tokens_claimed columns (moving to claims table pattern)
ALTER TABLE public.tokens 
DROP COLUMN IF EXISTS tokens_pending,
DROP COLUMN IF EXISTS tokens_claimed;

-- Drop old constraints if they exist
ALTER TABLE public.tokens 
DROP CONSTRAINT IF EXISTS tokens_pending_non_negative,
DROP CONSTRAINT IF EXISTS tokens_claimed_non_negative;

-- Create tokens_claims table (replaces/extends uct_claim_history with cleaner naming)
CREATE TABLE IF NOT EXISTS public.tokens_claims (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  tx_hash text,
  wallet_address text NOT NULL,
  network text NOT NULL DEFAULT 'base-sepolia',
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tokens_claims ENABLE ROW LEVEL SECURITY;

-- RLS policies for tokens_claims
CREATE POLICY "Users can view their own claims" 
ON public.tokens_claims 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own claims" 
ON public.tokens_claims 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Only backend can update claims (for status changes)
-- Users cannot update their own claims directly

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_tokens_claims_user_status 
ON public.tokens_claims(user_id, status);

CREATE INDEX IF NOT EXISTS idx_tokens_claims_user_created 
ON public.tokens_claims(user_id, created_at DESC);

-- Add constraint to prevent negative balance on tokens
ALTER TABLE public.tokens 
DROP CONSTRAINT IF EXISTS tokens_balance_non_negative;

ALTER TABLE public.tokens 
ADD CONSTRAINT tokens_balance_non_negative CHECK (balance >= 0);