import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/auth.jsx'
import PostCard from '../components/PostCard.jsx'
import { compact } from '../lib/format.js'

export default function Community() {
  const { slug } = useParams()
  const { session } = useAuth()
  const [community, setCommunity] = useState(null)
  const [posts, setPosts] = useState([])
  const [joined, setJoined] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    setLoading(true)
    setNotFound(false)
    supabase.from('communities').select('*').eq('slug', slug).maybeSingle().then(async ({ data }) => {
      if (!data) { setNotFound(true); setLoading(false); return }
      setCommunity(data)
      const [postsR, member] = await Promise.all([
        supabase.from('posts').select('*, profiles(apelido, avatar_url), communities(slug, name), likes(vote), comments(count)')
          .eq('community_id', data.id).order('created_at', { ascending: false }),
        supabase.from('community_members').select('community_id').eq('community_id', data.id).eq('user_id', session.user.id).maybeSingle()
      ])
      setPosts(postsR.data || [])
      setJoined(!!member.data)
      setLoading(false)
    })
  }, [slug, session.user.id])

  async function toggle() {
    if (joined) {
      await supabase.from('community_members').delete().eq('community_id', community.id).eq('user_id', session.user.id)
      setJoined(false)
      setCommunity(c => ({ ...c, members: Math.max(c.members - 1, 0) }))
    } else {
      await supabase.from('community_members').insert({ community_id: community.id, user_id: session.user.id })
      setJoined(true)
      setCommunity(c => ({ ...c, members: c.members + 1 }))
    }
  }

  if (loading) return <div className="container" style={{ paddingTop: 24 }}>Carregando...</div>
  if (notFound) return <div className="container" style={{ paddingTop: 24 }}>Comunidade não encontrada.</div>

  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <div style={{ paddingTop: 24 }}>
        <div className="card comm-hero">
          <span className="banner">{community.name.replace('r/', '').slice(0, 1)}</span>
          <div style={{ flex: 1 }}>
            <h2>{community.name}</h2>
            <div className="comm-meta">{compact(community.members)} membros · {community.category}</div>
            {community.description && <p style={{ marginTop: 8, color: 'var(--muted)', fontSize: 14 }}>{community.description}</p>}
          </div>
          <button className={`btn ${joined ? 'btn-outline' : 'btn-primary'}`} onClick={toggle}>
            {joined ? 'Sair' : 'Entrar'}
          </button>
        </div>
        {posts.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ color: 'var(--muted)' }}>Nenhuma publicação nesta comunidade ainda.</p>
            <Link to="/criar" className="btn btn-primary" style={{ marginTop: 12 }}>Criar post</Link>
          </div>
        )}
        {posts.map(p => <PostCard key={p.id} post={p} onDeleted={() => setPosts(ps => ps.filter(x => x.id !== p.id))} />)}
      </div>
    </div>
  )
}