import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/auth.jsx'
import PostCard from '../components/PostCard.jsx'
import { compact } from '../lib/format.js'
import Icon from '../components/Icons.jsx'

function ReportComment({ commentId }) {
  const { session } = useAuth()
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)
  async function send() {
    await supabase.from('reports').insert({ comment_id: commentId, reporter_id: session.user.id })
    setSent(true)
  }
  return (
    <span className="report">
      <button className="action" title="Denunciar comentário" onClick={() => setOpen(o => !o)}>
        <Icon name="flag" size={14} />
      </button>
      {open && !sent && <button className="btn report-btn" onClick={send}>Denunciar</button>}
      {open && sent && <span className="report-ok">Denúncia enviada.</span>}
    </span>
  )
}

function CommentVote({ comment }) {
  const { session } = useAuth()
  const [vote, setVote] = useState(comment.vote ?? 0)
  const [score, setScore] = useState(comment.comment_votes?.[0]?.vote ?? 0)

  async function cast(v) {
    if (vote === v) v = 0
    const prev = vote
    setVote(v)
    const { data } = await supabase.rpc('vote_comment', { p_comment_id: comment.id, p_vote: v })
    if (data != null) setScore(data)
    else setVote(prev)
  }

  return (
    <div className="vote-col comment-votes">
      <button className={`vote-btn up ${vote === 1 ? 'on' : ''}`} onClick={() => cast(1)} title="Votar a favor">
        <Icon name="up" size={13} />
      </button>
      <span className={`score ${vote === 1 ? 'up' : vote === -1 ? 'down' : ''}`}>{compact(score)}</span>
      <button className={`vote-btn down ${vote === -1 ? 'on' : ''}`} onClick={() => cast(-1)} title="Votar contra">
        <Icon name="down" size={13} />
      </button>
    </div>
  )
}

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
        .select('*, profiles(apelido), communities(slug, name), likes(vote), comments(count)')
        .eq('id', id)
        .single(),
      supabase.from('comments')
        .select('*, profiles(apelido), comment_votes(vote)')
        .eq('post_id', id)
        .order('created_at')
    ]).then(async ([p, c]) => {
      const data = p.data
      if (data) setPost(data)
      const list = c.data || []
      if (session && list.length) {
        const my = await supabase.from('comment_votes').select('comment_id, vote').in('comment_id', list.map(x => x.id)).eq('user_id', session.user.id)
        const map = Object.fromEntries((my.data || []).map(m => [m.comment_id, m.vote]))
        list.forEach(x => { x.vote = map[x.id] || 0 })
      }
      setComments(list)
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
            <div key={c.id} className="comment-row">
              <CommentVote comment={c} />
              <div className="comment">
                <span className="avatar">{(c.profiles?.apelido || '?')[0].toUpperCase()}</span>
                <div style={{ flex: 1 }}>
                  <div className="c-meta">u/{c.profiles?.apelido}</div>
                  <div className="c-body">{c.body}</div>
                </div>
                <ReportComment commentId={c.id} />
                {(profile?.is_admin || c.author_id === session.user.id) && (
                  <button className="action" style={{ color: 'var(--danger, #c0392b)' }} onClick={() => deleteComment(c.id)}>🗑</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}