---
name: supabase-skill
description: Convenções canônicas do backend Supabase do Lilás — schema PostgreSQL, RLS (Row Level Security), triggers, functions RPC, Supabase Auth (email OTP), Storage (futuro), migrações via Supabase CLI. Use ao ler, escrever ou revisar qualquer coisa em supabase/, incluindo migrations, policies, seeds, e ao definir contratos de dados consumidos pelo frontend. Não use para trabalho de UI (frontend-skill) nem para especificação de feature antes de código (sdd-orchestrator).
---

# Backend (Supabase — Lilás)

Base de **conhecimento** do backend Supabase: fatos do repositório, regras de segurança, migrações e anti‑padrões. Não é perfil de comportamento — o comportamento está nos agentes `frontend-architect` / `frontend-implementer` / `debug-specialist`, que carregam esta skill como contexto obrigatório.

---

## 1. Quando aplicar
| Situação | Aplicar |
| -------- | ------- |
| Alterações em `supabase/migrations/` | Sim |
| Novas tabelas, policies RLS, triggers, functions RPC | Sim |
| Seeds de comunidades, avatars bucket | Sim |
| Contratos de dados consumidos pelo frontend | Sim |
| UI, hooks, estilos | Não — [`frontend-skill`](../frontend-skill/SKILL.md) |
| Especificar feature antes de código | Não — [`sdd-orchestrator`](../sdd-orchestrator/SKILL.md) |

---

## 2. Ligações
| Recurso | Path |
| ------- | ---- |
| Mapa do projeto e comandos | [`docs/README.md`](../../docs/README.md) |
| Diagrama ER e detalhes de tabelas | [`docs/database.md`](../../docs/database.md) |
| Autenticação e fluxos | [`docs/authentication.md`](../../docs/authentication.md) |
| ADRs transversais | [`docs/adrs/`](../../docs/adrs/) |

---

## 3. Princípios
| Princípio | Como se traduz aqui |
| --------- | ------------------- |
| **Segurança no banco** | RLS habilitado em **todas** as tabelas; policies são a fronteira de autorização. |
| **Menos poder útil** | KISS/YAGNI: uma função RPC por operação complexa; não adicionar triggers "para o futuro". |
| **Fonte única de contratos** | Mudança de schema acompanha o consumidor (frontend) quando o incremento assim define. |
| **Dados sensíveis no banco** | PII minimizada; emails/telefones não expostos em policies públicas. |

---

## 4. Tabelas e Relacionamentos (resumo)
Ver `docs/database.md` para detalhes completos.

| Tabela | PK | Principais FKs | RLS |
| ------ | -- | -------------- | --- |
| `profiles` | `id` (uuid = auth.users) | `author_id → posts`, `author_id → comments`, `follower_id/following_id → follows` | 21 policies totais |
| `communities` | `id` | `community_id → posts`, `community_id → community_members` | SELECT público; UPDATE mod/admin |
| `community_members` | `id` | `user_id → profiles`, `community_id → communities` | INSERT/DELETE próprio |
| `posts` | `id` | `author_id → profiles`, `community_id → communities` | SELECT público; INSERT autenticado; DELETE próprio/mod/admin |
| `comments` | `id` | `post_id → posts`, `parent_id → comments`, `author_id → profiles` | SELECT público; INSERT autenticado; DELETE próprio/mod/admin |
| `likes` | `id` | `post_id → posts`, `user_id → auth.users` | INSERT/DELETE próprio |
| `follows` | `id` | `follower_id → profiles`, `following_id → profiles` | INSERT/DELETE próprio |
| `poll_votes` | (`post_id`, `user_id`) | `post_id → posts`, `user_id → auth.users` | SELECT autenticado; INSERT/UPDATE próprio |
| `community_mods` | (`community_id`, `user_id`) | refs `communities`, `profiles` | Leitura aberta; escrita admin |
| `community_bans` | (`community_id`, `user_id`) | refs `communities`, `profiles` | Leitura aberta; escrita admin (mods p/ bans) |

---

## 5. Funções RPC (resumo)
| Função | Retorno | Descrição |
| ------ | ------- | --------- |
| `karma_of(user)` | `int` | Soma dos votos recebidos em posts + comentários do usuário |
| `is_admin()` | `boolean` | Usuária atual é admin |
| `is_mod_of(community)` | `boolean` | Usuária atual é mod da comunidade (admin conta como mod) |
| `vote_post(post, vote)` / `vote_comment(comment, vote)` | `int` | Voto atômico, retorna novo placar |
| `sync_community_members()` | trigger | Mantém `communities.members` em sincronia |
| `delete_account()` | `void` | Exclui conta e todos os dados (cascata) |

---

## 6. Triggers
### `handle_new_user`
Dispara após `INSERT` em `auth.users`. Cria registro em `profiles`:
- `id = NEW.id`
- `apelido = raw_user_meta_data->>'apelido'` ou fallback `user_<id>`

Garante que todo usuário cadastrado já tenha perfil associado.

---

## 7. RLS (Row Level Security)
Todas as 7 tabelas principais possuem RLS habilitado. Total de **21 policies**.

### Políticas por Tabela (resumo)
| Tabela | Tipo | Exemplo |
| ------ | ---- | ------- |
| `profiles` | SELECT público | Qualquer autenticado lê perfis |
| `profiles` | UPDATE próprio | Usuário edita apenas seu perfil |
| `communities` | SELECT público | Todos listam comunidades |
| `community_members` | INSERT/DELETE próprio | Entrar/sair; INSERT bloqueado se banida |
| `posts` | SELECT público | Todos leem posts |
| `posts` | INSERT autenticado | Autor = própria usuária; conta nova (<24h) limitada a 5 posts/dia |
| `posts` | DELETE próprio/mod/admin | Autora, admin ou mod da comunidade deleta |
| `comments` | SELECT público | Todos leem comentários |
| `comments` | INSERT autenticado | Autenticado comenta |
| `comments` | DELETE próprio/mod/admin | Autora, admin ou mod deleta |
| `poll_votes` | SELECT autenticado / INSERT+UPDATE próprio | Votar e trocar voto |
| `community_mods/bans` | Leitura aberta / escrita admin (mods p/ bans) | Gestão de moderação |
| `likes` | INSERT/DELETE próprio | Curtir/descurtir |
| `follows` | INSERT/DELETE próprio | Seguir/deixar de seguir |

> **Nota:** Detalhes exatos devem ser confirmados no Supabase Dashboard. A aplicação assume RLS correto para fluxos implementados.

---

## 8. Dados Seed
5 comunidades criadas automaticamente na inicialização:
- `r/AgostoLilas`
- `r/Mulheres`
- `r/LeiMariaPenha`
- `r/SaudeFeminina`
- `r/Enfrentamento`

---

## 9. Migrações
- Gerenciadas via **Supabase CLI** (`supabase migration new`, `supabase db push`).
- Arquivos em `supabase/migrations/` com timestamp prefixo.
- **Release com `DROP COLUMN`/`RENAME` é forward‑only** — planejar em duas fases (adicionar → migrar dados → remover em release posterior).
- Revisão humana obrigatória antes de produção.

---

## 10. Autenticação (Supabase Auth)
- **Email OTP** (One‑Time Password) — 8 dígitos, válido 1h.
- **Signup**: `signUp` com `options.data.apelido` → trigger `handle_new_user` cria profile.
- **Signin**: `signInWithPassword` → `refreshProfile()` carrega profile.
- **Logout**: `signOut()` → `onAuthStateChange` limpa sessão e profile.
- **Rate limit email**: Free tier 2 emails/hora/IP. Produção: SMTP custom (Resend, SendGrid).
- **Domínios rejeitados**: `example.com`, `.test`, `.local` rejeitados pelo GoTrue.

---

## 11. Storage (futuro)
Bucket `avatars` criado via migration `20260825_create_avatars_bucket.sql`. Policies de leitura pública / escrita próprio usuário.

---

## 12. Validação (comandos reais)
```bash
supabase db push   # aplica migrações locais ao projeto vinculado
```
```bash
supabase db diff   # verifica diff de schema
```
```bash
supabase migration list
```

---

## 13. Checklist de entrega (feature backend)
1. [ ] Migration criada com `supabase migration new <nome>`.
2. [ ] RLS habilitado na tabela nova; policies cobrindo SELECT/INSERT/UPDATE/DELETE conforme necessidade.
3. [ ] Triggers/functions RPC com nomes descritivos e comentários.
4. [ ] Seed atualizado se nova comunidade ou dado de referência.
5. [ ] `supabase db push` roda sem erro em ambiente de staging.
6. [ ] Frontend consumidor atualizado (service, types) — contrato não quebra silenciosamente.
7. [ ] Testes de integração (se existirem) passam contra DB de teste.

---

## 14. Anti‑padrões
| Evitar | Porquê |
| ------ | ------ |
| Policies genéricas "por hábito" sem ganho claro | Ruído e superfície de ataque |
| Lógica de negócio pesada no frontend sem RLS correspondente | Viola segregação assumida |
| `supabase.from().select('*')` em leituras | Vaza colunas sensíveis; usar colunas explícitas |
| Triggers que modificam outras tabelas sem necessidade | Acoplamento oculto, difícil de depurar |
| Secrets no repositório | Config sensível vai para variáveis de ambiente / Netlify env vars |
| Migração `DROP`/`RENAME` sem plano em duas fases | Perda de dados irreversível |

---

## 15. Idioma
Mensagens de usuário e logs de negócio: **português (Brasil)**. Identificadores de código: **inglês**.

---

## Histórico
| Versão | Mudança |
| ------ | ------- |
| 1.0.0  | Criação adaptada do EmpregaNet `backend-skill` para Supabase (PostgreSQL + RLS + Auth) |