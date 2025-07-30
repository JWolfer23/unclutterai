-- Update the handle_new_user function with better error handling and logging
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert into profiles table with proper conflict handling
  INSERT INTO public.profiles (id, onboarding_completed, created_at, updated_at)
  VALUES (NEW.id, false, now(), now())
  ON CONFLICT (id) DO UPDATE SET
    updated_at = now();
  
  -- Insert into tokens table with proper conflict handling
  INSERT INTO public.tokens (user_id, balance, updated_at)
  VALUES (NEW.id, 0, now())
  ON CONFLICT (user_id) DO UPDATE SET
    updated_at = now();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't block user creation
    RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$;