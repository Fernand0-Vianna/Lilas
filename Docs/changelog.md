# Changelog

Histórico de mudanças baseado nas tasks semanais do projeto.

## 2026-08-17

### Feito

- Projeto Supabase criado e configurado (`gmmocqgdjmtlrahnfgye`, região `ca-central-1`)
- Migração aplicada: 7 tabelas (`profiles`, `communities`, `community_members`, `posts`, `comments`, `likes`, `follows`)
- Trigger `handle_new_user` configurado — cria perfil automaticamente no signup
- 21 políticas RLS aplicadas
- Seed das 5 comunidades: `r/AgostoLilas`, `r/Mulheres`, `r/LeiMariaPenha`, `r/SaudeFeminina`, `r/Enfrentamento`
- Aplicação React completa: Feed, Post, Criar, Comunidades, Perfil, Login OTP
- Topbar e BottomNav implementados
- PostCard com likes e comentários funcionando
- Design conforme protótipo Penpot implementado
- `vite build` passando
- Deploy no Netlify: `lilas-341.netlify.app`
- Commits enviados para GitHub (`Fernand0-Vianna/Lilas`, branch `main`)

### Bloqueios

- Rate limit do email embutido do Supabase: 2 emails/hora/IP — exaurido em testes via API (429)
- `example.com` rejeitado como email inválido pelo GoTrue
- Automação de browser (Obscura) não dispara `onChange` de inputs controlados — problema do harness, não do app

### Próximos passos

- Validar fluxo de login manualmente em produção
- Configurar SMTP custom para produção
- Fazer `git commit` + redeploy do client no Netlify para correções finais

---

## 2026-08-18

### Feito

- Configuração `site_url` atualizada para `https://lilas-341.netlify.app` via Management API
- Correções de schema no Supabase:
  - FKs `posts.author_id`, `comments.author_id`, `community_members.user_id`, `follows.follower_id/following_id` retargetadas para `profiles(id)` ON DELETE CASCADE
  - `likes.user_id` voltou a apontar para `auth.users(id)` para desambiguar relações PostgREST
  - Bug no app corrigido: `Post.jsx` usava `likes_count(*)` (view inexistente) — removido; `PostCard` já conta curtidas corretamente
- Teste de fluxo completo via REST: 14 checks PASS
  - Entrar em comunidade, criar post, comentar, curtir, seguir
  - Feed com joins (`profiles`, `communities`)
  - Contagem de likes
  - RLS (anon 401 para read/write)
  - Trigger de perfil funcionando
- Dados de teste limpos (0 usuários, 5 comunidades)
- Validado que email OTP dispara sem erro (200) — rate limit de 2/hora bateu no 2º envio (429)
- Observação: `email@dominio.test`/`.local` são rejeitados pelo GoTrue

### Bloqueios

- Rate limit de email permanece em 2/hora/IP — requer SMTP custom para produção

### Próximos passos

1. Validar fluxo de login manualmente (abrir site, email + apelido → Entrar → código OTP → Confirmar)
2. Configurar SMTP custom para produção (Resend/SendGrid)
3. Fazer commit + redeploy do client no Netlify para subir fix do `Post.jsx`

---

## 2026-08-18/23:30

<!-- Entrada pendente — aguardando detalhes da task noturna -->
