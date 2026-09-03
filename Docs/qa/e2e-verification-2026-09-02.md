# Relatório de Verificação E2E — Bug Fixes
**Data:** 2026-09-02
**Responsável:** QA Engineer (e2e-qa-engineer)
**Ambiente:** http://localhost:5173 (Vite dev server)

---

## Resumo Executivo

| Cenário | Resultado |
|---------|-----------|
| BUG-001: Nested <a> tags | ✅ **APROVADO** |
| BUG-002: N+1 queries | ⚠️ **PARCIALMENTE CORRIGIDO** |
| BUG-003: Favicon | ✅ **APROVADO** |
| BUG-004: Email pre-fill | ✅ **APROVADO** |
| BUG-005: Dropdown click-outside | ✅ **APROVADO** |
| BUG-006: Mobile search | ✅ **APROVADO** |

**Recomendação:** APTO COM RESSALVAS — 5/6 fixes completamente funcionais, 1 fix parcialmente implementado.

---

## Detalhes por Bug Fix

### BUG-001: Nested <a> tags em PostCard — ✅ APROVADO

**Evidência:**
- Tag "Dúvida" renderizada como <span class="tag-chip">Dúvida</span> (não <a>)
- Nenhum link <a> aninhado dentro do link principal do PostCard
- DOM verificado via JavaScript: 
estedLinksCount: 0

**Screenshot:** .playwright-mcp/element-2026-09-02T16-49-04-746Z.png

---

### BUG-002: N+1 queries — ⚠️ PARCIALMENTE CORRIGIDO

**O que foi verificado:**
- ✅ Bulk fetch para likes está presente: likes?...post_id=in.(...) (request #46)
- ✅ Bulk fetch para saves está presente: saves?...post_id=in.(...) (request #47)

**Problema identificado:**
Após os bulk fetches, ainda existem **muitas requisições individuais por post**:
- 24 requisições individuais de likes (likes?...post_id=eq.)
- 34 requisições individuais de saves (saves?...post_id=eq.)
- 4 requisições individuais de poll_votes

**Total de requisições Supabase:** ~77 (deveria ser ~5-6 com bulk fetch efetivo)

**Análise:** O bulk fetch foi adicionado, mas os componentes PostCard ainda fazem requisições individuais. O bulk fetch não está sendo utilizado pelos componentes filhos.

---

### BUG-003: Favicon — ✅ APROVADO

**Evidência:**
- Favicon inline SVG presente no <head>:
  `html
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%237c5ce0'/><text x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='system-ui' font-weight='800' font-size='20'>L</text></svg>" />
  `
- Formato correto: SVG roxo com "L" branca

---

### BUG-004: Email pre-fill — ✅ APROVADO

**Evidência:**
- Email input: utoComplete="email" ✅
- Password input (modo entrar): utoComplete="current-password" ✅
- Password input (modo criar): utoComplete="new-password" ✅
- Campo de apelido: utoComplete="off" ✅

**Nota:** O preenchimento automático do email é comportamento esperado do navegador (browser autofill), não bug do código.

---

### BUG-005: Dropdown click-outside — ✅ APROVADO

**Evidência:**
- Dropdown abre ao clicar no avatar (botão "J")
- Dropdown fecha ao clicar fora (botão "Em alta")
- Verificação DOM: hasOpenClass: false, opacity: 0
- Handler mousedown implementado em App.jsx:25-34

---

### BUG-006: Mobile search — ✅ APROVADO

**Evidência:**
- Viewport: 375x812 (mobile)
- Botão "Buscar" visível no topbar
- Input de busca: 	ype="search" ✅
- Formulário de busca mobile: .mobile-search-form-top
- Busca funcional: digitou "Dúvida" e recebeu resultados

**Screenshot:** .playwright-mcp/page-2026-09-02T16-56-27-145Z.png

---

## Evidências

| Artefato | Descrição |
|----------|-----------|
| .playwright-mcp/element-2026-09-02T16-49-04-746Z.png | PostCard com tag "Dúvida" (BUG-001) |
| .playwright-mcp/page-2026-09-02T16-56-27-145Z.png | Busca mobile com resultados (BUG-006) |

---

## Conclusão

**5 de 6 bug fixes estão completamente funcionais.** O fix de N+1 queries (BUG-002) está parcialmente implementado — o bulk fetch foi adicionado, mas não está sendo utilizado pelos componentes, resultando ainda em muitas requisições individuais.

**Recomendação:** Corrigir o BUG-002 para que os componentes PostCard utilizem os dados do bulk fetch em vez de fazer requisições individuais.
