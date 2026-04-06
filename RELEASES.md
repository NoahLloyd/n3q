# Release Pipeline

How changes go from a PR to production for both the web app and mobile app.

## Web App (Vercel)

```
PR opened → CI runs (typecheck + lint) → Review → Merge to main → Vercel auto-deploys
```

1. **PR**: CI checks run automatically (typecheck all packages, lint web)
2. **Vercel Preview**: Each PR gets a preview deployment at a unique URL
3. **Merge to main**: Vercel auto-deploys to production at n3q.house
4. **Rollback**: Instant via Vercel dashboard if something breaks

**Config**: `apps/web/vercel.json` — build command runs `pnpm turbo build --filter @n3q/web`

### When migrations are involved

If your PR adds a file to `apps/web/supabase/migrations/`:
1. The `migrate.yml` workflow runs `supabase db push` automatically on merge
2. Migrations run **before** the new code goes live (Vercel deploy takes ~60s, migration is instant)
3. If the migration fails, check the GitHub Actions log — the web deploy will still proceed, so coordinate with a team member if the migration is required for the new code

## Mobile App (EAS)

There are two types of mobile releases:

### OTA Update (JS-only changes)

```
Merge to main → EAS Update auto-publishes → Users get update on next app open
```

- **Triggers**: Automatically when `apps/mobile/**` or `packages/shared/**` changes on main
- **Workflow**: `.github/workflows/mobile-update.yml`
- **Speed**: ~2 minutes from merge to available
- **No App Store review needed**
- **Limitations**: Can't change native modules, app icon, splash screen, or permissions

Use OTA for: UI changes, bug fixes, new screens, query changes, styling updates.

### Native Build (App Store release)

```
Manual trigger → EAS Build → TestFlight → Internal testing → App Store review → Release
```

1. **Trigger**: Go to GitHub Actions → "Mobile Build" → Run workflow
   - Choose profile: `preview` (internal testing) or `production` (App Store)
   - Choose platform: `ios`, `android`, or `all`
2. **Build**: EAS builds in the cloud (~10-15 minutes)
3. **Preview builds**: Distributed to internal testers via Expo dashboard
4. **Production builds**: Submitted to App Store Connect / Google Play via `eas submit`
5. **TestFlight**: iOS builds go to TestFlight for beta testing
6. **Release**: After testing, release from App Store Connect

Use native builds for: Expo SDK upgrades, new native modules, app icon changes, permission changes, first release.

### When do I need a native build vs OTA?

| Change | OTA Update | Native Build |
|---|---|---|
| Fix a bug in a screen | Yes | |
| Add a new screen | Yes | |
| Change card styling | Yes | |
| Update shared queries | Yes | |
| Add a new npm package (JS-only) | Yes | |
| Upgrade Expo SDK | | Yes |
| Add expo-camera or other native module | | Yes |
| Change app icon or splash screen | | Yes |
| Change app.json permissions | | Yes |
| First release to App Store | | Yes |

## Version Management

- **Web**: No versioning — continuous deployment via Vercel
- **Mobile**: `version` in `apps/mobile/app.json`, auto-incremented by EAS on production builds
- **Runtime version**: Uses `fingerprint` policy — EAS automatically determines if an OTA update is compatible with the installed native build

## Secrets Required

| Secret | Where | Purpose |
|---|---|---|
| `EXPO_TOKEN` | GitHub repo | EAS Build + Update workflows |
| `SUPABASE_ACCESS_TOKEN` | GitHub repo | Auto-migration workflow |
| `SUPABASE_PROJECT_ID` | GitHub repo | Auto-migration workflow |

All secrets are added by a repo admin in GitHub → Settings → Secrets → Actions.

## Monitoring

- **Web**: Vercel dashboard — deployment logs, function logs, analytics
- **Mobile**: Expo dashboard — build status, update history, crash reports
- **Database**: Supabase dashboard — query performance, RLS policy logs
- **Push notifications**: Expo Push API receipts (check for `DeviceNotRegistered` errors to clean stale tokens)
