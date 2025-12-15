-- Add onchain_tx column to focus_ledger if it doesn't exist
ALTER TABLE public.focus_ledger ADD COLUMN IF NOT EXISTS onchain_tx text;

-- Add uct_change column to focus_ledger if missing (spec uses uct_change, table has uct_reward)
-- The table already has uct_reward, we'll use that