-- ============================================================
-- Orrery — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── Folders ──────────────────────────────────────────────────
create table if not exists folders (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  parent_id   uuid references folders(id) on delete cascade,
  created_at  timestamptz not null default now()
);

alter table folders enable row level security;
create policy "Users manage own folders" on folders
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Notes ─────────────────https://wwvsqudgvezrucmcamdw.supabase.co/auth/v1/callback
───────────────────────────────────
create table if not exists notes (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null default 'Untitled',
  content     text not null default '',
  folder_id   uuid references folders(id) on delete set null,
  parent_id   uuid references notes(id) on delete set null,
  tags        text[] not null default '{}',
  is_deleted  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table notes enable row level security;
create policy "Users manage own notes" on notes
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists notes_user_updated on notes(user_id, updated_at desc);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger notes_updated_at
  before update on notes
  for each row execute function update_updated_at();

-- ── Checkpoints ──────────────────────────────────────────────
create table if not exists checkpoints (
  id                    uuid primary key default uuid_generate_v4(),
  note_id               uuid not null references notes(id) on delete cascade,
  user_id               uuid not null references auth.users(id) on delete cascade,
  label                 text not null default 'Checkpoint',
  content               text not null default '',
  position              integer not null default 0,
  parent_checkpoint_id  uuid references checkpoints(id) on delete set null,
  branch_label          text,
  is_main               boolean not null default true,
  created_at            timestamptz not null default now()
);

alter table checkpoints enable row level security;
create policy "Users manage own checkpoints" on checkpoints
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists checkpoints_note on checkpoints(note_id, position);

-- Recursive CTE helper view for full branch history
create or replace view checkpoint_tree as
  with recursive tree as (
    select *, 0 as depth from checkpoints where parent_checkpoint_id is null
    union all
    select c.*, t.depth + 1 from checkpoints c
    join tree t on c.parent_checkpoint_id = t.id
  )
  select * from tree;

-- ── Branches ─────────────────────────────────────────────────
create table if not exists branches (
  id                    uuid primary key default uuid_generate_v4(),
  note_id               uuid not null references notes(id) on delete cascade,
  user_id               uuid not null references auth.users(id) on delete cascade,
  from_checkpoint_id    uuid not null references checkpoints(id) on delete cascade,
  label                 text not null default '',
  prompt                text not null default '',
  ai_generated          boolean not null default true,
  status                text not null default 'pending'
                          check (status in ('pending', 'accepted', 'rejected')),
  created_at            timestamptz not null default now()
);

alter table branches enable row level security;
create policy "Users manage own branches" on branches
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists branches_note on branches(note_id);
create index if not exists branches_checkpoint on branches(from_checkpoint_id);

-- ── User Settings ─────────────────────────────────────────────
create table if not exists user_settings (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  theme           text not null default 'system',
  hotkeys         jsonb not null default '{}',
  openrouter_key  text
);

alter table user_settings enable row level security;
create policy "Users manage own settings" on user_settings
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-create settings row on new user signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into user_settings (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
