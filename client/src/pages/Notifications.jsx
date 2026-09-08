import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/auth.jsx'

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return 'agora'
  if (s < 3600) return `${Math.floor(s / 60)}min`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

function describe(n) {
  const who = n.from?.apelido ? `@${n.from.apelido}` : 'Alguém'
  switch (n.type) {
    case 'comment': return `${who} comentou no seu post`
    case 'follow': return `${who} começou a te seguir`
    case 'mention': return `${who} te mencionou`
    default: return 'Nova atividade'
  }
}

function target(n) {
  if (n.type === 'comment' && n.post_id) return `/post/${n.post_id}`
  if (n.type === 'follow' && n.from?.apelido) return `/u/${n.from.apelido}`
  if (n.type === 'mention' && n.post_id) return `/post/${n.post_id}`
  return null
}

export default function Notifications() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user) return
    supabase.from('notifications')
      .select('*, from:from_user_id(apelido, avatar_url), post:post_id(title)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(async ({ data }) => {
        setList(data || [])
        setLoading(false)
      })
  }, [session?.user?.id])

  async function markAllRead() {
    await supabase.rpc('mark_notifications_read')
    setList(ns => ns.map(n => ({ ...n, read: true })))
  }

  if (loading) return <div className="container" style={{ paddingTop: 24 }}>Carregando...</div>

  return (
    <div className="container" style={{ maxWidth: 600 }}>
      <div style={{ paddingTop: 24 }}>
        <div className="create-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Alertas</h2>
          {list.some(n => !n.read) && (
            <button className="btn btn-outline" onClick={markAllRead} style={{ fontSize: 12 }}>Marcar como lidas</button>
          )}
        </div>

        {list.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ color: 'var(--muted)' }}>Nenhum alerta ainda.</p>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 8 }}>Quando alguém comentar nos seus posts ou começar a te seguir, você recebe um alerta aqui.</p>
          </div>
        ) : (
          list.map(n => {
            const t = target(n)
            const Wrapper = t ? Link : 'div'
            const wrapperProps = t ? { to: t, style: { textDecoration: 'none', color: 'inherit' } } : {}
            return (
              <Wrapper key={n.id} {...wrapperProps}>
                <div className={`card`} style={{
                  marginBottom: 8, padding: '12px 16px',
                  display: 'flex', gap: 12, alignItems: 'center',
                  borderColor: n.read ? 'var(--border)' : 'var(--primary)',
                  background: n.read ? 'var(--card)' : 'var(--primary-soft, rgba(107,79,165,0.06))',
                  cursor: t ? 'pointer' : 'default',
                }}>
                  <span className="avatar" style={{ width: 36, height: 36, fontSize: 14, flexShrink: 0 }}>
                    {n.from?.avatar_url ? <img src={n.from.avatar_url} alt="" /> : (n.from?.apelido || '?')[0].toUpperCase()}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{describe(n)}</div>
                    {n.post?.title && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.post.title}</div>}
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{timeAgo(n.created_at)}</div>
                  </div>
                  {!n.read && <span style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--primary)', flexShrink: 0 }} />}
                </div>
              </Wrapper>
            )
          })
        )}
      </div>
    </div>
  )
}
