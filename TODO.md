# N3Q Mobile App — TODO

## Blocked (needs Apple Developer account — waiting for D-U-N-S number)

The Apple Developer Program enrollment requires a D-U-N-S number for the N3Q organization. Once received:

1. **Enroll** at developer.apple.com/programs/enroll with the D-U-N-S number
2. **Create App ID** in Certificates, Identifiers & Profiles → bundle ID: `com.n3q.app`
3. **Create app** in App Store Connect → name: "N3Q", bundle ID: `com.n3q.app`
4. **Update `eas.json`** submit credentials:
   - `appleId`: the Apple ID email used to enroll
   - `ascAppId`: the numeric App Store Connect app ID (found in the app's URL)
   - `appleTeamId`: the team ID from developer.apple.com/account → Membership
5. **First build**: `eas build --profile production --platform ios`
6. **First submit**: `eas submit --platform ios`
7. **TestFlight**: Distribute to internal testers from App Store Connect
8. **App Store release**: Submit for review once tested

## Blocked (needs Google Play Developer account)

Google Play requires a one-time $25 registration fee.

1. **Register** at play.google.com/console
2. **Create app** → name: "N3Q", package: `com.n3q.app`
3. **First build**: `eas build --profile production --platform android`
4. **First submit**: `eas submit --platform android`
5. **Internal testing track**: Distribute APK/AAB for testing before public release

## Blocked (needs Supabase migration)
- [ ] Run `apps/web/supabase/migrations/add_mobile_auth.sql` migration
- [ ] Run `apps/web/supabase/migrations/add_push_tokens.sql` migration
- [ ] Test "Generate Login Code" flow end-to-end (web → mobile token exchange)
- [ ] Test push notifications on physical device

## Setup required (needs repo admin)
- [ ] Link GitHub repo to Expo project → expo.dev → n3q → n3q → Settings → GitHub
- [ ] Enable branch protection on `main`:
  - Require 1 approval on PRs
  - Do NOT require CI to pass (informational only)
- [ ] Enable Supabase migrations (workflow at `.github/workflows/migrate.yml`, manual dispatch only):
  - Generate a Supabase access token at supabase.com/dashboard/account/tokens
  - Add `SUPABASE_ACCESS_TOKEN` secret to GitHub repo
  - Add `SUPABASE_PROJECT_ID` secret (value: `kwjoxtcubwekahthwgsk`)

## Widgets (requires manual Xcode setup)

Widget SwiftUI code and data bridge are ready. The Expo config plugin for auto-adding the Widget Extension target is unreliable. Add manually in Xcode:

1. Open `apps/mobile/ios/N3Q.xcworkspace` in Xcode
2. File → New → Target → Widget Extension → name: `N3QWidget`, uncheck "Include Configuration App Intent"
3. Replace generated `N3QWidget.swift` with contents of `targets/widget/N3QWidget.swift`
4. Add App Group `group.com.n3q.app` to **both** the N3Q target and NQWidget target (Signing & Capabilities → + Capability → App Groups)
5. Build and run — widgets appear in the iOS home screen widget picker

**Note:** These manual Xcode changes are lost when `expo prebuild` regenerates the `ios/` directory. For persistent widget support, either fix the config plugin or migrate to a continuous native setup.

## To discuss
- [ ] Should we give backers of N3Q access to the web app and mobile app? If so, what level of access? Read-only (public pages) or full member access? Requires a backer verification flow or a separate role.

## Merge checklist (before merging feature/mobile-app → main)
- [ ] Supabase migrations applied (mobile_auth_tokens, mobile_refresh_tokens, push_tokens)
- [ ] End-to-end login code flow tested
- [ ] Push notifications tested on physical device
- [ ] At least one production EAS Build completed successfully
- [ ] App submitted to TestFlight and smoke-tested by a member

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
- [x] Shared navigation components (PixelArrow, BackButton, ModalHeader, PlusButton)
- [x] Developer docs (CLAUDE.md, CONTRIBUTING.md, RELEASES.md, DESIGN.md, README.md)
- [x] Add `EXPO_TOKEN` secret to GitHub repo → Settings → Secrets → Actions (token: generated from @n3q robot user `github-actions` on expo.dev)
