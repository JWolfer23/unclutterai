-- Create assistant_profiles table for global assistant state
CREATE TABLE public.assistant_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Role & Authority
  role text NOT NULL DEFAULT 'analyst' CHECK (role IN ('analyst', 'operator')),
  authority_level integer NOT NULL DEFAULT 0 CHECK (authority_level >= 0 AND authority_level <= 3),
  
  -- Allowed Actions (what assistant CAN do)
  allowed_actions jsonb NOT NULL DEFAULT '{
    "draft_replies": false,
    "schedule_items": false,
    "archive_items": false,
    "auto_handle_low_risk": false
  }'::jsonb,
  
  -- Trust Boundaries (what assistant MUST ask for)
  trust_boundaries jsonb NOT NULL DEFAULT '{
    "send_messages": true,
    "schedule_meetings": true,
    "delete_content": true
  }'::jsonb,
  
  -- Decision Style
  decision_style text NOT NULL DEFAULT 'ask' CHECK (
    decision_style IN ('decide_for_me', 'suggest', 'ask')
  ),
  
  -- Interruption Preference
  interruption_preference text NOT NULL DEFAULT 'balanced' CHECK (
    interruption_preference IN ('minimal', 'time_sensitive', 'balanced')
  ),
  
  -- Tone Preference
  tone_preference text NOT NULL DEFAULT 'calm' CHECK (
    tone_preference IN ('minimal', 'calm', 'analytical')
  ),
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.assistant_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own assistant profile"
  ON public.assistant_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own assistant profile"
  ON public.assistant_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assistant profile"
  ON public.assistant_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_assistant_profiles_user_id ON public.assistant_profiles(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_assistant_profiles_updated_at
  BEFORE UPDATE ON public.assistant_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();