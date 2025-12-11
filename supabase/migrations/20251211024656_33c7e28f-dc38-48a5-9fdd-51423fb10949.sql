-- Fix existing Gmail messages that have NULL user_id
-- Assign them to the user who owns the Gmail credential
UPDATE messages 
SET user_id = ec.user_id
FROM email_credentials ec
WHERE messages.platform = 'gmail'
AND messages.user_id IS NULL
AND ec.provider = 'gmail'
AND ec.is_active = true;