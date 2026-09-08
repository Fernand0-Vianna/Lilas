-- Lilás · Notificações
-- Rodar no SQL Editor do Supabase (projeto gmmocqgdjmtlrahnfgye)

-- ============ 1) Tabela notifications ============

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('comment', 'follow', 'mention')),
  from_user_id uuid references auth.users(id) on delete set null,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

-- Usuário lê suas próprias notificações
create policy "notifications read own"
  on public.notifications for select to authenticated
  using (auth.uid() = user_id);

-- Usuário marca suas notificações como lidas
create policy "notifications update own"
  on public.notifications for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Índices para performance
create index if not exists notifications_user_read_idx on public.notifications(user_id, read);
create index if not exists notifications_created_idx on public.notifications(user_id, created_at desc);

-- ============ 2) Triggers ============

-- Notifica autor do post quando alguém comenta
create or replace function public.notify_on_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Não notificar a si mesma
  if new.author_id = (select author_id from public.posts where id = new.post_id) then
    return new;
  end if;

  insert into public.notifications (user_id, type, from_user_id, post_id, comment_id)
  values (
    (select author_id from public.posts where id = new.post_id),
    'comment',
    new.author_id,
    new.post_id,
    new.id
  );
  return new;
end;
$$;

drop trigger if exists on_comment_notify on public.comments;
create trigger on_comment_notify
  after insert on public.comments
  for each row execute function public.notify_on_comment();

-- Notifica usuário quando alguém o segue
create or replace function public.notify_on_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Não notificar a si mesma
  if new.follower_id = new.following_id then
    return new;
  end if;

  insert into public.notifications (user_id, type, from_user_id)
  values (new.following_id, 'follow', new.follower_id);
  return new;
end;
$$;

drop trigger if exists on_follow_notify on public.follows;
create trigger on_follow_notify
  after insert on public.follows
  for each row execute function public.notify_on_follow();

-- ============ 3) RPCs ============

-- Conta notificações não lidas
create or replace function public.unread_count()
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int from public.notifications where user_id = auth.uid() and not read;
$$;

-- Marca todas como lidas
create or replace function public.mark_notifications_read()
returns void
language sql
security definer
set search_path = public
as $$
  update public.notifications set read = true where user_id = auth.uid() and not read;
$$;

grant execute on function public.unread_count(), public.mark_notifications_read() to authenticated;
