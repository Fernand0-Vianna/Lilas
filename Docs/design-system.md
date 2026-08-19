# Design System

## Paleta de Cores

| Token | Valor | Uso |
|-------|-------|-----|
| `--primary` | `#7c5ce0` | Roxo principal (botões, links, destaques) |
| `--primary-dark` | `#5b3fc4` | Roxo escuro (hover, logo) |
| `--primary-soft` | `#ede7fb` | Fundo suave de roxo (chips, avatares) |
| `--bg` | `#f7f5fb` | Fundo da página |
| `--card` | `#ffffff` | Fundo de cards |
| `--text` | `#2d2a33` | Texto principal |
| `--muted` | `#8b8494` | Texto secundário |
| `--muted-2` | `#b0a9bc` | Texto terciário / placeholders |
| `--border` | `#f0ecf6` | Bordas |
| `--accent` | `#ff6b9d` | Rosa (likes, destaques especiais) |
| `--ok` | `#4cd97b` | Verde (sucesso) |
| `--danger` | `#d6336c` / `#c0392b` | Vermelho (erros, exclusão) |

## Tipografia

- **Fonte:** IBM Plex Sans (padrão), com fallback para Inter e system-ui
- **Tamanhos base:**
  - `12px` — metadados, legendas
  - `13px` — corpo secundário, dicas
  - `14px` — corpo principal, botões
  - `16px` — títulos de seção
  - `18px` — logo
  - `20px` — títulos de página
  - `22px` — título do login card

- **Pesos:**
  - `400` — corpo regular
  - `500` — corpo médio, labels
  - `600` — botões, títulos de cartão
  - `700` — títulos, nomes de usuário
  - `800` — logo, avatares

## Espaçamento

- **Container:** `max-width: 1180px`, `padding: 0 20px`
- **Cards:** `padding: 16px`, `border-radius: 14px` (ou `16px` para post cards)
- **Gaps entre elementos:** `8px`, `10px`, `12px`, `16px`, `24px`

## Border Radius

| Token | Valor | Uso |
|-------|-------|-----|
| `--radius` | `14px` | Cards padrão |
| Botões | `999px` | Pills / botões arredondados |
| Inputs | `10px` | Campos de formulário |
| Avatares | `50%` | Círculos |

## Sombras

| Token | Valor | Uso |
|-------|-------|-----|
| `--shadow` | `0 2px 10px rgba(0,0,0,0.06)` | Elevação sutil |

## Componentes de UI

### Botões

| Variante | Estilo |
|----------|--------|
| `.btn-primary` | Roxo sólido, texto branco |
| `.btn-ghost` | Fundo roxo suave, texto roxo |
| `.btn-outline` | Borda cinza, fundo branco |
| `.btn-block` | Largura total |

### Inputs

- Borda `1.5px solid var(--border)`
- Raio `10px`
- Focus: `border-color: var(--primary)`
- Padding: `11px 14px`

### Cards

- Fundo branco
- Borda `1px solid var(--border)`
- Raio `14px`
- Sombras sutis

### Avatares

- Tamanho padrão: `32px`
- Grande: `56px` (welcome), `76px` (perfil mobile), `96px` (perfil desktop)
- Fundo: `#dcd2f5` / `#bcb4d2`
- Texto: `var(--primary-dark)`, peso 700

## Layout Responsivo

### Desktop (≥768px)
- Layout de 3 colunas (rail | feed | side)
- Topbar com navegação completa
- Sem bottomnav

### Tablet (768px–1199px)
- Layout de 2 colunas (feed | side)
- Rail oculta
- Sem bottomnav

### Mobile (<768px)
- Layout de 1 coluna
- Sidebar e rail ocultas
- Bottomnav visível
- Topbar compacta

### Touch
- Alvos mínimos de `44px`
- Fontes de input em `16px` para evitar zoom no iOS

## Protótipo

O design foi baseado no protótipo criado no **Penpot**. A paleta e os componentes seguem fielmente o design system definido lá.
