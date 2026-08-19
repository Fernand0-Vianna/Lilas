# Componentes

## Páginas

### `Feed` (`src/pages/Feed.jsx`)

Página inicial com feed de posts, rail de comunidades e sidebar de boas-vindas.

**Estado local:**
- `posts` — lista de posts
- `communities` — top 10 comunidades por membros
- `loading` — carregamento inicial

**Dados carregados:**
- Posts com `profiles(apelido, avatar_url)` e `communities(slug, name)`
- Comunidades ordenadas por `members`

**Funcionalidades:**
- Renderiza `PostCard` para cada post
- Remove post localmente quando deletado (`onDeleted`)
- Abas "Para você", "Novo", "Em alta" (placeholders visuais)

### `Post` (`src/pages/Post.jsx`)

Página de detalhe de um post com comentários.

**Estado local:**
- `post` — dados do post
- `comments` — lista de comentários
- `body` — texto do novo comentário
- `loading` — carregamento inicial

**Funcionalidades:**
- Carrega post + comentários em paralelo
- Adiciona comentário via `insert`
- Deleta comentário (próprio ou admin)
- Usa `PostCard` para renderizar o post

### `Create` (`src/pages/Create.jsx`)

Formulário de criação de post.

**Estado local:**
- `communities` — lista de comunidades
- `community` — comunidade selecionada
- `title` — título do post
- `body` — corpo do post
- `error` — mensagem de erro
- `loading` — estado de publicação

**Funcionalidades:**
- Seleção de comunidade via chips
- Validação de título e comunidade
- Publicação via `insert` em `posts`
- Redireciona para `/` após sucesso

### `Communities` (`src/pages/Communities.jsx`)

Lista de comunidades com busca e botão de entrada/saída.

**Estado local:**
- `communities` — lista completa
- `joined` — mapa de comunidades que o usuário entrou

**Funcionalidades:**
- Toggle de entrada/saída via `community_members`
- Formatação de contagem de membros (`compact`)

### `Profile` (`src/pages/Profile.jsx`)

Perfil de usuário (próprio ou de outro).

**Estado local:**
- `profile` — dados do perfil
- `posts` — posts do usuário
- `following` — se o usuário logado segue o perfil visitado
- `stats` — estatísticas (posts, likes, comments, followers, following)
- `tab` — aba ativa (`posts` ou `saves`)
- `editOpen` — painel de edição aberto
- `pw1`, `pw2` — campos de senha
- `pwMsg` — mensagem de alteração de senha

**Funcionalidades:**
- Toggle de seguir/deixar de seguir
- Alteração de senha
- Logout
- Abas de posts e saves (saves é placeholder)

### `Login` (`src/pages/Login.jsx`)

Página de autenticação com duas abas: Entrar e Criar conta.

**Estado local:**
- `mode` — `'entrar'` ou `'criar'`
- `email`, `apelido`, `password` — campos do formulário
- `error`, `info` — mensagens
- `loading` — estado de envio

**Funcionalidades:**
- Login com email/senha (`signInWithPassword`)
- Cadastro com email/senha/apelido (`signUp`)
- Apelido é armazenado em `raw_user_meta_data`

## Componentes

### `PostCard` (`src/components/PostCard.jsx`)

Card de post reutilizável no feed e perfis.

**Props:**
- `post` — objeto do post
- `onDeleted` — callback quando post é deletado

**Estado local:**
- `liked` — se o usuário logado curtiu
- `likes` — contagem de curtidas
- `comments` — contagem de comentários
- `author` — dados do autor

**Funcionalidades:**
- Conta likes e comments em paralelo
- Toggle de like
- Delete (próprio post ou admin)

> **Nota:** `PostCard` já conta likes corretamente. A página `Post.jsx` anterior usava `likes_count(*)` (view inexistente) — esse bug foi corrigido removendo a contagem da página e deixando `PostCard` gerenciar.

### `BottomNav` (`src/components/BottomNav.jsx`)

Navegação inferior mobile.

**Itens:**
- Início (`/`)
- Buscar (placeholder)
- Criar (`/criar`)
- Alertas (placeholder)
- Perfil (`/perfil`)

### `Icons` (`src/components/Icons.jsx`)

Biblioteca de ícones SVG embutidos.

**Ícones disponíveis:**
- `home`, `search`, `add`, `person`, `bell`
- `heart`, `comment`, `bookmark`
- `gear`, `more`, `pen`
- `location`, `chevron-left`, `flag`

**Props:**
- `name` — nome do ícone
- `size` — tamanho em px (default: 18)
- `filled` — preenchido ou outline
- `className`, `style` — estilos adicionais

## Utilitários

### `format.js` (`src/lib/format.js`)

- `compact(n)` — formata números grandes (ex: `1500` → `1,5 mil`)
- `timeAgo(date)` — formata data relativa (ex: `2h`, `5d`)
