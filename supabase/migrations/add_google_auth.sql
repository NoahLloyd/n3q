-- Add Google auth support to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS wallet_address text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS auth_method text DEFAULT 'wallet' CHECK (auth_method IN ('wallet', 'google')),
  ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS verified_at timestamptz;

-- Existing wallet-based profiles are automatically verified
UPDATE public.profiles SET is_verified = true WHERE auth_method = 'wallet' OR auth_method IS NULL;

-- Allow anon users to read profiles (for pending verification page)
-- Already exists: "Profiles are viewable by everyone"

-- Allow service role to update verification status
-- (handled by service client, bypasses RLS)
