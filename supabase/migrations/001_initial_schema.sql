create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'there' check (char_length(display_name) between 1 and 80),
  timezone text not null default 'UTC',
  goal_days integer not null default 90 check (goal_days between 1 and 3650),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.streaks (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  start_date date not null, end_date date, duration integer generated always as (case when end_date is null then null else end_date - start_date end) stored,
  reset_reason text, created_at timestamptz not null default now(), check (end_date is null or end_date >= start_date)
);
create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  date date not null, mood integer not null check (mood between 1 and 5), energy integer not null check (energy between 1 and 5),
  urge_level integer not null check (urge_level between 0 and 10), confidence integer not null check (confidence between 1 and 5),
  sleep_hours numeric(4,1) check (sleep_hours is null or (sleep_hours between 0 and 24)), triggers text[] not null default '{}', wins text not null default '', difficulties text not null default '', notes text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id, date)
);
create table if not exists public.urges (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  occurred_at timestamptz not null default now(), intensity integer not null check (intensity between 0 and 10), trigger text not null, location text not null default '', mood integer not null check (mood between 1 and 5), action_taken text not null default '', outcome text not null check (outcome in ('defeated','passed','relapse','ongoing')), notes text not null default '', created_at timestamptz not null default now()
);
create table if not exists public.relapses (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  occurred_at timestamptz not null default now(), trigger text not null, mood integer not null check (mood between 1 and 5), environment text not null default '', notes text not null default '', reflection text not null default '', created_at timestamptz not null default now()
);
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200), content text not null, mood integer check (mood is null or mood between 1 and 5), tags text[] not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, description text not null default '', target integer not null check (target > 0), current integer not null default 0 check (current >= 0 and current <= target), deadline date, status text not null default 'active' check (status in ('active','completed','paused','archived')), created_at timestamptz not null default now()
);
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, description text not null default '', start_date date not null, end_date date not null, status text not null default 'active' check (status in ('active','completed','paused','archived')), created_at timestamptz not null default now(), check (end_date >= start_date)
);
create table if not exists public.challenge_progress (
  id uuid primary key default gen_random_uuid(), challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, date date not null, completed boolean not null default false, unique(challenge_id, date)
);
create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, milestone_type text not null, achieved_at timestamptz not null default now(), unique(user_id, milestone_type)
);
create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, achievement_type text not null, unlocked_at timestamptz not null default now(), unique(user_id, achievement_type)
);
create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, title text not null default 'New conversation', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(), conversation_id uuid not null references public.ai_conversations(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade, role text not null check (role in ('user','assistant','system')), content text not null check (char_length(content) <= 20000), model text, created_at timestamptz not null default now()
);

create index if not exists check_ins_user_date_idx on public.check_ins(user_id, date desc);
create index if not exists urges_user_occurred_idx on public.urges(user_id, occurred_at desc);
create index if not exists journal_user_created_idx on public.journal_entries(user_id, created_at desc);
create index if not exists ai_messages_conversation_idx on public.ai_messages(conversation_id, created_at);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.profiles (id) values (new.id) on conflict (id) do nothing; return new; end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.streaks enable row level security;
alter table public.check_ins enable row level security;
alter table public.urges enable row level security;
alter table public.relapses enable row level security;
alter table public.journal_entries enable row level security;
alter table public.goals enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_progress enable row level security;
alter table public.milestones enable row level security;
alter table public.achievements enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;

create policy profiles_owner on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy streaks_owner on public.streaks for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy check_ins_owner on public.check_ins for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy urges_owner on public.urges for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy relapses_owner on public.relapses for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy journal_owner on public.journal_entries for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy goals_owner on public.goals for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy challenges_owner on public.challenges for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy challenge_progress_owner on public.challenge_progress for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy milestones_owner on public.milestones for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy achievements_owner on public.achievements for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy ai_conversations_owner on public.ai_conversations for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy ai_messages_owner on public.ai_messages for all using (user_id = auth.uid()) with check (user_id = auth.uid());
