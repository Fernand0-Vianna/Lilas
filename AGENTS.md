# Lilás - Contexto de desenvolvimento

Regra de ouro da orquestração: toda interação começa pelo agente `orchestrator` — o único agente primário habilitado. Os agentes `plan` e `build` estão desabilitados (`opencode.json`) justamente para impedir exploração ou edição direta fora do roteamento. Nunca invocar diretamente `frontend-architect`, `frontend-implementer`, `debug-specialist`, `test-engineer`, `performance-optimizer`, `code-reviewer`, `e2e-qa-engineer` sem passar primeiro pelo roteamento. O agente só pode sair do `orchestrator` quando ele decidir a cadeia mínima e o contexto estiver pronto.

- **Orchestrator como única porta de entrada**: `plan` e `build` estão desabilitados (`opencode.json`) — não existe modo que permita trabalho direto. Toda sessão inicia no `orchestrator`, que não pode agir como especialista direto sem delegação.
- **Porta de entrada única**: o primeiro passo é sempre classificar a tarefa e decidir o especialista correto; não existe atalho para implementação, validação ou revisão direta.
- **Router puro**: o `orchestrator` não deve explorar arquivos, interpretar o projeto em modo direto ou fazer leitura/grep/glob/list sozinho. Sua função é classificar e delegar por `task`.
- **SDD como método, não como segundo orquestrador**: a metodologia SDD fica em `specs/sdd/SDD-ORCHESTRATOR.md` e em `.opencode/skills/sdd-orchestrator/`, mas não cria um novo agente executivo. O único agente de entrada continua sendo `orchestrator`.
- **Validação obrigatória antes da conclusão**: um agente não pode declarar uma tarefa concluída apenas pela própria autoavaliação. A conclusão depende dos gates de verificação definidos pelo `orchestrator` e, quando necessário, do agente `verifier`.
- **Prompt vagos e “oi”**: tarefas ambíguas, curtas ou sem escopo não devem ser convertidas em execução direta. O agente deve responder com classificação e roteamento, nunca com ação imediata sem especialista.

Antes de implementar ou desenhar mudanças significativas, alinha-te ao **Spec-Driven Development** e à arquitetura descrita no repositório.

## Estrutura do Projeto

| Pasta | Tecnologia |
|-------|-----------|
| `client/src/` | Frontend: React 18, Vite 5, React Router 6, CSS puro (variáveis `styles.css`), npm |
| `supabase/` | Backend & Auth: Supabase (PostgreSQL, PostgREST, RLS, Storage) |
| `Deploy/` | Netlify (via comando `vite build` → `dist/`) |

Mapa completo de pastas e fluxos de dados: [`docs/architecture.md`](../docs/architecture.md)

## Fonte principal - SDD

- **Especificação do produto:** [`docs/architecture.md`](../docs/architecture.md) - princípios, camadas, fluxo de dados, deploy.
- **Fluxo por feature:** [`specs/features/<feature-id>/`](../specs/features/) - artefactos SDD (PRD, design, spec, tasks) por feature.
- **ADRs:** [`docs/architecture.md#decisoes-de-arquitetura`](../docs/architecture.md#decisoes-de-arquitetura) - decisões estruturais duradouras (quando documentadas).
- **Backlog:** [`docs/changelog.md`](../docs/changelog.md) - histórico de mudanças e roadmap.

## Documentação de Referência

| Área | Documento |
|------|-----------|
| Arquitetura & Rotas | [`docs/architecture.md`](../docs/architecture.md) / [`docs/routes.md`](../docs/routes.md) |
| Banco & Segurança (RLS) | [`docs/database.md`](../docs/database.md) |
| Autenticação (Supabase Auth) | [`docs/authentication.md`](../docs/authentication.md) |
| Design System (tokens, componentes) | [`docs/design-system.md`](../docs/design-system.md) |
| Referência de API | [`docs/api-reference.md`](../docs/api-reference.md) |
| Componentes canônicos | [`docs/components.md`](../docs/components.md) |
| Deploy | [`docs/deployment.md`](../docs/deployment.md) |

## Agentes especialistas (`.opencode/agents/`)

Invoca pelo **nome** (ex: `@code-reviewer`) ou utilize os modos de UI **Plan / Build** para que a IA roteie automaticamente em linguagem natural. Cada agente já traz a sua allowlist de ferramentas e lê a skill correspondente no arranque — não copies convenções para o prompt de delegação.

Índice e padrão de escrita: [`.opencode/agents/`](../.opencode/agents/)

| Situação | Agente |
|----------|--------|
| Arquitetura, rotas, hierarchy de estado (read-only) | `frontend-architect` |
| Implementação concreta UI, hooks, services, CSS | `frontend-implementer` |
| Qualidade de PR / diff (read-only) | `code-reviewer` |
| Bugs runtime / causa raiz / erros Supabase | `debug-specialist` |
| QA End-to-End (navega a UI real em localhost) | `e2e-qa-engineer` |
| Performance com evidência (bundle, renders) | `performance-optimizer` |
| Testes automatizados (Vitest + RTL) | `test-engineer` |

Orquestração mínima: um especialista quando bastar; cadeias curtas só quando a tarefa exigir.

## Skills (`.opencode/skills/`)

Carregadas automaticamente quando a situação encaixa, ou invocadas por menção direta.

Índice e padrão: [`.opencode/skills/`](../.opencode/skills/)

| Área | Skill |
|------|-------|
| Convenções frontend React+Vite (conhecimento) | `frontend-skill` |
| Convenções backend Supabase, RLS, Auth (conhecimento) | `supabase-skill` |
| Pedido vago ou multi-domínio → rotear e encadear | `meta-agent` |
| Especificar feature antes de código (PRD → design → spec) | skill `sdd-orchestrator` |
| Regressão E2E pela UI real | `e2e-qa-skill` |

Orquestração é skill, não agente: um subagente não tem a ferramenta Agent e por isso só conseguiria recomendar, não delegar.

## Regras de comportamento

- **Loop de orquestração:** o fluxo obrigatório é `receber → classificar → planejar → delegar → acompanhar estado → verificar → reparar se falhar → verificar novamente → finalizar`.
- **SDD first:** para features novas ou refactors com contrato negócio/técnico, seguir o fluxo SDD (PRD → design → spec/tasks) antes de gerar código.
- **Human-in-the-loop:** merge e decisões de risco ficam com o humano. Sem secrets no repo.
- **Verificação obrigatória:** um agente não pode declarar uma tarefa concluída apenas por sua própria avaliação. A conclusão depende dos gates de verificação definidos pelo `orchestrator`.
- **Fonte de verdade no Supabase:** RLS (21 policies) garante segurança; não reimplementar regras de acesso no frontend.
- **Inversão de dependência:** Páginas e hooks chamam `lib/` (services); **nunca** utilizar `supabase.from()` diretamente dentro do JSX.
- **Estado global mínimo:** Utilizar `AuthContext` (`session`, `profile`, `loading`). Manter uma única política de rota (`RequireAuth`).
- **Frontend Strict:** Utilizar variáveis puras via `styles.css` (`--primary`, `--radius`, etc.). **Proibido introduzir Tailwind**. Garantir acessibilidade (foco, teclado).
- **Comentários de código:** não adicionar comentários óbvios ou narrativos; comentar apenas decisões, regras de negócio e lógica complexa que não seja autoexplicativa. O `code-reviewer` deve revisar esse critério antes do `verifier`.
- **Gate de Qualidade:** Código só é entregue se `npm run build` passar, sem secrets no diff, e com design system respeitado.
- **Idioma:** respostas, copy de usuário, logs e mensagens de erro em **português (Brasil)**; identificadores de código (variáveis, métodos) em inglês.

## Fluxo recomendado para implementação

Para mudanças de código, usar a cadeia:

```text
frontend-implementer → code-reviewer → verifier
```

- `frontend-implementer`: implementa e evita comentários desnecessários.
- `code-reviewer`: revisa o diff e exige comentários somente quando explicam contexto não óbvio.
- `verifier`: confirma a evidência final e reabre a tarefa se ainda houver ruído ou falha.