import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/auth.jsx'

export default function Communities() {
  const { session } = useAuth()
  const [communities, setCommunities] = useState([])
  const [joined, setJoined] = useState({})

  useEffect(() => {
    Promise.all([
      supabase.from('communities').select('*').order('members', { ascending: false }),
      supabase.from('community_members').select('community_id').eq('user_id', session.user.id)
    ]).then(([c, j]) => {
      setCommunities(c.data || [])
      const map = {}
      ;(j.data || []).forEach(m => { map[m.community_id] = true })
      setJoined(map)
    })
  }, [session.user.id])

  async function toggle(c) {
    if (joined[c.id]) {
      await supabase.from('community_members').delete().eq('community_id', c.id).eq('user_id', session.user.id)
      setJoined({ ...joined, [c.id]: false })
    } else {
      await supabase.from('community_members').insert({ community_id: c.id, user_id: session.user.id })
      setJoined({ ...joined, [c.id]: true })
    }
  }

  function fmt(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + ' mi'
    if (n >= 1000) return (n / 1000).toFixed(0) + ' mil'
    return String(n)
  }

  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <div style={{ paddingTop: 24 }}>
        <div className="create-head"><h2>Comunidades</h2></div>
        <div className="search" style={{ maxWidth: '100%', marginBottom: 16 }}>
          <input placeholder="Buscar comunidades..." />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {communities.map(c => (
            <div key={c.id} className="card comm-card">
              <span className="banner">{c.name.replace('r/', '').slice(0, 1)}</span>
              <div style={{ flex: 1 }}>
                <h4>{c.name}</h4>
                <div className="comm-meta">{fmt(c.members)} membros · {c.category}</div>
                <p>{c.description}</p>
              </div>
              <button className={`btn ${joined[c.id] ? 'btn-outline' : 'btn-primary'}`} onClick={() => toggle(c)}>
                {joined[c.id] ? 'Entrou' : 'Entrar'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}