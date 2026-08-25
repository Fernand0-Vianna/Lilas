import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/auth.jsx'
import { compact, timeAgo } from '../lib/format.js'
import PostCard from '../components/PostCard.jsx'
import BottomNav from '../components/BottomNav.jsx'
import Icon from '../components/Icons.jsx'
import logo from '../assets/lilas-logo.svg'

function FollowersModal({ userId, type, onClose }) {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const { session, profile } = useAuth()
  const [followingMap, setFollowingMap] = useState({})

  useEffect(() => {
    setLoading(true)
    const fetchList = async () => {
      const isFollowers = type === 'followers'
      const q = isFollowers
        ? supabase.from('follows').select('follower_id, profiles:follower_id(id, apelido, avatar_url)').eq('following_id', userId)
        : supabase.from('follows').select('following_id, profiles:following_id(id, apelido, avatar_url)').eq('follower_id', userId)
      const { data } = await q
      const items = (data || []).map(r => isFollowers ? r.profiles : r.profiles).filter(Boolean)
      setList(items)
      if (session?.user) {
        const ids = items.map(i => i.id).filter(id => id !== session.user.id)
        if (ids.length) {
          const { data: f } = await supabase.from('follows').select('following_id').eq('follower_id', session.user.id).in('following_id', ids)
          const map = {}
          ;(f || []).forEach(r => { map[r.following_id] = true })
          setFollowingMap(map)
        }
      }
      setLoading(false)
    }
    fetchList()
  }, [userId, type, session?.user?.id])

  async function toggleFollow(targetId) {
    if (followingMap[targetId]) {
      await supabase.from('follows').delete().eq('follower_id', session.user.id).eq('following_id', targetId)
      setFollowingMap(m => { const n = { ...m }; delete n[targetId]; return n })
    } else {
      await supabase.from('follows').insert({ follower_id: session.user.id, following_id: targetId })
      setFollowingMap(m => ({ ...m, [targetId]: true }))
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{type === 'followers' ? 'Seguidores' : 'Seguindo'}</h3>
          <button className="modal-close" onClick={onClose}><Icon name="x-close" size={20} /></button>
        </div>
        <div className="modal-body">
          {loading ? <p className="modal-empty">Carregando...</p> : list.length === 0 ? (
            <p className="modal-empty">{type === 'followers' ? 'Nenhum seguidor ainda.' : 'Não segue ninguém ainda.'}</p>
          ) : list.map(u => (
            <div key={u.id} className="modal-user-row">
              <Link to={`/u/${u.apelido}`} className="modal-user-link" onClick={onClose}>
                <span className="avatar-sm">{u.avatar_url ? <img src={u.avatar_url} alt="" /> : (u.apelido || '?')[0].toUpperCase()}</span>
                <span className="modal-user-name">{u.apelido}</span>
              </Link>
              {u.id !== session?.user?.id && (
                <button className={`btn btn-sm ${followingMap[u.id] ? 'btn-outline' : 'btn-primary'}`} onClick={() => toggleFollow(u.id)}>
                  {followingMap[u.id] ? 'Seguindo' : 'Seguir'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ActivityFeed({ userId }) {
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const fetchActivity = async () => {
      const { data: posts } = await supabase.from('posts').select('id').eq('author_id', userId)
      const postIds = (posts || []).map(p => p.id)
      if (!postIds.length) { setActivity([]); setLoading(false); return }

      const [likesR, commentsR] = await Promise.all([
        supabase.from('likes').select('vote, post_id, user_id, created_at:post_id').in('post_id', postIds).order('post_id', { ascending: false }).limit(20),
        supabase.from('comments').select('body, post_id, user_id, created_at, profiles:user_id(apelido, avatar_url)').in('post_id', postIds).order('created_at', { ascending: false }).limit(20)
      ])

      const items = []
      ;(commentsR.data || []).forEach(c => {
        items.push({ type: 'comment', postId: c.post_id, user: c.profiles, body: c.body, created_at: c.created_at })
      })
      items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setActivity(items.slice(0, 15))
      setLoading(false)
    }
    fetchActivity()
  }, [userId])

  if (loading) return <p className="profile-empty">Carregando atividade...</p>
  if (!activity.length) return <p className="profile-empty">Nenhuma atividade recente.</p>

  return (
    <div className="activity-list">
      {activity.map((item, i) => (
        <div key={i} className="activity-item">
          <span className="avatar-xs">{item.user?.apelido?.[0]?.toUpperCase() || '?'}</span>
          <div className="activity-body">
            <p><b>{item.user?.apelido}</b> comentou em <Link to={`/post/${item.postId}`}>um post</Link></p>
            <p className="activity-preview">{item.body?.slice(0, 120)}{item.body?.length > 120 ? '...' : ''}</p>
            <span className="activity-time">{timeAgo(item.created_at)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function EditModal({ profile, onClose, onSave, onAvatarUpload }) {
  const [apelido, setApelido] = useState(profile.apelido || '')
  const [bio, setBio] = useState(profile.bio || '')
  const [pw1, setPw1] = useState('')
  const [pw2, setPw2] = useState('')
  const [msg, setMsg] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [tab, setTab] = useState('profile')
  const fileRef = useRef()

  async function handleSave() {
    setMsg('')
    if (!apelido.trim()) { setMsg('Escolha um apelido.'); return }
    const { error } = await supabase.from('profiles').update({
      apelido: apelido.trim().replace(/^@/, ''),
      bio: bio.trim()
    }).eq('id', profile.id)
    if (error) { setMsg(error.message); return }
    onSave(apelido.trim().replace(/^@/, ''), bio.trim())
    setMsg('Perfil atualizado.')
  }

  async function handleChangePw() {
    setPwMsg('')
    if (!pw1 || pw1.length < 6) { setPwMsg('A senha deve ter ao menos 6 caracteres.'); return }
    if (pw1 !== pw2) { setPwMsg('As senhas não conferem.'); return }
    const { error } = await supabase.auth.updateUser({ password: pw1 })
    if (error) { setPwMsg(error.message); return }
    setPwMsg('Senha atualizada.')
    setPw1(''); setPw2('')
  }

  function handleAvatarClick() { fileRef.current?.click() }

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setMsg('Imagem muito grande (máx 2MB).'); return }
    await onAvatarUpload(file)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet modal-edit" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Editar perfil</h3>
          <button className="modal-close" onClick={onClose}><Icon name="x-close" size={20} /></button>
        </div>
        <div className="modal-tabs">
          <button className={tab === 'profile' ? 'active' : ''} onClick={() => setTab('profile')}>Perfil</button>
          <button className={tab === 'security' ? 'active' : ''} onClick={() => setTab('security')}>Segurança</button>
        </div>
        <div className="modal-body">
          {tab === 'profile' ? (
            <>
              <div className="edit-avatar-section">
                <div className="edit-avatar-wrap" onClick={handleAvatarClick}>
                  {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="edit-avatar-img" /> : <span className="edit-avatar-letter">{(profile.apelido || '?')[0].toUpperCase()}</span>}
                  <div className="edit-avatar-overlay"><Icon name="camera" size={20} /></div>
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                <button className="btn btn-ghost btn-sm" onClick={handleAvatarClick}>Trocar foto</button>
              </div>
              <div className="field">
                <label>Apelido</label>
                <input value={apelido} onChange={e => setApelido(e.target.value)} placeholder="nome_fantasia" />
              </div>
              <div className="field">
                <label>Bio</label>
                <textarea rows={3} value={bio} onChange={e => setBio(e.target.value)} placeholder="Conte um pouco sobre você..." />
              </div>
              {msg && <p className={msg.includes('atualizado') ? 'ok' : 'error'}>{msg}</p>}
              <button className="btn btn-primary btn-block" onClick={handleSave}>Salvar perfil</button>
            </>
          ) : (
            <>
              <h4 className="edit-section-title">Alterar senha</h4>
              <div className="field">
                <label>Nova senha</label>
                <input type="password" placeholder="Mínimo 6 caracteres" value={pw1} onChange={e => setPw1(e.target.value)} />
              </div>
              <div className="field">
                <label>Repetir senha</label>
                <input type="password" placeholder="Confirme a senha" value={pw2} onChange={e => setPw2(e.target.value)} />
              </div>
              {pwMsg && <p className={pwMsg.includes('atualizada') ? 'ok' : 'error'}>{pwMsg}</p>}
              <button className="btn btn-primary btn-block" onClick={handleChangePw}>Salvar senha</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Profile() {
  const { apelido } = useParams()
  const { session, signOut, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [savedPosts, setSavedPosts] = useState([])
  const [following, setFollowing] = useState(false)
  const [stats, setStats] = useState({ posts: 0, likes: 0, comments: 0, followers: 0, following: 0 })
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [tab, setTab] = useState('posts')
  const [editOpen, setEditOpen] = useState(false)
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState('')
  const avatarInputRef = useRef()

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }, [])

  useEffect(() => {
    setLoading(true)
    setNotFound(false)
    setTab('posts')
    const q = apelido
      ? supabase.from('profiles').select('*').eq('apelido', apelido).maybeSingle()
      : supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()

    q.then(async ({ data }) => {
      if (!data) { setNotFound(true); setLoading(false); return }
      setProfile(data)
      if (params.get('editar') === '1') setEditOpen(true)
      const [postsR, followR, followersR, followingR] = await Promise.all([
        supabase.from('posts').select('*, profiles!posts_author_id_fkey(apelido, avatar_url), communities(name, slug), likes(vote), comments(count), poll_votes(option_idx)').eq('author_id', data.id).order('created_at', { ascending: false }),
        supabase.from('follows').select('id').eq('follower_id', session.user.id).eq('following_id', data.id).maybeSingle(),
        supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', data.id),
        supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', data.id)
      ])
      const list = postsR.data || []
      setPosts(list)
      setFollowing(!!followR.data)
      const ids = list.map(p => p.id)
      const tally = async (table) => ids.length
        ? supabase.from(table).select('id', { count: 'exact', head: true }).in('post_id', ids).then(r => r.count || 0)
        : 0
      const [karmaR, comments] = await Promise.all([
        supabase.rpc('karma_of', { p_user: data.id }),
        tally('comments')
      ])
      setStats({ posts: list.length, likes: karmaR.data ?? 0, comments, followers: followersR.count || 0, following: followingR.count || 0 })
      setLoading(false)
    })
  }, [apelido, session.user.id])

  async function toggleFollow() {
    if (following) {
      await supabase.from('follows').delete().eq('follower_id', session.user.id).eq('following_id', profile.id)
      setStats(s => ({ ...s, followers: s.followers - 1 }))
      setFollowing(false)
    } else {
      await supabase.from('follows').insert({ follower_id: session.user.id, following_id: profile.id })
      setStats(s => ({ ...s, followers: s.followers + 1 }))
      setFollowing(true)
    }
  }

  function handleShare() {
    const url = `${window.location.origin}/u/${profile.apelido}`
    navigator.clipboard?.writeText(url).then(() => showToast('Link copiado!')).catch(() => showToast(url))
  }

  async function handleAvatarUpload(file) {
    const ext = file.name.split('.').pop()
    const path = `${profile.id}/avatar.${ext}`
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (upErr) { showToast('Erro ao enviar imagem.'); return }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
    const publicUrl = urlData?.publicUrl
    if (!publicUrl) { showToast('Erro ao obter URL da imagem.'); return }
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id)
    setProfile(p => ({ ...p, avatar_url: publicUrl }))
    await refreshProfile()
    showToast('Foto atualizada!')
  }

  async function deleteAccount() {
    if (!window.confirm('Tem certeza? Sua conta, posts, curtidas e seguidores serão excluídos permanentemente.')) return
    if (!window.confirm('Confirme: esta ação não pode ser desfeita.')) return
    await supabase.rpc('delete_account')
    await signOut()
    navigate('/login')
  }

  useEffect(() => {
    if (tab !== 'saves') return
    supabase.from('saves')
      .select('post_id, posts(*, profiles!posts_author_id_fkey(apelido, avatar_url), communities(slug, name), likes(vote), comments(count), poll_votes(option_idx))')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setSavedPosts((data || []).map(s => s.posts).filter(Boolean)))
  }, [tab, session.user.id])

  if (loading) return <div className="container" style={{ paddingTop: 24 }}>Carregando...</div>
  if (notFound) return <div className="container" style={{ paddingTop: 24 }}>Usuário não encontrado.</div>

  const isMe = profile.id === session.user.id
  const initial = (profile.apelido || '?')[0].toUpperCase()
  const memberYear = new Date(profile.created_at).getFullYear()
  const memberMonth = new Date(profile.created_at).toLocaleDateString('pt-BR', { month: 'long' })

  return (
    <div className="profile-page">
      <header className="profile-topbar">
        <div className="profile-topbar-inner">
          <Link to="/" className="profile-logo">
            <img src={logo} alt="Lilás" className="logo-img" />
            Lilás
          </Link>
          <Link to="/" className="profile-back">
            <Icon name="chevron-left" size={15} /> Voltar
          </Link>
          <span className="profile-topbar-title">{isMe ? 'Meu perfil' : `u/${profile.apelido}`}</span>
          {isMe && (
            <button className="profile-gear" onClick={() => setEditOpen(true)}>
              <Icon name="gear" size={22} />
            </button>
          )}
          <Link to="/perfil" className="profile-topbar-user">
            <span className="avatar">{profile.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : initial}</span>
            <span className="avatar-name">{profile.apelido?.split(/[^a-zA-Z0-9]/)[0]}</span>
          </Link>
        </div>
      </header>

      <div className="profile-hero">
        <div className="profile-cover" />
        <div className="container profile-identity-wrap">
          <div className="profile-identity">
            <div className="profile-avatar-wrap">
              <span className="profile-avatar">
                {profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : initial}
              </span>
              {isMe && (
                <button className="avatar-upload-btn" onClick={() => avatarInputRef.current?.click()} title="Trocar foto">
                  <Icon name="camera" size={14} />
                </button>
              )}
              <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f) }} />
            </div>
            <div className="profile-info">
              <h1 className="profile-name">{profile.apelido}</h1>
              <div className="profile-handle">@{profile.apelido}</div>
              {profile.bio && <p className="profile-bio">{profile.bio}</p>}
              <div className="profile-meta">
                <Icon name="location" size={12} />
                <span>Membro desde {memberMonth} {memberYear}</span>
              </div>
            </div>
            <div className="profile-actions">
              {isMe ? (
                <button className="btn btn-outline profile-action-btn" onClick={() => setEditOpen(true)}>
                  <Icon name="pen" size={14} /> Editar perfil
                </button>
              ) : (
                <button className={`btn profile-action-btn ${following ? 'btn-outline' : 'btn-primary'}`} onClick={toggleFollow}>
                  {following ? 'Seguindo' : 'Seguir'}
                </button>
              )}
              <button className="btn btn-ghost profile-action-btn" onClick={handleShare} title="Compartilhar perfil">
                <Icon name="share" size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container profile-body">
        <div className="profile-stats">
          <div><b>{compact(stats.posts)}</b><span>Posts</span></div>
          <div><b>{compact(stats.likes)}</b><span>Karma</span></div>
          <div><b>{compact(stats.comments)}</b><span>Comentários</span></div>
          <button className="stat-btn" onClick={() => setModal('followers')}><b>{compact(stats.followers)}</b><span>Seguidores</span></button>
          <button className="stat-btn" onClick={() => setModal('following')}><b>{compact(stats.following)}</b><span>Seguindo</span></button>
        </div>

        <div className="profile-tabs">
          <button className={tab === 'posts' ? 'active' : ''} onClick={() => setTab('posts')}>Posts</button>
          <button className={tab === 'activity' ? 'active' : ''} onClick={() => setTab('activity')}>Atividade</button>
          {isMe && <button className={tab === 'saves' ? 'active' : ''} onClick={() => setTab('saves')}>Salvos</button>}
        </div>

        {tab === 'posts' ? (
          <div className="profile-grid">
            <div className="profile-posts">
              {posts.map(p => <PostCard key={p.id} post={p} onDeleted={() => setPosts(ps => ps.filter(x => x.id !== p.id))} />)}
              {posts.length === 0 && (
                <div className="card profile-empty-card">
                  <Icon name="pen" size={32} style={{ color: 'var(--muted-2)', marginBottom: 8 }} />
                  <p>Nenhuma publicação ainda.</p>
                  {isMe && <Link to="/criar" className="btn btn-primary" style={{ marginTop: 12 }}>Criar primeiro post</Link>}
                </div>
              )}
            </div>
            <aside className="profile-side">
              <div className="card about-card">
                <h3 className="about-title">Sobre mim</h3>
                {profile.bio && <p className="about-body">{profile.bio}</p>}
                <div className="about-meta">
                  <Icon name="location" size={13} />
                  <span>Membro desde {memberMonth} {memberYear}</span>
                </div>
              </div>
              {isMe && (
                <div className="help-card">
                  <h3 className="help-title">Precisa de ajuda?</h3>
                  <p className="help-body">Ligue 180. 24h e gratuito.</p>
                  <a className="help-btn" href="tel:180">Ligar agora</a>
                </div>
              )}
            </aside>
          </div>
        ) : tab === 'activity' ? (
          <div className="profile-grid">
            <div className="profile-posts">
              <ActivityFeed userId={profile.id} />
            </div>
          </div>
        ) : (
          <div className="profile-grid">
            <div className="profile-posts">
              {savedPosts.map(p => <PostCard key={p.id} post={p} onDeleted={() => setSavedPosts(ps => ps.filter(x => x.id !== p.id))} />)}
              {savedPosts.length === 0 && (
                <div className="card profile-empty-card">
                  <Icon name="bookmark" size={32} style={{ color: 'var(--muted-2)', marginBottom: 8 }} />
                  <p>Nenhum post salvo.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {isMe && (
          <div className="profile-danger-zone">
            <button className="btn btn-ghost btn-sm" onClick={async () => { await signOut(); navigate('/login') }}>
              Sair da conta
            </button>
            <button className="btn btn-ghost btn-sm danger" onClick={deleteAccount}>
              Excluir conta
            </button>
          </div>
        )}
      </div>

      {editOpen && <EditModal profile={profile} onClose={() => setEditOpen(false)} onSave={(a, b) => { setProfile(p => ({ ...p, apelido: a, bio: b })); refreshProfile() }} onAvatarUpload={handleAvatarUpload} />}
      {modal && <FollowersModal userId={profile.id} type={modal} onClose={() => setModal(null)} />}
      {toast && <div className="toast">{toast}</div>}

      <BottomNav />
    </div>
  )
}
