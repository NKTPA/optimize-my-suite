CREATE TABLE public.audit_signal_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  url TEXT NOT NULL,
  raw_signals JSONB NOT NULL,
  computed_scores JSONB NOT NULL
);
CREATE INDEX audit_signal_log_created_at_idx ON public.audit_signal_log (created_at DESC);
CREATE INDEX audit_signal_log_url_idx ON public.audit_signal_log (url);
GRANT ALL ON public.audit_signal_log TO service_role;
ALTER TABLE public.audit_signal_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No client access to audit_signal_log"
  ON public.audit_signal_log FOR SELECT
  USING (false);