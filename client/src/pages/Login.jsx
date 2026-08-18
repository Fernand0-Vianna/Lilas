import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/auth.jsx'

export default function Login() {
  const [mode, setMode] = useState('entrar')
  const [email, setEmail] = useState('')
  const [apelido, setApelido] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { refreshProfile } = useAuth()

  async function submit() {
    setError('')
    setInfo('')
    if (!email.trim() || !password) {
      setError('Preencha email e senha.')
      return
    }
    setLoading(true)
    if (mode === 'entrar') {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      })
      setLoading(false)
      if (error) { setError(error.message); return }
      await refreshProfile()
      navigate('/')
    } else {
      if (!apelido.trim()) {
        setError('Escolha um apelido.')
        setLoading(false)
        return
      }
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { apelido: apelido.trim().replace(/^@/, '') } }
      })
      setLoading(false)
      if (error) { setError(error.message); return }
      setInfo('Conta criada! Confirme seu email pelo link enviado para entrar.')
    }
  }

  return (
    <div className="login-wrap" style={{ background: 'linear-gradient(160deg,#5b3fc4,#7c5ce0 55%,#ff6b9d)' }}>
      <div className="login-card">
        <div className="login-logo"><span className="logo-badge">L</span><h1>Lilás</h1></div>
        <p className="login-sub">Sua comunidade segura para falar sobre violência contra a mulher, sem expor quem você é.</p>

        <div className="login-tabs">
          <button className={`tab ${mode === 'entrar' ? 'active' : ''}`} onClick={() => { setMode('entrar'); setError(''); setInfo('') }}>Entrar</button>
          <button className={`tab ${mode === 'criar' ? 'active' : ''}`} onClick={() => { setMode('criar'); setError(''); setInfo('') }}>Criar conta</button>
        </div>

        <div className="field">
          <label>Email</label>
          <input type="email" placeholder="seuemail@exemplo.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        {mode === 'criar' && (
          <div className="field">
            <label>Apelido (fantasy name)</label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ padding: '11px 0 11px 14px', color: 'var(--muted)' }}>@</span>
              <input style={{ borderLeft: 'none', paddingLeft: '4px' }} placeholder="nome_fantasia"
                value={apelido} onChange={e => setApelido(e.target.value)} />
            </div>
            <p className="hint">Você aparece como @{apelido.trim().replace(/^@/, '') || 'minha_fantasia'} — ninguém vê seu email.</p>
          </div>
        )}
        <div className="field">
          <label>Senha</label>
          <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()} />
        </div>

        {error && <div className="error">{error}</div>}
        {info && <div className="ok">{info}</div>}

        <button className="btn btn-primary btn-block" onClick={submit} disabled={loading}>
          {loading ? 'Aguarde...' : mode === 'entrar' ? 'Entrar' : 'Criar conta'}
        </button>
        <p className="hint" style={{ textAlign: 'center', marginTop: 12 }}>
          Seus dados ficam privados; as comunidades só veem seu apelido.
        </p>
      </div>
    </div>
  )
}
