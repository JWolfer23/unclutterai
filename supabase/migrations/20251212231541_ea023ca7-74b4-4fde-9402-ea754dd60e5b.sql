-- Extend sender_trust table with relationship intelligence columns
ALTER TABLE public.sender_trust
  ADD COLUMN IF NOT EXISTS relationship_type TEXT DEFAULT 'unknown' CHECK (relationship_type IN ('family', 'client', 'vendor', 'newsletter', 'acquaintance', 'drainer', 'unknown')),
  ADD COLUMN IF NOT EXISTS relationship_importance INTEGER DEFAULT 5 CHECK (relationship_importance >= 0 AND relationship_importance <= 10),
  ADD COLUMN IF NOT EXISTS relationship_notes JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS last_analyzed_at TIMESTAMP WITH TIME ZONE;

-- Create index for relationship lookups
CREATE INDEX IF NOT EXISTS idx_sender_trust_relationship ON public.sender_trust(user_id, relationship_type);
CREATE INDEX IF NOT EXISTS idx_sender_trust_importance ON public.sender_trust(user_id, relationship_importance DESC);