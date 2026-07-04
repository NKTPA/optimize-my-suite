ALTER TABLE public.audit_rate_limits
  ADD COLUMN allowed boolean NOT NULL DEFAULT false;

UPDATE public.audit_rate_limits SET allowed = true;

CREATE INDEX audit_rate_limits_allowed_created_at_idx
  ON public.audit_rate_limits (created_at DESC)
  WHERE allowed = true;
