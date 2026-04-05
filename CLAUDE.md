# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

n3q is a DAO community hub with NFT-gated membership on Base chain. It combines a Next.js web app, an Expo mobile app, and a shared package in a pnpm monorepo managed by Turborepo.

## Commands

```bash
# Root (runs across all workspaces via Turbo)
npm run dev          # Start all apps in parallel
npm run build        # Build all (respects dependency order)
npm run lint         # ESLint across workspaces
npm run typecheck    # TypeScript check across workspaces

# Web app (apps/web)
cd apps/web && npm run dev    # Next.js dev server on :3000 (uses --webpack flag)
cd apps/web && npm run build  # Production build (uses --webpack flag)
cd apps/web && npm run lint   # ESLint

# Mobile app (apps/mobile)
cd apps/mobile && npm start       # Expo dev server
cd apps/mobile && npm run ios     # iOS simulator
cd apps/mobile && npm run android # Android emulator
cd apps/mobile && npm run typecheck

# Install dependencies (note: uses npm with pnpm workspaces)
npm install --legacy-peer-deps
```

No test framework is configured.

## Architecture

```
n3q/
├── apps/web/          # Next.js 16 (App Router), React 19, Tailwind v4, shadcn/ui
├── apps/mobile/       # Expo SDK 54, React Native, Expo Router v6
└── packages/shared/   # @n3q/shared — types, constants, Supabase query helpers
```

### Web App (`apps/web/src/`)

- **Pages**: `app/dashboard/` — feed, voting, events, projects, directory, profile
- **API routes**: `app/api/` — all POST handlers (auth, members, content, calendar, link-preview)
- **Auth**: `lib/auth/context.tsx` — dual auth via wallet (wagmi/RainbowKit) or Google OAuth (Supabase Auth). `useAuth()` hook provides `userId`, `isAuthenticated`, `isMember`, `authMethod`.
- **Web3**: `lib/web3/` — wagmi config (Base chain only), NFT contract hooks, RainbowKit
- **Supabase clients**: `lib/supabase/client.ts` (browser), `server.ts` (RSC/route handlers), `service-client.ts` (admin/bypass RLS)
- **UI**: shadcn/ui components in `components/ui/`, Radix primitives, Lucide icons, `clsx` + `tailwind-merge` for className composition

### Mobile App (`apps/mobile/`)

- **Routing**: Expo Router file-based routing in `app/` with tab navigation in `app/(tabs)/`
- **Auth**: Token-based — web app generates QR code token, mobile exchanges it for JWT via `/api/auth/mobile-*` endpoints. Tokens stored in `expo-secure-store`.
- **Screens**: Mirror web features (feed, voting, events, projects, directory, profile)

### Shared Package (`packages/shared/`)

Exports types (`Profile`, `Poll`, `Event`, `Project`, `ContentItem`), content type constants, utility functions, and Supabase query helpers for polls/events/projects/profile. Imported as `@n3q/shared`. No build step — exports raw `.ts` files.

## Database

PostgreSQL via Supabase with Row Level Security (RLS). Key tables: `profiles`, `content_items`, `content_interactions`, `polls`, `poll_votes`, `events`, `event_attendees`, `projects`, `mobile_auth_tokens`, `mobile_refresh_tokens`.

- Schema: `apps/web/supabase/schema.sql`
- Migrations: `apps/web/supabase/migrations/` (applied in order)
- Always use the service client (`createSupabaseServiceClient`) to bypass RLS for admin operations (member verification, mobile auth token management)
- Regular queries go through `createSupabaseServerClient` (respects RLS)

## Key Patterns

- **Auth is dual-mode**: Wallet connection (NFT check on Base) and Google OAuth both grant access. `authMethod` in auth context distinguishes them. `userId` is either Supabase user ID or wallet address.
- **API routes are all POST**: Even read operations use POST with JSON bodies.
- **Mobile auth flow**: Web generates one-time token → QR code → mobile deep link (`n3q://auth?token=...`) → exchange for JWT + refresh token → refresh before expiry.
- **AI enrichment is optional**: Content enrichment uses Perplexity and Google APIs. Gracefully handles missing keys.
- **Next.js uses --webpack flag**: Both dev and build scripts pass `--webpack` (not Turbopack).

## Environment Variables

Web app needs: `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`. Optional: `PERPLEXITY_API_KEY`, `GOOGLE_API_KEY`.

Mobile app needs: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_API_URL`.

See `apps/web/env.example` and `apps/mobile/env.example`.
