import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/auth.jsx'
import { compact } from '../lib/format.js'
import CommunitiesSkeleton from '../components/CommunitiesSkeleton.jsx'

export default function Communities() {
  const { session } = useAuth()
  const [communities, setCommunities] = useState([])
  const [joined, setJoined] = useState({})
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    Promise.all([
      supabase.from('communities').select('*').order('members', { ascending: false }),
      supabase.from('community_members').select('community_id').eq('user_id', session.user.id)
    ]).then(([c, j]) => {
      setCommunities(c.data || [])
      const map = {}
      ;(j.data || []).forEach(m => { map[m.community_id] = true })
      setJoined(map)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [session.user.id])

  async function toggle(c) {
    if (joined[c.id]) {
      const { error } = await supabase.from('community_members').delete().eq('community_id', c.id).eq('user_id', session.user.id)
      if (!error) setJoined({ ...joined, [c.id]: false })
    } else {
      const { error } = await supabase.from('community_members').insert({ community_id: c.id, user_id: session.user.id })
      if (!error) setJoined({ ...joined, [c.id]: true })
    }
  }

  const q = query.trim().toLowerCase()
  const list = q
    ? communities.filter(c => c.name.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q))
    : communities

  if (loading) return <CommunitiesSkeleton />

  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <div style={{ paddingTop: 24 }}>
        <div className="create-head"><h2>Comunidades</h2><Link to="/criar-comunidade" className="btn btn-primary">Criar comunidade</Link></div>
        <div className="search" style={{ maxWidth: '100%', marginBottom: 16 }}>
          <input placeholder="Buscar comunidades..." value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {list.map(c => (
            <div key={c.id} className="card comm-card">
              <span className={`banner${c.banner_url ? ' banner--img' : ''}`} style={c.banner_url ? { backgroundImage: `url(${c.banner_url})` } : undefined}>{c.name.replace('r/', '').slice(0, 1)}</span>
              <div style={{ flex: 1 }}>
                <Link to={`/c/${c.slug}`}><h4>{c.name}</h4></Link>
                <div className="comm-meta">{compact(c.members)} membros · {c.category}</div>
                <p>{c.description}</p>
              </div>
              <button className={`btn ${joined[c.id] ? 'btn-outline' : 'btn-primary'}`} onClick={() => toggle(c)}>
                {joined[c.id] ? 'Entrou' : 'Entrar'}
              </button>
            </div>
          ))}
          {list.length === 0 && <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 24 }}>Nenhuma comunidade encontrada.</p>}
        </div>
      </div>
    </div>
  )
}