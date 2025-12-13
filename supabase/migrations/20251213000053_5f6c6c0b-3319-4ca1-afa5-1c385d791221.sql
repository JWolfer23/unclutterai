-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table for RBAC
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Fix qa_test_runs: restrict to admins only
DROP POLICY IF EXISTS "Authenticated users can manage QA tests" ON public.qa_test_runs;

CREATE POLICY "Admins can manage QA tests"
ON public.qa_test_runs
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Fix telemetry_events SELECT: remove the user_id IS NULL leak
DROP POLICY IF EXISTS "Users can view their own telemetry" ON public.telemetry_events;

CREATE POLICY "Users can view their own telemetry"
ON public.telemetry_events
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all telemetry"
ON public.telemetry_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fix telemetry_events INSERT: restrict to user's own events
DROP POLICY IF EXISTS "Service can insert telemetry" ON public.telemetry_events;

CREATE POLICY "Users can insert their own telemetry"
ON public.telemetry_events
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Fix feature_flags: restrict to admin read access
DROP POLICY IF EXISTS "Anyone can read feature flags" ON public.feature_flags;

CREATE POLICY "Admins can read feature flags"
ON public.feature_flags
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));