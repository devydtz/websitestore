-- Lunaris Craft private admin + assistant foundation.
-- This migration creates admin-managed store tables, assistant memory/index tables,
-- RLS policies, and admin role helper functions. It intentionally does not seed
-- fake ranks, crates, keys, bundles, or cosmetics.

create extension if not exists pgcrypto;

create or replace function public.admin_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.admin_profiles
  where id = auth.uid()
  limit 1
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.admin_role() in ('owner', 'admin', 'staff', 'viewer'), false)
$$;

create or replace function public.can_manage_store()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.admin_role() in ('owner', 'admin'), false)
$$;

create or replace function public.can_manage_requests()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.admin_role() in ('owner', 'admin', 'staff'), false)
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.admin_role() = 'owner', false)
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null check (role in ('owner', 'admin', 'staff', 'viewer')),
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.ranks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  price numeric(10,2),
  currency text default 'PHP',
  color text,
  icon text,
  perks jsonb default '[]'::jsonb,
  commands jsonb default '[]'::jsonb,
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.crates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  color text,
  rewards jsonb default '[]'::jsonb,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.crate_keys (
  id uuid primary key default gen_random_uuid(),
  crate_id uuid references public.crates(id) on delete set null,
  name text not null,
  slug text unique not null,
  description text,
  price numeric(10,2),
  currency text default 'PHP',
  icon text,
  commands jsonb default '[]'::jsonb,
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.bundles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  price numeric(10,2),
  compare_at_price numeric(10,2),
  currency text default 'PHP',
  icon text,
  color text,
  items jsonb default '[]'::jsonb,
  commands jsonb default '[]'::jsonb,
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.cosmetics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  category text check (category in ('trail', 'particle', 'hat', 'pet', 'wing', 'cape', 'tag', 'armor', 'other')),
  description text,
  preview_url text,
  price numeric(10,2),
  currency text default 'PHP',
  commands jsonb default '[]'::jsonb,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  request_code text unique not null,
  minecraft_username text not null,
  customer_name text,
  contact text,
  item_type text check (item_type in ('rank', 'crate', 'key', 'bundle', 'cosmetic', 'other')),
  item_id uuid,
  item_name text not null,
  amount numeric(10,2),
  payment_method text default 'gcash',
  payment_reference text,
  payment_screenshot_url text,
  status text check (status in ('pending', 'under_review', 'confirmed', 'rejected', 'completed', 'cancelled')) default 'pending',
  admin_note text,
  handled_by uuid references auth.users(id),
  handled_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users(id),
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.website_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id),
  updated_at timestamptz default now()
);

create table if not exists public.assistant_conversations (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users(id),
  title text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.assistant_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.assistant_conversations(id) on delete cascade,
  role text check (role in ('user', 'assistant', 'system', 'tool')),
  content text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.assistant_project_files (
  id uuid primary key default gen_random_uuid(),
  path text unique not null,
  file_type text,
  content_hash text,
  summary text,
  safe_snippet text,
  updated_at timestamptz default now()
);

create table if not exists public.assistant_project_chunks (
  id uuid primary key default gen_random_uuid(),
  file_id uuid references public.assistant_project_files(id) on delete cascade,
  path text not null,
  chunk_index int not null,
  content text not null,
  search_text tsvector generated always as (to_tsvector('english', content)) stored,
  created_at timestamptz default now()
);

create table if not exists public.assistant_database_notes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  category text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.assistant_edit_proposals (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users(id),
  conversation_id uuid references public.assistant_conversations(id),
  title text,
  description text,
  files jsonb not null default '[]'::jsonb,
  diff text,
  status text check (status in ('pending', 'applied', 'cancelled', 'failed')) default 'pending',
  created_at timestamptz default now(),
  applied_at timestamptz
);

create index if not exists ranks_slug_idx on public.ranks (slug);
create index if not exists ranks_active_idx on public.ranks (is_active, sort_order);
create index if not exists crates_slug_idx on public.crates (slug);
create index if not exists crate_keys_slug_idx on public.crate_keys (slug);
create index if not exists crate_keys_crate_id_idx on public.crate_keys (crate_id);
create index if not exists bundles_slug_idx on public.bundles (slug);
create index if not exists cosmetics_slug_idx on public.cosmetics (slug);
create index if not exists cosmetics_category_idx on public.cosmetics (category);
create index if not exists requests_status_idx on public.requests (status, created_at desc);
create index if not exists requests_username_idx on public.requests (minecraft_username);
create index if not exists admin_logs_created_at_idx on public.admin_logs (created_at desc);
create index if not exists assistant_chunks_search_idx on public.assistant_project_chunks using gin (search_text);
create unique index if not exists assistant_chunks_file_index_idx on public.assistant_project_chunks (file_id, chunk_index);

drop trigger if exists admin_profiles_touch_updated_at on public.admin_profiles;
create trigger admin_profiles_touch_updated_at before update on public.admin_profiles
for each row execute function public.touch_updated_at();

drop trigger if exists ranks_touch_updated_at on public.ranks;
create trigger ranks_touch_updated_at before update on public.ranks
for each row execute function public.touch_updated_at();

drop trigger if exists crates_touch_updated_at on public.crates;
create trigger crates_touch_updated_at before update on public.crates
for each row execute function public.touch_updated_at();

drop trigger if exists crate_keys_touch_updated_at on public.crate_keys;
create trigger crate_keys_touch_updated_at before update on public.crate_keys
for each row execute function public.touch_updated_at();

drop trigger if exists bundles_touch_updated_at on public.bundles;
create trigger bundles_touch_updated_at before update on public.bundles
for each row execute function public.touch_updated_at();

drop trigger if exists cosmetics_touch_updated_at on public.cosmetics;
create trigger cosmetics_touch_updated_at before update on public.cosmetics
for each row execute function public.touch_updated_at();

drop trigger if exists requests_touch_updated_at on public.requests;
create trigger requests_touch_updated_at before update on public.requests
for each row execute function public.touch_updated_at();

drop trigger if exists assistant_conversations_touch_updated_at on public.assistant_conversations;
create trigger assistant_conversations_touch_updated_at before update on public.assistant_conversations
for each row execute function public.touch_updated_at();

drop trigger if exists assistant_project_files_touch_updated_at on public.assistant_project_files;
create trigger assistant_project_files_touch_updated_at before update on public.assistant_project_files
for each row execute function public.touch_updated_at();

drop trigger if exists assistant_database_notes_touch_updated_at on public.assistant_database_notes;
create trigger assistant_database_notes_touch_updated_at before update on public.assistant_database_notes
for each row execute function public.touch_updated_at();

alter table public.admin_profiles enable row level security;
alter table public.ranks enable row level security;
alter table public.crates enable row level security;
alter table public.crate_keys enable row level security;
alter table public.bundles enable row level security;
alter table public.cosmetics enable row level security;
alter table public.requests enable row level security;
alter table public.admin_logs enable row level security;
alter table public.website_settings enable row level security;
alter table public.assistant_conversations enable row level security;
alter table public.assistant_messages enable row level security;
alter table public.assistant_project_files enable row level security;
alter table public.assistant_project_chunks enable row level security;
alter table public.assistant_database_notes enable row level security;
alter table public.assistant_edit_proposals enable row level security;

drop policy if exists "admins read admin profiles" on public.admin_profiles;
create policy "admins read admin profiles" on public.admin_profiles for select to authenticated using (public.is_admin());
drop policy if exists "owners manage admin profiles" on public.admin_profiles;
create policy "owners manage admin profiles" on public.admin_profiles for all to authenticated using (public.is_owner()) with check (public.is_owner());

drop policy if exists "admins read ranks" on public.ranks;
create policy "admins read ranks" on public.ranks for select to authenticated using (public.is_admin());
drop policy if exists "owner admin manage ranks" on public.ranks;
create policy "owner admin manage ranks" on public.ranks for all to authenticated using (public.can_manage_store()) with check (public.can_manage_store());

drop policy if exists "admins read crates" on public.crates;
create policy "admins read crates" on public.crates for select to authenticated using (public.is_admin());
drop policy if exists "owner admin manage crates" on public.crates;
create policy "owner admin manage crates" on public.crates for all to authenticated using (public.can_manage_store()) with check (public.can_manage_store());

drop policy if exists "admins read crate keys" on public.crate_keys;
create policy "admins read crate keys" on public.crate_keys for select to authenticated using (public.is_admin());
drop policy if exists "owner admin manage crate keys" on public.crate_keys;
create policy "owner admin manage crate keys" on public.crate_keys for all to authenticated using (public.can_manage_store()) with check (public.can_manage_store());

drop policy if exists "admins read bundles" on public.bundles;
create policy "admins read bundles" on public.bundles for select to authenticated using (public.is_admin());
drop policy if exists "owner admin manage bundles" on public.bundles;
create policy "owner admin manage bundles" on public.bundles for all to authenticated using (public.can_manage_store()) with check (public.can_manage_store());

drop policy if exists "admins read cosmetics" on public.cosmetics;
create policy "admins read cosmetics" on public.cosmetics for select to authenticated using (public.is_admin());
drop policy if exists "owner admin manage cosmetics" on public.cosmetics;
create policy "owner admin manage cosmetics" on public.cosmetics for all to authenticated using (public.can_manage_store()) with check (public.can_manage_store());

drop policy if exists "admins read requests" on public.requests;
create policy "admins read requests" on public.requests for select to authenticated using (public.is_admin());
drop policy if exists "staff update requests" on public.requests;
create policy "staff update requests" on public.requests for update to authenticated using (public.can_manage_requests()) with check (public.can_manage_requests());
drop policy if exists "owner admin insert requests" on public.requests;
create policy "owner admin insert requests" on public.requests for insert to authenticated with check (public.can_manage_store());
drop policy if exists "owner admin delete requests" on public.requests;
create policy "owner admin delete requests" on public.requests for delete to authenticated using (public.can_manage_store());

drop policy if exists "admins read logs" on public.admin_logs;
create policy "admins read logs" on public.admin_logs for select to authenticated using (public.is_admin());
drop policy if exists "admins insert logs" on public.admin_logs;
create policy "admins insert logs" on public.admin_logs for insert to authenticated with check (public.is_admin());

drop policy if exists "admins read settings" on public.website_settings;
create policy "admins read settings" on public.website_settings for select to authenticated using (public.is_admin());
drop policy if exists "owner admin manage settings" on public.website_settings;
create policy "owner admin manage settings" on public.website_settings for all to authenticated using (public.can_manage_store()) with check (public.can_manage_store());

drop policy if exists "owner admin read assistant conversations" on public.assistant_conversations;
create policy "owner admin read assistant conversations" on public.assistant_conversations for select to authenticated using (public.admin_role() in ('owner', 'admin'));
drop policy if exists "owner admin manage assistant conversations" on public.assistant_conversations;
create policy "owner admin manage assistant conversations" on public.assistant_conversations for all to authenticated using (public.admin_role() in ('owner', 'admin')) with check (public.admin_role() in ('owner', 'admin'));

drop policy if exists "owner admin read assistant messages" on public.assistant_messages;
create policy "owner admin read assistant messages" on public.assistant_messages for select to authenticated using (public.admin_role() in ('owner', 'admin'));
drop policy if exists "owner admin manage assistant messages" on public.assistant_messages;
create policy "owner admin manage assistant messages" on public.assistant_messages for all to authenticated using (public.admin_role() in ('owner', 'admin')) with check (public.admin_role() in ('owner', 'admin'));

drop policy if exists "owner admin read project files" on public.assistant_project_files;
create policy "owner admin read project files" on public.assistant_project_files for select to authenticated using (public.admin_role() in ('owner', 'admin'));
drop policy if exists "owner admin manage project files" on public.assistant_project_files;
create policy "owner admin manage project files" on public.assistant_project_files for all to authenticated using (public.admin_role() in ('owner', 'admin')) with check (public.admin_role() in ('owner', 'admin'));

drop policy if exists "owner admin read project chunks" on public.assistant_project_chunks;
create policy "owner admin read project chunks" on public.assistant_project_chunks for select to authenticated using (public.admin_role() in ('owner', 'admin'));
drop policy if exists "owner admin manage project chunks" on public.assistant_project_chunks;
create policy "owner admin manage project chunks" on public.assistant_project_chunks for all to authenticated using (public.admin_role() in ('owner', 'admin')) with check (public.admin_role() in ('owner', 'admin'));

drop policy if exists "owner admin read assistant notes" on public.assistant_database_notes;
create policy "owner admin read assistant notes" on public.assistant_database_notes for select to authenticated using (public.admin_role() in ('owner', 'admin'));
drop policy if exists "owner admin manage assistant notes" on public.assistant_database_notes;
create policy "owner admin manage assistant notes" on public.assistant_database_notes for all to authenticated using (public.admin_role() in ('owner', 'admin')) with check (public.admin_role() in ('owner', 'admin'));

drop policy if exists "owner admin read edit proposals" on public.assistant_edit_proposals;
create policy "owner admin read edit proposals" on public.assistant_edit_proposals for select to authenticated using (public.admin_role() in ('owner', 'admin'));
drop policy if exists "owner admin manage edit proposals" on public.assistant_edit_proposals;
create policy "owner admin manage edit proposals" on public.assistant_edit_proposals for all to authenticated using (public.admin_role() in ('owner', 'admin')) with check (public.admin_role() in ('owner', 'admin'));
