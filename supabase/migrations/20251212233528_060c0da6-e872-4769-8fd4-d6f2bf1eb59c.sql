-- Telemetry events table for tracking metrics
CREATE TABLE public.telemetry_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  event_name text NOT NULL,
  payload jsonb DEFAULT '{}',
  latency_ms integer,
  success boolean DEFAULT true,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for querying metrics
CREATE INDEX idx_telemetry_events_type ON public.telemetry_events(event_type, created_at DESC);
CREATE INDEX idx_telemetry_events_user ON public.telemetry_events(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.telemetry_events ENABLE ROW LEVEL SECURITY;

-- Service role can insert (for edge functions)
CREATE POLICY "Service can insert telemetry" ON public.telemetry_events
  FOR INSERT WITH CHECK (true);

-- Users can view their own telemetry
CREATE POLICY "Users can view their own telemetry" ON public.telemetry_events
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Feature flags table
CREATE TABLE public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_name text UNIQUE NOT NULL,
  is_enabled boolean DEFAULT false,
  rollout_percentage integer DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  allowed_user_ids uuid[] DEFAULT '{}',
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS (read-only for authenticated users)
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read feature flags" ON public.feature_flags
  FOR SELECT USING (true);

-- Insert default feature flags
INSERT INTO public.feature_flags (flag_name, is_enabled, rollout_percentage, description) VALUES
  ('uct_tokenization', true, 100, 'Enable UCT token earning and display'),
  ('auto_send', false, 0, 'Enable automatic email sending'),
  ('auto_minting', false, 0, 'Enable on-chain token minting'),
  ('agent_marketplace', true, 50, 'Enable AI agent marketplace'),
  ('instant_catchup', true, 100, 'Enable instant catch-up feature'),
  ('smart_stream', true, 100, 'Enable smart stream batching'),
  ('gmail_sync', true, 100, 'Enable Gmail OAuth and sync'),
  ('news_mode', true, 100, 'Enable news mode features');

-- AI feedback table for quality tracking
CREATE TABLE public.ai_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ai_block_type text NOT NULL,
  input_hash text,
  output_preview text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  thumbs_up boolean,
  feedback_text text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own feedback" ON public.ai_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback" ON public.ai_feedback
  FOR SELECT USING (auth.uid() = user_id);

-- QA test runs table
CREATE TABLE public.qa_test_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_name text NOT NULL,
  test_category text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'passed', 'failed', 'skipped')),
  duration_ms integer,
  error_details jsonb,
  metadata jsonb DEFAULT '{}',
  run_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.qa_test_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage QA tests" ON public.qa_test_runs
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Updated at trigger for feature flags
CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();