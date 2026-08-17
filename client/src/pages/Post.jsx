import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/auth.jsx'
import PostCard from '../components/PostCard.jsx'

export default function Post() {
  const { id } = useParams()
  const { session } = useAuth()
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase
        .from('posts')
        .select('*, profiles(apelido), communities(slug, name), likes_count(*)')
        .eq('id', id)
        .single(),
      supabase.from('comments').select('*, profiles(apelido)').eq('post_id', id).order('created_at')
    ]).then(([p, c]) => {
      const data = p.data
      if (data) {
        data.likes_count = data.likes_count?.length || 0
        setPost(data)
      }
      setComments(c.data || [])
      setLoading(false)
    })
  }, [id])

  async function addComment() {
    if (!body.trim()) return
    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: id, author_id: session.user.id, body: body.trim() })
      .select('*, profiles(apelido)')
      .single()
    if (error) return
    setComments(c => [...c, data])
    setBody('')
  }

  if (loading) return <div className="container" style={{ paddingTop: 24 }}>Carregando...</div>
  if (!post) return <div className="container" style={{ paddingTop: 24 }}>Post não encontrado.</div>

  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <div style={{ paddingTop: 24 }}>
        <PostCard post={post} />
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>Comentários</h3>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <textarea
              className="field"
              rows={2}
              style={{ flex: 1, padding: '11px 14px', border: '1.5px solid var(--border)', borderRadius: 10, outline: 'none' }}
              placeholder="Compartilhe apoio..."
              value={body}
              onChange={e => setBody(e.target.value)}
            />
            <button className="btn btn-primary" onClick={addComment}>Comentar</button>
          </div>
          {comments.map(c => (
            <div key={c.id} className="comment">
              <span className="avatar">{(c.profiles?.apelido || '?')[0].toUpperCase()}</span>
              <div>
                <div className="c-meta">u/{c.profiles?.apelido}</div>
                <div className="c-body">{c.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}