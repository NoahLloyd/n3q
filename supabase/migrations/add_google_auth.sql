-- Add Google auth support to profiles
-- Run this migration against your Supabase database to enable Google sign-up

-- Add new columns (safe to re-run — uses IF NOT EXISTS)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS wallet_address text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS auth_method text DEFAULT 'wallet' CHECK (auth_method IN ('wallet', 'google')),
  ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_by text,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS google_user_id text;

-- Existing wallet-based profiles are automatically verified
UPDATE public.profiles SET is_verified = true WHERE auth_method = 'wallet' OR auth_method IS NULL;

-- Index for looking up profiles by google_user_id (linked accounts)
CREATE INDEX IF NOT EXISTS idx_profiles_google_user_id ON public.profiles (google_user_id) WHERE google_user_id IS NOT NULL;

-- Index for looking up profiles by email
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email) WHERE email IS NOT NULL;

-- Ensure the "Profiles are viewable by everyone" policy exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Profiles are viewable by everyone'
  ) THEN
    CREATE POLICY "Profiles are viewable by everyone"
      ON public.profiles
      FOR SELECT
      USING (true);
  END IF;
END
$$;

-- IMPORTANT: Member verification requires SUPABASE_SERVICE_ROLE_KEY to be set in your .env
-- The service client bypasses RLS to allow one member to update another member's is_verified field.
-- Get your service role key from: Supabase Dashboard > Settings > API > service_role (secret)
