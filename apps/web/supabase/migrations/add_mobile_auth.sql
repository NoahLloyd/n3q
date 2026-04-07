-- Mobile auth tokens (one-time codes for QR/link auth)
CREATE TABLE IF NOT EXISTS public.mobile_auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.mobile_auth_tokens ENABLE ROW LEVEL SECURITY;

-- Only service role can manage these tokens (API routes use service client)
CREATE POLICY "Service role can manage mobile auth tokens"
  ON public.mobile_auth_tokens
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Mobile refresh tokens
CREATE TABLE IF NOT EXISTS public.mobile_refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.mobile_refresh_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage mobile refresh tokens"
  ON public.mobile_refresh_tokens
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index for token lookups
CREATE INDEX IF NOT EXISTS idx_mobile_auth_tokens_token ON public.mobile_auth_tokens(token);
CREATE INDEX IF NOT EXISTS idx_mobile_refresh_tokens_hash ON public.mobile_refresh_tokens(token_hash);

-- Auto-cleanup expired tokens (optional - can be run via cron)
-- DELETE FROM public.mobile_auth_tokens WHERE expires_at < now() AND used_at IS NULL;
