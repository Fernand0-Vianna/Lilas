# 🌸 Funcionalidades — Lilás

> **Espaço seguro para o Agosto Lilás**: Rede social de apoio para mulheres compartilharem histórias, encontrarem acolhimento e acessarem informações fundamentais sobre o combate à violência contra a mulher.

---

## ✨ Funcionalidades Implementadas

### 🔐 Autenticação e Segurança
| Funcionalidade | Descrição |
| :--- | :--- |
| **Login e Registro** | Acesso simplificado via e-mail e senha. |
| **Confirmação de E-mail** | Autenticação reforçada via link de confirmação. |
| **Apelido Anônimo** | Preservação total da privacidade da usuária. |
| **Recuperação de Acesso** | Redefinição segura de senha por e-mail. |
| **Proteção de Rotas** | Conteúdo restrito exclusivamente a usuárias autenticadas. |
| **Segurança no Banco** | Regras de *Row Level Security (RLS)* ativas no Supabase. |

---

### 📰 Feed e Publicações
| Funcionalidade | Descrição |
| :--- | :--- |
| **Feed Principal** | Exibição fluida de publicações da rede. |
| **Criação de Posts** | Suporte para títulos, textos detalhados e imagens. |
| **Visualização Completa** | Exibição detalhada da publicação com sua seção de comentários. |
| **Sistema de Votação** | Opções de *upvote* e *downvote* em posts. |
| **Busca de Posts** | Pesquisa direta por título. |
| **Filtro: Em Alta** | Ordenação calculada por *score* e tendência. |
| **Filtro: Novo** | Exibição por ordem de publicação (mais recentes). |
| **Filtro: Mais Votado** | Destaque para as maiores pontuações. |

---

### 💬 Comentários
| Funcionalidade | Descrição |
| :--- | :--- |
| **Interação em Posts** | Adição de comentários diretos em qualquer publicação. |
| **Votação em Comentários** | Sistema de *upvote* e *downvote* específico para respostas. |
| **Moderação de Comunidade** | Opção para denunciar comentários inadequados. |
| **Organização** | Exibição cronológica das respostas. |

---

### 👥 Comunidades
| Comunidade | Descrição / Objetivo |
| :--- | :--- |
| **`r/AgostoLilas`** | Espaço de acolhimento e conscientização. |
| **`r/Mulheres`** | Discussões gerais e fortalecimento. |
| **`r/LeiMariaPenha`** | Informações e dúvidas jurídicas. |
| **`r/SaudeFeminina`** | Cuidados com a saúde física e mental. |
| **`r/Enfrentamento`** | Apoio e combate à violência. |

| Recurso | Detalhes |
| :--- | :--- |
| **Mapeamento de Grupos** | Exibição de todas as comunidades com descrição e contagem de membros. |
| **Adesão** | Opção simples para entrar ou sair de qualquer comunidade. |
| **Filtro de Grupos** | Busca rápida de comunidades por nome ou descrição. |
| **Segmentação** | Conteúdos organizados e isolados por tema. |

---

### 👤 Perfil de Usuário
| Funcionalidade | Descrição |
| :--- | :--- |
| **Perfil Pessoal** | Painel individual exibindo o apelido cadastrado. |
| **Avatar Dinâmico** | Geração automática com a primeira letra do apelido. |
| **Rede de Conexões** | Sistema para seguir outros perfis. |
| **Edição de Perfil** | Gerenciamento de dados e preferências. |
| **Perfis Públicos** | Visualização da página de outros usuários. |

---

### 🚨 Denúncias e Moderação
| Funcionalidade | Descrição |
| :--- | :--- |
| **Denúncia de Posts** | Envio de alertas com justificativa/descrição detalhada. |
| **Denúncia de Comentários** | Sinalização rápida de mensagens inadequadas. |
| **Painel do Administrador** | Central exclusiva para análise de alertas. |
| **Status de Resolução** | Acompanhamento de denúncias (`Aberto` ➔ `Resolvido`). |
| **Ações de Moderação** | Remoção direta de conteúdos infratores. |
| **Acesso Restrito** | Painel administrativo protegido contra acessos não autorizados. |

---

### 🔖 Salvos
| Funcionalidade | Descrição |
| :--- | :--- |
| **Marcação de Favoritos** | Salvar publicações para leitura posterior. |
| **Gerenciamento de Salvos** | Central para adicionar ou remover itens salvos. |

---

### 🔍 Navegação & Interface
| Componente | Função |
| :--- | :--- |
| **Barra Superior (Header)** | Logo, campo de busca e atalhos do perfil. |
| **Navegação Inferior (Mobile)** | Barra de ícones otimizada para dispositivos móveis. |
| **Atalhos Rápidos** | Links diretos para as comunidades mais populares. |
| **Menu do Usuário** | Acesso rápido ao perfil, configurações e *logout*. |

---

### ⚙️ Recursos Adicionais
| Recurso | Descrição |
| :--- | :--- |
| **Formatação Numérica** | Abreviação amigável de métricas (ex: `1k`, `1.5mi`). |
| **Timestamps Relativos** | Exibição temporal amigável (ex: `há 2 horas`). |
| **Mensagens de Sistema** | Tratamento completo de erros em português. |
| **Componentização** | Arquitetura reutilizável (`Icon`, `PostCard`, etc). |

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
| :--- | :--- |
| **Frontend** | React 18 + Vite 5 |
| **Roteamento** | React Router 6 |
| **Backend** | Supabase (PostgreSQL + Auth + RLS) |
| **Deploy** | Netlify |

---

## 🎨 Composição do Código

| Linguagem / Tecnologia | Percentual | Aplicação |
| :--- | :---: | :--- |
| **JavaScript** | **73.0%** | Lógica de componentes e regras de negócio |
| **CSS** | **22.5%** | Estilização e responsividade |
| **PL/pgSQL** | **03.8%** | Funções e rotinas personalizadas no banco |
| **HTML** | **00.7%** | Estrutura base da aplicação |

---

## 📍 Deploy e Acesso
🔗 **Link da Aplicação**: [https://alilas.netlify.app/](https://alilas.netlify.app/)

---

**Última atualização**: 24/08/2026