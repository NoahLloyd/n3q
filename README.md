## Nine Three Quarters (n3q)

The n3q internal hub built with Next.js 16, TypeScript, Tailwind v4, shadcn/ui, Supabase, and wallet-based NFT authentication.

### Local setup

1. Create a Supabase project.
2. In the Supabase SQL editor, run `supabase/schema.sql` from this repo.
3. Copy `env.example` to `.env.local` and fill in the values.

Then install and run:

```bash
npm install --legacy-peer-deps
npm run dev
```

The app runs at `http://localhost:3000`.

### Authentication

Access requires an N3Q Membership NFT on Base. Connect your wallet to log in.

### Main flows

- `/` – wallet connect login (requires N3Q NFT)
- `/app` – shared high-signal content feed (add items, save/done, rate, comment, history)
- `/app/profile` – wallet and membership info
- `/app/directory` – all DAO members from the blockchain
- `/app/projects`, `/app/events` – placeholders for upcoming sections
