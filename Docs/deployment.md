# Deploy

## Netlify

### Configuração

O arquivo `netlify.toml` na raiz do projeto define a base do build:

```toml
[build]
  base = "client"
```

O Netlify detecta automaticamente o Vite e executa `npm run build` dentro da pasta `client`.

### Variáveis de Ambiente

No painel do Netlify (Site settings → Environment variables), configure:

| Variável | Valor |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://gmmocqgdjmtlrahnfgye.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Chave anônima do projeto Supabase |

> **Importante:** Variáveis com prefixo `VITE_` são expostas ao cliente. Nunca commit chaves secretas.

### Site em Produção

- **URL:** https://lilas-341.netlify.app
- **Branch principal:** `main`
- **Repositório:** https://github.com/Fernand0-Vianna/Lilas

## Supabase

### Projeto

- **ID:** `gmmocqgdjmtlrahnfgye`
- **Região:** `ca-central-1`
- **URL:** `https://gmmocqgdjmtlrahnfgye.supabase.co`

### Configurações de Auth

| Config | Valor |
|--------|-------|
| `site_url` | `https://lilas-341.netlify.app` |
| `mailer_autoconfirm` | `false` |
| `disable_signup` | `false` |

> **Nota:** O `site_url` deve apontar para o domínio de produção para redirecionamentos de email funcionarem corretamente.

### Migrações e Seed

- Migrações aplicadas via Supabase Dashboard ou CLI
- 7 tabelas criadas com RLS
- Trigger `handle_new_user` configurado
- 5 comunidades seedadas

### Rate Limit de Email

- **Limite padrão:** 2 emails/hora/IP
- **Aumentar limite:** Requer configuração de SMTP custom (Resend, SendGrid, etc.)

## GitHub

### Repositório

```
https://github.com/Fernand0-Vianna/Lilas
```

### Branch Principal

- `main` — branch de produção

### Workflow de Deploy

1. Push para `main`
2. Netlify detecta mudança
3. Executa `npm run build` em `client/`
4. Deploy automático para produção

## Passo a Passo para Reproduzir Deploy

1. **Criar projeto Supabase**
   - Criar projeto em https://supabase.com
   - Anotar `URL` e `anon key`

2. **Configurar banco**
   - Aplicar migrações (7 tabelas, RLS, trigger)
   - Seed das 5 comunidades

3. **Configurar Auth**
   - `site_url` para domínio de produção
   - Configurar SMTP se necessário

4. **Configurar Netlify**
   - Conectar repositório GitHub
   - Definir variáveis de ambiente
   - Deploy manual primeiro ou automático via branch

5. **Verificar**
   - Acessar URL de produção
   - Testar cadastro e login
   - Verificar RLS funcionando
