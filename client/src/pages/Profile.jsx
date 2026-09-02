import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { compact, timeAgo } from '../lib/format.js'
import {
  fetchProfileByApelido,
  fetchUserPosts,
  fetchFollowers,
  fetchFollowing,
  fetchFollowingMap,
  toggleFollow,
  updateProfile,
  uploadAvatar,
  uploadCover,
  deleteAccount,
  fetchUserActivity,
  fetchSavedPosts,
  checkIsFollowing,
  updateUserPassword,
  countFollowers,
  countFollowing,
  fetchUserKarma,
  countCommentsOnPosts
} from '../lib/profile-service.js'
import PostCard from '../components/PostCard.jsx'
import ConfirmModal from '../components/ConfirmModal.jsx'
import BottomNav from '../components/BottomNav.jsx'
import Icon from '../components/Icons.jsx'
import ProfileSkeleton from '../components/ProfileSkeleton.jsx'
import logo from '../assets/lilas-logo.svg'

function FollowersModal({ userId, type, onClose }) {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const { session, profile } = useAuth()
  const [followingMap, setFollowingMap] = useState({})
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    const fetchList = async () => {
      const isFollowers = type === 'followers'
      const { data: items } = isFollowers
        ? await fetchFollowers(userId)
        : await fetchFollowing(userId)

      setList(items || [])

      // Buscar status de follow em paralelo se houver itens
      if (session?.user && items?.length > 0) {
        const ids = items.map(i => i.id).filter(id => id !== session.user.id)
        if (ids.length) {
          const { data: map } = await fetchFollowingMap(session.user.id, ids)
          setFollowingMap(map || {})
        }
      }
      setLoading(false)
    }
    fetchList()
  }, [userId, type, session?.user?.id])

  async function handleToggleFollow(targetId) {
    try {
      setError('')
      const isCurrentlyFollowing = !!followingMap[targetId]
      const { error } = await toggleFollow(session.user.id, targetId, isCurrentlyFollowing)
      if (error) throw error

      if (isCurrentlyFollowing) {
        setFollowingMap(m => { const n = { ...m }; delete n[targetId]; return n })
      } else {
        setFollowingMap(m => ({ ...m, [targetId]: true }))
      }
    } catch (err) {
      console.error(err)
      setError('Erro ao seguir usuário. Tente novamente.')
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
          {error && <p className="error" style={{ marginBottom: 12 }}>{error}</p>}
          {loading ? <p className="modal-empty">Carregando...</p> : list.length === 0 ? (
            <p className="modal-empty">{type === 'followers' ? 'Nenhum seguidor ainda.' : 'Não segue ninguém ainda.'}</p>
          ) : list.map(u => (
            <div key={u.id} className="modal-user-row">
              <Link to={`/u/${u.apelido}`} className="modal-user-link" onClick={onClose}>
                <span className="avatar-sm">{u.avatar_url ? <img src={u.avatar_url} alt="" /> : (u.apelido || '?')[0].toUpperCase()}</span>
                <span className="modal-user-name">{u.apelido}</span>
              </Link>
              {u.id !== session?.user?.id && (
                <button className={`btn btn-sm ${followingMap[u.id] ? 'btn-outline' : 'btn-primary'}`} onClick={() => handleToggleFollow(u.id)}>
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
    const loadActivity = async () => {
      const { data } = await fetchUserActivity(userId)
      setActivity(data || [])
      setLoading(false)
    }
    loadActivity()
  }, [userId])

  if (loading) return <p className="profile-empty">Carregando atividade...</p>
  if (!activity.length) return <p className="profile-empty">Nenhuma atividade recente.</p>

  return (
    <div className="activity-list">
      {activity.map((item, i) => (
        <div key={i} className="activity-item">
          <span className="avatar-xs">{item.user?.apelido?.[0]?.toUpperCase() || '?'}</span>
          <div className="activity-body">
            <p>
              {item.isOwn ? (
                <>Você comentou em <Link to={`/post/${item.postId}`}>um post</Link></>
              ) : (
                <><Link to={`/u/${item.user?.apelido}`}><b>{item.user?.apelido}</b></Link> comentou em <Link to={`/post/${item.postId}`}>um post</Link></>
              )}
            </p>
            <p className="activity-preview">{item.body?.slice(0, 120)}{item.body?.length > 120 ? '...' : ''}</p>
            <span className="activity-time">{timeAgo(item.created_at)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function fileToWebP(file, quality = 0.85, maxSize = 1200) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.naturalWidth * scale)
      canvas.height = Math.round(img.naturalHeight * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(b => {
        URL.revokeObjectURL(url)
        if (b) resolve(b)
        else reject(new Error('Não foi possível processar a imagem.'))
      }, 'image/webp', quality)
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Arquivo inválido.')) }
    img.src = url
  })
}

function EditModal({ profile, onClose, onSave, onAvatarUpload, onCoverUpload, onSignOut, onDeleteAccount }) {
  const [apelido, setApelido] = useState(profile.apelido || '')
  const [bio, setBio] = useState(profile.bio || '')
  const [pw1, setPw1] = useState('')
  const [pw2, setPw2] = useState('')
  const [msg, setMsg] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [tab, setTab] = useState('profile')
  const avatarFileRef = useRef()
  const coverFileRef = useRef()

  async function handleSave() {
    setMsg('')
    if (!apelido.trim()) { setMsg('Escolha um apelido.'); return }
    const { error } = await updateProfile(profile.id, { apelido, bio })
    if (error) { setMsg(error.message); return }
    onSave(apelido.trim().replace(/^@/, ''), bio.trim())
    setMsg('Perfil atualizado.')
  }

  async function handleChangePw() {
    setPwMsg('')
    if (!pw1 || pw1.length < 6) { setPwMsg('A senha deve ter ao menos 6 caracteres.'); return }
    if (pw1 !== pw2) { setPwMsg('As senhas não conferem.'); return }
    const { error } = await updateUserPassword(pw1)
    if (error) { setPwMsg(error.message); return }
    setPwMsg('Senha atualizada.')
    setPw1(''); setPw2('')
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setMsg('Imagem muito grande (máx 5MB).'); return }
    await onAvatarUpload(file)
  }

  async function handleCoverChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setMsg('Imagem muito grande (máx 5MB).'); return }
    await onCoverUpload(file)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet modal-edit" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Editar perfil</h3>
          <button className="modal-close" onClick={onClose}><Icon name="x-close" size={20} /></button>
        </div>
        <div className="modal-tabs">
          <button type="button" className={tab === 'profile' ? 'active' : ''} onClick={() => setTab('profile')}>Perfil & Fotos</button>
          <button type="button" className={tab === 'security' ? 'active' : ''} onClick={() => setTab('security')}>Conta & Segurança</button>
        </div>
        <div className="modal-body">
          {tab === 'profile' ? (
            <>
              <div className="edit-photos-section" style={{ display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center', margin: '8px 0 16px', flexWrap: 'wrap' }}>
                <div className="edit-avatar-section" style={{ margin: 0 }}>
                  <div className="edit-avatar-wrap" onClick={() => avatarFileRef.current?.click()} title="Trocar foto de perfil">
                    {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="edit-avatar-img" /> : <span className="edit-avatar-letter">{(profile.apelido || '?')[0].toUpperCase()}</span>}
                    <div className="edit-avatar-overlay"><Icon name="camera" size={20} /></div>
                  </div>
                  <input ref={avatarFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                  <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 4 }} onClick={() => avatarFileRef.current?.click()}>Foto de perfil</button>
                </div>

                <div className="edit-cover-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div
                    className="edit-cover-preview"
                    onClick={() => coverFileRef.current?.click()}
                    style={{
                      width: 120, height: 72, borderRadius: 10, cursor: 'pointer', overflow: 'hidden',
                      background: (profile.cover_url || profile.banner_url) ? `url(${profile.cover_url || profile.banner_url}) center/cover` : 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                      display: 'grid', placeItems: 'center', border: '1.5px solid var(--border)', position: 'relative'
                    }}
                    title="Trocar imagem de fundo (capa)"
                  >
                    <div className="edit-cover-overlay" style={{ background: 'rgba(0,0,0,0.3)', width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: '#fff' }}>
                      <Icon name="camera" size={18} />
                    </div>
                  </div>
                  <input ref={coverFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverChange} />
                  <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 4 }} onClick={() => coverFileRef.current?.click()}>Foto de fundo</button>
                </div>
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
              <button type="button" className="btn btn-primary btn-block" onClick={handleSave}>Salvar perfil</button>
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
              <button type="button" className="btn btn-primary btn-block" onClick={handleChangePw}>Salvar nova senha</button>

              <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button type="button" className="btn btn-outline btn-block" onClick={onSignOut}>
                  Sair da conta
                </button>
                <button type="button" className="btn btn-ghost btn-block" style={{ color: 'var(--danger, #d6336c)' }} onClick={onDeleteAccount}>
                  Excluir conta definitivamente
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Profile() {
  const { apelido } = useParams()
  const { session, profile: authProfile, signOut, refreshProfile } = useAuth()
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
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false)
  const avatarInputRef = useRef()
  const coverInputRef = useRef()

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }, [])

  useEffect(() => {
    setLoading(true)
    setNotFound(false)
    setTab('posts')

    // Se não tem apelido na URL, é o próprio perfil - usar profile do AuthContext
    if (!apelido && authProfile) {
      // Usar profile já carregado do AuthContext
      setProfile(authProfile)
      if (params.get('editar') === '1') setEditOpen(true)

      // Buscar posts primeiro, depois stats em paralelo reutilizando os IDs
      ;(async () => {
        const postsR = await fetchUserPosts(authProfile.id)
        const postIds = postsR.data?.map(p => p.id) || []

        const [followR, followersR, followingR, karmaR, commentsCount] = await Promise.all([
          Promise.resolve({ isFollowing: false }),
          countFollowers(authProfile.id),
          countFollowing(authProfile.id),
          fetchUserKarma(authProfile.id),
          postIds.length ? countCommentsOnPosts(postIds) : Promise.resolve({ count: 0 })
        ])

        setPosts(postsR.data || [])
        setFollowing(false)
        setStats({
          posts: postsR.data?.length || 0,
          likes: karmaR.data ?? 0,
          comments: commentsCount.count || 0,
          followers: followersR.count || 0,
          following: followingR.count || 0
        })
        setLoading(false)
      })()
      return
    }

    // Se tem apelido na URL e já temos o profile com esse apelido, não re-buscar
    if (apelido && profile?.apelido === apelido && !loading) return

    // Caso contrário, buscar perfil pelo apelido
    fetchProfileByApelido(apelido).then(async ({ data }) => {
      if (!data) { setNotFound(true); setLoading(false); return }
      setProfile(data)
      if (params.get('editar') === '1') setEditOpen(true)

      // Buscar posts primeiro, depois stats em paralelo reutilizando os IDs
      const postsR = await fetchUserPosts(data.id)
      const postIds = postsR.data?.map(p => p.id) || []

      const [followR, followersR, followingR, karmaR, commentsCount] = await Promise.all([
        checkIsFollowing(session.user.id, data.id),
        countFollowers(data.id),
        countFollowing(data.id),
        fetchUserKarma(data.id),
        postIds.length ? countCommentsOnPosts(postIds) : Promise.resolve({ count: 0 })
      ])

      setPosts(postsR.data || [])
      setFollowing(!!followR.isFollowing)
      setStats({
        posts: postsR.data?.length || 0,
        likes: karmaR.data ?? 0,
        comments: commentsCount.count || 0,
        followers: followersR.count || 0,
        following: followingR.count || 0
      })
      setLoading(false)
    })
  }, [apelido, session.user.id, authProfile])

  async function handleToggleFollow() {
    try {
      const { error } = await toggleFollow(session.user.id, profile.id, following)
      if (error) throw error

      if (following) {
        setStats(s => ({ ...s, followers: s.followers - 1 }))
        setFollowing(false)
      } else {
        setStats(s => ({ ...s, followers: s.followers + 1 }))
        setFollowing(true)
      }
    } catch (err) {
      console.error(err)
      showToast('Erro ao seguir usuário. Tente novamente.')
    }
  }

  function handleShare() {
    const url = `${window.location.origin}/u/${profile.apelido}`
    navigator.clipboard?.writeText(url).then(() => showToast('Link copiado!')).catch(() => showToast(url))
  }

  async function handleAvatarUpload(file) {
    try {
      showToast('Enviando foto de perfil...')
      const webp = await fileToWebP(file, 0.85, 600)
      const { url, error } = await uploadAvatar(profile.id, webp)
      if (error) throw error

      setProfile(p => ({ ...p, avatar_url: url }))
      await refreshProfile()
      showToast('Foto de perfil atualizada!')
    } catch (err) {
      console.error(err)
      showToast(`Erro ao atualizar foto: ${err.message || 'Tente novamente.'}`)
    }
  }

  async function handleCoverUpload(file) {
    try {
      showToast('Enviando imagem de capa...')
      const webp = await fileToWebP(file, 0.85, 1400)
      const { url, error } = await uploadCover(profile.id, webp)
      if (error) throw error

      setProfile(p => ({ ...p, cover_url: url, banner_url: url }))
      await refreshProfile()
      showToast('Foto de fundo atualizada!')
    } catch (err) {
      console.error(err)
      showToast(`Erro ao atualizar capa: ${err.message || 'Tente novamente.'}`)
    }
  }

  async function doDeleteAccount() {
    try {
      const { error } = await deleteAccount()
      if (error) throw error
      setConfirmDeleteAccount(false)
      await signOut()
      navigate('/login')
    } catch (err) {
      console.error(err)
      showToast('Erro ao excluir conta. Tente novamente.')
    }
  }

  useEffect(() => {
    if (tab !== 'saves') return
    fetchSavedPosts(session.user.id).then(({ data }) => setSavedPosts(data || []))
  }, [tab, session.user.id])

  if (loading || (!notFound && !profile)) return <ProfileSkeleton />
  if (notFound) return <div className="container" style={{ paddingTop: 24 }}>Usuário não encontrado.</div>

  const isMe = profile.id === session.user.id
  const initial = (profile.apelido || '?')[0].toUpperCase()
  const memberYear = new Date(profile.created_at).getFullYear()
  const memberMonth = new Date(profile.created_at).toLocaleDateString('pt-BR', { month: 'long' })

  return (
    <div className="profile-page">
      <header className="profile-topbar">
        <div className="profile-topbar-inner">
          <button type="button" className="profile-back-btn" onClick={() => navigate(-1)} aria-label="Voltar" title="Voltar">
            <Icon name="chevron-left" size={20} />
          </button>
          <Link to="/" className="profile-logo">
            <img src={logo} alt="Lilás" className="logo-img" />
            Lilás
          </Link>
          <span className="profile-topbar-title">{isMe ? 'Meu perfil' : `u/${profile.apelido}`}</span>
          {isMe ? (
            <button className="profile-gear" onClick={() => setEditOpen(true)} title="Configurações e editar perfil">
              <Icon name="gear" size={20} />
            </button>
          ) : (
            <div className="profile-topbar-spacer" />
          )}
          <Link to="/perfil" className="profile-topbar-user">
            <span className="avatar">{profile.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : initial}</span>
            <span className="avatar-name">{profile.apelido?.split(/[^a-zA-Z0-9]/)[0]}</span>
          </Link>
        </div>
      </header>

      <div className="profile-hero">
        <div
          className="profile-cover"
          style={(profile.cover_url || profile.banner_url) ? {
            backgroundImage: `url(${profile.cover_url || profile.banner_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          } : undefined}
        >
          {isMe && (
            <>
              <button
                type="button"
                className="cover-upload-btn"
                onClick={() => coverInputRef.current?.click()}
                title="Trocar foto de fundo (capa)"
              >
                <Icon name="camera" size={15} />
                <span>Trocar capa</span>
              </button>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f) }}
              />
            </>
          )}
        </div>
        <div className="container profile-identity-wrap">
          <div className="profile-identity">
            <div className="profile-avatar-wrap">
              <span className="profile-avatar">
                {profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : initial}
              </span>
              {isMe && (
                <button type="button" className="avatar-upload-btn" onClick={() => avatarInputRef.current?.click()} title="Trocar foto de perfil">
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
                <button className={`btn profile-action-btn ${following ? 'btn-outline' : 'btn-primary'}`} onClick={handleToggleFollow}>
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
      </div>

      {editOpen && (
        <EditModal
          profile={profile}
          onClose={() => setEditOpen(false)}
          onSave={(a, b) => { setProfile(p => ({ ...p, apelido: a, bio: b })); refreshProfile() }}
          onAvatarUpload={handleAvatarUpload}
          onCoverUpload={handleCoverUpload}
          onSignOut={async () => { setEditOpen(false); await signOut(); navigate('/login') }}
          onDeleteAccount={() => setConfirmDeleteAccount(true)}
        />
      )}
      {modal && <FollowersModal userId={profile.id} type={modal} onClose={() => setModal(null)} />}
      {confirmDeleteAccount && (
        <ConfirmModal
          title="Excluir conta?"
          message="Sua conta, posts, curtidas e seguidores serão excluídos permanentemente. Esta ação não pode ser desfeita."
          confirmLabel="Excluir conta"
          danger
          onConfirm={doDeleteAccount}
          onClose={() => setConfirmDeleteAccount(false)}
        />
      )}
      {toast && <div className="toast">{toast}</div>}

      <BottomNav />
    </div>
  )
}

