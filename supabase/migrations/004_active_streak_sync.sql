alter table public.profiles
  add column if not exists active_streak_started_at timestamptz;
