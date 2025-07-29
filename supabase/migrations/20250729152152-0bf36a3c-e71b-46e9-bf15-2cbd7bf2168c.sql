-- Add ai_summary column to messages table
ALTER TABLE public.messages 
ADD COLUMN ai_summary TEXT;