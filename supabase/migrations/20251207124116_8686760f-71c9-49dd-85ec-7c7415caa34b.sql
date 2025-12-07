-- Add CHECK constraint to prevent negative token balances
ALTER TABLE public.tokens 
ADD CONSTRAINT tokens_balance_non_negative CHECK (balance >= 0);

-- Add CHECK constraint for valid EVM wallet addresses in profiles
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_wallet_address_valid CHECK (
  wallet_address IS NULL OR (
    LENGTH(wallet_address) = 42 AND 
    wallet_address LIKE '0x%'
  )
);

-- Add index for rate limiting queries on claim history
CREATE INDEX IF NOT EXISTS idx_uct_claims_user_created 
ON public.uct_claim_history(user_id, created_at DESC);