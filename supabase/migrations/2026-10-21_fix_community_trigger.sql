-- Fix trigger on_community_created to avoid FK violation
-- BEFORE INSERT sets creator_id, AFTER INSERT inserts into child tables
-- Created: 2026-10-21

create or replace function public.on_community_created_before()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.creator_id := auth.uid();
  return new;
end;
$$;

create or replace function public.on_community_created_after()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.community_mods (community_id, user_id, added_by)
  values (NEW.id, auth.uid(), auth.uid());

  insert into public.community_members (community_id, user_id)
  values (NEW.id, auth.uid());

  return null;
end;
$$;

-- Remove old trigger that caused FK violation when inserting into child tables in BEFORE
drop trigger if exists on_community_created on public.communities;

-- Create BEFORE trigger to set creator_id
create trigger on_community_created_before
  before insert on public.communities
  for each row
  execute function public.on_community_created_before();

-- Create AFTER trigger to insert into community_mods and community_members
create trigger on_community_created_after
  after insert on public.communities
  for each row
  execute function public.on_community_created_after();
