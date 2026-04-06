# N3Q Mobile App — TODO

## Blocked (needs Supabase migration)
- [ ] Run `apps/web/supabase/migrations/add_mobile_auth.sql` migration
- [ ] Run `apps/web/supabase/migrations/add_push_tokens.sql` migration
- [ ] Test "Generate Login Code" flow end-to-end (web → mobile token exchange)
- [ ] Test push notifications on physical device

## Mobile App
- [ ] EAS Build setup for TestFlight distribution
- [ ] Loading skeletons / empty states polish
- [ ] Offline: show cached TanStack Query data

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
