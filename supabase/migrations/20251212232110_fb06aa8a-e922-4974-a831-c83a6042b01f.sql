-- Drop and recreate the index if it exists with different definition
DROP INDEX IF EXISTS idx_focus_ledger_event_type;
CREATE INDEX idx_focus_ledger_event_type ON public.focus_ledger(user_id, event_type);