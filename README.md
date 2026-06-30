# Lunaris Craft Website

Private Minecraft server store and admin dashboard for `mclunaris.store`.

## What Is Included

- React + Vite + TypeScript frontend.
- Supabase auth/database.
- Private admin routes under `/admin`.
- CRUD admin pages for requests, ranks, crates, crate keys, bundles, cosmetics, admins, settings, and logs.
- Local Ollama assistant server in `assistant-server/`.
- Safe project indexing and database scanning for the private admin assistant.
- No fake ranks, crate keys, bundles, crates, or cosmetics are seeded.

## Environment Variables

Copy `.env.example` to your local `.env` files and fill the values.

Frontend variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ASSISTANT_API_URL`

Backend assistant variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OLLAMA_BASE_URL`
- `OLLAMA_MODEL`

Never put `SUPABASE_SERVICE_ROLE_KEY` in the frontend or Cloudflare public variables.

## Supabase Setup

1. Open Supabase SQL Editor.
2. Run the migration in `supabase/migrations/20260630000000_lunaris_admin_assistant.sql`.
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

Open `/admin/dashboard`. If you are not signed in as a user with an `admin_profiles` row, the admin panel will block access.

## Ollama Setup

Install Ollama, then run:

```bash
ollama pull qwen2.5-coder:7b
ollama serve
```

Optional supported models:

```bash
ollama pull qwen2.5-coder:3b
ollama pull qwen3-coder
```

## Assistant Server

```bash
cd assistant-server
pnpm install
pnpm dev
```

Then open `/admin/dashboard` and click the glowing assistant button at bottom-right.

Use these assistant buttons first:

1. Rebuild Project Knowledge by calling the server endpoint or running `pnpm index:project` inside `assistant-server`.
2. Analyze Project.
3. Analyze Database.
4. Scan Ranks, Keys, Bundles, Logs.

## Safety

The assistant server validates the logged-in Supabase session before returning admin data. It uses the service role only on the backend. It blocks dangerous commands, never exposes `.env` files, backs up files before applying edits, and does not run deploy or git push automatically.
