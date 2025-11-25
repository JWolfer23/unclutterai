-- Create focus_session_notes table
CREATE TABLE IF NOT EXISTS public.focus_session_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID REFERENCES public.focus_sessions(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('learning', 'health', 'career', 'wealth')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.focus_session_notes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notes"
  ON public.focus_session_notes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes"
  ON public.focus_session_notes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
  ON public.focus_session_notes
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
  ON public.focus_session_notes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.focus_session_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();