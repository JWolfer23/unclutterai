-- Enable pg_cron extension for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests  
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule weekly email reports every Monday at 8 AM UTC
-- Note: This runs at 8 AM UTC, users will need to adjust for their local timezone
SELECT cron.schedule(
  'weekly-unclutter-ai-reports',
  '0 8 * * 1', -- Every Monday at 8:00 AM UTC
  $$
  SELECT
    net.http_post(
        url:='https://aihlehujbzkkugzmcobn.supabase.co/functions/v1/weekly-report',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpaGxlaHVqYnpra3Vnem1jb2JuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2Mjc5MzMsImV4cCI6MjA2NzIwMzkzM30.ynMPVsQsz9W-SuyZmP84spoRsxp5GBWRbGvOpNFx7KI"}'::jsonb,
        body:='{"trigger": "cron"}'::jsonb
    ) as request_id;
  $$
);