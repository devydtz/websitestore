# Lunaris Craft Website

Private Minecraft server store and admin dashboard for `mclunaris.store`.

## What Is Included

- React + Vite + TypeScript frontend.
- Supabase auth/database.
- Existing private admin panel under `/admin`.
- Store systems for orders, accounts, promo codes, products, and delivery actions.
- Lunaris Core: a private admin-only helper inside the existing admin panel.

## Lunaris Core

Lunaris Core is built into the website. It does not use an external AI server, OpenAI, Cloudflare AI, or paid API keys.

Inside the admin panel, click the floating `Lunaris Core` button. It can answer using local tools:

- Time and date in Asia/Manila.
- Basic calculator and price math.
- Safe project map search for website/admin/build questions.
- Supabase data scans through the existing frontend data helpers.
- Optional web research placeholder. If search is not configured, it says web research is not configured yet.

Lunaris Core never reads `.env` files and never exposes service-role keys, tokens, passwords, or private secrets.

## Environment Variables

Copy `.env.example` to your local `.env` and fill:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Do not put a Supabase service-role key in the frontend.

## Supabase Setup

If this is a fresh project:

1. Open Supabase SQL Editor.
2. Run the migrations under `supabase/migrations/`.
3. Create or sign up your first Supabase auth user.
4. Find that user's UUID in Authentication > Users.
5. Insert the first owner profile:

```sql
insert into public.admin_profiles (id, display_name, role)
values ('PASTE_AUTH_USER_UUID_HERE', 'Devydtz', 'owner')
on conflict (id) do update
set role = 'owner', display_name = excluded.display_name, updated_at = now();
```

## Run The Website

```bash
pnpm install
pnpm dev
```

Open `/admin`. If you are not signed in as an admin user, the admin panel blocks access.

## Safety

Lunaris Core is admin-only because it is mounted only inside the existing admin panel. It uses safe summaries instead of raw private files, and it relies on the current Supabase permissions already used by the admin panel.
