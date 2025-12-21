-- Fix 1: Add auth.uid() validation to complete_onboarding_mission()
CREATE OR REPLACE FUNCTION public.complete_onboarding_mission(p_user_id uuid, p_mission_id text, p_uct_reward numeric DEFAULT 10)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_already_completed boolean;
  v_result jsonb;
BEGIN
  -- SECURITY: Validate that the caller can only complete missions for themselves
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot complete missions for other users';
  END IF;

  -- Check if already completed
  SELECT completed_at IS NOT NULL INTO v_already_completed
  FROM onboarding_missions
  WHERE user_id = p_user_id AND mission_id = p_mission_id;

  IF v_already_completed THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_completed');
  END IF;

  -- Insert or update mission as completed
  INSERT INTO onboarding_missions (user_id, mission_id, completed_at, uct_awarded)
  VALUES (p_user_id, p_mission_id, now(), p_uct_reward)
  ON CONFLICT (user_id, mission_id)
  DO UPDATE SET completed_at = now(), uct_awarded = p_uct_reward, updated_at = now()
  WHERE onboarding_missions.completed_at IS NULL;

  -- Award UCT to user balance
  INSERT INTO uct_balances (user_id, balance, pending)
  VALUES (p_user_id, p_uct_reward, 0)
  ON CONFLICT (user_id)
  DO UPDATE SET balance = uct_balances.balance + p_uct_reward, updated_at = now();

  -- Log the reward in focus_ledger
  INSERT INTO focus_ledger (user_id, event_type, uct_reward, payload)
  VALUES (p_user_id, 'onboarding_mission', p_uct_reward, jsonb_build_object('mission_id', p_mission_id));

  RETURN jsonb_build_object('success', true, 'uct_awarded', p_uct_reward);
END;
$function$;

-- Fix 2: Create a public view for UCT pricing that only exposes essential info
-- First, drop the existing public read policy
DROP POLICY IF EXISTS "Anyone can read UCT pricing" ON public.uct_pricing;

-- Create a view that only exposes essential pricing info
CREATE OR REPLACE VIEW public.uct_pricing_public AS
SELECT 
  id,
  price,
  calculated_at,
  created_at
FROM public.uct_pricing
ORDER BY calculated_at DESC
LIMIT 1;

-- Grant access to the view
GRANT SELECT ON public.uct_pricing_public TO authenticated, anon;

-- Create admin-only policy for the full table
CREATE POLICY "Admins can read full pricing data"
ON public.uct_pricing
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow authenticated users to read only through the view (for basic price display)
CREATE POLICY "Users can read latest price only"
ON public.uct_pricing
FOR SELECT
TO authenticated
USING (
  id = (SELECT id FROM public.uct_pricing ORDER BY calculated_at DESC LIMIT 1)
);