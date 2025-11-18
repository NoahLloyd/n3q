## n3q hacker house app

This is the n3q internal hub built with Next.js 16, TypeScript, Tailwind v4, shadcn/ui, and Supabase.

### Local setup

1. Create a Supabase project and enable email magic-link auth.
2. In the Supabase SQL editor, run `supabase/schema.sql` from this repo.
3. Copy `env.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Then install and run:

```bash
npm install
npm run dev
```

The app runs at `http://localhost:3000`.

### Main flows

- `/` – email magic-link login.
- `/app` – shared high-signal content feed (add items, save/done, rate, comment, history).
- `/app/profile` – basic profile.
- `/app/directory`, `/app/projects`, `/app/events` – placeholders for upcoming sections.

