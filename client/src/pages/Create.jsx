import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/auth.jsx'

export default function Create() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [communities, setCommunities] = useState([])
  const [community, setCommunity] = useState('')
  const [type, setType] = useState('text')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('communities').select('*').order('members', { ascending: false }).then(({ data }) => {
      setCommunities(data || [])
      if (data?.length) setCommunity(data[0].id)
    })
  }, [])

  async function publish() {
    setError('')
    if (!title.trim()) { setError('Dê um título à publicação.'); return }
    if (!community) { setError('Escolha uma comunidade.'); return }
    if (type === 'image' && !imageUrl.trim()) { setError('Cole a URL da imagem.'); return }
    setLoading(true)
    const { error } = await supabase.from('posts').insert({
      author_id: session.user.id,
      community_id: community,
      title: title.trim(),
      body: type === 'image' ? '' : body.trim(),
      image_url: type === 'image' ? imageUrl.trim() : ''
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    navigate('/')
  }

  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <div style={{ paddingTop: 24 }}>
        <div className="card">
          <div className="create-head">
            <h2>Criar post</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline" onClick={() => navigate(-1)}>Cancelar</button>
              <button className="btn btn-primary" onClick={publish} disabled={loading}>
                {loading ? 'Publicando...' : 'Publicar'}
              </button>
            </div>
          </div>
          <div className="comm-select">
            {communities.map(c => (
              <button key={c.id} className={`comm-chip ${community === c.id ? 'active' : ''}`} onClick={() => setCommunity(c.id)}>
                {c.name}
              </button>
            ))}
          </div>
          {error && <div className="error">{error}</div>}
          <div className="feed-tabs" style={{ marginBottom: 16 }}>
            <button className={type === 'text' ? 'active' : ''} onClick={() => setType('text')}>Texto</button>
            <button className={type === 'image' ? 'active' : ''} onClick={() => setType('image')}>Imagem</button>
          </div>
          <div className="field">
            <input placeholder="Título" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          {type === 'text' ? (
            <div className="field">
              <textarea rows={6} placeholder="Compartilhe algo inspirador..." value={body} onChange={e => setBody(e.target.value)} style={{ padding: '11px 14px', border: '1.5px solid var(--border)', borderRadius: 10, outline: 'none', fontFamily: 'inherit', fontSize: 14 }} />
            </div>
          ) : (
            <div className="field">
              <input placeholder="URL da imagem (https://...)" value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
            </div>
          )}
          <p className="hint">Sua publicação pode salvar vidas.</p>
        </div>
      </div>
    </div>
  )
}