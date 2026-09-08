# Guia de uso do SDD — Lilás

## Como começar
1. Definir `feature-id` em kebab-case.
2. Descrever o problema de negócio de forma objetiva.
3. Gerar `specs/features/<feature-id>/prd.md`.
4. Obter aprovação humana do PRD.
5. Gerar `design.md` e rodar nova aprovação.
6. Gerar `spec.md` + `tasks.md`.
7. Só então delegar a implementação.

## Exemplo
```text
specs/features/
└── lil-12-notificacao-comentario/
    ├── prd.md
    ├── design.md
    ├── spec.md
    ├── tasks.md
    └── state.md
```

## Versionamento
Ao alterar artefato aprovada, subir versão no frontmatter:
- `v1.1.0` para mudança compatível
- `v2.0.0` para quebra de contrato ou mudança arquitetural

## Checklist antes de declarar fase concluída
- [ ] frontmatter com `version`, `date`, `status`
- [ ] artefato na pasta correta
- [ ] sem mistura de fases
- [ ] critérios de aceite verificáveis
- [ ] sem código de produção antes do gate

## Observações
- O fluxo SDD não substitui a arquitetura do projeto; ele formaliza o contrato antes da implementação.
- O roteamento de especialistas continua sendo responsabilidade da `meta-agent` e do `orchestrator`.
