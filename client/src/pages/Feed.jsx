import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/auth.jsx'
import PostCard from '../components/PostCard.jsx'

function useFeed() {
  const [posts, setPosts] = useState([])
  const [communities, setCommunities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase
        .from('posts')
        .select('*, profiles(apelido, avatar_url), communities(slug, name)')
        .order('created_at', { ascending: false })
        .limit(30),
      supabase.from('communities').select('*').order('members', { ascending: false }).limit(10)
    ]).then(([p, c]) => {
      setPosts(p.data || [])
      setCommunities(c.data || [])
      setLoading(false)
    })
  }, [])

  return { posts, communities, loading, removePost: id => setPosts(p => p.filter(x => x.id !== id)) }
}

export default function Feed() {
  const { posts, communities, loading, removePost } = useFeed()
  const { profile } = useAuth()

  return (
    <div className="container">
      <div className="layout">
        <aside className="rail">
          <h3>Comunidades</h3>
          {communities.map(c => (
            <Link key={c.id} to="/comunidades" className="rail-item">
              <span className="r">{c.name.replace('r/', '').slice(0, 1)}</span>
              {c.name}
            </Link>
          ))}
        </aside>

        <main className="main">
          <div className="feed-tabs">
            <button className="active">Para você</button>
            <button>Novo</button>
            <button>Em alta</button>
          </div>
          {loading ? <p style={{ color: 'var(--muted)' }}>Carregando...</p> :
            posts.map(p => <PostCard key={p.id} post={p} onDeleted={() => removePost(p.id)} />)}
          {!loading && posts.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
              <h3>Nada por aqui ainda</h3>
              <p style={{ color: 'var(--muted)', margin: '8px 0 16px' }}>Seja a primeira a compartilhar algo inspirador.</p>
              <Link to="/criar" className="btn btn-primary">Criar post</Link>
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