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

## Próximos passos
1. **Validar fluxo de login manualmente** (passo que não dá pra automatizar sem acesso a inbox): abrir `https://lilas-341.netlify.app`, email + apelido → Entrar → digitar código → Confirmar. Reportar erro exato se falhar. (O código OTP tem 8 dígitos; expira em 1h.)
2. **Configurar SMTP custom para produção** (limite de 2 emails/hora/IP é baixo para usuários reais): exige `SMTP_ADMIN_EMAIL/HOST/PORT/USER/PASS` no dashboard Supabase (ex: Resend/SendGrid).
3. Fazer `git commit` + redeploy do client no Netlify para o fix do `Post.jsx` subir (e confirmar feed/post no ar).

## Config relevante
- Projeto Supabase: `gmmocqgdjmtlrahnfgye` / `https://gmmocqgdjmtlrahnfgye.supabase.co`
- Netlify: `lilas-341.netlify.app`
- GitHub: `Fernand0-Vianna/Lilas`
- Supabase Auth: `mailer_autoconfirm: false`, `disable_signup: false`


---

