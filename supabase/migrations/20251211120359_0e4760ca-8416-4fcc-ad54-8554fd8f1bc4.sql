-- Add explicit INSERT policy for email_credentials table
-- Email credentials should only be inserted by backend service (gmail-oauth-callback uses service role)
CREATE POLICY "Users can insert their own email credentials" 
ON public.email_credentials 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);