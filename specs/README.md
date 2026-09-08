# Specs e SDD — Lilás

Esta pasta guarda documentos operacionais do ciclo de produto e engenharia.

## Estrutura

```text
specs/
├── features/
│   └── <feature-id>/
│       ├── prd.md
│       ├── design.md
│       ├── spec.md
│       ├── tasks.md
│       └── state.md   # opcional
├── sdd/
│   ├── SDD-ORCHESTRATOR.md
│   ├── SDD-USAGE-GUIDE.md
│   └── adrs/
└── README.md
```

## Regra de separação
- `docs/` continua para documentação de produto, arquitetura e referências gerais do projeto.
- `specs/` guarda artefatos de feature, SDD e ADRs.

Isso deixa a camada de produto e a camada de execução separadas, sem misturar backlog operacional com documentação pública do sistema.
