-- Allow users to delete their own email credentials
CREATE POLICY "Users can delete their own email credentials"
ON public.email_credentials
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to update their own email credentials  
CREATE POLICY "Users can update their own email credentials"
ON public.email_credentials
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);