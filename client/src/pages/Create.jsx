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

const TAGS = ['Dúvida', 'Conseguiu', 'História Real', 'Desabafo', 'Apoio']

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
  const [tag, setTag] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [pollOptions, setPollOptions] = useState(['', ''])
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

  function setOption(i, v) {
    setPollOptions(o => o.map((x, j) => (j === i ? v : x)))
  }

  async function publish() {
    setError('')
    if (!title.trim()) { setError('Dê um título à publicação.'); return }
    if (!community) { setError('Escolha uma comunidade.'); return }
    if (type === 'image' && !file) { setError('Escolha uma imagem do seu dispositivo.'); return }
    const options = pollOptions.map(o => o.trim()).filter(Boolean)
    if (type === 'poll' && options.length < 2) { setError('A enquete precisa de ao menos 2 opções.'); return }
    if (type === 'link') {
      try { new URL(linkUrl) } catch { setError('Cole uma URL válida (comece com http).'); return }
    }
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
        body: type === 'image' || type === 'poll' ? '' : body.trim(),
        image_url: imageUrl,
        tag: tag || null,
        link_url: type === 'link' ? linkUrl.trim() : null,
        poll_options: type === 'poll' ? options : null
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
            <button className={type === 'link' ? 'active' : ''} onClick={() => setType('link')}>Link</button>
            <button className={type === 'poll' ? 'active' : ''} onClick={() => setType('poll')}>Enquete</button>
          </div>
          <div className="field">
            <input placeholder="Título" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          {type === 'text' || type === 'link' ? (
            <div className="field">
              {type === 'link' && (
                <input
                  placeholder="https://..."
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  style={{ marginBottom: 10 }}
                />
              )}
              <textarea rows={6} placeholder={type === 'link' ? 'Um pouco de contexto (opcional)...' : 'Compartilhe algo inspirador...'} value={body} onChange={e => setBody(e.target.value)} style={{ padding: '11px 14px', border: '1.5px solid var(--border)', borderRadius: 10, outline: 'none', fontFamily: 'inherit', fontSize: 14 }} />
            </div>
          ) : type === 'poll' ? (
            <div className="field">
              <label>Opções da enquete:</label>
              {pollOptions.map((o, i) => (
                <input
                  key={i}
                  placeholder={`Opção ${i + 1}`}
                  value={o}
                  onChange={e => setOption(i, e.target.value)}
                  style={{ marginBottom: 8 }}
                />
              ))}
              {pollOptions.length < 6 && (
                <button className="btn btn-outline" style={{ marginTop: 4 }} onClick={() => setPollOptions(o => [...o, ''])}>
                  + Opção
                </button>
              )}
            </div>
          ) : (
            <div className="field">
              <label className="hint" htmlFor="post-image">Imagem PNG/JPG do dispositivo (convertida para WebP):</label>
              <input id="post-image" type="file" accept="image/png,image/jpeg,image/webp" onChange={onFile} />
              {preview && <img src={preview} alt="" className="post-img" style={{ marginTop: 10 }} />}
            </div>
          )}
          <div className="field">
            <label>Tag (opcional)</label>
            <div className="comm-select" style={{ margin: 0 }}>
              {TAGS.map(t => (
                <button key={t} type="button" className={`comm-chip ${tag === t ? 'active' : ''}`} onClick={() => setTag(tag === t ? '' : t)}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <p className="hint">Sua publicação pode salvar vidas.</p>
        </div>
      </div>
    </div>
  )
}