# Referência de API

> **Nota:** Não há backend tradicional. Todas as operações são feitas diretamente contra o Supabase via `supabase-js`. O PostgREST expõe as tabelas como endpoints REST automaticamente.

## Cliente Supabase

Localizado em `client/src/lib/supabase.js`.

```js
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(url, anon)
```

## Operações por Entidade

### Auth

#### Signup
```js
const { error } = await supabase.auth.signUp({
  email: 'usuario@email.com',
  password: 'senha123',
  options: { data: { apelido: 'nome_fantasia' } }
})
```

#### Login
```js
const { error } = await supabase.auth.signInWithPassword({
  email: 'usuario@email.com',
  password: 'senha123'
})
```

#### Logout
```js
await supabase.auth.signOut()
```

#### Sessão atual
```js
const { data } = await supabase.auth.getSession()
// data.session contém a sessão
```

#### Listener de mudança de auth
```js
const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
  // atualiza estado global
})
// sub.subscription.unsubscribe() para limpar
```

### Profiles

#### Ler perfil próprio
```js
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', session.user.id)
  .maybeSingle()
```

#### Ler perfil por apelido
```js
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('apelido', apelido)
  .maybeSingle()
```

#### Atualizar senha
```js
const { error } = await supabase.auth.updateUser({ password: novaSenha })
```

### Communities

#### Listar comunidades
```js
const { data } = await supabase
  .from('communities')
  .select('*')
  .order('members', { ascending: false })
```

#### Entrar em comunidade
```js
const { error } = await supabase
  .from('community_members')
  .insert({ community_id: id, user_id: session.user.id })
```

#### Sair de comunidade
```js
const { error } = await supabase
  .from('community_members')
  .delete()
  .eq('community_id', id)
  .eq('user_id', session.user.id)
```

### Posts

#### Criar post
```js
const { error } = await supabase
  .from('posts')
  .insert({
    author_id: session.user.id,
    community_id: communityId,
    title: 'Título',
    body: 'Conteúdo'
  })
```

#### Feed (posts recentes com joins)
```js
const { data } = await supabase
  .from('posts')
  .select('*, profiles(apelido, avatar_url), communities(slug, name)')
  .order('created_at', { ascending: false })
  .limit(30)
```

#### Post por ID
```js
const { data } = await supabase
  .from('posts')
  .select('*, profiles(apelido), communities(slug, name)')
  .eq('id', postId)
  .single()
```

#### Deletar post
```js
const { error } = await supabase
  .from('posts')
  .delete()
  .eq('id', postId)
```

### Comments

#### Criar comentário
```js
const { data, error } = await supabase
  .from('comments')
  .insert({ post_id: postId, author_id: session.user.id, body: texto })
  .select('*, profiles(apelido)')
  .single()
```

#### Listar comentários de um post
```js
const { data } = await supabase
  .from('comments')
  .select('*, profiles(apelido)')
  .eq('post_id', postId)
  .order('created_at')
```

#### Deletar comentário
```js
const { error } = await supabase
  .from('comments')
  .delete()
  .eq('id', commentId)
```

### Likes

#### Contar likes de um post
```js
const { count } = await supabase
  .from('likes')
  .select('*', { count: 'exact', head: true })
  .eq('post_id', postId)
```

#### Verificar se usuário curtiu
```js
const { data } = await supabase
  .from('likes')
  .select('user_id')
  .eq('post_id', postId)
  .eq('user_id', session.user.id)
  .maybeSingle()
```

#### Curtir post
```js
const { error } = await supabase
  .from('likes')
  .insert({ post_id: postId, user_id: session.user.id })
```

#### Descurtir post
```js
const { error } = await supabase
  .from('likes')
  .delete()
  .eq('post_id', postId)
  .eq('user_id', session.user.id)
```

### Follows

#### Seguir usuário
```js
const { error } = await supabase
  .from('follows')
  .insert({ follower_id: meuId, following_id: userId })
```

#### Deixar de seguir
```js
const { error } = await supabase
  .from('follows')
  .delete()
  .eq('follower_id', meuId)
  .eq('following_id', userId)
```

#### Verificar se está seguindo
```js
const { data } = await supabase
  .from('follows')
  .select('id')
  .eq('follower_id', meuId)
  .eq('following_id', userId)
  .maybeSingle()
```

#### Contar seguidores
```js
const { count } = await supabase
  .from('follows')
  .select('*', { count: 'exact', head: true })
  .eq('following_id', userId)
```

#### Contar seguindo
```js
const { count } = await supabase
  .from('follows')
  .select('*', { count: 'exact', head: true })
  .eq('follower_id', userId)
```

## Padrões de Query Importantes

### Joins embedados
```js
// Traz dados relacionados em uma única query
supabase.from('posts').select('*, profiles(apelido), communities(name)')
```

### Contagem sem trazer dados
```js
// head: true não retorna linhas, apenas count
supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', id)
```

### maybeSingle vs single
```js
// maybeSingle: retorna null se não encontrar (não lança erro)
.maybeSingle()

// single: lança erro se não encontrar exatamente 1
.single()
```

## Observações

- `likes_count(*)` (usado incorretamente em versão anterior do `Post.jsx`) não é uma view válida. Use as queries de contagem acima.
- `posts.author_id` referencia `profiles(id)`, não `auth.users(id)`, para permitir joins com `profiles(...)`.
- `likes.user_id` referencia `auth.users(id)` para desambiguar relações PostgREST.
