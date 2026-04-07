# Contributing to N3Q

Thanks for contributing to N3Q!

## Getting started

```bash
# Clone the repo
git clone https://github.com/n3q-dao/n3q.git
cd n3q

# Install dependencies (requires pnpm)
pnpm install

# Start everything
pnpm dev
```

### Web app only

```bash
cd apps/web
cp env.example .env.local    # fill in your keys
pnpm dev                     # runs on :3000
```

### Mobile app only

```bash
cd apps/mobile
cp env.example .env.local    # fill in Supabase + API URL
npx expo start               # Expo Go on your phone
npx expo start --ios          # iOS simulator
```

## Project structure

```
n3q/
├── apps/web/          # Next.js 16, Tailwind, shadcn/ui
├── apps/mobile/       # Expo SDK 54, Expo Router
└── packages/shared/   # @n3q/shared — types, queries, utils
```

Changes to `packages/shared` affect both apps. Run `pnpm typecheck` from the root to verify.

## Making changes

1. **Create a branch** from `main`: `git checkout -b feature/your-thing`
2. **Make your changes** — keep PRs focused on one thing
3. **Type check**: `pnpm typecheck` (runs across all workspaces)
4. **Push and open a PR** against `main`
5. CI will run type checks and linting automatically

## Conventions

- **Commits**: Short imperative subject line. "Add event reminders" not "Added event reminders"
- **Branches**: `feature/`, `fix/`, `chore/` prefixes
- **Types**: All shared types live in `packages/shared/src/types.ts`
- **Supabase queries**: Accept `SupabaseClient` as the first parameter (not module-level clients)
- **Mobile design**: Use colors from `src/lib/theme.ts`, Departure Mono for UI text, square corners (no border-radius)
- **Web design**: shadcn/ui components, Tailwind, `rounded-none` cards

## Environment variables

You need your own Supabase project or access to the shared dev instance. Ask in the group for credentials.

**Web** (`apps/web/.env.local`):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- `MOBILE_JWT_SECRET`

**Mobile** (`apps/mobile/.env.local`):
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_API_URL`

## Adding a new feature

### Both apps
1. Add types to `packages/shared/src/types.ts`
2. Add queries to `packages/shared/src/supabase/`
3. Re-export from `packages/shared/src/index.ts`
4. Web wrapper in `apps/web/src/lib/supabase/` (passes browser client)
5. Mobile screen calls shared function with its own client

### Mobile only
1. Add screen in `apps/mobile/app/(tabs)/[section]/`
2. Use `colors` from theme, match existing card/button patterns
3. Add safe area insets for header and tab bar
4. Add skeleton loading state

### Database
1. Add migration in `apps/web/supabase/migrations/`
2. Update `apps/web/supabase/schema.sql`
3. Run migration via Supabase SQL Editor or MCP

## Questions?

Open an issue or ask in the N3Q community channels.
