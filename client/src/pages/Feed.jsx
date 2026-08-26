import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/auth.jsx'
import PostCard from '../components/PostCard.jsx'

function hotScore(post) {
  const score = post.likes?.[0]?.vote ?? 0
  const order = Math.log10(Math.max(Math.abs(score), 1)) * Math.sign(score)
  return order + (new Date(post.created_at).getTime() / 1000) / 45000
}

function useFeed(q) {
  const [posts, setPosts] = useState([])
  const [communities, setCommunities] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    let query = supabase
      .from('posts')
      .select('*, profiles!posts_author_id_fkey(apelido, avatar_url), communities(slug, name), likes(vote), comments(count), poll_votes(option_idx)')
      .order('created_at', { ascending: false })
      .limit(50)
    if (q) query = query.ilike('title', `%${q}%`)
    const userSearch = q ? q.replace(/^[uU@\/]+/, '').trim() : ''
    const usersQuery = userSearch
      ? supabase.from('profiles').select('id, apelido, avatar_url, bio').ilike('apelido', `%${userSearch}%`).limit(10).then(r => r, () => ({ data: [] }))
      : Promise.resolve({ data: [] })
    Promise.all([
      query,
      supabase.from('communities').select('*').order('members', { ascending: false }).limit(10),
      usersQuery
    ]).then(([p, c, u]) => {
      setPosts(p.data || [])
      setCommunities(c.data || [])
      setUsers(u.data || [])
      setLoading(false)
    }).catch(() => {
      setPosts([])
      setCommunities([])
      setUsers([])
      setLoading(false)
    })
  }, [q])

  return { posts, communities, users, loading, removePost: id => setPosts(p => p.filter(x => x.id !== id)) }
}

export default function Feed() {
  const [params] = useSearchParams()
  const q = params.get('q') || ''
  const { posts, communities, users, loading, removePost } = useFeed(q)
  const { profile } = useAuth()
  const [tab, setTab] = useState('hot')

  const sorted = [...posts]
  if (tab === 'top') sorted.sort((a, b) => (b.likes?.[0]?.vote || 0) - (a.likes?.[0]?.vote || 0))
  if (tab === 'new') sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  if (tab === 'hot') sorted.sort((a, b) => hotScore(b) - hotScore(a))

  return (
    <div className="container">
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
          <div className="feed-tabs">
            <button className={tab === 'hot' ? 'active' : ''} onClick={() => setTab('hot')}>Em alta</button>
            <button className={tab === 'new' ? 'active' : ''} onClick={() => setTab('new')}>Novo</button>
            <button className={tab === 'top' ? 'active' : ''} onClick={() => setTab('top')}>Mais votado</button>
          </div>
          {loading ? <p style={{ color: 'var(--muted)' }}>Carregando...</p> :
            sorted.map(p => <PostCard key={p.id} post={p} onDeleted={() => removePost(p.id)} />)}
          {!loading && sorted.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
              <h3>{q ? 'Nada encontrado' : 'Nada por aqui ainda'}</h3>
              <p style={{ color: 'var(--muted)', margin: '8px 0 16px' }}>{q ? 'Tente outra palavra-chave.' : 'Seja a primeira a compartilhar algo inspirador.'}</p>
              {!q && <Link to="/criar" className="btn btn-primary">Criar post</Link>}
            </div>
          )}
        </main>

        <aside className="side">
          <div className="card welcome">
            <span className="avatar big-av">{(profile?.apelido || '?')[0].toUpperCase()}</span>
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
    </div>
  )
}