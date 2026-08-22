-- Prevent records from one user being attached to another user's parent record.
create or replace function public.challenge_progress_owner_check() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.challenges
    where challenges.id = new.challenge_id and challenges.user_id = new.user_id
  ) then
    raise exception 'challenge and progress owner must match';
  end if;
  return new;
end;
$$;

drop trigger if exists challenge_progress_owner_check on public.challenge_progress;
create trigger challenge_progress_owner_check
before insert or update on public.challenge_progress
for each row execute procedure public.challenge_progress_owner_check();

create or replace function public.ai_message_owner_check() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.ai_conversations
    where ai_conversations.id = new.conversation_id and ai_conversations.user_id = new.user_id
  ) then
    raise exception 'conversation and message owner must match';
  end if;
  return new;
end;
$$;

drop trigger if exists ai_message_owner_check on public.ai_messages;
create trigger ai_message_owner_check
before insert or update on public.ai_messages
for each row execute procedure public.ai_message_owner_check();

create index if not exists streaks_user_start_idx on public.streaks(user_id, start_date desc);
create index if not exists relapses_user_occurred_idx on public.relapses(user_id, occurred_at desc);
create index if not exists goals_user_created_idx on public.goals(user_id, created_at desc);
create index if not exists challenges_user_created_idx on public.challenges(user_id, created_at desc);
create index if not exists ai_conversations_user_updated_idx on public.ai_conversations(user_id, updated_at desc);
create index if not exists ai_messages_user_created_idx on public.ai_messages(user_id, created_at desc);
