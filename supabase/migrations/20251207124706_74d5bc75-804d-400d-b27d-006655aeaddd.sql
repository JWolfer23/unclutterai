-- Add tokens_pending and tokens_claimed columns to tokens table
ALTER TABLE public.tokens 
ADD COLUMN IF NOT EXISTS tokens_pending integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS tokens_claimed integer DEFAULT 0;

-- Add constraints to prevent negative values
ALTER TABLE public.tokens 
ADD CONSTRAINT tokens_pending_non_negative CHECK (tokens_pending >= 0),
ADD CONSTRAINT tokens_claimed_non_negative CHECK (tokens_claimed >= 0);