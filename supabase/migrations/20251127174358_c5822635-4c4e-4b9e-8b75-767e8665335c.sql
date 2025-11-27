-- Create news_prompts table for custom user prompts
CREATE TABLE public.news_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  prompt_text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create news_schedules table for delivery preferences
CREATE TABLE public.news_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'daily', -- 'daily' or 'weekly'
  delivery_time TEXT NOT NULL DEFAULT '09:00', -- HH:mm format
  channels JSONB DEFAULT '["in-app"]'::jsonb, -- array of channels
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create news_summaries table to store generated summaries
CREATE TABLE public.news_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  prompt_id UUID,
  summary_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.news_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for news_prompts
CREATE POLICY "Users can view their own prompts"
ON public.news_prompts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prompts"
ON public.news_prompts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prompts"
ON public.news_prompts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prompts"
ON public.news_prompts FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for news_schedules
CREATE POLICY "Users can view their own schedules"
ON public.news_schedules FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own schedules"
ON public.news_schedules FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedules"
ON public.news_schedules FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedules"
ON public.news_schedules FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for news_summaries
CREATE POLICY "Users can view their own summaries"
ON public.news_summaries FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own summaries"
ON public.news_summaries FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own summaries"
ON public.news_summaries FOR DELETE
USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_news_prompts_updated_at
BEFORE UPDATE ON public.news_prompts
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_news_schedules_updated_at
BEFORE UPDATE ON public.news_schedules
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();