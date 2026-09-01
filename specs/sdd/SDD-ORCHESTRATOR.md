# SDD Orchestrator — Lilás

Este documento define a metodologia de governança SDD do projeto. Ele não é um segundo agente executivo nem um orquestrador paralelo. O único ponto de entrada executável continua sendo o agente `orchestrator`.

A função deste documento é orientar quando a demanda exige PRD/design/spec antes da implementação, sem duplicar a política de roteamento.

## 1. Quando aplicar
- Capability nova com contrato de negócio a fixar
- Refactor grande que mexe em fronteiras ou contratos entre camadas
- Pedido explícito: "PRD primeiro", "spec antes de código", "orquestrador SDD"

Não usar para:
- correção de bug pontual
- ajuste dentro do contrato existente
- implementação depois que a spec já foi aprovada

## 2. Fluxo obrigatório
1. `prd.md` — problema, personas, regras, critérios de aceite, non-goals
2. `design.md` — arquitetura, contratos de dados, fluxo de autenticação, rotas e integrações
3. `spec.md` — matriz de critério de aceite × verificação
4. `tasks.md` — plano de implementação com ordem e dependências
5. Implementação
6. `state.md` (opcional) — congelamento após aprovação

## 3. Gate de código
Regra inviolável: não gerar ou alterar código de produção antes da aprovação humana das fases acordadas.

Se a spec ainda estiver em Draft:
- dizer que o gate está fechado
- apontar o que falta aprovar
- oferecer spike descartável somente se solicitado explicitamente

## 4. Estrutura canônica
```text
specs/features/
└── <feature-id>/
    ├── prd.md
    ├── design.md
    ├── spec.md
    ├── tasks.md
    └── state.md  # opcional
```

## 5. Regras de qualidade
- Uma feature = uma pasta.
- `feature-id` em kebab-case.
- Artefatos em português (Brasil), identificadores técnicos em inglês.
- Critérios de aceite verificáveis e observáveis.
- Sem duplicação entre PRD, design e spec.
- Não inventar integrações que não existam no repositório.

## 6. Delegação posterior
Depois da spec aprovada:
- `frontend-architect` para estrutura / roteamento / estado
- `frontend-implementer` para UI e serviços
- `test-engineer` para testes
- `e2e-qa-engineer` para validação real da UI
- `code-reviewer` para revisão final

## 7. Fonte de verdade da arquitetura
- `docs/architecture.md`
- `docs/database.md`
- `docs/authentication.md`
- `docs/routes.md`
- `docs/design-system.md`
- `Docs/` (documentação detalhada do projeto)
