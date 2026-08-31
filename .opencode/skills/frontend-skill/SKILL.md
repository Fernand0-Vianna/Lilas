---
name: frontend-skill
description: Convenções canônicas do frontend Lilás — React 18 + Vite 5, React Router 6, CSS puro com variáveis CSS, design system (tokens, spacing, componentes), estado via Context, serviço por feature, autenticação Supabase Auth (cookie httpOnly via Supabase), roteamento com guard RequireAuth, componentes canônicos de loading, build Vite. Use ao ler, escrever ou revisar qualquer coisa em client/src, incluindo páginas, componentes, hooks, estilos e acessibilidade. Não use para backend Supabase (supabase-skill) nem para regressão pela UI real (e2e-qa-skill).
---

# Frontend (Lilás — React + Vite)

Base de **conhecimento** do frontend: decisões fechadas, armadilhas já pagas e checklists. O comportamento de implementação está no agente `frontend-implementer`, que carrega esta skill como contexto obrigatório.

---

## 1. Quando aplicar
| Situação | Aplicar |
| -------- | ------- |
| Todo trabalho em `client/src/` | Sim |
| Novas páginas, componentes, hooks, estilos, rotas | Sim |
| Integração com Supabase + validação ao renderizar dados | Sim |
| Refatores que dividem componentes grandes ou corrigem a11y | Sim |
| Schema, RLS, triggers Supabase | Não — [`supabase-skill`](../supabase-skill/SKILL.md) |
| Validar comportamento real navegando UI | Não — [`e2e-qa-skill`](../e2e-qa-skill/SKILL.md) |

---

## 2. Ligações
| Recurso | Path |
| ------- | ---- |
| Mapa do projeto e comandos de build | [`docs/README.md`](../../docs/README.md) |
| Agente de implementação frontend | [`frontend-implementer`](../../agents/frontend-implementer.md) |
| Paridade de contratos com Supabase | [`supabase-skill`](../supabase-skill/SKILL.md) |
| Governo SDD (quando houver pasta `specs/features/<id>/`) | [`sdd-orchestrator`](../sdd-orchestrator/SKILL.md) |

---

## 3. Princípios
| Princípio | Prática obrigatória |
| --------- | ------------------- |
| **SRP nos componentes** | Componente faz **uma** parcela óbvia de UI; dados/efeitos vão para hooks/services. |
| **Supabase é fonte de verdade** | Não reimplementar regras densas já garantidas por RLS/triggers; duplicação só para ergonomia. |
| **Inversão de dependência na fronteira** | Páginas/hooks chamam `service/` da feature dona — sem `supabase.from()` disperso em componentes. |
| **KISS/YAGNI** | Não criar `core/domain/` profundo antes de haver comportamento repetido com valor claro. |
| **Type safety** | JavaScript ES modules; evitar `any` dinâmico; usar JSDoc quando útil. |

---

## 4. Stack (fechamento explícito)
| Usar | Não usar neste projeto |
| ---- | ----------------------- |
| React 18 + Vite 5 + React Router 6 | Next.js, SSR, Tailwind novo |
| CSS puro com variáveis CSS (`styles.css`) | Styled‑components, Emotion, CSS Modules |
| Supabase JS SDK (`@supabase/supabase-js`) | Fetch direto ao PostgREST |
| React Hook Form + Zod (se formulários complexos) | Validação só no submit sem mensagens tratadas |
| Context API para estado global mínimo | Redux, Zustand, Recoil sem justificativa |

---

## 5. Pastas e responsabilidades
| Camada lógica | Onde | Regra |
| ------------- | ---- | ----- |
| UI pura ("dumb") | `src/components/` | Só props/handlers declarados; sem side‑effects escondidos |
| Coesão por feature | `src/pages/` (cada página é feature) | Colocar hooks, wrappers e assets locais junto |
| API + schemas | **`src/lib/`** — `supabase.js`, `auth.jsx`, `errors.js`, `format.js` | Não duplicar cliente Supabase por feature |
| Moldura da aplicação | `src/App.jsx` (`Shell`, `Topbar`, `BottomNav`, `RequireAuth`) | Shell **único** para rotas públicas e autenticadas |
| Helpers cross‑feature | Só com **3+ consumidores** confirmados | Senão, duplicação controlada até estabilizar |

---

## 6. Renderização
- **SPA pura** — sem SSR. `ReactDOM.createRoot` em `main.jsx`.
- **Padrão = Client Components** (todos). Não há Server Components.
- **Rotas públicas**: `/login`, `/redefinir-senha`.
- **Rotas protegidas**: envolvidas por `RequireAuth` que consome `AuthContext`.

---

## 7. Design System (tokens em `styles.css`)
### Paleta
| Token | Valor | Uso |
| ----- | ----- | --- |
| `--primary` | `#7c5ce0` | Roxo principal (botões, links, destaques) |
| `--primary-dark` | `#5b3fc4` | Hover, logo |
| `--primary-soft` | `#ede7fb` | Fundo suave (chips, avatares) |
| `--bg` | `#f7f5fb` | Fundo da página |
| `--card` | `#ffffff` | Fundo de cards |
| `--text` | `#2d2a33` | Texto principal |
| `--muted` | `#8b8494` | Texto secundário |
| `--border` | `#f0ecf6` | Bordas |
| `--accent` | `#ff6b9d` | Rosa (likes) |
| `--ok` | `#4cd97b` | Verde sucesso |
| `--danger` | `#d6336c` | Vermelho erros/exclusão |

### Tipografia
- Fonte: **IBM Plex Sans** (fallback Inter, system‑ui)
- Tamanhos base: 12px (meta), 13px (secundário), 14px (corpo), 16px (título seção), 18px (logo), 20px (título página), 22px (login card)
- Pesos: 400 (regular), 500 (médio), 600 (botões), 700 (títulos), 800 (logo/avatares)

### Espaçamento & Radius
- Container: `max-width: 1180px`, `padding: 0 20px`
- Cards: `padding: 16px`, `border-radius: 14px` (16px para post cards)
- Gaps: 8, 10, 12, 16, 24px
- Radius tokens: `--radius: 14px`; botões `999px`; inputs `10px`; avatares `50%`

### Sombras
- `--shadow: 0 2px 10px rgba(0,0,0,0.06)`

### Componentes canônicos
- Botões: `.btn-primary`, `.btn-ghost`, `.btn-outline`, `.btn-block`
- Inputs: borda `1.5px solid var(--border)`, radius `10px`, focus `border-color: var(--primary)`
- Cards: fundo branco, borda `1px solid var(--border)`, radius `14px`, sombra sutil
- Avatares: padrão `32px`; grande `56px` (welcome), `76px` (perfil mobile), `96px` (perfil desktop)

### Layout Responsivo
- Desktop (≥768px): 3 colunas (rail | feed | side), Topbar completa, sem BottomNav
- Tablet (768–1199px): 2 colunas (feed | side), rail oculta, sem BottomNav
- Mobile (<768px): 1 coluna, sidebar/rail ocultas, BottomNav visível, Topbar compacta
- Touch: alvos mínimos `44px`, inputs `16px` para evitar zoom iOS

---

## 8. Estado, dados e comunicação com Supabase
| Tópico | Expectativa |
| ------ | ----------- |
| **Loading / error / empty** | Sempre tratados visualmente, com retry onde UX exigir |
| **Mutations idempotentes** | Evitar POST duplo: desabilitar botão progressivamente, debounce, ou idempotência no servidor |
| **Optimistic UI** | Só com caminho compensatório em caso de falha — nunca esconder erros |
| **Tempo real** | Hook dedicado quando produto usar: reconexão, backoff explicável, cancel on unmount |

---

## 9. Autenticação e RBAC
- **Auth 100% Supabase Auth** — sessão via cookie httpOnly gerenciado pelo SDK; nenhum token em JS.
- **Uma única política de acesso**: `RequireAuth` consome `AuthContext` (`session`, `loading`). Não criar terceira implementação.
- Rota nova exige atualizar `RequireAuth` / `AppRoutes`; forbidden redireciona para `/login`.
- **Capacidades** centralizadas; sem strings mágicas — extrair helpers compartilhados (`profile?.is_admin`).
- UI condicional coerente com papel real vindo do backend — **nunca** apenas esconder link.
- `AuthProvider` único em `App.jsx`.

### 9.1 Auth ≠ dados do usuário
| Responsabilidade | Onde | Endpoints Supabase |
| ---------------- | ---- | ------------------ |
| Credencial e sessão (entrar, sair, registrar, renovar, recuperar) | `src/lib/auth.jsx` | `supabase.auth.*` |
| Dados do próprio usuário (ver/editar perfil, trocar senha, encerrar conta) | `src/pages/Profile.jsx` + `service` | `profiles` table |
| Usuários como dado de negócio (gestão, listagens) | `src/pages/AdminReports.jsx` | `profiles`, `posts`, `comments` |

- Schema do usuário (`Profile`) vive em **`src/lib/auth.jsx`** (tipo inferido), não em `shared/auth`.
- Interceptor de erro de auth: `src/lib/errors.js` mapeia mensagens Supabase → pt‑BR.

---

## 10. UX, estética e acessibilidade
| Âmbito | Orientação |
| ------ | ---------- |
| Layout e espaçamento | Seguir grid/tokens existentes; evitar valores arbitrários |
| Interação | Estados de foco e navegação por teclado; modais prendem e devolvem foco |
| a11y | HTML semântico; ícones com `aria-label`; imagens com alt |
| Reduced motion | Respeitar preferências já suportadas |

### 10.1 Estados de loading — componentes canônicos
| Situação | Usar |
| -------- | ---- |
| Troca de rota | `LoadingState` (spinner + rótulo, centrado) — obrigatório em `AppRoutes` enquanto `loading` |
| Forma do conteúdo conhecida (lista, formulário, detalhe) | `PostCardSkeleton`, `FormFieldsSkeleton` (se existirem) |
| Espera indeterminada | `LoadingState` |
| Indicador embutido (botão, campo, linha) | `Spinner` (`sm`/`md`/`lg`), herda `currentColor` |
| Submissão de formulário | Botão com `disabled` + `Spinner` interno + `aria-busy` |

Regras:
- **Todo segmento com layout precisa de loading** enquanto `AuthContext.loading`.
- **Atraso antes de aparecer**: `LoadingState` só visível após ~250 ms.
- **Não trocar rótulo do botão** por "Enviando…": adiciona spinner, mantém texto.
- `prefers-reduced-motion`: trocar rotação por pulsação de opacidade.
- Container com `role="status"`; texto `sr-only` quando sem rótulo visível.

---

## 11. Documentação em JavaScript
Hooks e utilidades **não triviais** levam JSDoc curto explicando intenção, parâmetros e retorno. Evitar JSDoc barroco em wrappers de uma linha.

---

## 12. Testes
### Infra real hoje
**Nenhum framework de teste instalado**. Propor adição de **Vitest + React Testing Library** como decisão explícita.

### Hierarquia de valor (quando houver suite)
| Prioridade | Foco |
| ---------- | ---- |
| 1º | Lógica pura de alto risco em hooks/utils/services: validações, mappers, regras de negócio, controle de acesso a rotas, máscaras/normalizações |
| 2º | Fluxos de formulário (validação → payload Supabase) como cenários de integração |
| 3º | Comportamento que só aparece com app rodando (navegação real, layout, timing, integração ao vivo) → **não é unitário**: é regressão manual pela UI, coberta por [`e2e-qa-skill`](../e2e-qa-skill/SKILL.md) |

---

## 13. Validação (comandos reais)
```bash
npm run build
```
```bash
npm run lint   # se existir
```
```bash
npm test       # se existir
```

---

## 14. Checklist de entrega (feature UI)
1. [ ] Página/feature coesa; componentes suficientemente pequenos.
2. [ ] `service/` da feature (em `lib/` ou ao lado da página) com validação na fronteira — entrada **e** payload de saída.
3. [ ] Estados **loading/error/empty/retry** com componentes canônicos — sem spinner ad‑hoc.
4. [ ] Form com validação e mensagens ao usuário em **pt‑BR**.
5. [ ] a11y: navegação por teclado, foco em overlays, `prefers-reduced-motion`.
6. [ ] Rota nova → `RequireAuth`/`AppRoutes` atualizados; guard continua usando `AuthContext`.
7. [ ] `build` (e `lint`/`test` se existirem) verdes.
8. [ ] Cenários de teste criados/atualizados quando há lógica pura nova.

---

## 15. Anti‑padrões
| Bloqueado | Motivo |
| --------- | ------ |
| Lógica de negócio densa no JSX | Impede reuso e teste isolado |
| Introduzir Tailwind ou sistema de estilo divergente | Política atual explícita |
| `supabase.from()` espalhado sem service | Regressão rápida de contratos inconsistentes |
| Buscar mesmo recurso em múltiplos componentes | Duplica responsabilidade; passar por prop ou Context |
| Spinner/skeleton ad‑hoc | Já existem `LoadingState`, `Spinner` |
| Ações no rodapé de formulário longo | Lugar é cabeçalho (Topbar) ou `FormHeader` futuro |
| Grid de campos ou media query por feature | CSS tokens já resolvem colunas e colapso |
| Terceira implementação de política de rota | `RequireAuth` + `AuthContext` são fonte única |
| Token de auth em JS | Supabase SDK já gerencia sessão httpOnly |
| Texto de UI em português europeu | Produto é **pt‑BR** |

---

## 16. Idioma
Copy de usuário final em **português (Brasil)**; identificadores de código em **inglês**.

---

## Histórico
| Versão | Mudança |
| ------ | ------- |
| 1.0.0  | Criação adaptada do EmpregaNet `frontend-skill` para stack Lilás (React+Vite+Supabase) |