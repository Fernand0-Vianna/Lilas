import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/auth.jsx'
import { compact } from '../lib/format.js'
import PostCard from '../components/PostCard.jsx'
import BottomNav from '../components/BottomNav.jsx'
import Icon from '../components/Icons.jsx'
import logo from '../assets/lilas-logo.svg'

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
  const [pw1, setPw1] = useState('')
  const [pw2, setPw2] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [bio, setBio] = useState('')
  const [apelido2, setApelido2] = useState('')
  const [saveMsg, setSaveMsg] = useState('')

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
      if (params.get('editar') === '1') {
        setBio(data.bio || '')
        setApelido2(data.apelido || '')
        setEditOpen(true)
      }
      const [postsR, followR, followersR, followingR] = await Promise.all([
        supabase.from('posts').select('*, profiles(apelido, avatar_url), communities(name, slug)').eq('author_id', data.id).order('created_at', { ascending: false }),
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
      const [likes, comments] = await Promise.all([tally('likes'), tally('comments')])
      setStats({ posts: list.length, likes, comments, followers: followersR.count || 0, following: followingR.count || 0 })
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

  async function changePassword() {
    setPwMsg('')
    if (!pw1 || pw1.length < 6) { setPwMsg('A senha deve ter ao menos 6 caracteres.'); return }
    if (pw1 !== pw2) { setPwMsg('As senhas não conferem.'); return }
    const { error } = await supabase.auth.updateUser({ password: pw1 })
    if (error) { setPwMsg(error.message); return }
    setPwMsg('Senha atualizada.')
    setPw1('')
    setPw2('')
  }

  function openEdit() {
    setEditOpen(o => !o)
    setBio(profile.bio || '')
    setApelido2(profile.apelido || '')
    setSaveMsg('')
  }

  async function saveProfile() {
    setSaveMsg('')
    if (!apelido2.trim()) { setSaveMsg('Escolha um apelido.'); return }
    const { error } = await supabase.from('profiles').update({
      apelido: apelido2.trim().replace(/^@/, ''),
      bio: bio.trim()
    }).eq('id', session.user.id)
    if (error) { setSaveMsg(error.message); return }
    await refreshProfile()
    setProfile(p => ({ ...p, apelido: apelido2.trim().replace(/^@/, ''), bio: bio.trim() }))
    setSaveMsg('Perfil atualizado.')
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
      .select('post_id, posts(*, profiles(apelido, avatar_url), communities(slug, name), likes(count), comments(count))')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setSavedPosts((data || []).map(s => s.posts).filter(Boolean)))
  }, [tab, session.user.id])

  if (loading) return <div className="container" style={{ paddingTop: 24 }}>Carregando...</div>
  if (notFound) return <div className="container" style={{ paddingTop: 24 }}>Usuário não encontrado.</div>

  const isMe = profile.id === session.user.id
  const initial = (profile.apelido || '?')[0].toUpperCase()
  const firstName = profile.apelido.split(/[^a-zA-Z0-9]/)[0]
  const memberYear = new Date(profile.created_at).getFullYear()

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
            <button className="profile-gear" onClick={openEdit}>
              <Icon name="gear" size={22} />
            </button>
          )}
          <Link to="/perfil" className="profile-topbar-user">
            <span className="avatar">{initial}</span>
            <span className="avatar-name">{firstName}</span>
          </Link>
        </div>
      </header>

      <div className="profile-hero">
        <div className="profile-cover" />
        <div className="container profile-identity-wrap">
          <div className="profile-identity">
            <span className="profile-avatar">{initial}</span>
            <div className="profile-info">
              <h1 className="profile-name">{profile.apelido}</h1>
              <div className="profile-handle">@{profile.apelido}</div>
              {profile.bio && <p className="profile-bio">{profile.bio}</p>}
            </div>
            {isMe ? (
              <button className="btn profile-edit" onClick={openEdit}>
                <Icon name="pen" size={15} /> Editar perfil
              </button>
            ) : (
              <button className={`btn profile-edit follow-btn ${following ? 'following' : ''}`} onClick={toggleFollow}>
                {following ? 'Seguindo' : 'Seguir'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container profile-body">
        <div className="profile-stats">
          <div><b>{compact(stats.posts)}</b><span>Posts</span></div>
          <div><b>{compact(stats.likes)}</b><span>Curtidas</span></div>
          <div><b>{compact(stats.comments)}</b><span>Comentários</span></div>
          <div><b>{compact(stats.followers)}</b><span>Seguidores</span></div>
          <div className="stat-following"><b>{compact(stats.following)}</b><span>Seguindo</span></div>
        </div>

        {isMe && editOpen && (
          <div className="card profile-edit-panel">
            <h3 style={{ fontSize: 16, marginBottom: 12 }}>Editar perfil</h3>
            <div className="field">
              <label>Apelido</label>
              <input value={apelido2} onChange={e => setApelido2(e.target.value)} placeholder="nome_fantasia" />
            </div>
            <div className="field">
              <label>Bio</label>
              <textarea rows={3} value={bio} onChange={e => setBio(e.target.value)} placeholder="Conte um pouco sobre você..." style={{ padding: '11px 14px', border: '1.5px solid var(--border)', borderRadius: 10, outline: 'none', fontFamily: 'inherit', fontSize: 14 }} />
            </div>
            {saveMsg && <p style={{ fontSize: 13, color: saveMsg === 'Perfil atualizado.' ? '#1a7f46' : '#d6336c', marginBottom: 12 }}>{saveMsg}</p>}
            <button className="btn btn-primary" onClick={saveProfile}>Salvar perfil</button>

            <h3 style={{ fontSize: 16, margin: '20px 0 12px' }}>Alterar senha</h3>
            <div className="pw-row">
              <div style={{ flex: 1 }}>
                <input className="field" type="password" placeholder="Nova senha" value={pw1} onChange={e => setPw1(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <input className="field" type="password" placeholder="Repetir senha" value={pw2} onChange={e => setPw2(e.target.value)} />
              </div>
              <button className="btn btn-primary" onClick={changePassword}>Salvar</button>
            </div>
            {pwMsg && <p style={{ fontSize: 13, color: pwMsg === 'Senha atualizada.' ? '#1a7f46' : '#d6336c', marginTop: 8 }}>{pwMsg}</p>}
            <button className="btn btn-block" style={{ marginTop: 14, borderColor: 'var(--danger, #d6336c)', color: '#d6336c' }} onClick={async () => { await signOut(); navigate('/login') }}>
              Sair da conta
            </button>
            <button className="btn btn-block" style={{ marginTop: 8, borderColor: 'var(--danger, #d6336c)', color: '#d6336c' }} onClick={deleteAccount}>
              Excluir conta
            </button>
          </div>
        )}

        <div className="profile-tabs">
          <button className={tab === 'posts' ? 'active' : ''} onClick={() => setTab('posts')}>Meus posts</button>
          <button className={tab === 'saves' ? 'active' : ''} onClick={() => setTab('saves')}>Salvos</button>
        </div>

        {tab === 'posts' ? (
          <div className="profile-grid">
            <div className="profile-posts">
              {posts.map(p => <PostCard key={p.id} post={p} onDeleted={() => setPosts(ps => ps.filter(x => x.id !== p.id))} />)}
              {posts.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                  <p style={{ color: 'var(--muted)' }}>Nenhuma publicação ainda.</p>
                </div>
              )}
            </div>

            <aside className="profile-side">
              <div className="card about-card">
                <h3 className="about-title">Sobre mim</h3>
                {profile.bio && <p className="about-body">{profile.bio}</p>}
                <div className="about-meta">
                  <Icon name="location" size={13} />
                  <span>Membro desde {memberYear}</span>
                </div>
              </div>
              <div className="help-card">
                <h3 className="help-title">Precisa de ajuda?</h3>
                <p className="help-body">Ligue 180. 24h e gratuito.</p>
                <a className="help-btn" href="tel:180">Ligar agora</a>
              </div>
            </aside>
          </div>
        ) : (
          <div className="profile-grid">
            <div className="profile-posts">
              {savedPosts.map(p => <PostCard key={p.id} post={p} onDeleted={() => setSavedPosts(ps => ps.filter(x => x.id !== p.id))} />)}
              {savedPosts.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                  <p style={{ color: 'var(--muted)' }}>Nenhum post salvo. Toque no marcador para guardar publicações.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}