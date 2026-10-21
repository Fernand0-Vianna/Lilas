# Deploy

## Vercel (produção)

### Configuração

O arquivo `client/vercel.json` aplica o rewrite de SPA (`/*` → `/index.html`).
O build é o padrão do Vite (`npm run build` → `dist/`), lido automaticamente pelo Vercel.

### Variáveis de Ambiente

No painel do Vercel (Project → Settings → Environment Variables), configure:

| Variável | Valor |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://gmmocqgdjmtlrahnfgye.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Chave anônima do projeto Supabase |

> **Importante:** Variáveis com prefixo `VITE_` são expostas ao cliente. Nunca commit chaves secretas.

### Site em Produção

- **URL:** https://lilas-two.vercel.app
- **Branch principal:** `main` — deploy automático a cada push
- **Repositório:** https://github.com/Fernand0-Vianna/Lilas

## Supabase

### Projeto

- **ID:** `gmmocqgdjmtlrahnfgye`
- **Região:** `ca-central-1`
- **URL:** `https://gmmocqgdjmtlrahnfgye.supabase.co`

### Configurações de Auth

| Config | Valor |
|--------|-------|
| `site_url` | `https://lilas-two.vercel.app` |
| `mailer_autoconfirm` | `false` |
| `disable_signup` | `false` |

> **Nota:** O `site_url` deve apontar para o domínio de produção para redirecionamentos de email funcionarem corretamente.

### Migrações e Seed

- Migrações aplicadas via Supabase Dashboard ou CLI
- Tabelas com RLS (posts, comments, likes, poll_votes, comment_votes, saves, follows, reports, notifications, communities, community_members, community_mods, community_bans)
- Trigger `handle_new_user` configurado
- 5 comunidades seedadas

### Rate Limit de Email

- **Limite padrão:** 2 emails/hora/IP — insuficiente para produção
- **Solução:** configurar SMTP custom no Dashboard (Authentication → SMTP) com um provedor como Resend, Brevo ou SendGrid

## GitHub

### Repositório

```
https://github.com/Fernand0-Vianna/Lilas
```

### Branch Principal

- `main` — branch de produção

### Workflow de Deploy

1. Push para `main`
2. Vercel detecta mudança
3. Executa `npm run build` em `client/`
4. Deploy automático para produção

## Passo a Passo para Reproduzir Deploy

1. **Criar projeto Supabase**
   - Criar projeto em https://supabase.com
   - Anotar `URL` e `anon key`

2. **Configurar banco**
   - Aplicar migrações (tabelas, RLS, trigger)
   - Seed das 5 comunidades

3. **Configurar Auth**
   - `site_url` para domínio de produção
   - Configurar SMTP custom (Authentication → SMTP)

4. **Configurar Vercel**
   - Conectar repositório GitHub
   - Definir variáveis de ambiente

5. **Verificar**
   - Acessar URL de produção
   - Testar cadastro e login
   - Verificar RLS funcionando