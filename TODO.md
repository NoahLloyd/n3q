# N3Q Mobile App — TODO

## Blocked (needs Supabase migration)
- [ ] Run `apps/web/supabase/migrations/add_mobile_auth.sql` migration
- [ ] Run `apps/web/supabase/migrations/add_push_tokens.sql` migration
- [ ] Test "Generate Login Code" flow end-to-end (web → mobile token exchange)
- [ ] Test push notifications on physical device

## Blocked (needs Apple Developer account)
- [ ] Fill in `eas.json` submit credentials (appleId, ascAppId, appleTeamId)
- [ ] First EAS Build + TestFlight submission
- [ ] Update EAS Update URL in app.json with real project ID

## Setup required
- [ ] Add `EXPO_TOKEN` secret to GitHub repo (from expo.dev/accounts/n3q/settings/access-tokens)

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
