CREATE TABLE public.audit_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  ip_hash text NOT NULL,
  email text NULL
);

CREATE INDEX audit_rate_limits_ip_hash_created_at_idx
  ON public.audit_rate_limits (ip_hash, created_at DESC);

CREATE INDEX audit_rate_limits_created_at_idx
  ON public.audit_rate_limits (created_at DESC);

GRANT ALL ON public.audit_rate_limits TO service_role;

ALTER TABLE public.audit_rate_limits ENABLE ROW LEVEL SECURITY;

-- No policies for anon/authenticated: only service_role (edge function) may read/write.
