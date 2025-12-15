-- Create AI Agent Marketplace table
CREATE TABLE public.ai_agent_marketplace (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  uct_cost numeric NOT NULL CHECK (uct_cost > 0),
  creator_id uuid NOT NULL,
  icon text,
  estimated_time_mins integer DEFAULT 5,
  complexity text DEFAULT 'medium',
  status text NOT NULL DEFAULT 'active',
  usage_count integer DEFAULT 0,
  rating numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_agent_marketplace ENABLE ROW LEVEL SECURITY;

-- Anyone can view active agents
CREATE POLICY "Anyone can view active agents"
ON public.ai_agent_marketplace
FOR SELECT
USING (status = 'active');

-- Creators can manage their own agents
CREATE POLICY "Creators can insert their own agents"
ON public.ai_agent_marketplace
FOR INSERT
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their own agents"
ON public.ai_agent_marketplace
FOR UPDATE
USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their own agents"
ON public.ai_agent_marketplace
FOR DELETE
USING (auth.uid() = creator_id);

-- Create indexes
CREATE INDEX idx_marketplace_category ON public.ai_agent_marketplace(category);
CREATE INDEX idx_marketplace_status ON public.ai_agent_marketplace(status);
CREATE INDEX idx_marketplace_creator ON public.ai_agent_marketplace(creator_id);