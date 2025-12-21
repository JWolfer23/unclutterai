-- Add account_id to link messages to specific email credentials
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.email_credentials(id) ON DELETE SET NULL;

-- Create index for efficient lookups by account
CREATE INDEX IF NOT EXISTS idx_messages_account_id ON public.messages(account_id);

-- Create index for unified inbox queries (priority-based sorting)
CREATE INDEX IF NOT EXISTS idx_messages_unified_inbox ON public.messages(user_id, is_read, is_archived, priority_score DESC, received_at DESC);