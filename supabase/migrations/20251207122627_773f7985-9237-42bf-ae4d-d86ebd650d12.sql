-- Add wallet_provider column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS wallet_provider text;

-- Add index for faster wallet lookups
CREATE INDEX IF NOT EXISTS idx_profiles_wallet_address ON public.profiles(wallet_address) WHERE wallet_address IS NOT NULL;