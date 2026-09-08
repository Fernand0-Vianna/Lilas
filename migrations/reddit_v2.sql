-- Lilás · Reddit v2 (tags, links, enquetes, karma, mods de comunidade)
-- Rodar no SQL Editor do Supabase (projeto gmmocqgdjmtlrahnfgye)

-- ============ 1) Posts mais ricos ============

-- Tag de contexto no post ("Dúvida", "Conseguiu", "História Real"...)
alter table public.posts add column if not exists tag text;

-- Post de link externo
alter table public.posts add column if not exists link_url text;

-- Enquete: opções na própria linha do post, votos em tabela separada
alter table public.posts add column if not exists poll_options text[];

create table if not exists public.poll_votes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  option_idx int not null check (option_idx >= 0),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.poll_votes enable row level security;
create policy "poll read" on public.poll_votes for select to authenticated using (true);
create policy "poll vote own" on public.poll_votes for insert to authenticated with check (auth.uid() = user_id);
create policy "poll change own" on public.poll_votes for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============ 2) Karma ============
-- Soma dos votos recebidos em posts + comentários do usuário.
create or replace function public.karma_of(p_user uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select
    (select coalesce(sum(v.vote), 0) from likes v join posts p on p.id = v.post_id where p.author_id = p_user)
    + (select coalesce(sum(cv.vote), 0) from comment_votes cv join comments c on c.id = cv.comment_id where c.author_id = p_user);
$$;

-- Anti-spam: conta nova (<24h) publica no máx. 5 posts por dia; resto livre.
drop policy if exists "posts insert own" on public.posts;
drop policy if exists "posts insert" on public.posts;
create policy "posts insert"
  on public.posts for insert to authenticated
  with check (
    author_id = auth.uid()
    and (
      exists (select 1 from profiles pr where pr.id = auth.uid() and pr.is_admin)
      or exists (select 1 from profiles pr where pr.id = auth.uid() and pr.created_at < now() - interval '24 hours')
      or (
        select count(*) from posts pa
        where pa.author_id = auth.uid() and pa.created_at > now() - interval '24 hours'
      ) < 5
    )
  );

-- ============ 3) Moderação de comunidade ============

-- Helpers (security definer para ler as tabelas dentro das policies)
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from profiles where id = auth.uid() and is_admin); $$;

create or replace function public.is_mod_of(p_community uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.is_admin()
    or exists (select 1 from community_mods m where m.community_id = p_community and m.user_id = auth.uid());
$$;

grant execute on function public.karma_of(uuid), public.is_admin(), public.is_mod_of(uuid) to authenticated;

-- Mods nomeados pelo admin da plataforma
create table if not exists public.community_mods (
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  added_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  primary key (community_id, user_id)
);
alter table public.community_mods enable row level security;
create policy "mods read" on public.community_mods for select to authenticated using (true);
create policy "mods add admin" on public.community_mods for insert to authenticated with check (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin));
create policy "mods remove admin" on public.community_mods for delete to authenticated using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin));

-- Banidos de uma comunidade (mod ou admin bane; banido não entra)
create table if not exists public.community_bans (
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  banned_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  primary key (community_id, user_id)
);
alter table public.community_bans enable row level security;
create policy "bans read mod" on public.community_bans for select to authenticated using (public.is_mod_of(community_id));
create policy "bans add mod" on public.community_bans for insert to authenticated with check (public.is_mod_of(community_id));
create policy "bans remove mod" on public.community_bans for delete to authenticated using (public.is_mod_of(community_id));

-- Regras da comunidade, editadas por mods (substitui a antiga "update" aberta)
alter table public.communities add column if not exists rules text;
drop policy if exists "communities update" on public.communities;
drop policy if exists "communities update mod" on public.communities;
create policy "communities update mod"
  on public.communities for update to authenticated
  using (public.is_mod_of(id))
  with check (public.is_mod_of(id));

-- Delete de post: autor, admin OU mod da comunidade
do $$
begin
  execute (
    select string_agg(format('drop policy if exists %I on public.posts', policyname), '; ')
    from pg_policies where tablename = 'posts' and cmd = 'DELETE'
  );
end $$;
create policy "posts delete"
  on public.posts for delete to authenticated
  using (author_id = auth.uid() or public.is_mod_of(community_id));

-- Delete de comentário: autor, admin OU mod da comunidade do post
do $$
begin
  execute (
    select string_agg(format('drop policy if exists %I on public.comments', policyname), '; ')
    from pg_policies where tablename = 'comments' and cmd = 'DELETE'
  );
end $$;
create policy "comments delete"
  on public.comments for delete to authenticated
  using (author_id = auth.uid() or public.is_mod_of((select community_id from posts where id = post_id)));

-- Entrar em comunidade: bloqueado se banido
do $$
begin
  execute (
    select string_agg(format('drop policy if exists %I on public.community_members', policyname), '; ')
    from pg_policies where tablename = 'community_members' and cmd = 'INSERT'
  );
end $$;
create policy "community_members insert"
  on public.community_members for insert to authenticated
  with check (
    user_id = auth.uid()
    and not exists (
      select 1 from community_bans b
      where b.community_id = community_id and b.user_id = user_id
    )
  );
