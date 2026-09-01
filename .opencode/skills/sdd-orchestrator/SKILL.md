---
name: sdd-orchestrator
description: Conduz o fluxo Spec-Driven Development do Lilás fase a fase — prd.md, design.md, spec.md, tasks.md em specs/features/<feature-id>/ — com versionamento em frontmatter e gate que impede gerar código até aprovação humana de cada fase. Use ao iniciar capability nova, refator grande cujo contrato de negócio/técnico deve ficar documentado, ou quando o usuário pedir "orquestrador SDD", "PRD primeiro" ou "spec antes de implementar". Não use para correção de bug, ajuste pequeno dentro de contrato existente, nem para implementar feature cuja spec já esteja aprovada.
---

# Orquestrador SDD — Lilás

Esta skill é uma guia de método, não um segundo agente de orquestração. O único agente de entrada do projeto continua sendo `orchestrator`. O papel desta skill é orientar a aplicação do SDD quando a tarefa exigir PRD/design/spec antes da implementação.

O governo (fases, regras, mapeamento) está em [`specs/sdd/SDD-ORCHESTRATOR.md`](../../specs/sdd/SDD-ORCHESTRATOR.md) — documento aprovado e versionado, que esta skill aplica em vez de reescrever.

| Documento | Papel |
| --------- | ----- |
| [`specs/sdd/SDD-ORCHESTRATOR.md`](../../specs/sdd/SDD-ORCHESTRATOR.md) | Regras de governo, conteúdo mínimo de cada artefato, gate de código |
| [`specs/sdd/SDD-USAGE-GUIDE.md`](../../specs/sdd/SDD-USAGE-GUIDE.md) | Templates de acionamento, version bump, geração de `state.md` |
| [`specs/sdd/adrs/`](../../specs/sdd/adrs/) | Decisões estruturais duradouras |

Ler o primeiro antes de gerar qualquer artefato.

---

## 1. Quando aplicar
| Situação | Aplicar |
| -------- | ------- |
| Capability nova com contrato de negócio a fixar | Sim |
| Refator que muda fronteiras ou contratos entre camadas/serviços | Sim |
| Pedido explícito: "orquestrador SDD", "PRD primeiro", "spec antes de código" | Sim |
| Correção de bug ou ajuste dentro de contrato existente | Não — agente `debug-specialist` ou implementação direta |
| Spec já aprovada, falta construir | Não — ir para fase 4 (delegação) |
| Decisão técnica isolada e duradoura, sem feature associada | Não — escrever ADR em `specs/sdd/adrs/` |

---

## 2. Entradas necessárias
Antes da Fase 1, exigir do usuário (perguntar o que faltar — não inventar):
- `feature-id` em kebab-case (ex.: `lil-12-notificacao-comentario`)
- Problema de negócio que a feature resolve
- Regras principais: RBAC, invariantes, limites conhecidos

Sem `feature-id` e sem problema de negócio, não criar pasta nem arquivo.

---

## 3. Processo — uma fase por vez, com gate humano entre cada
| Fase | Artefato | Gate de saída |
| ---- | -------- | ------------- |
| 1 | `prd.md` — problema, personas e RBAC, workflows, critérios de aceite verificáveis, non-goals | Aprovação humana do PRD |
| 2 | `design.md` — contratos de dados, fluxos (mermaid quando ajudar), HTTP (rotas/verbos/corpos/códigos), infra e políticas de auth | Aprovação humana do design |
| 3 | `spec.md` (matriz critério de aceite → local de verificação) + `tasks.md` (plano de implementação, com *deviation notes*) | Aprovação humana da spec |
| 4 | Implementação delegada | — |
| 5 | `state.md` (opcional) — congelamento pós-aprovação | — |

Regras de execução em cada fase:
1. Gerar somente o artefato da fase corrente e parar para aprovação. Nunca produzir dois artefatos numa passagem.
2. Todo artefato nasce em `v1.0.0` com frontmatter `version` / `date` / `status: Draft | Approved`.
3. Separação PRD vs design: no `prd.md` não entram soluções técnicas, pacotes npm, Supabase, RLS, mensagens ou estruturas de BD.
4. Sem duplicação entre artefatos: `spec.md` não repete endpoints nem tabelas (isso é `design.md`) e não dilui passos de implementação (isso é `tasks.md`).
5. Dependências reais: não inventar integrações ou assinaturas externas — exigir confirmação humana ou código existente no repositório.
6. Simetria de domínio: operações reversíveis (cancelar, despublicar, remover) devem ser modeladas com mesmo rigor que construtivas.

### 3.1 Gate de código (regra inviolável)
Não gerar, refatorar ou alterar código de produção ou testes de implementação antes de as fases acordadas estarem explicitamente aprovadas pelo humano. Exceção única: spike descartável pedido explicitamente, fora do PR da feature.

Se usuário pedir código com spec ainda em Draft: dizer em uma frase que o gate está fechado, mostrar o que falta aprovar e oferecer spike descartável como alternativa.

### 3.2 Version bump
Ao alterar artefato já aprovado, subir versão no frontmatter e atualizar data:
| Bump | Quando |
| ---- | ------ |
| Minor (v1.1.0) | Novos critérios de aceite, campos ou endpoints compatíveis com existente |
| Major (v2.0.0) | Mudança arquitetural, troca de integração crítica ou regras que invalidam contrato anterior |

---

## 4. Fase 4 — Delegação depois da spec aprovada
| Âmbito | Delegar a | Conhecimento que o agente carrega |
| ------ | --------- | ------------------------------- |
| Fronteiras, hierarquia, roteamento, estado | `frontend-architect` | [`frontend-skill`](../frontend-skill/SKILL.md) |
| Código React (componentes, hooks, services) | `frontend-implementer` | [`frontend-skill`](../frontend-skill/SKILL.md) |
| Schema, RLS, triggers, RPC | `frontend-implementer` (com leitura de [`supabase-skill`](../supabase-skill/SKILL.md)) | ambas |
| Testes | `test-engineer` | `frontend-skill` / `supabase-skill` conforme camada |
| Verificação pela UI real | [`e2e-qa-skill`](../e2e-qa-skill/SKILL.md) | — |

Passar ao agente o caminho de `specs/features/<id>/design.md` e `tasks.md` — não recopiar conteúdo no prompt.
Decisão estrutural que sobreviva à feature: registrar ADR em `specs/sdd/adrs/`.

---

## 5. Estrutura canônica
```text
specs/features/
└── <feature-id>/
    ├── prd.md
    ├── design.md
    ├── spec.md
    ├── tasks.md
    └── state.md            # opcional, após freeze
```
Uma pasta por feature. Não misturar features no mesmo arquivo nem na raiz de `docs/`.

---

## 6. Validação antes de declarar fase concluída
1. [ ] Artefato tem frontmatter com `version`, `date`, `status`.
2. [ ] Está na pasta `specs/features/<feature-id>/` correta.
3. [ ] Não invade âmbito de outra fase (§3, regras 3 e 4).
4. [ ] Critérios de aceite são verificáveis (observáveis, não aspiracionais).
5. [ ] Non-goals declarados no `prd.md`.
6. [ ] Nenhum código de produção foi tocado (§3.1).

---

## 7. Idioma
Artefatos e comunicação em português (Brasil); identificadores técnicos e `feature-id` em inglês/kebab-case.

---

## Histórico
| Versão | Mudança |
| ------ | ------- |
| 1.0.0 | Adaptado do EmpregaNet `sdd-orchestrator` para stack Lilás (React + Vite + Supabase) |