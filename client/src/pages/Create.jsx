import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/auth.jsx'

function fileToWebP(file, quality = 0.8, maxSize = 1600) {
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
        else reject(new Error('Não foi possível converter a imagem.'))
      }, 'image/webp', quality)
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Arquivo inválido.')) }
    img.src = url
  })
}

export default function Create() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [communities, setCommunities] = useState([])
  const [community, setCommunity] = useState('')
  const [type, setType] = useState('text')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('communities').select('*').order('members', { ascending: false }).then(({ data }) => {
      setCommunities(data || [])
      if (data?.length) setCommunity(data[0].id)
    })
  }, [])

  function onFile(e) {
    const f = e.target.files?.[0]
    setFile(f || null)
    setPreview(f ? URL.createObjectURL(f) : '')
  }

  async function publish() {
    setError('')
    if (!title.trim()) { setError('Dê um título à publicação.'); return }
    if (!community) { setError('Escolha uma comunidade.'); return }
    if (type === 'image' && !file) { setError('Escolha uma imagem do seu dispositivo.'); return }
    setLoading(true)
    try {
      let imageUrl = ''
      if (type === 'image') {
        const webp = await fileToWebP(file)
        const { data, error: upErr } = await supabase.storage
          .from('posts')
          .upload(`${session.user.id}/${Date.now()}.webp`, webp, { contentType: 'image/webp' })
        if (upErr) throw upErr
        imageUrl = supabase.storage.from('posts').getPublicUrl(data.path).data.publicUrl
      }
      const { error } = await supabase.from('posts').insert({
        author_id: session.user.id,
        community_id: community,
        title: title.trim(),
        body: type === 'image' ? '' : body.trim(),
        image_url: imageUrl
      })
      if (error) throw error
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
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
              <label className="hint" htmlFor="post-image">Imagem PNG/JPG do dispositivo (convertida para WebP):</label>
              <input id="post-image" type="file" accept="image/png,image/jpeg,image/webp" onChange={onFile} />
              {preview && <img src={preview} alt="" className="post-img" style={{ marginTop: 10 }} />}
            </div>
          )}
          <p className="hint">Sua publicação pode salvar vidas.</p>
        </div>
      </div>
    </div>
  )
}