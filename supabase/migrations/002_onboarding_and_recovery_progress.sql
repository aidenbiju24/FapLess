alter table public.profiles add column if not exists primary_goal text;
alter table public.profiles add column if not exists preferred_approach text;
alter table public.profiles add column if not exists common_triggers text[] not null default '{}';
alter table public.profiles add column if not exists onboarding_complete boolean not null default false;
alter table public.profiles add column if not exists reminders_enabled boolean not null default true;
alter table public.profiles add column if not exists ai_storage_enabled boolean not null default false;

alter table public.check_ins add column if not exists wins text not null default '';
alter table public.check_ins add column if not exists difficulties text not null default '';

create table if not exists public.program_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_id text not null,
  day integer not null check (day > 0),
  completed_at timestamptz not null default now(),
  unique(user_id, program_id, day)
);
create index if not exists program_progress_user_program_idx on public.program_progress(user_id, program_id);
alter table public.program_progress enable row level security;
create policy program_progress_owner on public.program_progress for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  notifications_enabled boolean not null default true,
  ai_storage_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.user_settings enable row level security;
create policy user_settings_owner on public.user_settings for all using (user_id = auth.uid()) with check (user_id = auth.uid());
