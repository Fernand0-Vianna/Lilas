import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/auth.jsx'
import PostCard from '../components/PostCard.jsx'
import ConfirmModal from '../components/ConfirmModal.jsx'
import { compact } from '../lib/format.js'
import Icon from '../components/Icons.jsx'
import PostSkeleton from '../components/PostSkeleton.jsx'

function ReportComment({ commentId }) {
  const { session } = useAuth()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [sent, setSent] = useState(false)
  async function send() {
    const { error } = await supabase.from('reports').insert({ comment_id: commentId, reporter_id: session.user.id, reason: reason.trim() })
    if (!error) setSent(true)
  }
  return (
    <span className="report">
      <button className="action" title="Denunciar comentário" onClick={() => setOpen(o => !o)}>
        <Icon name="flag" size={14} />
      </button>
      {open && !sent && (
        <div className="report-pop">
          <input placeholder="Motivo da denúncia..." value={reason} onChange={e => setReason(e.target.value)} autoFocus />
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn btn-primary report-btn" onClick={send}>Enviar</button>
            <button className="btn btn-outline report-btn" onClick={() => setOpen(false)}>✕</button>
          </div>
        </div>
      )}
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
  const [isMod, setIsMod] = useState(false)
  const [userVote, setUserVote] = useState(undefined)
  const [userSaved, setUserSaved] = useState(undefined)
  const [loading, setLoading] = useState(true)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editBody, setEditBody] = useState('')

  useEffect(() => {
    Promise.all([
      supabase
        .from('posts')
        .select('id, title, body, image_url, tag, link_url, created_at, author_id, community_id, poll_options, profiles!posts_author_id_fkey(id, apelido, avatar_url), communities(slug, name), likes(vote), comments(count), poll_votes(option_idx)')
        .eq('id', id)
        .single(),
      supabase.from('comments')
        .select('*, profiles(apelido), comment_votes(vote)')
        .eq('post_id', id)
        .order('created_at')
    ]).then(async ([p, c]) => {
      const data = p.data
      if (data) {
        setPost(data)
        supabase.rpc('is_mod_of', { p_community: data.community_id }).then(({ data: mod }) => setIsMod(!!mod))

        if (session?.user?.id) {
          const [likesRes, savesRes] = await Promise.all([
            supabase.from('likes').select('vote').eq('post_id', data.id).eq('user_id', session.user.id).maybeSingle(),
            supabase.from('saves').select('post_id').eq('post_id', data.id).eq('user_id', session.user.id).maybeSingle()
          ])
          setUserVote(likesRes.data?.vote ?? 0)
          setUserSaved(!!savesRes.data)
        }
      }
      const list = c.data || []
      if (session && list.length) {
        const my = await supabase.from('comment_votes').select('comment_id, vote').in('comment_id', list.map(x => x.id)).eq('user_id', session.user.id)
        const map = Object.fromEntries((my.data || []).map(m => [m.comment_id, m.vote]))
        list.forEach(x => { x.vote = map[x.id] || 0 })
      }
      setComments(list)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [id, session?.user?.id])

  // Real-time: sincroniza comentários em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('post-comments')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `post_id=eq.${id}` }, (payload) => {
        supabase.from('comments')
          .select('*, profiles!comments_author_id_fkey(apelido, avatar_url), comment_votes(vote)')
          .eq('id', payload.new.id)
          .single()
          .then(({ data }) => {
            if (data) {
              setComments(prev => {
                if (prev.some(c => c.id === data.id)) return prev
                return [...prev, data]
              })
            }
          })
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'comments', filter: `post_id=eq.${id}` }, (payload) => {
        setComments(prev => prev.filter(c => c.id !== payload.old.id))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id])

  // Real-time: sincroniza votos da enquete
  useEffect(() => {
    const channel = supabase
      .channel('post-poll-votes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'poll_votes', filter: `post_id=eq.${id}` }, (payload) => {
        setPost(prev => {
          if (!prev || !prev.poll_options) return prev
          let newVotes = [...(prev.poll_votes || [])]

          if (payload.eventType === 'INSERT') {
            newVotes.push(payload.new)
          } else if (payload.eventType === 'UPDATE') {
            newVotes = newVotes.map(v => v.user_id === payload.new.user_id ? payload.new : v)
          } else if (payload.eventType === 'DELETE') {
            newVotes = newVotes.filter(v => v.user_id !== payload.old?.user_id)
          }

          return { ...prev, poll_votes: newVotes }
        })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
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

  async function doDeleteComment() {
    const commentId = confirmDeleteId
    await supabase.from('comments').delete().eq('id', commentId)
    const ids = new Set([commentId, ...descendants(commentId).map(c => c.id)])
    setComments(cs => cs.filter(x => !ids.has(x.id)))
    setConfirmDeleteId(null)
  }

  async function saveEdit() {
    if (!editBody.trim()) return
    const { error } = await supabase.from('comments').update({ body: editBody.trim() }).eq('id', editingId)
    if (error) return
    setComments(cs => cs.map(x => x.id === editingId ? { ...x, body: editBody.trim() } : x))
    setEditingId(null)
    setEditBody('')
  }

  if (loading) return <PostSkeleton />
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
        <PostCard post={post} canModerate={isMod} onRemove={() => navigate('/')} userVote={userVote} userSaved={userSaved} />
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>Comentários</h3>
          {replyForm(addComment, body, setBody)}
          {rows.map(({ c, depth }) => (
            <div key={c.id} className="comment-row">
              {depth > 0 && (
                <div className="comment-thread">
                  <div className="comment-line" />
                </div>
              )}
              <CommentVote comment={c} />
              <div className="comment">
                <span className="avatar">{(c.profiles?.apelido || '?')[0].toUpperCase()}</span>
                <div style={{ flex: 1 }}>
                  <div className="c-meta">u/{c.profiles?.apelido}</div>
                  {editingId === c.id ? (
                    <div className="compose-row" style={{ marginTop: 4 }}>
                      <textarea
                        className="field"
                        rows={2}
                        style={{ padding: '11px 14px', border: '1.5px solid var(--border)', borderRadius: 10, outline: 'none', width: '100%' }}
                        value={editBody}
                        onChange={e => setEditBody(e.target.value)}
                        autoFocus
                      />
                      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                        <button className="btn btn-primary btn-sm" onClick={saveEdit}>Salvar</button>
                        <button className="btn btn-outline btn-sm" onClick={() => setEditingId(null)}>Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <div className="c-body">{c.body}</div>
                  )}
                  {editingId !== c.id && (
                    <button
                      className="action"
                      style={{ fontSize: 11 }}
                      onClick={() => { setReplyTo(replyTo === c.id ? null : c.id); setReplyBody('') }}
                    >
                      <Icon name="comment" size={11} /> Responder
                    </button>
                  )}
                  {replyTo === c.id && replyForm(sendReply, replyBody, setReplyBody, () => setReplyTo(null))}
                </div>
                <ReportComment commentId={c.id} />
                {c.author_id === session.user.id && editingId !== c.id && (
                  <button className="action" title="Editar comentário" onClick={() => { setEditingId(c.id); setEditBody(c.body) }}>✏️</button>
                )}
                {(isMod || profile?.is_admin || c.author_id === session.user.id) && editingId !== c.id && (
                  <button className="action" style={{ color: 'var(--danger, #c0392b)' }} onClick={() => setConfirmDeleteId(c.id)}>🗑</button>
                )}
              </div>
            </div>
          ))}
          {!loading && rows.length === 0 && (
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>Nenhum comentário ainda.</p>
          )}
        </div>
      </div>
      {confirmDeleteId && (
        <ConfirmModal
          title="Excluir comentário?"
          message="Respostas deste comentário também serão excluídas."
          confirmLabel="Excluir"
          danger
          onConfirm={doDeleteComment}
          onClose={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  )
}
