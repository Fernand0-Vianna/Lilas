import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/auth.jsx'
import { compact, timeAgo } from '../lib/format.js'
import Icon from './Icons.jsx'

export default function PostCard({ post, onDeleted }) {
  const { session, profile } = useAuth()
  const navigate = useNavigate()
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(0)
  const [comments, setComments] = useState(0)
  const [author, setAuthor] = useState(null)

  useEffect(() => {
    setAuthor(post.profiles || null)
    setLikes(post.likes_count || 0)
    Promise.all([
      supabase.from('likes').select('user_id', { count: 'exact', head: true }).eq('post_id', post.id),
      supabase.from('comments').select('id', { count: 'exact', head: true }).eq('post_id', post.id),
      supabase.from('likes').select('user_id').eq('post_id', post.id).eq('user_id', session.user.id).maybeSingle()
    ]).then(([l, c, me]) => {
      if (l.count !== null) setLikes(l.count)
      setComments(c.count || 0)
      setLiked(!!me.data)
    })
  }, [post.id])

  async function toggleLike() {
    if (liked) {
      await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', session.user.id)
      setLikes(l => l - 1)
      setLiked(false)
    } else {
      await supabase.from('likes').insert({ post_id: post.id, user_id: session.user.id })
      setLikes(l => l + 1)
      setLiked(true)
    }
  }

  async function deletePost() {
    const ok = window.confirm('Excluir esta publicação?')
    if (!ok) return
    await supabase.from('posts').delete().eq('id', post.id)
    if (onDeleted) onDeleted()
    else navigate('/')
  }

  const canDelete = profile?.is_admin || post.author_id === session.user.id
  return (
    <article className="card post-card">
      <div className="post-head">
        <span className="avatar">{(author?.apelido || '?')[0].toUpperCase()}</span>
        <div className="post-meta">
          <Link to={`/u/${author?.apelido}`} className="author">u/{author?.apelido}</Link>
          <div className="comm">
            <Link to="/comunidades" className="comm-name">{post.communities?.name}</Link>
            <span className="time"> · {timeAgo(post.created_at)}</span>
          </div>
        </div>
        {canDelete && (
          <button className="post-more" title="Excluir publicação" onClick={deletePost}>
            <Icon name="more" size={18} />
          </button>
        )}
      </div>
      <Link to={`/post/${post.id}`} className="post-link">
        <h3 className="post-title">{post.title}</h3>
        {post.body && <p className="post-body">{post.body}</p>}
        {post.image_url && <img src={post.image_url} alt="" className="post-img" />}
      </Link>
      <div className="post-actions">
        <button className={`action ${liked ? 'liked' : ''}`} onClick={toggleLike}>
          <Icon name="heart" size={15} filled={liked} /> <b className="like-count">{compact(likes)}</b>
        </button>
        <Link to={`/post/${post.id}`} className="action">
          <Icon name="comment" size={15} /> <span>{compact(comments)}</span>
        </Link>
        <button className="action" style={{ marginLeft: 'auto' }}>
          <Icon name="bookmark" size={15} />
        </button>
      </div>
    </article>
  )
}