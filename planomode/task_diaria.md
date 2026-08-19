# Task — 2026-08-17 

## O que foi feito

### Backend (Supabase)
- Projeto **LIlas** (`gmmocqgdjmtlrahnfgye`, ca-central-1) criado e configurado.
- Migração aplicada:
  - 7 tabelas: `profiles`, `communities`, `community_members`, `posts`, `comments`, `likes`, `follows`.
  - Trigger `handle_new_user` — cria `profiles` automaticamente ao criar usuário (apelido vem de `raw_user_meta_data`, fallback `user_<id>`).
  - 21 políticas RLS.
  - Seed das 5 comunidades do design Penpot: `r/AgostoLilas`, `r/Mulheres`, `r/LeiMariaPenha`, `r/SaudeFeminina`, `r/Enfrentamento`.
- Verificado em produção: signup criou usuário em `auth.users` + trigger criou o `profiles`. Banco limpo ao final (0 usuários, 5 comunidades).

### Client (Vite + React)
- Aplicação completa em `client/`: Feed, Post, Criar, Comunidades, Perfil (com Seguir), Login OTP, topbar/bottomnav, PostCard.
- Design conforme protótipo Penpot: `#7c5ce0` / `#5b3fc4` / `#ff6b9d` / fundo `#f7f5fb`.
- `vite build` passa.
- Env vars do client em `client/.env` (gitignored) e `.env.example` (commitado).

### Deploy
- Netlify: site `lilas-341.netlify.app` criado, env vars `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` setadas, deploy `--build --prod` no ar.
- GitHub: commits enviados para `Fernand0-Vianna/Lilas` (main).

## Bloqueios / aprendizado
- Rate limit do email embutido do Supabase: **2 emails/hora/IP** (`rate_limit_email_sent: 2`). Exauri em testes via API → 429. Não é bug do app.
- `example.com` é rejeitado como email inválido pelo GoTrue.
- A automação de browser (Obscura) não dispara `onChange` de inputs controlados do React e bloqueia fetch in-page — problema do harness, não do app.

## Progresso — 2026-08-18 (execução do plano)

### Config aplicada (Management API)
- `site_url` → `https://lilas-341.netlify.app` ✅ (era `http://localhost:3000`)
- `rate_limit_email_sent` **não** pode subir sem SMTP custom — o endpoint exige `SMTP_ADMIN_EMAIL/HOST/PORT/USER/PASS` configurados. Ficou em 2.

### Bugs de schema corrigidos (migrations)
- FKs `posts.author_id`, `comments.author_id`, `community_members.user_id`, `follows.follower_id/following_id` apontavam para `auth.users` → PostgREST não achava relação `posts→profiles` e os joins embedados do app (`profiles(...)`) falhavam (PGRST200). Retargetadas para `profiles(id)` ON DELETE CASCADE.
- `likes.user_id` voltou a apontar para `auth.users(id)` para desambiguar a relação `posts→profiles` (evita PGRST201 many-to-many via likes).
- Bug no app: `Post.jsx` usava `likes_count(*)` (view inexistente) → página do post quebrava. Removido; `PostCard` já conta curtidas sozinho.

### Teste de fluxo completo (via REST, usuários de teste)
Todos os 14 checks PASS: entrar em comunidade, criar post, comentar, curtir, seguir, ler feed com joins (`profiles`, `communities`), contagem de likes, RLS (anon 401 para read/write), trigger de perfil. Dados de teste limpos ao final (0 usuários, 5 comunidades).
- Validado que o email OTP dispara sem erro (200) — rate limit de 2/hora bateu no 2º envio (429), confirmando o gargalo.
- Observação: `email@dominio.test`/`.local` são rejeitados pelo GoTrue (`email_address_invalid`); usar domínio real.

## Progresso — 2026-08-18 (continuação)

### Site renomeado
- Netlify: site renomeado de `lilas-341.netlify.app` → **`alilas.netlify.app`**. O domínio antigo retorna "Site not found" (morto).
- Supabase `site_url` já corrigido → `https://alilas.netlify.app` ✅ (via Management API, token em `.env` `#at:`).

### Login validado (email + senha)
- Fluxo mudou de OTP para **email + senha** (commits `cd56e13`, `fb10281`, `73f97a7`) — o passo "digitar código OTP" do plano original está obsoleto.
- Teste de ponta a ponta com usuário de teste `teste.lilas@proton.me` / senha `Lilas@2026teste` (criado via admin API, confirmado direto no banco para não gastar rate limit de email):
  - `POST /auth/v1/token?grant_type=password` → 200, usuário confirmado ✅
  - Feed autenticado lê joins `profiles(apelido)` + `communities(name)` ✅
  - Tela de login no ar em `alilas.netlify.app` renderiza corretamente (harness de browser bloqueia fetch in-page — problema do harness, não do app; validado via REST).
- `Post.jsx` já não usa `likes_count(*)` (fix commitado em `e0a6d79`); working tree limpo, deploy do client no ar com a tela nova.

## Próximos passos
1. **Configurar SMTP custom para produção** (único bloqueio real): limite `rate_limit_email_sent: 2`/hora é baixo para usuários reais. Exige `SMTP_ADMIN_EMAIL/HOST/PORT/USER/PASS` no dashboard Supabase (ex: Resend/SendGrid) — precisa das credenciais.
2. Confirmar manualmente a chegada do email de confirmação (depende do passo 1 ou espera do reset do rate limit de 2 emails/hora).

## Config relevante
- Projeto Supabase: `gmmocqgdjmtlrahnfgye` / `https://gmmocqgdjmtlrahnfgye.supabase.co`
- Netlify: `lilas-341.netlify.app`
- GitHub: `Fernand0-Vianna/Lilas`
- Supabase Auth: `mailer_autoconfirm: false`, `disable_signup: false`


---

