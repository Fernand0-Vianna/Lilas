import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/auth.jsx'
import { compact, timeAgo } from '../lib/format.js'
import Icon from './Icons.jsx'
import ConfirmModal from './ConfirmModal.jsx'

function Poll({ post }) {
  const { session } = useAuth()
  const [counts, setCounts] = useState([])
  const [mine, setMine] = useState(-1)

  useEffect(() => {
    const rows = post.poll_votes || []
    const c = (post.poll_options || []).map((_, i) => rows.filter(r => r.option_idx === i).length)
    setCounts(c)
  }, [post.id])

  useEffect(() => {
    if (!post.poll_options) return
    supabase.from('poll_votes').select('option_idx').eq('post_id', post.id).eq('user_id', session.user.id)
      .maybeSingle().then(({ data }) => setMine(data?.option_idx ?? -1))
  }, [post.id])

  async function vote(i) {
    if (mine === i) return
    const prev = mine
    setMine(i)
    setCounts(c => c.map((x, j) => j === i ? x + 1 : j === prev ? x - 1 : x))
    const { error } = await supabase.from('poll_votes')
      .upsert({ post_id: post.id, user_id: session.user.id, option_idx: i })
    if (error) {
      setMine(prev)
      setCounts(c => c.map((x, j) => j === i ? x - 1 : j === prev ? x + 1 : x))
    }
  }

  const total = counts.reduce((s, n) => s + n, 0)
  return (
    <div className="poll">
      {(post.poll_options || []).map((opt, i) => {
        const pct = total ? Math.round((counts[i] / total) * 100) : 0
        return (
          <button key={i} className={`poll-opt ${mine === i ? 'on' : ''}`} onClick={e => { e.preventDefault(); e.stopPropagation(); vote(i) }}>
            <span className="poll-fill" style={{ width: `${pct}%` }} />
            <span className="poll-label">{opt}</span>
            <span className="poll-pct">{total ? `${pct}%` : ''}</span>
          </button>
        )
      })}
      <p className="hint">{compact(total)} voto{total === 1 ? '' : 's'}</p>
    </div>
  )
}

export default function PostCard({ post, onDeleted, canModerate }) {
  const { session, profile } = useAuth()
  const navigate = useNavigate()
  const [vote, setVote] = useState(0)
  const [score, setScore] = useState(0)
  const [comments, setComments] = useState(0)
  const [saved, setSaved] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [reason, setReason] = useState('')
  const [reported, setReported] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [author, setAuthor] = useState(null)

  useEffect(() => {
    setAuthor(post.profiles || null)
    setScore((post.likes || []).reduce((s, l) => s + (l.vote || 0), 0))
    setComments(post.comments?.[0]?.count ?? 0)
    Promise.all([
      supabase.from('likes').select('vote').eq('post_id', post.id).eq('user_id', session.user.id).maybeSingle(),
      supabase.from('saves').select('post_id').eq('post_id', post.id).eq('user_id', session.user.id).maybeSingle()
    ]).then(([me, s]) => {
      setVote(me.data?.vote ?? 0)
      setSaved(!!s.data)
    })
  }, [post.id])

  async function castVote(v) {
    if (vote === v) v = 0
    const prev = vote
    setVote(v)
    const { data } = await supabase.rpc('vote_post', { p_post_id: post.id, p_vote: v })
    if (data != null) setScore(data)
    else setVote(prev)
  }

  async function toggleSave() {
    const prev = saved
    setSaved(!saved)
    const { error } = saved
      ? await supabase.from('saves').delete().eq('post_id', post.id).eq('user_id', session.user.id)
      : await supabase.from('saves').insert({ post_id: post.id, user_id: session.user.id })
    if (error) setSaved(prev)
  }

  async function sendReport() {
    const { error } = await supabase.from('reports').insert({ post_id: post.id, reporter_id: session.user.id, reason: reason.trim() })
    if (!error) {
      setReported(true)
      setReporting(false)
    }
  }

  async function doDeletePost() {
    await supabase.from('posts').delete().eq('id', post.id)
    setConfirmDelete(false)
    if (onDeleted) onDeleted()
    else navigate('/')
  }

  let host = ''
  try { host = post.link_url ? new URL(post.link_url).hostname.replace(/^www\./, '') : '' } catch { /* url inválida */ }
  const canDelete = profile?.is_admin || post.author_id === session.user.id || !!canModerate
  return (
    <article className="card post-card">
      <div className="vote-col">
        <button className={`vote-btn up ${vote === 1 ? 'on' : ''}`} onClick={() => castVote(1)} title="Votar a favor">
          <Icon name="up" size={14} />
        </button>
        <span className={`score ${vote === 1 ? 'up' : vote === -1 ? 'down' : ''}`}>{compact(score)}</span>
        <button className={`vote-btn down ${vote === -1 ? 'on' : ''}`} onClick={() => castVote(-1)} title="Votar contra">
          <Icon name="down" size={14} />
        </button>
      </div>
      <div className="post-main">
        <div className="post-head">
          <Link to={`/u/${author?.apelido}`} className="post-author-link">
            <span className="avatar-xs">{author?.avatar_url ? <img src={author.avatar_url} alt="" /> : (author?.apelido || '?')[0].toUpperCase()}</span>
            <span className="post-author-name">@{author?.apelido}</span>
          </Link>
          <div className="post-meta">
            <div className="comm">
              <Link to={`/c/${post.communities?.slug}`} className="comm-badge">{post.communities?.name}</Link>
              <span className="time"> · {timeAgo(post.created_at)}</span>
            </div>
          </div>
          {canDelete && (
            <button className="post-more" title={canModerate && post.author_id !== session.user.id ? 'Remover (moderação)' : 'Excluir publicação'} onClick={() => setConfirmDelete(true)}>
              <Icon name="more" size={16} />
            </button>
          )}
        </div>
        {host ? (
          <>
            <h3 className="post-title">{post.title}</h3>
            <a href={post.link_url} target="_blank" rel="noreferrer noopener" className="link-card">
              <img src={`https://www.google.com/s2/favicons?domain=${host}&sz=32`} alt="" onError={e => { e.target.style.display = 'none' }} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="link-host">{host}</span>
                <span className="link-url">{post.link_url}</span>
              </span>
              <Icon name="chevron-left" size={12} style={{ transform: 'rotate(180deg)', flexShrink: 0 }} />
            </a>
            {post.body && <p className="post-body">{post.body}</p>}
          </>
        ) : (
          <Link to={`/post/${post.id}`} className="post-link">
            <h3 className="post-title">
              {post.tag && <Link to={`/?q=${encodeURIComponent(post.tag)}`} className="tag-chip" onClick={e => e.stopPropagation()}>{post.tag}</Link>}
              {post.title}
            </h3>
            {post.body && <p className="post-body">{post.body}</p>}
            {post.image_url && <img src={post.image_url} alt="" className="post-img" loading="lazy" />}
            {post.poll_options && <Poll post={post} />}
          </Link>
        )}
        <div className="post-actions">
          <Link to={`/post/${post.id}`} className="action">
            <Icon name="comment" size={14} /> <span>{compact(comments)}</span>
          </Link>
          <button className={`action ${saved ? 'liked' : ''}`} title="Salvar" onClick={toggleSave}>
            <Icon name="bookmark" size={14} filled={saved} />
          </button>
          <span className="report">
            <button className="action" title="Denunciar" onClick={() => setReporting(o => !o)}>
              <Icon name="flag" size={14} />
            </button>
            {reporting && !reported && (
              <div className="report-pop">
                <input
                  placeholder="Motivo da denúncia..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-primary report-btn" onClick={sendReport}>Enviar</button>
                  <button className="btn btn-outline report-btn" onClick={() => setReporting(false)}>✕</button>
                </div>
              </div>
            )}
            {reported && <span className="report-ok">Denúncia enviada.</span>}
          </span>
        </div>
      </div>
      {confirmDelete && (
        <ConfirmModal
          title={canModerate && post.author_id !== session.user.id ? 'Remover publicação?' : 'Excluir publicação?'}
          message={canModerate && post.author_id !== session.user.id
            ? 'Tem certeza que deseja remover esta publicação como moderação?'
            : 'Tem certeza que deseja excluir esta publicação?'}
          confirmLabel={canModerate && post.author_id !== session.user.id ? 'Remover' : 'Excluir'}
          danger
          onConfirm={doDeletePost}
          onClose={() => setConfirmDelete(false)}
        />
      )}
    </article>
  )
}
