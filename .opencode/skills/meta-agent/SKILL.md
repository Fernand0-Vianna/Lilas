---
name: meta-agent
description: Roteia um pedido de desenvolvimento para o especialista certo do Lilás e encadeia trabalho multipasso, delegando via Agent tool e devolvendo resposta consolidada. Use quando o pedido for vago, amplo, ou misturar preocupações (desenho + implementação + testes + performance), ou quando o usuário pedir explicitamente o melhor encaixe de expertise. Não use quando domínio já é óbvio e estreito — invoque o agente diretamente.
---

# Roteador de especialistas — Lilás

Orquestra: decide o caminho de especialista **mais curto e efetivo**, delega via **Agent tool**, funde as saídas numa resposta coesa. Vive como skill (não agente) por motivo funcional: a orquestração precisa da Agent tool, disponível na thread principal e não dentro de subagente.

Regra de ouro do roteamento: o ponto de entrada é a skill `meta-agent` / agente `orchestrator`; nunca se deve saltar para especialistas diretamente em uma conversa normal do projeto. Só quando a tarefa for claramente estreita e aprovada explicitamente pelo usuário, pode-se invocar o agente direto.

---

## 1. Quando aplicar
| Situação | Aplicar |
| -------- | ------- |
| Pedido vago, amplo, ou que mistura desenho + código + testes + performance | Sim |
| Usuário quer "melhor encaixe" de expertise ou resultado multipasso | Sim |
| Pedido estreito e claramente de um domínio ("rever só este diff") | Não — invocar agente diretamente |
| Feature nova com contrato a fixar antes de código | Não — [`sdd-orchestrator`](../sdd-orchestrator/SKILL.md) |
| Tarefa de uma frase que já se resolve sem delegar | Não — responder diretamente |

Encaminhar **não** é obrigatório: se um único agente basta, delegar uma vez e parar.

---

## 2. Tabela de roteamento
| Preocupação | Especialista | Gatilhos típicos |
| ----------- | ------------ | ---------------- |
| Arquitetura, component hierarchy, roteamento, estado global | agent [`frontend-architect`](../../agents/frontend-architect.md) | "como estruturar isto?", refator que muda hierarquia |
| Código React concreto (componentes, hooks, services) | agent [`frontend-implementer`](../../agents/frontend-implementer.md) | implementar, ligar ao Supabase, corrigir a11y |
| Qualidade de PR/diff, smells, pronto-para-merge | agent [`code-reviewer`](../../agents/code-reviewer.md) | diffs, revisão pré-merge |
| Testes automatizados (unit, integração) | agent [`test-engineer`](../../agents/test-engineer.md) | "adicionar testes", teste instável, lacuna cobertura |
| Bug, regressão, causa raiz | agent [`debug-specialist`](../../agents/debug-specialist.md) | stack trace, teste falhando, comportamento errado |
| Performance, gargalo, bundle, escala | agent [`performance-optimizer`](../../agents/performance-optimizer.md) | tela lenta, memória, query Supabase |
| Validar comportamento real navegando UI | skill [`e2e-qa-skill`](../e2e-qa-skill/SKILL.md) → agent `e2e-qa-engineer` | "testa o frontend", "roda regressão", reproduzir bug na tela |
| Feature nova com spec formal antes de código | skill [`sdd-orchestrator`](../sdd-orchestrator/SKILL.md) | "PRD primeiro", incremento grande |

---

## 3. Regras de sobreposição
- **Especificar → construir:** `sdd-orchestrator` até artefatos aprovados; depois `frontend-architect` → `frontend-implementer`.
- **Desenhar → construir:** `frontend-architect` → `frontend-implementer` só quando arquitetura ainda não decidida. Se já estiver, pular arquiteto.
- **Construir → verificar:** `frontend-implementer` → `test-engineer` quando faltarem testes para comportamento novo.
- **Construir → validar na UI:** mudança em `client/src/**` → `e2e-qa-skill` antes de dar tarefa por concluída.
- **Implementação + revisão:** `frontend-implementer` → `code-reviewer` quando pedirem implementação **e** passagem de qualidade.
- **Performance vs bug:** se corretude em dúvida, `debug-specialist` primeiro; `performance-optimizer` só quando problema claramente latência/throughput/recursos.
- **Suspeita de performance em revisão:** `code-reviewer` marca como suspeita e encaminha; não é o `code-reviewer` que afina.

---

## 4. Processo
1. **Decompor** pedido em passos ordenados; cada passo tem **um** especialista principal.
2. **Executar cadeia mínima** — sem agentes extra "por cobertura". Passos independentes podem rodar em paralelo numa só mensagem; dependentes esperam.
3. **Passar contexto por referência**, não por cópia: indicar arquivos, `specs/features/<id>/` e skill que agente deve ler. Não recopiar convenções no prompt — cada agente já carrega sua skill.
4. **Fundir** saídas numa resposta única: remover duplicação; resolver contradições em favor do especialista cujo domínio corresponde ao conflito.

---

## 5. Regras
- Não substituir especialista por conselho genérico quando delegação melhoraria materialmente resultado.
- Não empilhar agentes em tarefas de uma frase.
- Não delegar duas vezes a mesma pergunta a agentes diferentes para "comparar".
- Nunca apresentar handoffs em bruto: usuário recebe resultado integrado.

---

## 6. Formato de saída
1. **Roteamento** — uma linha: qual/quais especialistas e porquê. Omitir se handoff trivial de um só agente.
2. **Resultado** — entrega principal, já fundida e deduplicada.
3. **Notas** — só trade-offs, riscos ou próximos passos não óbvios; poucos bullets.

---

## 7. Idioma
Português (Brasil).

---

## Histórico
| Versão | Mudança |
| ------ | ------- |
| 1.0.0  | Adaptado do EmpregaNet `meta-agent` para stack Lilás (React+Vite+Supabase) |