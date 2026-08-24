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
  const [replyTo, setReplyTo] = useState(null)
  const [replyBody, setReplyBody] = useState('')
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

  function descendants(parentId) {
    const out = []
    const walk = pid => comments.filter(c => c.parent_id === pid).forEach(c => { out.push(c); walk(c.id) })
    walk(parentId)
    return out
  }

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

  async function sendReply() {
    if (!replyBody.trim()) return
    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: id, author_id: session.user.id, body: replyBody.trim(), parent_id: replyTo })
      .select('*, profiles(apelido)')
      .single()
    if (error) return
    setComments(c => [...c, data])
    setReplyBody('')
    setReplyTo(null)
  }

  async function deleteComment(commentId) {
    if (!window.confirm('Excluir este comentário? Respostas dele também serão excluídas.')) return
    await supabase.from('comments').delete().eq('id', commentId)
    const ids = new Set([commentId, ...descendants(commentId).map(c => c.id)])
    setComments(cs => cs.filter(x => !ids.has(x.id)))
  }

  if (loading) return <div className="container" style={{ paddingTop: 24 }}>Carregando...</div>
  if (!post) return <div className="container" style={{ paddingTop: 24 }}>Post não encontrado.</div>

  // lista plana -> linhas em ordem de thread (DFS), profundidade limitada no recuo
  const byParent = {}
  comments.forEach(c => { (byParent[c.parent_id || 'root'] ||= []).push(c) })
  const rows = []
  const walk = (pid, depth) => (byParent[pid] || []).forEach(c => { rows.push({ c, depth }); walk(c.id, depth + 1) })
  walk('root', 0)

  const replyForm = (onSend, value, setValue, onClose) => (
    <div className="compose-row" style={{ marginTop: 8 }}>
      <textarea
        className="field"
        rows={2}
        style={{ padding: '11px 14px', border: '1.5px solid var(--border)', borderRadius: 10, outline: 'none' }}
        placeholder="Compartilhe apoio..."
        value={value}
        onChange={e => setValue(e.target.value)}
        autoFocus
      />
      <button className="btn btn-primary" onClick={onSend}>Responder</button>
      {onClose && <button className="btn btn-outline" onClick={onClose}>Cancelar</button>}
    </div>
  )

  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <div style={{ paddingTop: 24 }}>
        <PostCard post={post} onDeleted={() => navigate('/')} />
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>Comentários</h3>
          {replyForm(addComment, body, setBody)}
          {rows.map(({ c, depth }) => (
            <div key={c.id} className="comment-row" style={depth ? { marginLeft: Math.min(depth, 6) * 16 } : undefined}>
              <CommentVote comment={c} />
              <div className="comment">
                <span className="avatar">{(c.profiles?.apelido || '?')[0].toUpperCase()}</span>
                <div style={{ flex: 1 }}>
                  <div className="c-meta">u/{c.profiles?.apelido}</div>
                  <div className="c-body">{c.body}</div>
                  <button
                    className="action"
                    style={{ fontSize: 12 }}
                    onClick={() => { setReplyTo(replyTo === c.id ? null : c.id); setReplyBody('') }}
                  >
                    <Icon name="comment" size={12} /> Responder
                  </button>
                  {replyTo === c.id && replyForm(sendReply, replyBody, setReplyBody, () => setReplyTo(null))}
                </div>
                <ReportComment commentId={c.id} />
                {(profile?.is_admin || c.author_id === session.user.id) && (
                  <button className="action" style={{ color: 'var(--danger, #c0392b)' }} onClick={() => deleteComment(c.id)}>🗑</button>
                )}
              </div>
            </div>
          ))}
          {!loading && rows.length === 0 && (
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>Nenhum comentário ainda.</p>
          )}
        </div>
      </div>
    </div>
  )
}
