-- Create enum for source types
CREATE TYPE public.learning_source_type AS ENUM ('course', 'book', 'pdf', 'video', 'audio', 'article');

-- Create enum for goal types
CREATE TYPE public.learning_goal_type AS ENUM ('daily', 'weekly', 'milestone');

-- Create enum for note types
CREATE TYPE public.learning_note_type AS ENUM ('note', 'flashcard', 'summary');

-- Create learning_sources table
CREATE TABLE public.learning_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source_type learning_source_type NOT NULL,
  url TEXT,
  isbn TEXT,
  notes TEXT,
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create learning_goals table
CREATE TABLE public.learning_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  goal_type learning_goal_type NOT NULL,
  target_value INTEGER NOT NULL DEFAULT 1,
  current_value INTEGER NOT NULL DEFAULT 0,
  start_date DATE,
  end_date DATE,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create learning_notes table
CREATE TABLE public.learning_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_id UUID REFERENCES public.learning_sources(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags JSONB DEFAULT '[]'::jsonb,
  note_type learning_note_type DEFAULT 'note',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create learning_schedules table
CREATE TABLE public.learning_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  frequency TEXT NOT NULL DEFAULT 'daily',
  delivery_time TEXT NOT NULL DEFAULT '09:00',
  days_of_week JSONB DEFAULT '[]'::jsonb,
  channels JSONB DEFAULT '["in-app"]'::jsonb,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create learning_streaks table
CREATE TABLE public.learning_streaks (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_session DATE
);

-- Enable RLS on all tables
ALTER TABLE public.learning_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_streaks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for learning_sources
CREATE POLICY "Users can view their own sources"
  ON public.learning_sources FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sources"
  ON public.learning_sources FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sources"
  ON public.learning_sources FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sources"
  ON public.learning_sources FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for learning_goals
CREATE POLICY "Users can view their own goals"
  ON public.learning_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals"
  ON public.learning_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
  ON public.learning_goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals"
  ON public.learning_goals FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for learning_notes
CREATE POLICY "Users can view their own notes"
  ON public.learning_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes"
  ON public.learning_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
  ON public.learning_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
  ON public.learning_notes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for learning_schedules
CREATE POLICY "Users can view their own schedules"
  ON public.learning_schedules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own schedules"
  ON public.learning_schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedules"
  ON public.learning_schedules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedules"
  ON public.learning_schedules FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for learning_streaks
CREATE POLICY "Users can view their own streaks"
  ON public.learning_streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streaks"
  ON public.learning_streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks"
  ON public.learning_streaks FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX idx_learning_sources_user_id ON public.learning_sources(user_id);
CREATE INDEX idx_learning_goals_user_id ON public.learning_goals(user_id);
CREATE INDEX idx_learning_notes_user_id ON public.learning_notes(user_id);
CREATE INDEX idx_learning_notes_source_id ON public.learning_notes(source_id);
CREATE INDEX idx_learning_schedules_user_id ON public.learning_schedules(user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_learning_sources_updated_at
  BEFORE UPDATE ON public.learning_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_learning_goals_updated_at
  BEFORE UPDATE ON public.learning_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_learning_notes_updated_at
  BEFORE UPDATE ON public.learning_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();