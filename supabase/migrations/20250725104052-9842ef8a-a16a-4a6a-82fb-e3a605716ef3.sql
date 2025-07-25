-- Fix critical RLS security issues

-- 1. Add RLS policies for focus_sessions table
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own focus sessions" 
ON public.focus_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own focus sessions" 
ON public.focus_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own focus sessions" 
ON public.focus_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own focus sessions" 
ON public.focus_sessions 
FOR DELETE 
USING (auth.uid() = user_id);

-- 2. Add RLS policies for interruptions table
ALTER TABLE public.interruptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own interruptions" 
ON public.interruptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interruptions" 
ON public.interruptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interruptions" 
ON public.interruptions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interruptions" 
ON public.interruptions 
FOR DELETE 
USING (auth.uid() = user_id);

-- 3. Remove the insecure "Allow read for all" policy from messages table
DROP POLICY IF EXISTS "Allow read for all" ON public.messages;

-- 4. Fix database function security by updating handle_updated_at function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

-- 5. Fix handle_new_user function security
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.tokens (user_id, balance)
  VALUES (NEW.id, 0);
  RETURN NEW;
END;
$function$;