# ADRs — Lilás

Decisões arquiteturais duradouras devem entrar nesta pasta quando a mudança afetar contratos, padrões ou fronteiras do sistema.

## Convenção
- arquivo em `specs/sdd/adrs/ADR-<NNNN>-<titulo.md>`
- incluir contexto, decisão, consequências e alternativas
- manter a decisão separada da feature

## Quando registrar
- troca de integração crítica
- mudança de padrão de autenticação
- nova regra de armazenamento ou RLS
- decisão que deva sobreviver a uma feature específica

## Exemplo
```text
specs/sdd/adrs/
└── ADR-0001-estado-global-auth.md
```
