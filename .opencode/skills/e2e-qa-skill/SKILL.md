---
name: e2e-qa-skill
description: Executa regressão end-to-end exploratória do frontend Lilás pela UI real (Browser pane), delegando a execução ao subagente e2e-qa-engineer módulo a módulo e consolidando relatório versionado. Contém metodologia canônica — pré-condições de ambiente, matriz de cenários, priorização, escala de severidade e templates de defeito e relatório. Use quando o usuário pedir "testar o frontend", "rodar regressão", "fazer QA de X", "validar essa tela antes de mergear" ou reproduzir bug relatado, e também depois de alterar algo em client/src. Não use para testes unitários ou de integração (test-engineer) nem para revisão estática de diff (code-reviewer).
---
 
# Regressão E2E — Lilás (frontend)

Fonte única da metodologia E2E e da sua orquestração. Testa a aplicação como um usuário real, pela interface visual, e não pela leitura de código. Complementa, sem substituir, cenários BDD futuros ([`frontend-skill`](../frontend-skill/SKILL.md) §12).

Execução: esta skill roda na thread principal e delega a execução ao subagente [`e2e-qa-engineer`](../../agents/e2e-qa-engineer.md), que usa o servidor MCP `playwright`. Esse agente lê este arquivo no arranque — não repetir metodologia no prompt de delegação.

Argumento opcional de escopo: `auth`, `feed`, `post`, `create`, `communities`, `profile`, `admin`. Vazio = regressão completa.

---

## 1. Quando aplicar
| Situação | Aplicar |
| -------- | ------- |
| Regressão completa antes de release | Sim |
| Validar feature nova ponta a ponta (acesso → operação → confirmação) | Sim |
| Reproduzir bug relatado navegando pelo fluxo real | Sim |
| Auditoria UX: consistência visual, estados, responsividade | Sim |
| Escrever ou executar teste unitário/integrado | Não — agente `test-engineer` |
| Revisar apenas diff/PR | Não — agente `code-reviewer` |
| Diagnosticar causa raiz de bug já reproduzido | Não — agente `debug-specialist` |

---

## 2. Passo 0 — Pré-condições (sempre primeiro e bloqueantes)
| Serviço | Como subir | Porta |
| ------- | ---------- | ----- |
| Frontend (Vite dev) | iniciar com `npm run dev` em `client/` | `5173` |
| Supabase (projeto vinculado) | Conforme `docs/README.md` | HTTPS |

1. Frontend em execução. Se a porta `5173` estiver ocupada por processo fora do OpenCode, não matar; usar a URL existente com o Playwright MCP.
2. Confirmar que é a app correta. Ler título/conteúdo ("Lilás"). Se for outra coisa, pode ser outro projeto Vite na mesma porta — parar e avisar.
3. Confirmar que o Supabase está acessível antes de qualquer fluxo autenticado ou com dado real. Se não estiver, parar e registrar bloqueio de ambiente.
4. Confirmar restrições de dados com o usuário antes de iniciar CRUDs (por exemplo: "não criar posts novos", "não mexer nos perfis existentes").

Qualquer pré-condição falhada interrompe a execução e vira item de Riscos no relatório (§8). Nunca prosseguir assumindo comportamento.

---

## 3. Fase 1 — Mapeamento
Percorrer a árvore real de rotas (`client/src/App.jsx`) e listar módulos e fluxos críticos. Ponto de partida conhecido — confirmar; o mapa evolui.

| Grupo | Rotas | Natureza |
| ----- | ----- | -------- |
| `auth` | `/login`, `/redefinir-senha` | Público, sem sessão |
| `main` | `/`, `/post/:id`, `/criar`, `/comunidades`, `/c/:slug`, `/u/:apelido`, `/perfil`, `/denuncias` | Autenticado, RBAC por `profile.is_admin` |

Para cada rota, identificar: exige autenticação? exige admin? é CRUD? tem formulário? tem filtro, busca ou paginação?

---

## 4. Fase 2 — Matriz de cenários
Campos mínimos por cenário:
| Campo | Descrição |
| ----- | --------- |
| ID | `E2E-<módulo>-<sequencial>` (ex.: `E2E-FEED-003`) |
| Módulo | Feature/rota |
| Cenário | Frase curta do que é testado |
| Tipo | Positivo / Negativo / Extremo |
| Prioridade | Crítica / Alta / Média / Baixa (§5) |
| Pré-condição | Sessão, papel e dado existente necessário |
| Passos | Sequência de ações na UI |
| Resultado esperado | O que deve ser observável na tela/rede ao final |

Cobrir, por módulo aplicável:
- CRUD — criação, consulta (lista + detalhe), edição, exclusão, modal de confirmação, item desaparece da lista.
- Formulários — campos obrigatórios, máscaras, validação client-side vs mensagem da API, submit duplo (debounce).
- Filtros / busca / paginação — resultado correto, estado vazio, navegação entre páginas, combinação de filtros.
- Navegação e RBAC — redirecionamento para `/login` sem sessão; menus condicionais coerentes com o papel real do backend, não só escondidos no cliente.
- Feedback visual — loading state / skeletons / spinner, toast de sucesso/erro, modal de confirmação, botão desabilita durante envio.
- Responsividade — ao menos fluxos críticos em `mobile` e `desktop`.

Ordem de prioridade quando o escopo é completo: Auth/RBAC → feed público → posts → comunidades → perfil → admin.

---

## 5. Fase 3 — Priorização e severidade
| Critério de prioridade | Peso |
| ---------------------- | ---- |
| Fluxo gera engajamento ou é pré-requisito (login, criar post, comentar) | Alto |
| Exposto publicamente sem autenticação (feed) | Alto |
| Envolve RBAC ou dados sensíveis (admin, denúncias) | Alto |
| Alta frequência de uso pelo usuário final | Médio |
| Tela de configuração pouco acessada | Baixo |

Executar Crítica → Alta → Média → Baixa. Se tempo/ambiente limitar, documentar em "Fluxos ainda não testados" (§8) — nunca omitir silenciosamente.

| Severidade | Critério |
| ---------- | -------- |
| Bloqueante | Impede fluxo crítico concluir (não loga, não cria post) |
| Crítica | Fluxo conclui, mas com dado incorreto/perdido, ou falha em segurança/RBAC |
| Alta | Funcionalidade quebrada mas com contorno, ou erro visível sem explicação |
| Média | Comportamento incorreto sem bloquear fluxo (mensagem errada, estado visual inconsistente) |
| Baixa | Cosmético, UX subótima, sem impacto funcional |

Reprodutibilidade: Sempre / Intermitente / Uma vez — registrar passos exatos mesmo quando intermitente.

---

## 6. Fase 4 — Execução
Delegar ao subagente `e2e-qa-engineer` um módulo por vez, sequencialmente e em foreground — nunca em paralelo: todos compartilham a mesma sessão do Playwright MCP. Em cada prompt de delegação, informar apenas:
1. Módulo em escopo e cenários dessa fatia.
2. Estado da sessão (autenticada como qual papel) e `tabId`/URL onde continuar.
3. Restrições de dados acordadas no Passo 0.

Aguardar cada módulo terminar antes de iniciar o próximo.

Regras de execução que o agente aplica (definidas aqui, não repetir no prompt):
- Incremental — um cenário por vez; não acumular interações não relacionadas antes de validar.
- Validação efetiva — conferir dado/estado real (`get_page_text`, item da lista, status da rede). Página carregada não aprova cenário.
- Cadência de checagem — em toda ação que dispara rede (submit, exclusão, filtro), conferir depois: `read_console_messages` (erros novos) e, se feedback visual ambíguo, `read_network_requests` para status real. Toast genérico pode esconder 500.
- Não ignorar ruído — erro no console ou 4xx/5xx que não impediu navegação ainda é bug; registrar.
- Evidência em toda falha — `screenshot`/`zoom` na região relevante, ou `read_page`/`get_page_text` para texto exato, antes de seguir.

### 6.1 Dados e segurança
- Nunca usar credenciais reais de produção ou dados de usuários reais. Usar contas de teste existentes ou criar dados descartáveis com prefixo `[QA]`.
- Ações irreversíveis (excluir registro real, envio que notifica terceiros) exigem confirmação do usuário antes, a menos que o dado seja de teste criado nesta execução.
- Não contornar RBAC/guards manipulando estado do cliente — testar controle de acesso pela UI (tentar rota sem permissão e confirmar bloqueio/redirecionamento).

---

## 7. Template de defeito
```
**Funcionalidade:** <módulo/tela>
**Passo realizado:** <ação exata que disparou problema>
**Comportamento esperado:** <o que deveria acontecer>
**Comportamento encontrado:** <o que de fato aconteceu>
**Evidência:** <screenshot/zoom, trecho do console ou da rede>
**Severidade:** Bloqueante | Crítica | Alta | Média | Baixa
**Reprodutibilidade:** Sempre | Intermitente | Uma vez
```

---

## 8. Passo final — Consolidação e relatório
Depois de todos os módulos do escopo, consolidar relatórios individuais num único, com estrutura obrigatória:
1. Resumo executivo — cenários executados / aprovados / reprovados / bloqueados; recomendação final apto / apto com ressalvas / não apto para release, com justificativa de 1–2 frases.
2. Cenários executados — tabela ID / Módulo / Resultado (Aprovado / Reprovado / Bloqueado).
3. Bugs encontrados — ordenados por severidade, no template §7.
4. Fluxos ainda não testados — o que ficou de fora e por quê (tempo, ambiente, dado indisponível).
5. Riscos identificados — o que a execução não conseguiu garantir.
6. Evidências — referência às capturas, associadas ao ID do cenário/bug.

Gravar em `docs/qa/e2e-regression-<YYYY-MM-DD-HHmm>.md` (criar `docs/qa/` se não existir) e resumir no chat, destacando Bloqueante/Crítica primeiro e apontando o arquivo.

---

## 9. Fora de escopo
- Testes unitários/integrados automatizados — agente `test-engineer`.
- Revisão estática de diff — agente `code-reviewer`.
- Pentest, bypass de CAPTCHA, força bruta.
- Alterar configs de segurança, permissões ou dados de produção.
- Criar issues no tracker — exige confirmação explícita do usuário; nunca publicar sozinho.

---

## 10. Idioma
Relatório e comunicação em português (Brasil); IDs de cenário em formato curto (`E2E-FEED-003`).