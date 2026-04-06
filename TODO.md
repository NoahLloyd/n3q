# N3Q Mobile App — TODO

## Blocked (needs Supabase migration)
- [ ] Run `apps/web/supabase/migrations/add_mobile_auth.sql` migration
- [ ] Run `apps/web/supabase/migrations/add_push_tokens.sql` migration
- [ ] Test "Generate Login Code" flow end-to-end (web → mobile token exchange)
- [ ] Test push notifications on physical device

## Blocked (needs Apple Developer account)
- [ ] Fill in `eas.json` submit credentials (appleId, ascAppId, appleTeamId)
- [ ] First EAS Build + TestFlight submission

## Setup required (needs repo admin)
- [ ] Add `EXPO_TOKEN` secret to GitHub repo → Settings → Secrets → Actions (token: generated from @n3q robot user `github-actions` on expo.dev)
- [ ] Link GitHub repo to Expo project → expo.dev → n3q → n3q → Settings → GitHub
- [ ] Enable branch protection on `main`:
  - Require 1 approval on PRs
  - Do NOT require CI to pass (informational only)
- [ ] Enable Supabase migrations (workflow at `.github/workflows/migrate.yml`, manual dispatch only):
  - Generate a Supabase access token at supabase.com/dashboard/account/tokens
  - Add `SUPABASE_ACCESS_TOKEN` secret to GitHub repo
  - Add `SUPABASE_PROJECT_ID` secret (value: `kwjoxtcubwekahthwgsk`)

## Done
- [x] Monorepo setup (pnpm + Turborepo)
- [x] Shared package (@n3q/shared)
- [x] All 5 tabs: Knowledge, Projects, Events, Voting, Directory
- [x] Detail screens for all tabs
- [x] Create/add screens for all tabs
- [x] Login screen with 6-digit code auth
- [x] Profile screen with sign out
- [x] Push notifications (registration, triggers, event reminders cron)
- [x] Push permission prompt + profile toggle
- [x] Design system matching web app (theme colors, Departure Mono, square corners)
- [x] Custom tab bar with animated labels
- [x] Custom header bar with profile avatar + plus icon
- [x] Custom back button with pixel arrow
- [x] Modal grabbers
- [x] Safe area insets on all screens
- [x] App icon + splash screen with N3Q branding
- [x] Loading skeletons / empty states polish
- [x] Offline: persisted TanStack Query cache via AsyncStorage
- [x] CI: GitHub Actions typecheck + lint on PRs
- [x] CD: EAS Build workflow (manual trigger, dev/preview/prod profiles)
- [x] CD: EAS Update workflow (auto OTA on push to main)
