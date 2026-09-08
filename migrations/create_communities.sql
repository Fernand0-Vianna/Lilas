-- Lilás · Criar comunidades
-- Rodar no SQL Editor do Supabase (projeto gmmocqgdjmtlrahnfgye)
-- NOTA: MCP do Supabase é read-only, aplicar manualmente.

-- 1) Coluna creator_id na communities (quem criou)
alter table public.communities add column if not exists creator_id uuid references public.profiles(id) on delete set null;
create index if not exists communities_creator_idx on public.communities(creator_id);

-- 2) Trigger: ao criar comunidade, criador vira membro + mod automaticamente
create or replace function public.on_community_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.creator_id := auth.uid();
  insert into public.community_mods (community_id, user_id, added_by)
  values (new.id, auth.uid(), auth.uid());
  insert into public.community_members (community_id, user_id)
  values (new.id, auth.uid());
  return new;
end;
$$;

drop trigger if exists on_community_created on public.communities;
create trigger on_community_created
  before insert on public.communities
  for each row execute function public.on_community_created();
