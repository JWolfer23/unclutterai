-- Add new columns to focus_sessions table for full backend functionality
ALTER TABLE public.focus_sessions 
ADD COLUMN IF NOT EXISTS mode text,
ADD COLUMN IF NOT EXISTS goal text,
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS uct_reward numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_completed boolean DEFAULT false;