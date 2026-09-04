# Rotas

## Tabela de Rotas

| Caminho | Componente | Proteção | Descrição |
|---------|-----------|----------|-----------|
| `/login` | `Login` | Pública | Entrar ou criar conta |
| `/` | `Feed` | `RequireAuth` | Feed principal |
| `/post/:id` | `Post` | `RequireAuth` | Página de post + comentários |
| `/criar` | `Create` | `RequireAuth` | Criar nova publicação |
| `/comunidades` | `Communities` | `RequireAuth` | Lista de comunidades |
| `/alertas` | `Notifications` | `RequireAuth` | Notificações do usuário |
| `/u/:apelido` | `Profile` | `RequireAuth` | Perfil de usuário por apelido |
| `/perfil` | `Profile` | `RequireAuth` | Perfil do usuário logado |
| `*` | — | — | Redireciona para `/` |

## Componentes de Layout

### `Shell`
Envolve páginas autenticadas com `Topbar` + conteúdo + `BottomNav`.

```jsx
<Shell>
  {children}
</Shell>
```

### `Topbar`
Barra superior fixa com logo, busca, navegação e avatar do usuário.

**Elementos:**
- Logo + nome "Lilás" (link para `/`)
- Input de busca (placeholder: "Buscar no Lilás...")
- Links: Feed, Comunidades, + Criar
- Sino de alertas (link para `/alertas`, badge de não lidas)
- Avatar com inicial do apelido (link para perfil)

### `BottomNav`
Navegação inferior mobile com 5 itens.

| Ícone | Rota | Label |
|-------|------|-------|
| home | `/` | Início |
| users | `/comunidades` | Comunidades |
| add | `/criar` | Criar |
| bell | `/alertas` | Alertas |
| person | `/perfil` | Perfil |

### `RequireAuth`
Guard de autenticação para rotas protegidas.

```jsx
<RequireAuth>
  <Shell><Feed /></Shell>
</RequireAuth>
```

**Comportamento:**
- `loading === true` → renderiza `null`
- `!session` → `<Navigate to="/login" replace />`
- Caso contrário → renderiza `children`

## Redirecionamentos

| Cenário | Destino |
|----------|---------|
| `/login` com sessão ativa | `/` |
| Rota desconhecida (`*`) | `/` |
| Acesso a rota protegida sem sessão | `/login` |

## Navegação

- **Desktop:** Topbar com links horizontais
- **Mobile:** Topbar compacta + BottomNav com ícones
- **Tablet:** Layout intermediário (topbar visível, bottomnav oculto)
