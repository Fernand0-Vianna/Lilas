import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/auth.jsx'
import PostCard from '../components/PostCard.jsx'

export default function Profile() {
  const { apelido } = useParams()
  const { session } = useAuth()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [following, setFollowing] = useState(false)
  const [followers, setFollowers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const target = apelido || session.user.id

  useEffect(() => {
    setLoading(true)
    setNotFound(false)
    const q = apelido
      ? supabase.from('profiles').select('*').eq('apelido', apelido).maybeSingle()
      : supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()

    q.then(async ({ data }) => {
      if (!data) { setNotFound(true); setLoading(false); return }
      setProfile(data)
      const [postsR, followR, countR] = await Promise.all([
        supabase.from('posts').select('*, profiles(apelido), communities(name, slug)').eq('author_id', data.id).order('created_at', { ascending: false }),
        supabase.from('follows').select('id').eq('follower_id', session.user.id).eq('following_id', data.id).maybeSingle(),
        supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', data.id)
      ])
      setPosts(postsR.data || [])
      setFollowing(!!followR.data)
      setFollowers(countR.count || 0)
      setLoading(false)
    })
  }, [apelido, session.user.id])

  async function toggleFollow() {
    if (following) {
      await supabase.from('follows').delete().eq('follower_id', session.user.id).eq('following_id', profile.id)
      setFollowers(f => f - 1)
      setFollowing(false)
    } else {
      await supabase.from('follows').insert({ follower_id: session.user.id, following_id: profile.id })
      setFollowers(f => f + 1)
      setFollowing(true)
    }
  }

  if (loading) return <div className="container" style={{ paddingTop: 24 }}>Carregando...</div>
  if (notFound) return <div className="container" style={{ paddingTop: 24 }}>Usuário não encontrado.</div>

  const isMe = profile.id === session.user.id

  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <div style={{ paddingTop: 24 }}>
        <div className="card profile-head">
          <span className="avatar">{(profile.apelido || '?')[0].toUpperCase()}</span>
          <div style={{ flex: 1 }}>
            <h2>{profile.apelido}</h2>
            <div className="handle">@{profile.apelido}</div>
            {profile.bio && <div className="bio">{profile.bio}</div>}
            <div className="stats">
              <div><b>{posts.length}</b><span>Posts</span></div>
              <div><b>{followers}</b><span>Seguidores</span></div>
            </div>
          </div>
          {!isMe && (
            <button className={`btn ${following ? 'btn-outline' : 'btn-primary'}`} onClick={toggleFollow}>
              {following ? 'Seguindo' : 'Seguir'}
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
          {posts.map(p => <PostCard key={p.id} post={p} onDeleted={() => setPosts(ps => ps.filter(x => x.id !== p.id))} />)}
          {posts.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
              <p style={{ color: 'var(--muted)' }}>Nenhuma publicação ainda.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}