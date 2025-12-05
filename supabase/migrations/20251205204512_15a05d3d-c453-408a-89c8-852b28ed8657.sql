-- Create focus_levels table for XP and leveling system
CREATE TABLE public.focus_levels (
  user_id UUID PRIMARY KEY,
  level INTEGER NOT NULL DEFAULT 1,
  xp_total INTEGER NOT NULL DEFAULT 0,
  xp_to_next INTEGER NOT NULL DEFAULT 100,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.focus_levels ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own focus level"
ON public.focus_levels
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own focus level"
ON public.focus_levels
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own focus level"
ON public.focus_levels
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_focus_levels_updated_at
BEFORE UPDATE ON public.focus_levels
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();