alter table public.journal_entries
  add column if not exists deleted_at timestamptz;

create index if not exists journal_user_deleted_idx
  on public.journal_entries(user_id, deleted_at)
  where deleted_at is not null;
