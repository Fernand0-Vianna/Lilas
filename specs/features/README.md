# Features do Lilás

Cada feature nova deve viver em uma pasta própria dentro de `specs/features/`.

Estrutura:

```text
specs/features/
└── <feature-id>/
    ├── prd.md
    ├── design.md
    ├── spec.md
    ├── tasks.md
    └── state.md   # opcional
```

## Convenções
- `feature-id` em kebab-case
- nome curto e específico
- um arquivo por fase do SDD
- sem misturar múltiplas features em um mesmo artefato

## Exemplo
```text
specs/features/
└── lil-14-feed-moderado/
    ├── prd.md
    ├── design.md
    ├── spec.md
    ├── tasks.md
    └── state.md
```
