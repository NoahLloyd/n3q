# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

n3q is a DAO community hub with NFT-gated membership on Base chain. It combines a Next.js web app, an Expo mobile app, and a shared package in a pnpm monorepo managed by Turborepo.

## Commands

```bash
# Root (runs across all workspaces via Turbo)
pnpm dev             # Start all apps in parallel
pnpm build           # Build all (respects dependency order)
pnpm lint            # ESLint across workspaces
pnpm typecheck       # TypeScript check across workspaces

# Install dependencies
pnpm install --frozen-lockfile   # CI / clean install
pnpm install                     # Local dev

# Web app (apps/web)
cd apps/web && pnpm dev    # Next.js dev server on :3000 (uses --webpack flag)
cd apps/web && pnpm build  # Production build (uses --webpack flag)
cd apps/web && pnpm lint   # ESLint

# Mobile app (apps/mobile)
cd apps/mobile && pnpm start       # Expo dev server
cd apps/mobile && pnpm ios         # iOS simulator
cd apps/mobile && pnpm android     # Android emulator
cd apps/mobile && pnpm typecheck   # TypeScript check
```

No test framework is configured.

## Architecture

```
n3q/
├── apps/web/          # Next.js 16 (App Router), React 19, Tailwind v4, shadcn/ui
├── apps/mobile/       # Expo SDK 54, React Native 0.81, Expo Router v6
├── packages/shared/   # @n3q/shared — types, constants, Supabase query helpers
├── .github/workflows/ # CI (typecheck + lint), EAS Build, EAS Update
└── pnpm-workspace.yaml
```

### Web App (`apps/web/src/`)

- **Pages**: `app/dashboard/` -- feed, voting, events, projects, directory, profile
- **API routes**: `app/api/` -- all POST handlers (auth, members, content, calendar, link-preview, mobile-token, mobile-exchange)
- **Auth**: `lib/auth/context.tsx` -- dual auth via wallet (wagmi/RainbowKit) or Google OAuth (Supabase Auth). `useAuth()` hook provides `userId`, `isAuthenticated`, `isMember`, `authMethod`.
- **Web3**: `lib/web3/` -- wagmi config (Base chain only), NFT contract hooks, RainbowKit
- **JWT**: `lib/jwt.ts` -- custom HS256 JWT signing/verification for mobile sessions using `MOBILE_JWT_SECRET`
- **Supabase clients**: `lib/supabase/client.ts` (browser), `server.ts` (RSC/route handlers), `service-client.ts` (admin/bypass RLS)
- **UI**: shadcn/ui components in `components/ui/`, Radix primitives, Lucide icons, `clsx` + `tailwind-merge` for className composition

### Mobile App (`apps/mobile/`)

- **Routing**: Expo Router file-based routing in `app/` with tab navigation in `app/(tabs)/`
- **Tabs**: Knowledge (feed), Projects, Events, Voting, Directory -- custom animated tab bar with BlurView glass effect
- **Auth**: 6-digit code flow -- web generates code, user enters it in mobile app, mobile exchanges code for custom JWT + refresh token via `/api/auth/mobile-exchange`. Tokens stored in `expo-secure-store`.
- **Push notifications**: `expo-notifications` for registration and display. Push tokens stored in `push_tokens` table. Event reminder cron triggers server-side.
- **Offline**: Persisted TanStack Query cache via `@tanstack/query-async-storage-persister` + AsyncStorage
- **Design**: Dark theme matching web (`src/lib/theme.ts`), Departure Mono font, square corners, amber accent color (#f5a623)
- **Screens**: Detail + create/add screens for all five tabs, profile screen with sign out

### Shared Package (`packages/shared/`)

Exports types (`Profile`, `Poll`, `Event`, `Project`, `ContentItem`, etc.), content type constants, `formatDistanceToNow` utility, and Supabase query helpers for polls/events/projects/profile. Imported as `@n3q/shared`.

- No build step -- exports raw `.ts` files via `"main": "./src/index.ts"`
- Deep imports supported: `@n3q/shared/supabase/polls`
- All Supabase query functions accept `SupabaseClient` as the first parameter, so both web (server client) and mobile (anon client) can share the same query logic

## Database

PostgreSQL via Supabase with Row Level Security (RLS). Key tables: `profiles`, `content_items`, `content_interactions`, `polls`, `poll_votes`, `events`, `event_attendees`, `projects`, `mobile_auth_tokens`, `mobile_refresh_tokens`, `push_tokens`.

- Schema: `apps/web/supabase/schema.sql`
- Migrations: `apps/web/supabase/migrations/` (applied in order)
- Always use the service client (`createSupabaseServiceClient`) to bypass RLS for admin operations (member verification, mobile auth token management)
- Regular queries go through `createSupabaseServerClient` (respects RLS)

## Key Patterns

- **Auth is dual-mode on web**: Wallet connection (NFT check on Base) and Google OAuth both grant access. `authMethod` in auth context distinguishes them. `userId` is either Supabase user ID or wallet address.
- **Mobile auth flow**: Web generates 6-digit code -> user enters code in mobile app -> exchange for custom JWT + refresh token -> refresh before expiry. JWT signed with `MOBILE_JWT_SECRET` via `lib/jwt.ts`.
- **API routes are all POST**: Even read operations use POST with JSON bodies.
- **Shared queries accept SupabaseClient**: All query helpers in `packages/shared/src/supabase/` take a `SupabaseClient` as the first parameter, making them reusable across web and mobile.
- **AI enrichment is optional**: Content enrichment uses Perplexity and Google APIs. Gracefully handles missing keys.
- **Next.js uses --webpack flag**: Both dev and build scripts pass `--webpack` (not Turbopack).

## CI/CD

- **CI** (`.github/workflows/ci.yml`): Runs on PRs and pushes to `main`. Typechecks all three packages (shared, web, mobile) and lints web. Uses pnpm 10 + Node 20.
- **EAS Build** (`.github/workflows/mobile-build.yml`): Manual dispatch. Builds mobile app via `eas build` with selectable profile (development/preview/production) and platform (ios/android/all).
- **EAS Update** (`.github/workflows/mobile-update.yml`): Auto-triggers on push to `main` when `apps/mobile/**` or `packages/shared/**` change. Publishes OTA update to production branch.
- All workflows use `pnpm install --frozen-lockfile` and require `EXPO_TOKEN` secret for EAS.

## EAS Build

Build profiles in `apps/mobile/eas.json`:
- **development**: Dev client, internal distribution, iOS simulator
- **preview**: Internal distribution (physical devices)
- **production**: Auto-incrementing version, store submission

Runtime version uses fingerprint policy. EAS project ID: `cdb8a70f-0945-45dc-89d1-f358e5a80009`, owner: `n3q`.

## Environment Variables

Web app (`apps/web/env.example`):
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` -- client-side
- `SUPABASE_SERVICE_ROLE_KEY` -- server-side, bypasses RLS
- `MOBILE_JWT_SECRET` -- signs mobile auth JWTs
- Optional: `PERPLEXITY_API_KEY`, `GOOGLE_API_KEY`

Mobile app (`apps/mobile/env.example`):
- `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` -- Supabase client
- `EXPO_PUBLIC_API_URL` -- web app URL for API calls (token exchange, push registration)

GitHub Actions secrets: `EXPO_TOKEN` (from expo.dev, required for EAS Build/Update workflows).
