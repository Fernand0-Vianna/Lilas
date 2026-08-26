# Plataforma Agosto Lilás — Funcionalidades

> Funcionalidades organizadas por prioridade para controlar o escopo do projeto.

---

## 1. Agora — MVP

Funcionalidades essenciais para a primeira versão da plataforma.

### 1.1 Usuários

| Funcionalidade | Descrição | Status |
|---|---|:---:|
| **Autenticação OTP** | Login por código enviado por e-mail | [x] |
| **Pseudônimo** | Identidade pública protegida | [x] |
| **Perfil** | Visualização e edição do perfil | [x] |
| **Seguir usuários** | Seguir e visualizar outros perfis | [x] |
| **Proteção de rotas** | Controle de acesso às áreas protegidas | [x] |
| **Bloqueio** | Bloquear interações de usuários | [ ] |

### 1.2 Comunidade

| Funcionalidade | Descrição | Status |
|---|---|:---:|
| **Feed** | Exibição das publicações | [x] |
| **Comunidades** | Organização por temas | [x] |
| **Posts** | Publicações com texto e imagem | [x] |
| **Comentários** | Interação nas publicações | [x] |
| **Curtidas** | Interação com posts | [x] |
| **Filtro por comunidade** | Filtrar conteúdos por tema | [ ] |
| **Ordenação** | Ordenar por recentes e populares | [ ] |

**Comunidades iniciais:**

r/Relatos - Para mensagem de apoio e acolhimento
r/Apoio Juridico -Pra dúvidas sobre medida protetiva, DEAM, defensoria
r/Rede de Apoio - Com filtro de cidadade proxima

### 1.3 Relatos

| Funcionalidade | Descrição | Status |
|---|---|:---:|
| **Criar relato** | Registrar uma ocorrência | [ ] |
| **Relato anônimo** | Preservar a identidade pública | [ ] |
| **Classificação** | Categorizar a ocorrência | [ ] |
| **Evidências** | Anexar arquivos | [ ] |
| **Protocolo** | Identificador único do relato | [ ] |
| **Acompanhamento** | Consultar status e histórico | [ ] |

**Fluxo do relato:**

```text
Recebido
   ↓
Em análise
   ↓
Em acompanhamento
   ↓
Finalizado
```

### 1.4 Segurança e Moderação

| Funcionalidade | Descrição | Status |
|---|---|:---:|
| **Denunciar conteúdo** | Denunciar posts e comentários | [ ] |
| **Moderação** | Analisar conteúdos denunciados | [ ] |
| **Bloqueio** | Restringir usuários | [ ] |
| **Controle de acesso** | Gerenciar permissões | [ ] |


---

## 2. Depois — Evolução

Funcionalidades complementares para versões posteriores ao MVP.

| Módulo | Funcionalidades | Status |
|---|---|:---:|
| **Busca** | Posts, comunidades e usuários | [ ] |
| **Notificações** | Comentários, curtidas, seguidores e relatos | [ ] |
| **Privacidade** | Perfil privado, sessões e gerenciamento de dados | [ ] |
| **Emergência** | SOS, contatos de confiança e saída rápida | [ ] |
| **Informação** | Artigos, direitos, Lei Maria da Penha e FAQ | [ ] |
| **Conteúdo** | Salvar, compartilhar e posts em destaque | [ ] |

---

## 3. Futuro — Fora de Escopo

Funcionalidades que não fazem parte do projeto atual.

| Área | Funcionalidades | Status |
|---|---|:---:|
| **IA** | Moderação automática, classificação e triagem | [ ] |
| **Integrações** | Órgãos públicos e serviços oficiais | [ ] |
| **Profissionais** | Advogados, psicólogos e ONGs verificados | [ ] |
| **Mobile** | Aplicativos Android e iOS | [ ] |
| **BI** | Dashboards, métricas e relatórios avançados | [ ] |
| **Expansão** | Multilíngue e novas integrações | [ ] |

---

## 4. Resumo do Escopo

| Etapa | Objetivo | Status |
|---|---|:---:|
| **Agora — MVP** | Núcleo funcional da plataforma | [ ] |
| **Depois — Evolução** | Melhorias e funcionalidades complementares | [ ] |
| **Futuro — Fora de Escopo** | Expansões e integrações avançadas | [ ] |

---

## 5. Ordem de Implementação

```text
Autenticação
     ↓
Comunidade
     ↓
Relatos
     ↓
Segurança e Moderação
     ↓
Administração
     ↓
Evolução
     ↓
Funcionalidades futuras
```

> O objetivo é concluir primeiro o núcleo funcional da plataforma, mantendo funcionalidades complementares e integrações avançadas fora do escopo inicial.
> ## 1.4 Segurança e Moderação

| Funcionalidade          | Descrição                                            | Status |
| ----------------------- | ---------------------------------------------------- | :----: |
| **Denunciar conteúdo**  | Denunciar posts e comentários inadequados            |  [ ]   |
| **Moderação básica**    | Administrador analisa e remove conteúdos denunciados |  [ ]   |
| **Bloqueio de usuário** | Bloquear usuários que violem as regras da plataforma |  [ ]   |
| **Controle de acesso**  | Diferenciar permissões de usuário e administrador    |  [ ]   |
| **Autenticação segura** | Validar acesso e manter sessões autenticadas         |  [ ]   |
