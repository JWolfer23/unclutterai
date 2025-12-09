-- Enable pgcrypto for encryption functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create email_credentials table for storing OAuth tokens
CREATE TABLE public.email_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL CHECK (provider IN ('gmail', 'outlook', 'apple_mail')),
  email_address text NOT NULL,
  access_token_encrypted text NOT NULL,
  refresh_token_encrypted text NOT NULL,
  token_expires_at timestamptz,
  scopes text[],
  is_active boolean DEFAULT true,
  last_sync_at timestamptz,
  sync_error text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, email_address)
);

-- Enable RLS on email_credentials
ALTER TABLE public.email_credentials ENABLE ROW LEVEL SECURITY;

-- Users can only view their own credentials (without token values for security)
CREATE POLICY "Users can view their own email credentials"
ON public.email_credentials
FOR SELECT
USING (auth.uid() = user_id);

-- Only service role can insert/update/delete (edge functions handle this)
-- No user-facing policies for INSERT/UPDATE/DELETE

-- Add new columns to messages table for email integration
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS thread_id text,
ADD COLUMN IF NOT EXISTS priority_score integer CHECK (priority_score >= 1 AND priority_score <= 5),
ADD COLUMN IF NOT EXISTS sender_handle text,
ADD COLUMN IF NOT EXISTS external_message_id text,
ADD COLUMN IF NOT EXISTS channel_type text DEFAULT 'email',
ADD COLUMN IF NOT EXISTS labels jsonb DEFAULT '[]'::jsonb;

-- Add INSERT policy to messages table (currently missing)
CREATE POLICY "Users can insert their own messages"
ON public.messages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add index for deduplication on external_message_id
CREATE INDEX IF NOT EXISTS idx_messages_external_id ON public.messages(external_message_id);

-- Add index for thread grouping
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON public.messages(thread_id);

-- Add index for priority filtering
CREATE INDEX IF NOT EXISTS idx_messages_priority ON public.messages(user_id, priority_score);

-- Add trigger for updated_at on email_credentials
CREATE TRIGGER update_email_credentials_updated_at
BEFORE UPDATE ON public.email_credentials
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();