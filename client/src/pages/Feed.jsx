import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/auth.jsx'
import { fetchVotesAndSaves } from '../lib/profile-service.js'
import PostCard from '../components/PostCard.jsx'
import FeedSkeleton from '../components/FeedSkeleton.jsx'

function hotScore(post) {
  const score = (post.likes || []).reduce((s, l) => s + (l.vote || 0), 0)
  const order = Math.log10(Math.max(Math.abs(score), 1)) * Math.sign(score)
  return order + (new Date(post.created_at).getTime() / 1000) / 45000
}

function useFeed(q, scope) {
  const { session } = useAuth()
  const [posts, setPosts] = useState([])
  const [communities, setCommunities] = useState([])
  const [users, setUsers] = useState([])
  const [userVotes, setUserVotes] = useState({})
  const [userSaves, setUserSaves] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const pageRef = useRef(0)

  useEffect(() => {
    setLoading(true)
    setHasMore(true)
    setPosts([])
    pageRef.current = 0
    const userId = session?.user?.id

    const buildQuery = (from, to) => {
      let query = supabase
        .from('posts')
        .select(`
          id, title, body, tag, image_url, link_url, poll_options, created_at, author_id,
          profiles!posts_author_id_fkey(id, apelido, avatar_url),
          communities!posts_community_id_fkey(slug, name),
          likes(vote),
          comments(count),
          poll_votes(option_idx)
        `)
        .order('created_at', { ascending: false })
        .range(from, to)

      return query
    }

    const applyFilters = async (query) => {
      if (scope === 'home' && userId) {
        const [commRes, followRes] = await Promise.all([
          supabase.from('community_members').select('community_id').eq('user_id', userId),
          supabase.from('follows').select('following_id').eq('follower_id', userId)
        ])
        const communityIds = (commRes.data || []).map(r => r.community_id)
        const followingIds = (followRes.data || []).map(r => r.following_id)
        if (!communityIds.length && !followingIds.length) {
          return null
        }
        const filters = []
        if (communityIds.length) filters.push(`community_id.in.(${communityIds.join(',')})`)
        if (followingIds.length) filters.push(`author_id.in.(${followingIds.join(',')})`)
        query = query.or(filters.join(','))
      }
      if (q) query = query.or(`title.ilike.%${q}%,body.ilike.%${q}%`)
      return query
    }

    const buildRangeQuery = async (from, to) => {
      let query = buildQuery(from, to)
      return await applyFilters(query)
    }

    const userSearch = q ? q.replace(/^[uU@\/]+/, '').trim() : ''
    const usersQuery = userSearch
      ? supabase.from('profiles').select('id, apelido, avatar_url, bio').ilike('apelido', `%${userSearch}%`).limit(10).then(r => r, () => ({ data: [] }))
      : Promise.resolve({ data: [] })
    const communitiesQuery = q
      ? supabase.from('communities').select('*').ilike('name', `%${q}%`).limit(10).then(r => r, () => ({ data: [] }))
      : supabase.from('communities').select('*').order('members', { ascending: false }).limit(10)

    Promise.all([
      buildRangeQuery(0, 49),
      communitiesQuery,
      usersQuery
    ]).then(async ([p, c, u]) => {
      const allPosts = (p && p.data) || []
      setPosts(allPosts)
      setHasMore(allPosts.length === 50)
      setCommunities(c.data || [])
      setUsers(u.data || [])

      const postIds = allPosts.map(x => x.id)
      if (postIds.length && userId) {
        const { votesMap, savesMap } = await fetchVotesAndSaves(postIds, userId)
        setUserVotes(votesMap)
        setUserSaves(savesMap)
      } else {
        setUserVotes({})
        setUserSaves({})
      }

      setLoading(false)
    }).catch(() => {
      setPosts([])
      setCommunities([])
      setUsers([])
      setUserVotes({})
      setUserSaves({})
      setLoading(false)
    })
  }, [q, scope, session?.user?.id])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const from = (pageRef.current + 1) * 50
    const to = from + 49
    const userId = session?.user?.id
    try {
      let query = buildQuery(from, to)
      const applied = await applyFilters(query)
      if (!applied) {
        setHasMore(false)
      } else {
        const { data } = await applied
        if (data?.length) {
          pageRef.current += 1
          setPosts(prev => {
            const ids = new Set(prev.map(p => p.id))
            const fresh = data.filter(p => !ids.has(p.id))
            return [...prev, ...fresh]
          })
          setHasMore(data.length === 50)
          const postIds = data.map(x => x.id)
          if (postIds.length && userId) {
            const { votesMap, savesMap } = await fetchVotesAndSaves(postIds, userId)
            setUserVotes(v => ({ ...v, ...votesMap }))
            setUserSaves(s => ({ ...s, ...savesMap }))
          }
        } else {
          setHasMore(false)
        }
      }
    } catch {
      setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }, [hasMore, loadingMore, q, scope, session?.user?.id])

  // Real-time: sincroniza votos (likes) entre usuários
  useEffect(() => {
    const channel = supabase
      .channel('feed-likes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, (payload) => {
        const postId = payload.new?.post_id || payload.old?.post_id
        if (!postId) return

        setPosts(prev => prev.map(p => {
          if (p.id !== postId) return p
          let newLikes = [...(p.likes || [])]

          if (payload.eventType === 'DELETE') {
            newLikes = newLikes.filter(l => l.user_id !== payload.old?.user_id)
          } else if (payload.eventType === 'INSERT') {
            newLikes.push({ vote: payload.new.vote, user_id: payload.new.user_id })
          } else if (payload.eventType === 'UPDATE') {
            newLikes = newLikes.map(l =>
              l.user_id === payload.new.user_id ? { ...l, vote: payload.new.vote } : l
            )
          }

          const newScore = newLikes.reduce((s, l) => s + (l.vote || 0), 0)
          return { ...p, likes: newLikes, score: newScore }
        }))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const removePost = useCallback(id => {
    setPosts(p => p.filter(x => x.id !== id))
  }, [])

  return { posts, communities, users, userVotes, userSaves, loading, loadingMore, hasMore, loadMore, removePost }
}

export default function Feed() {
  const [params] = useSearchParams()
  const q = params.get('q') || ''
  const { profile } = useAuth()
  const [tab, setTab] = useState('hot')
  const [feedScope, setFeedScope] = useState('home')
  const { posts, communities, users, userVotes, userSaves, loading, loadingMore, hasMore, loadMore, removePost } = useFeed(q, q ? 'all' : feedScope)
  const sentinelRef = useRef(null)

  useEffect(() => {
    if (!sentinelRef.current) return
    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) loadMore()
    }, { rootMargin: '600px' })
    io.observe(sentinelRef.current)
    return () => io.disconnect()
  }, [loadMore, posts])

  const sorted = useMemo(() => {
    const s = [...posts]
    if (tab === 'top') s.sort((a, b) => {
      const sa = (a.likes || []).reduce((st, l) => st + (l.vote || 0), 0)
      const sb = (b.likes || []).reduce((st, l) => st + (l.vote || 0), 0)
      return sb - sa
    })
    if (tab === 'new') s.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    if (tab === 'hot') s.sort((a, b) => hotScore(b) - hotScore(a))
    return s
  }, [posts, tab])

  const visible = useMemo(() => {
    if (tab === 'top') {
      return sorted.filter(p => (p.likes || []).reduce((s, l) => s + (l.vote || 0), 0) > 0)
    }
    return sorted
  }, [sorted, tab])

  return (
    <div className="container">
      {loading ? (
        <FeedSkeleton />
      ) : (
        <div className="layout">
          <aside className="rail">
            <h3>Comunidades</h3>
            {communities.map(c => (
              <Link key={c.id} to={`/c/${c.slug}`} className="rail-item">
                <span className={`r${c.banner_url ? ' r--img' : ''}`} style={c.banner_url ? { backgroundImage: `url(${c.banner_url})` } : undefined}>{c.name.replace('r/', '').slice(0, 1)}</span>
                {c.name}
              </Link>
            ))}
          </aside>

          <main className="main">
            {/* Mobile Emergency / Support Banner */}
            <aside className="mobile-help-banner" aria-label="Central de Atendimento">
              <div className="mobile-help-content">
                <span className="mobile-help-badge">Apoio 24h</span>
                <span className="mobile-help-text">Precisa de ajuda? Ligue <strong>180</strong> (gratuito)</span>
              </div>
              <a href="tel:180" className="btn mobile-help-btn" title="Ligar para a Central 180">
                Ligar 180
              </a>
            </aside>

            {q && <h2 style={{ fontSize: 18, margin: '16px 0' }}>Resultados para "{q}"</h2>}
            {q && users.length > 0 && (
              <div className="card" style={{ padding: 12, marginBottom: 4 }}>
                <h3 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 8, fontWeight: 700 }}>Pessoas</h3>
                {users.map(u => (
                  <Link key={u.id} to={`/u/${u.apelido}`} className="rail-item">
                    <span className="avatar-sm">{u.avatar_url ? <img src={u.avatar_url} alt="" /> : u.apelido[0].toUpperCase()}</span>
                    <span>@{u.apelido}</span>
                  </Link>
                ))}
              </div>
            )}
            {!q && (
              <div className="feed-tabs" style={{ marginBottom: 0 }}>
                <button className={feedScope === 'home' ? 'active' : ''} onClick={() => { setFeedScope('home'); setTab('hot') }}>Home</button>
                <button className={feedScope === 'all' ? 'active' : ''} onClick={() => { setFeedScope('all'); setTab('hot') }}>Tudo</button>
              </div>
            )}
            <div className="feed-tabs">
              <button className={tab === 'hot' ? 'active' : ''} onClick={() => setTab('hot')}>Em alta</button>
              <button className={tab === 'new' ? 'active' : ''} onClick={() => setTab('new')}>Novo</button>
              <button className={tab === 'top' ? 'active' : ''} onClick={() => setTab('top')}>Mais votado</button>
            </div>
            {visible.map(p => <PostCard key={p.id} post={p} onRemove={removePost} userVote={userVotes[p.id]} userSaved={userSaves[p.id]} />)}
            {hasMore && (
              <div ref={sentinelRef} style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 13 }}>
                {loadingMore ? 'Carregando...' : ''}
              </div>
            )}
            {visible.length === 0 && (
              <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                <h3>{q ? 'Nada encontrado' : 'Nada por aqui ainda'}</h3>
                <p style={{ color: 'var(--muted)', margin: '8px 0 16px' }}>{q ? 'Tente outra palavra-chave.' : 'Seja a primeira a compartilhar algo inspirador.'}</p>
                {!q && <Link to="/criar" className="btn btn-primary">Criar post</Link>}
              </div>
            )}
          </main>

          <aside className="side">
            <div className="card welcome">
              <span className="avatar big-av">{profile?.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : (profile?.apelido || '?')[0].toUpperCase()}</span>
              <h4>Bem-vinda, @{profile?.apelido}</h4>
              <p>Encontre apoio e compartilhe sua história.</p>
              <Link to="/criar" className="btn btn-primary welcome-btn">+ Criar post</Link>
            </div>
            <div className="card side-info">
              <h4>Lilás</h4>
              <p>Rede social segura para enfrentamento à violência contra a mulher.</p>
              <div className="side-meta">
                <span><b>5</b> comunidades</span>
                <span><b>180</b> Central de Atendimento</span>
              </div>
            </div>
            <div className="card side-info">
              <h4>Emergência</h4>
              <p>Ligue <b>180</b> — Central de Atendimento à Mulher. Gratuito e 24h.</p>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}