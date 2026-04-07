# Nine Three Quarters

The internal hub for N3Q — a community of technical founders building together.

Web app + mobile app in a monorepo. Knowledge sharing, voting, events, projects, and a member directory.

## Stack

- **Web**: Next.js 16, Tailwind v4, shadcn/ui, RainbowKit (wallet auth), Google OAuth
- **Mobile**: Expo SDK 54, React Native, Expo Router
- **Shared**: TypeScript types and Supabase queries shared between both apps
- **Database**: Supabase (PostgreSQL + RLS)
- **Chain**: Base (NFT-gated membership)

## Quick start

```bash
pnpm install
pnpm dev            # starts both web and mobile

# Or run individually:
pnpm dev:web        # web at localhost:3000
pnpm dev:mobile     # mobile in Expo Go
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for full setup instructions.

## What's in the app

- **Knowledge** — Curate high-signal content (articles, podcasts, papers, tools). AI-enriched summaries and tagging.
- **Projects** — Track what members are building. Find collaborators.
- **Events** — Sessions, dinners, and things worth showing up for. RSVP and calendar export.
- **Voting** — Polls and governance decisions. Yes/no/abstain or multiple choice with auto-close.
- **Directory** — All members and what they're working on.

## Auth

**Web**: Connect your wallet (requires N3Q Membership NFT on Base) or sign in with Google (requires member verification).

**Mobile**: Generate a 6-digit code on the web app, enter it on your phone.

## Releases

**Web**: Merging to `main` auto-deploys to production via Vercel.

**Mobile**: JS changes auto-publish as OTA updates via EAS Update. Native changes require a manual EAS Build + App Store submission.

See [RELEASES.md](RELEASES.md) for the full pipeline.

## Contributing

This is a volunteer-run project. See [CONTRIBUTING.md](CONTRIBUTING.md) for how to get started.

## Repo structure

```
n3q/
├── apps/web/          # Next.js web app
├── apps/mobile/       # Expo mobile app
├── packages/shared/   # Shared types, queries, utils
└── .github/workflows/ # CI + mobile build/update
```

## Docs

- [CONTRIBUTING.md](CONTRIBUTING.md) — Setup, conventions, how to add features
- [RELEASES.md](RELEASES.md) — Release pipeline for web and mobile
- [DESIGN.md](DESIGN.md) — Design system, colors, typography, components
- [CLAUDE.md](CLAUDE.md) — Context for Claude Code sessions
