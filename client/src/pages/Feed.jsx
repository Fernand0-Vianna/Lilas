import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/auth.jsx'
import PostCard from '../components/PostCard.jsx'

function useFeed(q) {
  const [posts, setPosts] = useState([])
  const [communities, setCommunities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    let query = supabase
      .from('posts')
      .select('*, profiles(apelido, avatar_url), communities(slug, name), likes(count), comments(count)')
      .order('created_at', { ascending: false })
      .limit(30)
    if (q) query = query.ilike('title', `%${q}%`)
    Promise.all([
      query,
      supabase.from('communities').select('*').order('members', { ascending: false }).limit(10)
    ]).then(([p, c]) => {
      setPosts(p.data || [])
      setCommunities(c.data || [])
      setLoading(false)
    })
  }, [q])

  return { posts, communities, loading, removePost: id => setPosts(p => p.filter(x => x.id !== id)) }
}

export default function Feed() {
  const [params] = useSearchParams()
  const q = params.get('q') || ''
  const { posts, communities, loading, removePost } = useFeed(q)
  const { profile } = useAuth()
  const [tab, setTab] = useState('voce')

  const sorted = [...posts]
  if (tab === 'alta') sorted.sort((a, b) => (b.likes?.[0]?.count || 0) - (a.likes?.[0]?.count || 0))
  if (tab === 'novo') sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

  return (
    <div className="container">
      <div className="layout">
        <aside className="rail">
          <h3>Comunidades</h3>
          {communities.map(c => (
            <Link key={c.id} to={`/c/${c.slug}`} className="rail-item">
              <span className="r">{c.name.replace('r/', '').slice(0, 1)}</span>
              {c.name}
            </Link>
          ))}
        </aside>

        <main className="main">
          {q && <h2 style={{ fontSize: 18, margin: '16px 0' }}>Resultados para "{q}"</h2>}
          <div className="feed-tabs">
            <button className={tab === 'voce' ? 'active' : ''} onClick={() => setTab('voce')}>Para você</button>
            <button className={tab === 'novo' ? 'active' : ''} onClick={() => setTab('novo')}>Novo</button>
            <button className={tab === 'alta' ? 'active' : ''} onClick={() => setTab('alta')}>Em alta</button>
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
            <p>Encontre apoio e compartilhe sua história em segurança.</p>
            <Link to="/criar" className="btn btn-primary welcome-btn">+ Criar post</Link>
          </div>
          <div className="card">
            <h3 style={{ fontSize: 14, marginBottom: 8 }}>Ligue 180</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
              Central de Atendimento à Mulher — gratuito e 24h. Ligue 180. Sua publicação pode salvar vidas.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}