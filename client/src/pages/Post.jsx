import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/auth.jsx'
import PostCard from '../components/PostCard.jsx'

export default function Post() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session, profile } = useAuth()
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase
        .from('posts')
        .select('*, profiles(apelido), communities(slug, name)')
        .eq('id', id)
        .single(),
      supabase.from('comments').select('*, profiles(apelido)').eq('post_id', id).order('created_at')
    ]).then(([p, c]) => {
      const data = p.data
      if (data) {
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

  async function deleteComment(commentId) {
    if (!window.confirm('Excluir este comentário?')) return
    await supabase.from('comments').delete().eq('id', commentId)
    setComments(c => c.filter(x => x.id !== commentId))
  }

  if (loading) return <div className="container" style={{ paddingTop: 24 }}>Carregando...</div>
  if (!post) return <div className="container" style={{ paddingTop: 24 }}>Post não encontrado.</div>

  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <div style={{ paddingTop: 24 }}>
        <PostCard post={post} onDeleted={() => navigate('/')} />
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>Comentários</h3>
          <div className="compose-row">
            <textarea
              className="field"
              rows={2}
              style={{ padding: '11px 14px', border: '1.5px solid var(--border)', borderRadius: 10, outline: 'none' }}
              placeholder="Compartilhe apoio..."
              value={body}
              onChange={e => setBody(e.target.value)}
            />
            <button className="btn btn-primary" onClick={addComment}>Comentar</button>
          </div>
          {comments.map(c => (
            <div key={c.id} className="comment">
              <span className="avatar">{(c.profiles?.apelido || '?')[0].toUpperCase()}</span>
              <div style={{ flex: 1 }}>
                <div className="c-meta">u/{c.profiles?.apelido}</div>
                <div className="c-body">{c.body}</div>
              </div>
              {(profile?.is_admin || c.author_id === session.user.id) && (
                <button className="action" style={{ color: 'var(--danger, #c0392b)' }} onClick={() => deleteComment(c.id)}>🗑</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}