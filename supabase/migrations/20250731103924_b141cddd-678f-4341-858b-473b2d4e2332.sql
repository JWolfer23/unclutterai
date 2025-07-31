-- Add wallet_address to profiles table
ALTER TABLE public.profiles 
ADD COLUMN wallet_address TEXT;

-- Add scoring fields to tasks table
ALTER TABLE public.tasks 
ADD COLUMN score INTEGER CHECK (score >= 1 AND score <= 10),
ADD COLUMN urgency TEXT CHECK (urgency IN ('low', 'medium', 'high')),
ADD COLUMN importance TEXT CHECK (importance IN ('low', 'medium', 'high'));

-- Update tasks table due_date to be more specific (it already exists)
-- No changes needed for due_date as it already exists

-- Ensure messages.ai_summary exists (it already does)
-- No changes needed for ai_summary as it already exists