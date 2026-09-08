import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/auth.jsx'

export default function CreateCommunity() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [rules, setRules] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  async function submit(e) {
    e.preventDefault()
    setError('')
    const n = name.trim()
    if (!n) { setError('Dê um nome para a comunidade.'); return }
    if (n.length < 2) { setError('O nome deve ter ao menos 2 letras.'); return }
    if (!slug || slug.length < 2) { setError('Use apenas letras e números (acentos são removidos).'); return }

    setLoading(true)
    const { data, error } = await supabase
      .from('communities')
      .insert({
        name: n.startsWith('r/') ? n : `r/${n}`,
        slug,
        description: description.trim(),
        category: category.trim(),
        rules: rules.trim() || null,
      })
      .select('slug')
      .single()

    if (error) {
      setLoading(false)
      if (error.message.includes('duplicate') || error.code === '23505') setError('Já existe uma comunidade com esse nome. Escolha outro.')
      else setError(error.message)
      return
    }
    navigate(`/c/${data.slug}`)
  }

  return (
    <div className="container" style={{ maxWidth: 600 }}>
      <div style={{ paddingTop: 24 }}>
        <div className="create-head">
          <h2>Criar comunidade</h2>
          <Link to="/comunidades" className="btn btn-outline">Voltar</Link>
        </div>
        <form className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }} onSubmit={submit}>
          <div>
            <label style={{ fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 6 }}>Nome</label>
            <input
              placeholder="ex: Acolhimento"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ width: '100%' }}
            />
            {name && (
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
                URL: <code>r/{slug || '...'}</code>
              </div>
            )}
          </div>
          <div>
            <label style={{ fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 6 }}>Descrição (opcional)</label>
            <textarea
              placeholder="Sobre o que é essa comunidade?"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 6 }}>Categoria (opcional)</label>
            <input
              placeholder="ex: Apoio, Direitos, Saúde"
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Criando...' : 'Criar comunidade'}
          </button>
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
            Você será a primeira moderadora da comunidade.
          </p>
        </form>
      </div>
    </div>
  )
}
