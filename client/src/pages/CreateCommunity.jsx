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
  const [fieldErrors, setFieldErrors] = useState({ name: '', general: '' })
  const [loading, setLoading] = useState(false)

  const slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  const baseInputStyle = {
    width: '100%',
    padding: '11px 14px',
    border: '1.5px solid var(--border)',
    borderRadius: '10px',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    background: 'var(--card)',
    color: 'var(--text)',
    transition: 'border-color 0.15s',
  }

  function inputStyle(hasError) {
    return {
      ...baseInputStyle,
      borderColor: hasError ? 'var(--danger)' : 'var(--border)',
    }
  }

  async function submit(e) {
    e.preventDefault()
    setFieldErrors({ name: '', general: '' })
    const n = name.trim()
    if (!n) {
      setFieldErrors({ name: 'Dê um nome para a comunidade.', general: '' })
      return
    }
    if (n.length < 2) {
      setFieldErrors({ name: 'O nome deve ter ao menos 2 letras.', general: '' })
      return
    }
    if (!slug || slug.length < 2) {
      setFieldErrors({ name: 'Use apenas letras e números (acentos são removidos).', general: '' })
      return
    }

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
      let msg = 'Não foi possível criar a comunidade. Tente novamente.'
      if (error.code === '23505' || error.message?.toLowerCase().includes('duplicate')) {
        msg = 'Já existe uma comunidade com esse nome. Escolha outro.'
      } else if (error.message?.toLowerCase().includes('foreign key')) {
        msg = 'Não foi possível criar a comunidade. Tente novamente.'
      }
      setFieldErrors({ name: '', general: msg })
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
        <form className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }} onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="name" style={{ fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 6 }}>Nome</label>
            <input
              id="name"
              name="name"
              placeholder="ex: Acolhimento"
              value={name}
              onChange={e => setName(e.target.value)}
              style={inputStyle(!!fieldErrors.name)}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,92,224,0.1)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = fieldErrors.name ? 'var(--danger)' : 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
              aria-invalid={!!fieldErrors.name}
              aria-describedby={fieldErrors.name ? 'name-error' : undefined}
              autoComplete="off"
            />
            {name && (
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
                URL: <code>r/{slug || '...'}</code>
              </div>
            )}
            {fieldErrors.name && <p id="name-error" style={{ color: 'var(--danger)', fontSize: 12, marginTop: 6 }}>{fieldErrors.name}</p>}
          </div>
          <div className="field">
            <label htmlFor="description" style={{ fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 6 }}>Descrição (opcional)</label>
            <textarea
              id="description"
              name="description"
              placeholder="Sobre o que é essa comunidade?"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              style={{ ...baseInputStyle, resize: 'vertical' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,92,224,0.1)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>
          <div className="field">
            <label htmlFor="category" style={{ fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 6 }}>Categoria (opcional)</label>
            <input
              id="category"
              name="category"
              placeholder="ex: Apoio, Direitos, Saúde"
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={baseInputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,92,224,0.1)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
              autoComplete="off"
            />
          </div>
          {fieldErrors.general && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{fieldErrors.general}</p>}
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
