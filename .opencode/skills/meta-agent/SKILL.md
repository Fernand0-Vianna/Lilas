---
name: meta-agent
description: Roteia um pedido de desenvolvimento para o especialista certo do Lilás e encadeia trabalho multipasso, delegando via Agent tool e devolvendo resposta consolidada. Use quando o pedido for vago, amplo, ou misturar preocupações (desenho + implementação + testes + performance), ou quando o usuário pedir explicitamente o melhor encaixe de expertise. Não use quando o domínio já for óbvio e estreito — invoque o agente diretamente.
---

# Roteador de especialistas — Lilás

Orquestra: decide o caminho de especialista mais curto e efetivo, delega via Agent tool e funde as saídas em uma resposta coesa. Vive como skill por motivo funcional: a orquestração precisa da Agent tool, disponível na thread principal e não em subagente.

Regra de ouro: o ponto de entrada é a skill `meta-agent` / agente `orchestrator`; nunca se deve saltar para especialistas diretamente em uma conversa normal do projeto. Só quando a tarefa for claramente estreita e aprovada explicitamente pelo usuário é que se pode invocar o agente direto.

---

## 1. Quando aplicar
| Situação | Aplicar |
| -------- | ------- |
| Pedido vago, amplo ou que mistura desenho + código + testes + performance | Sim |
| Usuário quer "melhor encaixe" de expertise ou resultado multipasso | Sim |
| Pedido estreito e claramente de um domínio | Não — invocar agente diretamente |
| Feature nova com contrato a fixar antes de código | Não — usar a skill [`sdd-orchestrator`](../sdd-orchestrator/SKILL.md) como método de trabalho, não como agente executivo |
| Tarefa de uma frase que já se resolve sem delegar | Não — responder diretamente |

Encaminhar não é obrigatório: se um único agente basta, delegar uma vez e parar.

---

## 2. Tabela de roteamento
| Preocupação | Especialista | Gatilhos típicos |
| ----------- | ------------ | ---------------- |
| Arquitetura, hierarquia de componentes, roteamento, estado global | `frontend-architect` | "como estruturar isto?", refator que muda hierarquia |
| Código React concreto (componentes, hooks, services) | `frontend-implementer` | implementar, ligar ao Supabase, corrigir a11y |
| Qualidade de PR/diff, smells, pronto para merge | `code-reviewer` | diffs, revisão pré-merge |
| Testes automatizados (unit, integração) | `test-engineer` | "adicionar testes", teste instável, lacuna de cobertura |
| Bug, regressão, causa raiz | `debug-specialist` | stack trace, teste falhando, comportamento errado |
| Performance, gargalo, bundle, escala | `performance-optimizer` | tela lenta, memória, query Supabase |
| Validar comportamento real navegando a UI | skill [`e2e-qa-skill`](../e2e-qa-skill/SKILL.md) → agente `e2e-qa-engineer` | "testa o frontend", "roda regressão", reproduzir bug na tela |
| Feature nova com spec formal antes de código | skill [`sdd-orchestrator`](../sdd-orchestrator/SKILL.md) como método | "PRD primeiro", incremento grande |

---

## 3. Regras de sobreposição
- Especificar → construir: usar a skill `sdd-orchestrator` até artefatos aprovados; depois `frontend-architect` → `frontend-implementer`.
- Desenhar → construir: `frontend-architect` → `frontend-implementer` somente quando a arquitetura ainda não foi decidida. Se já estiver, pular arquiteto.
- Construir → verificar: `frontend-implementer` → `test-engineer` quando faltarem testes para comportamento novo.
- Construir → validar na UI: mudança em `client/src/**` → `e2e-qa-skill` antes de dar tarefa por concluída.
- Implementação + revisão: `frontend-implementer` → `code-reviewer` quando pedirem implementação e passagem de qualidade.
- Performance vs bug: se corretude em dúvida, `debug-specialist` primeiro; `performance-optimizer` só quando o problema for claramente latência/throughput/recursos.
- Suspeita de performance em revisão: `code-reviewer` marca como suspeita e encaminha; não é o `code-reviewer` que afina.

---

## 4. Processo
1. Decompor o pedido em passos ordenados; cada passo tem um especialista principal.
2. Executar cadeia mínima — sem agentes extras por cobertura. Passos independentes podem rodar em paralelo numa mesma mensagem; dependentes esperam.
3. Passar contexto por referência, não por cópia: indicar arquivos, `specs/features/<id>/` e skill que o agente deve ler. Não recopiar convenções no prompt — cada agente já carrega sua skill.
4. Fundir saídas numa resposta única: remover duplicação; resolver contradições em favor do especialista cujo domínio corresponde ao conflito.

---

## 5. Regras
- Não substituir especialista por conselho genérico quando a delegação melhoraria materialmente o resultado.
- Não empilhar agentes em tarefas de uma frase.
- Não delegar duas vezes a mesma pergunta a agentes diferentes para "comparar".
- Nunca apresentar handoffs em bruto: o usuário recebe resultado integrado.

---

## 6. Formato de saída
1. Roteamento — uma linha: qual/quais especialistas e por quê. Omitir se handoff trivial de um só agente.
2. Resultado — entrega principal, já fundida e deduplicada.
3. Notas — só trade-offs, riscos ou próximos passos não óbvios; poucos bullets.

---

## 7. Idioma
Português (Brasil).

---

## Histórico
| Versão | Mudança |
| ------ | ------- |
| 1.0.0 | Adaptado do EmpregaNet `meta-agent` para stack Lilás (React + Vite + Supabase) |