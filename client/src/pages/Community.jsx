import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/auth.jsx'
import PostCard from '../components/PostCard.jsx'
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
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    setLoading(true)
    setNotFound(false)
    supabase.from('communities').select('*').eq('slug', slug).maybeSingle().then(async ({ data }) => {
      if (!data) { setNotFound(true); setLoading(false); return }
      setCommunity(data)
      const [postsR, member, mod] = await Promise.all([
        supabase.from('posts').select('*, profiles(apelido, avatar_url), communities(slug, name), likes(vote), comments(count), poll_votes(option_idx)')
          .eq('community_id', data.id).order('created_at', { ascending: false }),
        supabase.from('community_members').select('community_id').eq('community_id', data.id).eq('user_id', session.user.id).maybeSingle(),
        supabase.rpc('is_mod_of', { p_community: data.id })
      ])
      setPosts(postsR.data || [])
      setJoined(!!member.data)
      setIsMod(!!mod.data)
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
      if (error) { window.alert(error.message.includes('community_members_insert') ? 'Você está bloqueada nesta comunidade.' : error.message); return }
      setJoined(true)
      setCommunity(c => ({ ...c, members: c.members + 1 }))
    }
  }

  if (loading) return <div className="container" style={{ paddingTop: 24 }}>Carregando...</div>
  if (notFound) return <div className="container" style={{ paddingTop: 24 }}>Comunidade não encontrada.</div>

  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <div style={{ paddingTop: 24 }}>
        <div className="card comm-hero">
          <span className="banner">{community.name.replace('r/', '').slice(0, 1)}</span>
          <div style={{ flex: 1 }}>
            <h2>{community.name}</h2>
            <div className="comm-meta">{compact(community.members)} membros · {community.category}</div>
            {community.description && <p style={{ marginTop: 8, color: 'var(--muted)', fontSize: 14 }}>{community.description}</p>}
            {community.rules && (
              <details style={{ marginTop: 10 }}>
                <summary style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary-dark)', cursor: 'pointer' }}>📜 Regras</summary>
                <p style={{ marginTop: 6, color: 'var(--muted)', fontSize: 13, whiteSpace: 'pre-wrap' }}>{community.rules}</p>
              </details>
            )}
          </div>
          <button className={`btn ${joined ? 'btn-outline' : 'btn-primary'}`} onClick={toggle}>
            {joined ? 'Sair' : 'Entrar'}
          </button>
        </div>
        {(isMod || profile?.is_admin) && (
          <div style={{ marginBottom: 16, textAlign: 'right' }}>
            <button className="btn btn-ghost" onClick={() => setShowModPanel(o => !o)}>
              🛡 Painel de moderação
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
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ color: 'var(--muted)' }}>Nenhuma publicação nesta comunidade ainda.</p>
            <Link to="/criar" className="btn btn-primary" style={{ marginTop: 12 }}>Criar post</Link>
          </div>
        )}
        {posts.map(p => (
          <PostCard key={p.id} post={p} canModerate={isMod} onDeleted={() => setPosts(ps => ps.filter(x => x.id !== p.id))} />
        ))}
      </div>
    </div>
  )
}
