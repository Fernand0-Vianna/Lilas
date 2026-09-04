import { useEffect, useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/auth.jsx'
import Icon from '../components/Icons.jsx'

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
  const [loadingComms, setLoadingComms] = useState(true)
  const [community, setCommunity] = useState('')
  const [type, setType] = useState('post') // 'post' (text+image) | 'link' | 'poll'
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [tag, setTag] = useState('')
  const [sensitive, setSensitive] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [pollOptions, setPollOptions] = useState(['', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    setLoadingComms(true)
    supabase
      .from('community_members')
      .select('community_id, communities(*)')
      .eq('user_id', session.user.id)
      .then(({ data }) => {
        const comms = (data || []).map(d => d.communities).filter(Boolean)
        setCommunities(comms)
        if (comms.length) setCommunity(comms[0].id)
        setLoadingComms(false)
      })
  }, [session.user.id])

  function onFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  function removeFile() {
    setFile(null)
    setPreview('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function setOption(i, v) {
    setPollOptions(o => o.map((x, j) => (j === i ? v : x)))
  }

  async function publish() {
    setError('')
    if (!title.trim()) { setError('Dê um título à publicação.'); return }
    if (!community) { setError('Escolha uma comunidade que você participa.'); return }
    const options = pollOptions.map(o => o.trim()).filter(Boolean)
    if (type === 'poll' && options.length < 2) { setError('A enquete precisa de ao menos 2 opções.'); return }
    if (type === 'link') {
      try { new URL(linkUrl) } catch { setError('Cole uma URL válida (comece com http).'); return }
    }
    setLoading(true)
    try {
      let imageUrl = ''
      if (file) {
        const webp = await fileToWebP(file)
        const path = `${session.user.id}/${Date.now()}.webp`
        const { data, error: upErr } = await supabase.storage
          .from('posts')
          .upload(path, webp, { contentType: 'image/webp' })
        if (upErr) throw upErr
        imageUrl = supabase.storage.from('posts').getPublicUrl(data.path).data.publicUrl
      }
      const { error } = await supabase.from('posts').insert({
        author_id: session.user.id,
        community_id: community,
        title: title.trim(),
        body: body.trim(),
        image_url: imageUrl || null,
        tag: tag || null,
        link_url: type === 'link' ? linkUrl.trim() : null,
        poll_options: type === 'poll' ? options : null,
        is_sensitive: sensitive
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
              <button className="btn btn-primary" onClick={publish} disabled={loading || loadingComms || communities.length === 0}>
                {loading ? 'Publicando...' : 'Publicar'}
              </button>
            </div>
          </div>

          {loadingComms ? (
            <p className="hint" style={{ marginBottom: 12 }}>Carregando suas comunidades...</p>
          ) : communities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 12px', background: 'var(--bg)', borderRadius: 12, marginBottom: 16 }}>
              <p style={{ fontWeight: 600, marginBottom: 6 }}>Você ainda não participa de nenhuma comunidade.</p>
              <p className="hint" style={{ marginBottom: 12 }}>Para poder criar uma publicação, entre em ao menos uma comunidade.</p>
              <Link to="/comunidades" className="btn btn-primary btn-sm">Explorar comunidades</Link>
            </div>
          ) : (
            <div className="field">
              <label style={{ marginBottom: 6 }}>Publicar em:</label>
              <div className="comm-select">
                {communities.map(c => (
                  <button key={c.id} type="button" className={`comm-chip ${community === c.id ? 'active' : ''}`} onClick={() => setCommunity(c.id)}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <div className="error">{error}</div>}

          <div className="feed-tabs" style={{ marginBottom: 16 }}>
            <button type="button" className={type === 'post' ? 'active' : ''} onClick={() => setType('post')}>Publicação</button>
            <button type="button" className={type === 'link' ? 'active' : ''} onClick={() => setType('link')}>Link</button>
            <button type="button" className={type === 'poll' ? 'active' : ''} onClick={() => setType('poll')}>Enquete</button>
          </div>

          <div className="field">
            <input placeholder="Título da publicação" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          {type === 'link' && (
            <div className="field">
              <input
                placeholder="https://exemplo.com/noticia-ou-artigo"
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                style={{ marginBottom: 10 }}
              />
            </div>
          )}

          {type === 'poll' ? (
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
                <button type="button" className="btn btn-outline" style={{ marginTop: 4 }} onClick={() => setPollOptions(o => [...o, ''])}>
                  + Opção
                </button>
              )}
            </div>
          ) : (
            <div className="field">
              <textarea
                rows={5}
                placeholder={type === 'link' ? 'Um pouco de contexto sobre o link (opcional)...' : 'Compartilhe sua história, dúvida ou palavras de apoio...'}
                value={body}
                onChange={e => setBody(e.target.value)}
                style={{ padding: '11px 14px', border: '1.5px solid var(--border)', borderRadius: 10, outline: 'none', fontFamily: 'inherit', fontSize: 14 }}
              />
            </div>
          )}

          {/* Anexo de Imagem unificado com botão de ícone */}
          {type !== 'poll' && (
            <div className="create-media-section" style={{ marginBottom: 14 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={onFile}
              />
              {!preview ? (
                <button
                  type="button"
                  className="btn-attach-photo"
                  onClick={() => fileInputRef.current?.click()}
                  title="Anexar imagem"
                >
                  <Icon name="camera" size={18} />
                  <span>Adicionar foto</span>
                </button>
              ) : (
                <div className="attached-preview-wrap">
                  <img src={preview} alt="Prévia" className="attached-preview-img" />
                  <button type="button" className="attached-remove-btn" onClick={removeFile} title="Remover imagem">
                    <Icon name="x-close" size={16} /> Remover foto
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="field">
            <label>Tag de contexto (opcional)</label>
            <div className="comm-select" style={{ margin: 0 }}>
              {TAGS.map(t => (
                <button key={t} type="button" className={`comm-chip ${tag === t ? 'active' : ''}`} onClick={() => setTag(tag === t ? '' : t)}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label className="checkbox" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={sensitive} onChange={e => setSensitive(e.target.checked)} />
              Conteúdo sensível (será exibido com desfoque até você escolher revelar)
            </label>
          </div>

          <p className="hint">Sua publicação é anônima e pode salvar vidas.</p>
        </div>
      </div>
    </div>
  )
}