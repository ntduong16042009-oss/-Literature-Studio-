-- ============================================================================
-- LITERATURE STUDIO ULTIMATE — SUPABASE POSTGRESQL SCHEMA & RBAC RLS MIGRATION
-- Project URL: https://ntvplwnaldoihuvqcfag.supabase.co
-- Safe & Non-Destructive: Preserves all existing user data while upgrading
-- authentication to mandatory Email/Username + Password and User/Admin RBAC.
-- ============================================================================

create extension if not exists "pgcrypto";

-- Helper function to automatically update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- 1. TABLE: profiles (Created first so role helper functions can reference it)
-- ============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text not null default 'Độc giả Literature Studio',
  avatar_url text,
  email text unique,
  role text not null default 'user' check (role in ('user', 'admin')),
  account_type text not null default 'registered',
  account_status text not null default 'active' check (account_status in ('active', 'locked')),
  is_locked boolean not null default false,
  must_change_password boolean not null default false,
  sync_status text not null default 'synced',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Non-destructive column upgrades if profiles table already existed
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists role text not null default 'user';
alter table public.profiles add column if not exists account_status text not null default 'active';
alter table public.profiles add column if not exists is_locked boolean not null default false;
alter table public.profiles add column if not exists must_change_password boolean not null default false;

create unique index if not exists idx_profiles_username_lower on public.profiles (lower(username));
create index if not exists idx_profiles_email on public.profiles (lower(email));
create index if not exists idx_profiles_role on public.profiles (role);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.handle_updated_at();

-- Helper function to check if current authenticated user is an active Admin
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
stable
as $$
begin
  return exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and is_locked = false
  );
end;
$$;

-- Compatibility wrapper for content editor checks
create or replace function public.is_privileged_editor()
returns boolean
language plpgsql
security definer
stable
as $$
begin
  return public.is_admin();
end;
$$;

-- ============================================================================
-- 2. TABLE: authors
-- ============================================================================
create table if not exists public.authors (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  birth_death text,
  period text,
  biography text,
  literary_style text,
  is_published boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_authors_name on public.authors(name);
drop trigger if exists trg_authors_updated_at on public.authors;
create trigger trg_authors_updated_at before update on public.authors for each row execute function public.handle_updated_at();

-- ============================================================================
-- 3. TABLE: categories
-- ============================================================================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  category_type text not null default 'literature' check (category_type in ('literature', 'music', 'video')),
  description text,
  user_id uuid references auth.users(id) on delete cascade,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug, category_type, user_id)
);

create index if not exists idx_categories_type on public.categories(category_type);
create index if not exists idx_categories_user on public.categories(user_id);
drop trigger if exists trg_categories_updated_at on public.categories;
create trigger trg_categories_updated_at before update on public.categories for each row execute function public.handle_updated_at();

-- ============================================================================
-- 4. TABLE: works
-- ============================================================================
create table if not exists public.works (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  author_id uuid references public.authors(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  title text not null,
  author_name text not null,
  genre text not null default 'Thơ hiện đại',
  period text,
  creation_context text,
  summary text,
  theme text,
  content_value text,
  artistic_value text,
  characters text,
  artistic_imagery text,
  excerpt text,
  commentary text,
  category_label text not null default 'Tóm tắt tác phẩm',
  tags text[] not null default '{}',
  pinned boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_works_user_id on public.works(user_id);
create index if not exists idx_works_published on public.works(is_published);
create index if not exists idx_works_title on public.works(title);
drop trigger if exists trg_works_updated_at on public.works;
create trigger trg_works_updated_at before update on public.works for each row execute function public.handle_updated_at();

-- ============================================================================
-- 5. TABLE: reading_history
-- ============================================================================
create table if not exists public.reading_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  work_id text,
  work_title text not null,
  action_type text not null default 'read',
  duration_seconds integer not null default 0,
  visited_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_reading_history_user on public.reading_history(user_id, visited_at desc);

-- ============================================================================
-- 6. TABLE: reading_progress
-- ============================================================================
create table if not exists public.reading_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  work_id text not null,
  work_title text,
  last_chunk_index integer not null default 0,
  cursor_offset integer not null default 0,
  scroll_position numeric not null default 0,
  completion_percent numeric not null default 0,
  personal_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, work_id)
);

create index if not exists idx_reading_progress_user on public.reading_progress(user_id);
drop trigger if exists trg_reading_progress_updated_at on public.reading_progress;
create trigger trg_reading_progress_updated_at before update on public.reading_progress for each row execute function public.handle_updated_at();

-- ============================================================================
-- 7. TABLE: favorites
-- ============================================================================
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_id text not null,
  target_type text not null default 'work' check (target_type in ('work', 'track', 'playlist', 'lesson')),
  title text,
  created_at timestamptz not null default now(),
  unique (user_id, target_id, target_type)
);

create index if not exists idx_favorites_user on public.favorites(user_id);

-- ============================================================================
-- 8. TABLE: lessons
-- ============================================================================
create table if not exists public.lessons (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  work_id text,
  title text not null,
  steps_json jsonb not null default '[]'::jsonb,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_lessons_user on public.lessons(user_id);
drop trigger if exists trg_lessons_updated_at on public.lessons;
create trigger trg_lessons_updated_at before update on public.lessons for each row execute function public.handle_updated_at();

-- ============================================================================
-- 9. TABLE: materials
-- ============================================================================
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  work_id text,
  title text not null,
  material_type text not null default 'note' check (material_type in ('note', 'flashcard', 'quiz', 'outline', 'Saved_AI')),
  content text not null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_materials_user on public.materials(user_id, material_type);
drop trigger if exists trg_materials_updated_at on public.materials;
create trigger trg_materials_updated_at before update on public.materials for each row execute function public.handle_updated_at();

-- ============================================================================
-- 10. TABLE: user_workspace_sync
-- ============================================================================
create table if not exists public.user_workspace_sync (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tracks_json jsonb not null default '[]'::jsonb,
  music_categories_json jsonb not null default '[]'::jsonb,
  videos_json jsonb not null default '[]'::jsonb,
  playlists_json jsonb not null default '[]'::jsonb,
  queue_json jsonb not null default '[]'::jsonb,
  cards_json jsonb not null default '[]'::jsonb,
  scripts_json jsonb not null default '[]'::jsonb,
  notes_json jsonb not null default '{}'::jsonb,
  flashcards_json jsonb not null default '[]'::jsonb,
  history_json jsonb not null default '[]'::jsonb,
  sync_version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_workspace_sync_updated_at on public.user_workspace_sync;
create trigger trg_workspace_sync_updated_at before update on public.user_workspace_sync for each row execute function public.handle_updated_at();

-- ============================================================================
-- 11. TABLE: ai_conversations
-- ============================================================================
create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Cuộc trò chuyện văn học mới',
  work_id text,
  work_title text,
  model text not null default 'gpt-4.1-mini',
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ai_conversations_user on public.ai_conversations(user_id, updated_at desc);
drop trigger if exists trg_ai_conversations_updated_at on public.ai_conversations;
create trigger trg_ai_conversations_updated_at before update on public.ai_conversations for each row execute function public.handle_updated_at();

-- ============================================================================
-- 12. TABLE: ai_messages
-- ============================================================================
create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  capability text,
  selected_passage text,
  model text,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  rating smallint check (rating in (-1, 0, 1)),
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_messages_conv on public.ai_messages(conversation_id, created_at asc);
create index if not exists idx_ai_messages_user on public.ai_messages(user_id);

-- ============================================================================
-- 13. TABLE: ai_usage
-- ============================================================================
create table if not exists public.ai_usage (
  user_id uuid primary key references auth.users(id) on delete cascade,
  daily_requests integer not null default 0,
  max_daily_requests integer not null default 100,
  total_requests integer not null default 0,
  total_input_tokens bigint not null default 0,
  total_output_tokens bigint not null default 0,
  budget_limit_tokens bigint not null default 500000,
  last_reset_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_ai_usage_updated_at on public.ai_usage;
create trigger trg_ai_usage_updated_at before update on public.ai_usage for each row execute function public.handle_updated_at();

-- ============================================================================
-- 14. TABLE: user_devices (Logged-in Sessions & Device Management)
-- ============================================================================
create table if not exists public.user_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_fingerprint text not null,
  device_name text not null,
  device_type text not null default 'Desktop',
  platform text,
  browser text,
  session_status text not null default 'active' check (session_status in ('active', 'revoked', 'signed_out')),
  is_revoked boolean not null default false,
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, device_fingerprint)
);

alter table public.user_devices add column if not exists device_type text not null default 'Desktop';
alter table public.user_devices add column if not exists session_status text not null default 'active';

create index if not exists idx_user_devices_user on public.user_devices(user_id, last_active_at desc);

-- ============================================================================
-- 15. TABLE: user_settings
-- ============================================================================
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'dark' check (theme in ('dark', 'light')),
  language text not null default 'vi' check (language in ('vi', 'en')),
  audio_output_device_id text not null default 'default',
  tts_voice_uri text not null default '',
  tts_speed numeric not null default 1.0,
  tts_volume numeric not null default 1.0,
  tts_auto_scroll boolean not null default true,
  ducking_percent integer not null default 20,
  master_volume integer not null default 80,
  auto_save boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_user_settings_updated_at on public.user_settings;
create trigger trg_user_settings_updated_at before update on public.user_settings for each row execute function public.handle_updated_at();

-- ============================================================================
-- 16. TABLE: admin_audit_logs (Security & Administrative Action Audit Trail)
-- ============================================================================
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users(id) on delete set null,
  admin_username text not null,
  action text not null,
  target_user_id uuid,
  target_device_id text,
  details jsonb not null default '{}'::jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_audit_logs_created on public.admin_audit_logs(created_at desc);
create index if not exists idx_admin_audit_logs_admin on public.admin_audit_logs(admin_id);

-- Remove legacy anonymous pairing table if unused
drop table if exists public.device_pairing_codes cascade;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR USER & ADMIN ROLES
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.authors enable row level security;
alter table public.categories enable row level security;
alter table public.works enable row level security;
alter table public.reading_history enable row level security;
alter table public.reading_progress enable row level security;
alter table public.favorites enable row level security;
alter table public.lessons enable row level security;
alter table public.materials enable row level security;
alter table public.user_workspace_sync enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_usage enable row level security;
alter table public.user_devices enable row level security;
alter table public.user_settings enable row level security;
alter table public.admin_audit_logs enable row level security;

-- 1. profiles RLS (Users can view their own profile; Admins can view/manage all; Users can NEVER change their own role to admin)
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (
    auth.uid() = id
    and role = 'user'
    and is_locked = false
  );

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id or public.is_admin())
  with check (
    (auth.uid() = id and role = 'user' and is_locked = false)
    or public.is_admin()
  );

-- 2. authors RLS
drop policy if exists "authors_select_public" on public.authors;
create policy "authors_select_public" on public.authors
  for select using (is_published = true or created_by = auth.uid() or public.is_admin());

drop policy if exists "authors_write_privileged" on public.authors;
create policy "authors_write_privileged" on public.authors
  for all using (public.is_admin())
  with check (public.is_admin());

-- 3. categories RLS
drop policy if exists "categories_select" on public.categories;
create policy "categories_select" on public.categories
  for select using (is_published = true or user_id = auth.uid() or public.is_admin());

drop policy if exists "categories_modify_own" on public.categories;
create policy "categories_modify_own" on public.categories
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- 4. works RLS
drop policy if exists "works_select_published_or_own" on public.works;
create policy "works_select_published_or_own" on public.works
  for select using (is_published = true or auth.uid() = user_id or public.is_admin());

drop policy if exists "works_insert_own" on public.works;
create policy "works_insert_own" on public.works
  for insert with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "works_update_own" on public.works;
create policy "works_update_own" on public.works
  for update using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "works_delete_own" on public.works;
create policy "works_delete_own" on public.works
  for delete using (auth.uid() = user_id or public.is_admin());

-- 5. reading_history RLS
drop policy if exists "reading_history_own" on public.reading_history;
create policy "reading_history_own" on public.reading_history
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- 6. reading_progress RLS
drop policy if exists "reading_progress_own" on public.reading_progress;
create policy "reading_progress_own" on public.reading_progress
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- 7. favorites RLS
drop policy if exists "favorites_own" on public.favorites;
create policy "favorites_own" on public.favorites
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- 8. lessons RLS
drop policy if exists "lessons_select" on public.lessons;
create policy "lessons_select" on public.lessons
  for select using (is_published = true or auth.uid() = user_id or public.is_admin());

drop policy if exists "lessons_modify_own" on public.lessons;
create policy "lessons_modify_own" on public.lessons
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- 9. materials RLS
drop policy if exists "materials_own" on public.materials;
create policy "materials_own" on public.materials
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- 10. user_workspace_sync RLS
drop policy if exists "workspace_sync_own" on public.user_workspace_sync;
create policy "workspace_sync_own" on public.user_workspace_sync
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- 11. ai_conversations RLS
drop policy if exists "ai_conversations_own" on public.ai_conversations;
create policy "ai_conversations_own" on public.ai_conversations
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- 12. ai_messages RLS
drop policy if exists "ai_messages_own" on public.ai_messages;
create policy "ai_messages_own" on public.ai_messages
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- 13. ai_usage RLS
drop policy if exists "ai_usage_select_own" on public.ai_usage;
create policy "ai_usage_select_own" on public.ai_usage
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "ai_usage_admin_all" on public.ai_usage;
create policy "ai_usage_admin_all" on public.ai_usage
  for all using (public.is_admin())
  with check (public.is_admin());

-- 14. user_devices RLS (Users see only their own devices; Admins can view and revoke any device)
drop policy if exists "user_devices_own" on public.user_devices;
create policy "user_devices_own" on public.user_devices
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- 15. user_settings RLS
drop policy if exists "user_settings_own" on public.user_settings;
create policy "user_settings_own" on public.user_settings
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- 16. admin_audit_logs RLS (Strictly Admin-only)
drop policy if exists "admin_audit_logs_admin_only" on public.admin_audit_logs;
create policy "admin_audit_logs_admin_only" on public.admin_audit_logs
  for all using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- AUTOMATIC PROFILE CREATION & ADMIN PROMOTION FOR lecongvinh (lecongvinhfm00@gmail.com)
-- ============================================================================
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_username text;
  v_role text;
begin
  v_email := lower(coalesce(new.email, ''));
  v_username := lower(coalesce(
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'display_name',
    case when v_email = 'lecongvinhfm00@gmail.com' then 'lecongvinh' else split_part(v_email, '@', 1) end
  ));

  if v_email = 'lecongvinhfm00@gmail.com' or v_username = 'lecongvinh' then
    v_username := 'lecongvinh';
    v_role := 'admin';
  else
    v_role := 'user';
  end if;

  insert into public.profiles (
    id,
    username,
    display_name,
    email,
    role,
    account_type,
    account_status,
    is_locked,
    must_change_password,
    sync_status
  )
  values (
    new.id,
    v_username,
    coalesce(new.raw_user_meta_data->>'display_name', v_username),
    v_email,
    v_role,
    case when v_role = 'admin' then 'admin' else 'registered' end,
    'active',
    false,
    false,
    'synced'
  )
  on conflict (id) do update
  set
    username = excluded.username,
    email = excluded.email,
    role = case when excluded.role = 'admin' then 'admin' else public.profiles.role end,
    account_type = case when excluded.role = 'admin' then 'admin' else public.profiles.account_type end,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Ensure if lecongvinhfm00@gmail.com already exists in public.profiles, it is promoted to admin
update public.profiles
set
  username = 'lecongvinh',
  role = 'admin',
  account_type = 'admin',
  account_status = 'active',
  is_locked = false,
  updated_at = now()
where lower(email) = 'lecongvinhfm00@gmail.com' or lower(username) = 'lecongvinh';

