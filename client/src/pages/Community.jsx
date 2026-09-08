import { useCallback, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/auth.jsx'
import { fetchVotesAndSaves } from '../lib/profile-service.js'
import PostCard from '../components/PostCard.jsx'
import CommunitySkeleton from '../components/CommunitySkeleton.jsx'
import { compact } from '../lib/format.js'

function ModPanel({ community, onRulesSaved }) {
  const { profile } = useAuth()
  const [rules, setRules] = useState(community.rules || '')
  const [msg, setMsg] = useState('')
  const [modInput, setModInput] = useState('')
  const [banInput, setBanInput] = useState('')
  const [mods, setMods] = useState([])
  const [bans, setBans] = useState([])
  const isAdmin = !!profile?.is_admin

  async function reload() {
    const [m, b] = await Promise.all([
      isAdmin
        ? supabase.from('community_mods').select('user_id, profiles(apelido)').eq('community_id', community.id)
        : Promise.resolve({ data: [] }),
      supabase.from('community_bans').select('user_id, profiles(apelido)').eq('community_id', community.id)
    ])
    setMods(m.data || [])
    setBans(b.data || [])
  }
  useEffect(() => { reload() }, [community.id])

  async function findUser(apelido) {
    const { data } = await supabase.from('profiles').select('id').eq('apelido', apelido.trim().replace(/^u\/|^@/, '')).maybeSingle()
    return data?.id || null
  }

  async function saveRules() {
    const { error } = await supabase.from('communities').update({ rules }).eq('id', community.id)
    setMsg(error ? error.message : 'Regras salvas.')
    if (!error && onRulesSaved) onRulesSaved(rules)
  }

  async function addMod() {
    const uid = await findUser(modInput)
    if (!uid) { setMsg('Usuária não encontrada.'); return }
    const { error } = await supabase.from('community_mods').insert({ community_id: community.id, user_id: uid, added_by: profile.id })
    setMsg(error ? (error.message.includes('duplicate') ? 'Já é mod.' : error.message) : `u/${modInput} agora é mod.`)
    setModInput('')
    reload()
  }

  async function removeMod(uid) {
    await supabase.from('community_mods').delete().eq('community_id', community.id).eq('user_id', uid)
    reload()
  }

  async function ban() {
    const uid = await findUser(banInput)
    if (!uid) { setMsg('Usuária não encontrada.'); return }
    const { error } = await supabase.from('community_bans').insert({ community_id: community.id, user_id: uid, banned_by: profile.id })
    if (!error) await supabase.from('community_members').delete().eq('community_id', community.id).eq('user_id', uid)
    setMsg(error ? error.message : 'Bloqueada da comunidade.')
    setBanInput('')
    reload()
  }

  async function unban(uid) {
    await supabase.from('community_bans').delete().eq('community_id', community.id).eq('user_id', uid)
    reload()
  }

  return (
    <div className="card mod-panel">
      <h3 style={{ fontSize: 16, marginBottom: 12 }}>🛡 Moderação</h3>
      <div className="field">
        <label>Regras da comunidade</label>
        <textarea rows={4} value={rules} onChange={e => setRules(e.target.value)} placeholder="Ex: seja gentil, sem julgamentos..." style={{ padding: '11px 14px', border: '1.5px solid var(--border)', borderRadius: 10, outline: 'none', fontFamily: 'inherit', fontSize: 14 }} />
        <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={saveRules}>Salvar regras</button>
      </div>
      {isAdmin && (
        <div className="field" style={{ marginTop: 12 }}>
          <label>Moderadoras</label>
          {mods.map(m => (
            <span key={m.user_id} className="tag-chip" style={{ marginRight: 6 }}>
              u/{m.profiles?.apelido}
              <button style={{ marginLeft: 6 }} onClick={() => removeMod(m.user_id)}>×</button>
            </span>
          ))}
          <div className="compose-row" style={{ marginTop: 8 }}>
            <input value={modInput} onChange={e => setModInput(e.target.value)} placeholder="Apelido para nomear mod" />
            <button className="btn btn-outline" onClick={addMod}>+ Mod</button>
          </div>
        </div>
      )}
      <div className="field" style={{ marginTop: 8 }}>
        <label>Bloquear usuárias</label>
        {bans.map(b => (
          <span key={b.user_id} className="tag-chip danger" style={{ marginRight: 6 }}>
            u/{b.profiles?.apelido}
            <button style={{ marginLeft: 6 }} onClick={() => unban(b.user_id)}>× desbloquear</button>
          </span>
        ))}
        <div className="compose-row" style={{ marginTop: 8 }}>
          <input value={banInput} onChange={e => setBanInput(e.target.value)} placeholder="Apelido para bloquear" />
          <button className="btn btn-outline" onClick={ban}>Bloquear</button>
        </div>
      </div>
      {msg && <p style={{ fontSize: 13, color: 'var(--primary-dark)', marginTop: 8 }}>{msg}</p>}
    </div>
  )
}

export default function Community() {
  const { slug } = useParams()
  const { session, profile } = useAuth()
  const [community, setCommunity] = useState(null)
  const [posts, setPosts] = useState([])
  const [joined, setJoined] = useState(false)
  const [isMod, setIsMod] = useState(false)
  const [showModPanel, setShowModPanel] = useState(false)
  const [userVotes, setUserVotes] = useState({})
  const [userSaves, setUserSaves] = useState({})
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [toast, setToast] = useState('')

  const removePost = useCallback(id => {
    setPosts(ps => ps.filter(x => x.id !== id))
  }, [])

  useEffect(() => {
    setLoading(true)
    setNotFound(false)
    supabase.from('communities').select('*').eq('slug', slug).maybeSingle().then(async ({ data }) => {
      if (!data) { setNotFound(true); setLoading(false); return }
      setCommunity(data)
      const [postsR, member, mod] = await Promise.all([
        supabase.from('posts').select('*, profiles!posts_author_id_fkey(apelido, avatar_url), communities(slug, name), likes(vote), comments(count), poll_votes(option_idx)')
          .eq('community_id', data.id).order('created_at', { ascending: false }),
        supabase.from('community_members').select('community_id').eq('community_id', data.id).eq('user_id', session.user.id).maybeSingle(),
        supabase.rpc('is_mod_of', { p_community: data.id })
      ])
      const allPosts = postsR.data || []
      setPosts(allPosts)
      setJoined(!!member.data)
      setIsMod(!!mod.data)

      const postIds = allPosts.map(x => x.id)
      if (postIds.length && session?.user?.id) {
        const { votesMap, savesMap } = await fetchVotesAndSaves(postIds, session.user.id)
        setUserVotes(votesMap)
        setUserSaves(savesMap)
      }

      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [slug, session.user.id])

  async function toggle() {
    if (joined) {
      await supabase.from('community_members').delete().eq('community_id', community.id).eq('user_id', session.user.id)
      setJoined(false)
      setCommunity(c => ({ ...c, members: Math.max(c.members - 1, 0) }))
    } else {
      const { error } = await supabase.from('community_members').insert({ community_id: community.id, user_id: session.user.id })
      if (error) { setToast(error.message.includes('community_members_insert') ? 'Você está bloqueada nesta comunidade.' : error.message); setTimeout(() => setToast(''), 3000); return }
      setJoined(true)
      setCommunity(c => ({ ...c, members: c.members + 1 }))
    }
  }

  if (loading) return <CommunitySkeleton />
  if (notFound) return <div className="container" style={{ paddingTop: 24 }}>Comunidade não encontrada.</div>

  return (
    <div className="container">
      <div style={{ paddingTop: 16 }}>
        <div className="comm-banner-wrap">
          <div className="comm-banner" style={community.banner_url ? { backgroundImage: `url(${community.banner_url})` } : undefined}>
            {!community.banner_url && <span className="comm-banner-letter">{community.name.replace('r/', '').slice(0, 1)}</span>}
          </div>
          <div className="comm-banner-info">
            <span className="comm-banner-icon" style={community.banner_url ? { backgroundImage: `url(${community.banner_url})` } : undefined}>
              {!community.banner_url && community.name.replace('r/', '').slice(0, 1)}
            </span>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>{community.name}</h2>
              <div className="comm-meta">{compact(community.members)} membros · {community.category}</div>
            </div>
            <button className={`btn ${joined ? 'btn-outline' : 'btn-primary'}`} onClick={toggle}>
              {joined ? 'Sair' : 'Entrar'}
            </button>
          </div>
        </div>
        <div className="comm-layout-grid">
          <div>
            {(isMod || profile?.is_admin) && (
              <div style={{ marginBottom: 12, textAlign: 'right' }}>
                <button className="btn btn-ghost" onClick={() => setShowModPanel(o => !o)}>
                  🛡 Moderação
                </button>
              </div>
            )}
            {showModPanel && (isMod || profile?.is_admin) && (
              <ModPanel
                community={community}
                onRulesSaved={rules => setCommunity(c => ({ ...c, rules }))}
              />
            )}
            {posts.length === 0 && (
              <div className="card" style={{ textAlign: 'center', padding: 32 }}>
                <p style={{ color: 'var(--muted)' }}>Nenhuma publicação ainda.</p>
                <Link to="/criar" className="btn btn-primary" style={{ marginTop: 10 }}>Criar post</Link>
          </div>
        )}
        {posts.map(p => (
          <PostCard key={p.id} post={p} canModerate={isMod} onRemove={removePost} userVote={userVotes[p.id]} userSaved={userSaves[p.id]} />
        ))}
          </div>
          <aside className="comm-sidebar">
            <div className="card">
              <h4>Sobre</h4>
              {community.description && <p>{community.description}</p>}
              <div className="comm-stat">
                <div><b>{compact(community.members)}</b><span>Membros</span></div>
              </div>
              {community.rules && (
                <div className="comm-rules">
                  <h4>Regras</h4>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{community.rules}</p>
                </div>
              )}
              <div className="comm-created">
                📅 Criada em {new Date(community.created_at || Date.now()).toLocaleDateString('pt-BR')}
              </div>
            </div>
          </aside>
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
