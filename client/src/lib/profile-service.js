
import { supabase } from './supabase.js'

// BUSCA DE PERFIL


/**
 * Busca perfil por apelido
 * @param {string} apelido - Nome público do usuário
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function fetchProfileByApelido(apelido) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, apelido, avatar_url, bio, cover_url, banner_url, created_at')
    .eq('apelido', apelido)
    .maybeSingle()

  return { data, error }
}

/**
 * Atualiza dados do perfil (apelido e bio)
 * @param {string} userId - ID do usuário
 * @param {object} updates - Dados para atualizar
 * @param {string} updates.apelido - Novo apelido
 * @param {string} updates.bio - Nova bio
 * @returns {Promise<{error: object|null}>}
 */
export async function updateProfile(userId, { apelido, bio }) {
  const { error } = await supabase
    .from('profiles')
    .update({
      apelido: apelido.trim().replace(/^@/, ''),
      bio: bio.trim()
    })
    .eq('id', userId)

  return { error }
}

// ESTATÍSTICAS DO PERFIL

/**
 * Busca posts de um usuário
 * @param {string} userId - ID do autor
 * @returns {Promise<{data: Array, error: object|null}>}
 */
export async function fetchUserPosts(userId) {
  const { data, error } = await supabase
    .from('posts')
    .select('id, author_id, title, body, image_url, tag, link_url, created_at, poll_options, poll_votes(option_idx), likes(vote), comments(count), profiles!posts_author_id_fkey(id, apelido, avatar_url), communities(name, slug)')
    .eq('author_id', userId)
    .order('created_at', { ascending: false })

  return { data: data || [], error }
}

/**
 * Conta comentários nos posts de um usuário
 * @param {string[]} postIds - IDs dos posts
 * @returns {Promise<{count: number, error: object|null}>}
 */
export async function countCommentsOnPosts(postIds) {
  if (!postIds.length) return { count: 0, error: null }

  const { count, error } = await supabase
    .from('comments')
    .select('id', { count: 'exact', head: true })
    .in('post_id', postIds)

  return { count: count || 0, error }
}

/**
 * Busca karma do usuário (soma de votos em posts + comentários)
 * @param {string} userId - ID do usuário
 * @returns {Promise<{data: number, error: object|null}>}
 */
export async function fetchUserKarma(userId) {
  const { data, error } = await supabase
    .rpc('karma_of', { p_user: userId })

  return { data: data ?? 0, error }
}

/**
 * Busca estatísticas completas do perfil
 * @param {string} userId - ID do usuário
 * @param {string[]|null} postIds - IDs dos posts (opcional; se não fornecido, busca automaticamente)
 * @returns {Promise<{posts: number, likes: number, comments: number, followers: number, following: number}>}
 */
export async function fetchProfileStats(userId, postIds = null) {
  const ids = postIds || (await fetchUserPosts(userId)).data?.map(p => p.id) || []

  const [followersR, followingR, karmaR] = await Promise.all([
    countFollowers(userId),
    countFollowing(userId),
    fetchUserKarma(userId)
  ])

  const { count: commentsCount } = await countCommentsOnPosts(ids)

  return {
    posts: postIds ? postIds.length : (await fetchUserPosts(userId)).data?.length || 0,
    likes: karmaR.data,
    comments: commentsCount,
    followers: followersR.count,
    following: followingR.count
  }
}

// SEGUIDORES E SEGUINDO

/**
 * Conta seguidores de um usuário
 * @param {string} userId - ID do usuário
 * @returns {Promise<{count: number, error: object|null}>}
 */
export async function countFollowers(userId) {
  const { count, error } = await supabase
    .from('follows')
    .select('follower_id', { count: 'exact', head: true })
    .eq('following_id', userId)

  return { count: count || 0, error }
}

/**
 * Conta quantos usuários um usuário segue
 * @param {string} userId - ID do usuário
 * @returns {Promise<{count: number, error: object|null}>}
 */
export async function countFollowing(userId) {
  const { count, error } = await supabase
    .from('follows')
    .select('follower_id', { count: 'exact', head: true })
    .eq('follower_id', userId)

  return { count: count || 0, error }
}

/**
 * Verifica se um usuário está seguindo outro
 * @param {string} followerId - ID do seguidor
 * @param {string} followingId - ID de quem é seguido
 * @returns {Promise<{isFollowing: boolean, error: object|null}>}
 */
export async function checkIsFollowing(followerId, followingId) {
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle()

  return { isFollowing: !!data, error }
}

/**
 * Busca lista de seguidores de um usuário
 * @param {string} userId - ID do usuário
 * @returns {Promise<{data: Array, error: object|null}>}
 */
export async function fetchFollowers(userId) {
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id, profiles:follower_id(id, apelido, avatar_url)')
    .eq('following_id', userId)

  const items = (data || []).map(r => r.profiles).filter(Boolean)
  return { data: items, error }
}

/**
 * Busca lista de usuários que um usuário segue
 * @param {string} userId - ID do usuário
 * @returns {Promise<{data: Array, error: object|null}>}
 */
export async function fetchFollowing(userId) {
  const { data, error } = await supabase
    .from('follows')
    .select('following_id, profiles:following_id(id, apelido, avatar_url)')
    .eq('follower_id', userId)

  const items = (data || []).map(r => r.profiles).filter(Boolean)
  return { data: items, error }
}

/**
 * Busca status de follow para múltiplos usuários
 * @param {string} followerId - ID do seguidor
 * @param {string[]} targetIds - IDs dos usuários a verificar
 * @returns {Promise<{data: object, error: object|null}>}
 */
export async function fetchFollowingMap(followerId, targetIds) {
  if (!targetIds.length) return { data: {}, error: null }

  const { data, error } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', followerId)
    .in('following_id', targetIds)

  const map = {}
  ;(data || []).forEach(r => { map[r.following_id] = true })

  return { data: map, error }
}

/**
 * Alterna status de follow (seguir/deixar de seguir)
 * @param {string} followerId - ID do seguidor
 * @param {string} followingId - ID de quem é seguido
 * @param {boolean} isCurrentlyFollowing - Se já está seguindo
 * @returns {Promise<{error: object|null}>}
 */
export async function toggleFollow(followerId, followingId, isCurrentlyFollowing) {
  if (isCurrentlyFollowing) {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId)

    return { error }
  } else {
    const { error } = await supabase
      .from('follows')
      .insert({ follower_id: followerId, following_id: followingId })

    return { error }
  }
}

// ATIVIDADE DO USUÁRIO

/**
 * Busca atividade recente do usuário (comentários)
 * @param {string} userId - ID do usuário
 * @returns {Promise<{data: Array, error: object|null}>}
 */
export async function fetchUserActivity(userId) {
  const [postsRes, myCommentsRes] = await Promise.all([
    supabase.from('posts').select('id').eq('author_id', userId),
    supabase.from('comments')
      .select('body, post_id, author_id, created_at, profiles:author_id(apelido, avatar_url)')
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
  ])

  if (postsRes.error || myCommentsRes.error) {
    return { data: [], error: postsRes.error || myCommentsRes.error }
  }

  const posts = postsRes.data
  const myComments = myCommentsRes.data

  const postIds = (posts || []).map(p => p.id)

  // Comentários nos posts do usuário
  const { data: commentsOnMyPosts } = postIds.length
    ? await supabase.from('comments')
        .select('body, post_id, author_id, created_at, profiles:author_id(apelido, avatar_url)')
        .in('post_id', postIds)
        .order('created_at', { ascending: false })
        .limit(20)
    : { data: [] }

  // Combinar e ordenar por data
  const items = []
  const seen = new Set()

  ;(commentsOnMyPosts || []).forEach(c => {
    const key = `${c.author_id}-${c.post_id}-${c.created_at}`
    if (seen.has(key)) return
    seen.add(key)
    items.push({
      type: 'comment',
      postId: c.post_id,
      user: c.profiles,
      body: c.body,
      created_at: c.created_at,
      isOwn: c.author_id === userId
    })
  })

  ;(myComments || []).forEach(c => {
    const key = `${c.author_id}-${c.post_id}-${c.created_at}`
    if (seen.has(key)) return
    seen.add(key)
    items.push({
      type: 'comment',
      postId: c.post_id,
      user: c.profiles,
      body: c.body,
      created_at: c.created_at,
      isOwn: true
    })
  })

  items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  return { data: items.slice(0, 15), error: null }
}

// POSTS SALVOS

/**
 * Busca posts salvos pelo usuário
 * @param {string} userId - ID do usuário
 * @returns {Promise<{data: Array, error: object|null}>}
 */
export async function fetchSavedPosts(userId) {
  const { data, error } = await supabase
    .from('saves')
    .select('post_id, posts(id, author_id, title, body, image_url, tag, link_url, created_at, poll_options, poll_votes(option_idx), likes(vote), comments(count), profiles!posts_author_id_fkey(id, apelido, avatar_url), communities(name, slug))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  const posts = (data || []).map(s => s.posts).filter(Boolean)
  return { data: posts, error }
}

// AVATAR E CAPA

/**
 * Faz upload do avatar e atualiza o perfil
 * @param {string} userId - ID do usuário
 * @param {Blob} file - Arquivo de imagem (já convertido para WebP)
 * @returns {Promise<{url: string|null, error: object|null}>}
 */
export async function uploadAvatar(userId, file) {
  const fileName = `${userId}/avatar_${Date.now()}.webp`

  // Tentar upload no bucket 'posts/avatars'
  let uploadRes = await supabase.storage
    .from('posts')
    .upload(`avatars/${fileName}`, file, { contentType: 'image/webp', upsert: true })

  let publicUrl = ''

  if (!uploadRes.error) {
    publicUrl = supabase.storage.from('posts').getPublicUrl(`avatars/${fileName}`).data.publicUrl
  } else {
    // Fallback para bucket 'avatars'
    const altRes = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { contentType: 'image/webp', upsert: true })

    if (altRes.error) {
      return { url: null, error: altRes.error }
    }

    publicUrl = supabase.storage.from('avatars').getPublicUrl(fileName).data.publicUrl
  }

  const bustUrl = `${publicUrl}?t=${Date.now()}`

  // Atualizar perfil
  const { error: dbErr } = await supabase
    .from('profiles')
    .update({ avatar_url: bustUrl })
    .eq('id', userId)

  if (dbErr) return { url: null, error: dbErr }

  return { url: bustUrl, error: null }
}

/**
 * Faz upload da capa/banner e atualiza o perfil
 * @param {string} userId - ID do usuário
 * @param {Blob} file - Arquivo de imagem (já convertido para WebP)
 * @returns {Promise<{url: string|null, error: object|null}>}
 */
export async function uploadCover(userId, file) {
  const fileName = `${userId}/cover_${Date.now()}.webp`

  const { error: uploadErr } = await supabase.storage
    .from('covers')
    .upload(fileName, file, { contentType: 'image/webp', upsert: true })

  if (uploadErr) return { url: null, error: uploadErr }

  const publicUrl = supabase.storage.from('covers').getPublicUrl(fileName).data.publicUrl
  const bustUrl = `${publicUrl}?t=${Date.now()}`

  // Tentar atualizar cover_url primeiro
  let { error: updateErr } = await supabase
    .from('profiles')
    .update({ cover_url: bustUrl })
    .eq('id', userId)

  // Fallback para banner_url se cover_url não existir
  if (updateErr) {
    const res = await supabase
      .from('profiles')
      .update({ banner_url: bustUrl })
      .eq('id', userId)

    if (res.error) return { url: null, error: res.error }
  }

  return { url: bustUrl, error: null }
}

// CONTA

/**
 * Atualiza a senha do usuário
 * @param {string} newPassword - Nova senha (mínimo 6 caracteres)
 * @returns {Promise<{error: object|null}>}
 */
export async function updateUserPassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  return { error }
}

/**
 * Exclui a conta do usuário (RLS garante que só exclui a si mesma)
 * @returns {Promise<{error: object|null}>}
 */
export async function deleteAccount() {
  const { error } = await supabase.rpc('delete_account')
  return { error }
}
