⚠️ O que falta para ser "Reddit"

Para transformar o Lilas em uma plataforma mais parecida com o Reddit, você precisaria implementar:

### 1. Sistema de Votos (Upvotes/Downvotes)
O Reddit é definido pela curadoria da comunidade através de votos. Atualmente, o projeto tem "curtidas" (likes_count), mas o README menciona que isso foi removido para adição de moderação.

O que falta: Implementar um sistema de votos positivos e negativos (setas para cima e para baixo).
Impacto: Isso permite que o conteúdo mais relevante suba no feed e conteúdos irrelevantes sejam escondidos ou ordenados por "Mais Polêmico".

### 2. Threads de Comentários em Profundidade (Nested Comments)
O projeto menciona "Voto em comentários (estilo Reddit)" no histórico de commits, mas precisa verificar se a implementação é de árvore aninhada.

O que falta: Comentários que podem ter resposta a comentários (reply), criando uma árvore de discussões visualizada em níveis, não apenas uma lista linear.

### 3. Sistema de "Posts" Mais Ricos
Links Externos: O Reddit permite postar links que geram pré-visualização (embeds). O código atual foca em texto e imagem.
Enquetes (Polls): Um recurso muito popular no Reddit para engajamento.
Tags de Categoria: Além das comunidades, permitir tags específicas dentro do post (ex: "Dúvida", "Conseguiu", "História Real").

### 4. Gamificação e Karma
O Reddit usa um sistema de reputação chamado Karma, baseado nos votos que seus posts e comentários recebem.

O que falta: Criar um contador de Karma no perfil do usuário e possivelmente usar isso para limitar postagens de novos usuários (para evitar spam).

### 5. Moderação Avançada (Community Mods)
O README menciona "moderação admin", mas no Reddit, cada comunidade (subreddit) tem seus próprios moderadores.

O que falta: Permitir que usuários escolhidos pelos administradores de cada comunidade (ex: moderação de r/Mulheres) possam editar ou remover posts, bloquear usuários e definir regras específicas para aquela comunidade.
