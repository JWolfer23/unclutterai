-- Create user_wallets table for multi-wallet support
CREATE TABLE IF NOT EXISTS public.user_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  wallet_address text NOT NULL,
  chain text NOT NULL,
  wallet_type text NOT NULL,
  wallet_provider text NOT NULL,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, wallet_address)
);

-- Enable RLS
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_wallets
CREATE POLICY "Users can view their own wallets" ON public.user_wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallets" ON public.user_wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallets" ON public.user_wallets
  FOR UPDATE USING (auth.uid() = user_id);

-- Create uct_balances table for token balance tracking
CREATE TABLE IF NOT EXISTS public.uct_balances (
  user_id uuid PRIMARY KEY,
  balance numeric DEFAULT 0,
  pending numeric DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.uct_balances ENABLE ROW LEVEL SECURITY;

-- RLS policies for uct_balances
CREATE POLICY "Users can view their own balance" ON public.uct_balances
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own balance" ON public.uct_balances
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own balance" ON public.uct_balances
  FOR UPDATE USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON public.user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallets_chain ON public.user_wallets(chain);