# Changelog

Histórico de mudanças baseado nas tasks semanais do projeto.

## 2026-09-04

### Feito

- **Criar comunidades**: página `/criar-comunidade` (web `Client/src/pages/CreateCommunity.jsx` + mobile `criar-comunidade.tsx`), coluna `creator_id` em `communities`, trigger `on_community_created` (criadora vira membro + primeira mod automaticamente), slug único com validação. Acesso via botão "Criar comunidade" na lista `/comunidades`.
- **Notificações**: tabela `notifications` aplicada no banco (8 linhas de estrutura), triggers `on_comment_notify`/`on_follow_notify`, RPCs `unread_count`/`mark_notifications_read` verificados.

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

## 2026-08-24

### Feito

- Task `planomode/task_diaria.md` implementada (features estilo Reddit):
  - **Posts mais ricos**: tipos Link (card com favicon/domínio) e Enquete (opções em `poll_options`, votos em `poll_votes`, barras de percentual) + tags de contexto no post (`Dúvida`, `Conseguiu`, `História Real`, `Desabafo`, `Apoio`)
  - **Karma completo**: função `karma_of(uuid)` soma votos de posts + comentários; perfil exibe via RPC
  - **Anti-spam**: política RLS de `posts insert` — contas com menos de 24h publicam no máx. 5 posts/dia (admin livre)
  - **Mods de comunidade**: tabelas `community_mods` e `community_bans`; coluna `rules` em `communities`; funções `is_admin()`/`is_mod_of(uuid)`; delete de post/comentário liberado para mod da comunidade; banido não consegue entrar; painel de moderação na página da comunidade (regras, nomear/remover mods — admin, bloquear/desbloquear usuárias)
  - Política `communities update` aberta (`using(true)`) substituída por versão restrita a mods/admin
- Migration aplicada no Supabase via Management API (`migrations/reddit_v2.sql`)
- Itens 1 (votos) e 2 (comentários aninhados) já existiam no código
- `vite build` passando

---

## 2026-08-18/23:30

<!-- Entrada pendente — aguardando detalhes da task noturna -->
