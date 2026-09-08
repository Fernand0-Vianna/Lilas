-- Lilás · melhorias (saves, reports, membros, delete_account)
-- Rodar no SQL Editor do Supabase Dashboard (projeto gmmocqgdjmtlrahnfgye)

-- 1) Salvos/bookmark
create table if not exists public.saves (
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
alter table public.saves enable row level security;
create policy "saves read own" on public.saves for select using (auth.uid() = user_id);
create policy "saves insert own" on public.saves for insert with check (auth.uid() = user_id);
create policy "saves delete own" on public.saves for delete using (auth.uid() = user_id);

-- 2) Denúncias
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null default '',
  status text not null default 'aberto' check (status in ('aberto', 'resolvido', 'descartado')),
  created_at timestamptz not null default now(),
  check (post_id is not null or comment_id is not null)
);
alter table public.reports enable row level security;
create policy "reports insert" on public.reports for insert with check (auth.uid() = reporter_id);
create policy "reports read admin" on public.reports for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));
create policy "reports update admin" on public.reports for update using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));
create policy "reports delete admin" on public.reports for delete using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- 3) Contador de membros em sincronia (entrar/sair)
create or replace function public.sync_community_members()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.communities set members = members + 1 where id = new.community_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.communities set members = greatest(members - 1, 0) where id = old.community_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists community_members_sync on public.community_members;
create trigger community_members_sync
  after insert or delete on public.community_members
  for each row execute function public.sync_community_members();

-- 4) Excluir conta (cascata limpa profiles/posts/curtidas/seguidores)
create or replace function public.delete_account()
returns void
language sql
security definer
set search_path = public
as $$
  delete from auth.users where id = auth.uid();
$$;

revoke execute on function public.delete_account() from public;
grant execute on function public.delete_account() to authenticated;

-- 5) Comentários aninhados (threads, estilo Reddit)
-- Responder vira insert com parent_id; excluir pai apaga a sub-árvore.
alter table public.comments add column if not exists parent_id uuid references public.comments(id) on delete cascade;
create index if not exists comments_parent_idx on public.comments(parent_id);