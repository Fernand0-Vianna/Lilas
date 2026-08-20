# Lilás

<p align="center">
  <img src="midias/logolilas.svg" alt="Lilás" width="120" />
</p>

**Rede social de apoio para o Agosto Lilas.** Um espaço seguro para mulheres compartilharem histórias, encontrarem apoio e acessarem informações sobre combate à violência contra a mulher.

🔗 **Deploy:** [https://alilas.netlify.app/](https://alilas.netlify.app/)

---

## Funcionalidades

- Feed de publicações com comunidades temáticas
- Criação de posts com texto e imagem
- Comentários e curtidas
- Comunidades (r/AgostoLilas, r/Mulheres, r/LeiMariaPenha, r/SaudeFeminina, r/Enfrentamento)
- Perfis de usuário com sistema de seguir
- Autenticação por email (OTP) com apelido anônimo
- Proteção de rotas e conteúdo moderado

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite 5 |
| Roteamento | React Router 6 |
| Backend / Banco | Supabase (PostgreSQL + Auth + RLS) |
| Deploy | Netlify |

## Pré-requisitos

- Node.js 18+
- Conta no Supabase
- Git

## Setup Local

```bash
# 1. Clone o repositório
git clone https://github.com/Fernand0-Vianna/Lilas.git
cd Lilas

# 2. Instale dependências
cd client
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais Supabase

# 4. Rode o servidor de desenvolvimento
npm run dev
```

## Variáveis de Ambiente

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

## Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Servidor de desenvolvimento (Vite) |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build localmente |

## Estrutura do Projeto

```
Lilas/
├── client/                  # Aplicação React + Vite
│   ├── src/
│   │   ├── lib/            # Supabase client e Auth context
│   │   ├── pages/          # Páginas (Feed, Post, Login, etc.)
│   │   ├── components/     # Componentes reutilizáveis
│   │   └── styles.css      # Tokens e estilos globais
│   ├── netlify.toml        # Config do deploy
│   └── .env.example        # Template de env vars
├── planomode/              # Histórico de tasks e planos
├── midias/                 # Assets estáticos
├── netlify.toml            # Build config raiz
└── README.md
```

## Documentação

Para detalhes da arquitetura, banco de dados, autenticação e mais, consulte a pasta [`Docs/`](./Docs/).

- [Índice da Documentação](./Docs/index.md)
- [Arquitetura](./Docs/architecture.md)
- [Banco de Dados](./Docs/database.md)
- [Autenticação](./Docs/authentication.md)
- [Referência de API](./Docs/api-reference.md)
- [Rotas](./Docs/routes.md)
- [Componentes](./Docs/components.md)
- [Design System](./Docs/design-system.md)
- [Deploy](./Docs/deployment.md)
- [Contribuindo](./Docs/contributing.md)
- [Changelog](./Docs/changelog.md)

## Licença

Projeto acadêmico — Agosto Lilas.
