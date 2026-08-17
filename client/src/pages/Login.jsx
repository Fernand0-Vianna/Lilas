import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/auth.jsx'

export default function Login() {
  const [email, setEmail] = useState('')
  const [apelido, setApelido] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { refreshProfile } = useAuth()

  async function sendCode() {
    setError('')
    if (!email.trim() || !apelido.trim()) {
      setError('Preencha email e apelido.')
      return
    }
    setLoading(true)
    const clean = apelido.trim().replace(/^@/, '')
    // signUp is idempotent-safe: it registers the apelido on first use,
    // existing users are simply sent an OTP below.
    const { error: signupError } = await supabase.auth.signUp({
      email: email.trim(),
      password: crypto.randomUUID(),
      options: { data: { apelido: clean }, emailRedirectTo: window.location.origin }
    })
    if (signupError && signupError.code !== 'user_already_exists') {
      setError(signupError.message)
      setLoading(false)
      return
    }
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false }
    })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setSent(true)
  }

  async function verify() {
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code, type: 'email' })
    setLoading(false)
    if (error) { setError(error.message); return }
    await refreshProfile()
    navigate('/')
  }

  return (
    <div className="login-wrap" style={{ background: 'linear-gradient(160deg,#5b3fc4,#7c5ce0 55%,#ff6b9d)' }}>
      <div className="login-card">
        <div className="login-logo"><span className="logo-badge">L</span><h1>Lilás</h1></div>
        <p className="login-sub">Sua comunidade segura para falar sobre violência contra a mulher, sem expor quem você é.</p>

        {!sent ? (
          <>
            <div className="field">
              <label>Email</label>
              <input type="email" placeholder="seuemail@exemplo.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label>Apelido (fantasy name)</label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ padding: '11px 0 11px 14px', color: 'var(--muted)' }}>@</span>
                <input style={{ borderLeft: 'none', paddingLeft: '4px' }} placeholder="nome_fantasia"
                  value={apelido} onChange={e => setApelido(e.target.value)} />
              </div>
              <p className="hint">Você aparece como @{apelido.trim().replace(/^@/, '') || 'minha_fantasia'} — ninguém vê seu email.</p>
            </div>
            {error && <div className="error">{error}</div>}
            <button className="btn btn-primary btn-block" onClick={sendCode} disabled={loading}>
              {loading ? 'Enviando...' : 'Entrar'}
            </button>
            <p className="hint" style={{ textAlign: 'center', marginTop: 12 }}>
              Enviamos um código por email. Seus dados ficam privados; as comunidades só veem seu apelido.
            </p>
          </>
        ) : (
          <>
            <div className="ok">Código enviado para {email}. Digite-o abaixo.</div>
            <div className="field">
              <label>Código</label>
              <input inputMode="numeric" placeholder="000000" value={code} onChange={e => setCode(e.target.value)} />
            </div>
            {error && <div className="error">{error}</div>}
            <button className="btn btn-primary btn-block" onClick={verify} disabled={loading}>
              {loading ? 'Verificando...' : 'Confirmar'}
            </button>
            <p className="hint" style={{ textAlign: 'center', marginTop: 12 }}>
              <button onClick={() => { setSent(false); setCode('') }} style={{ color: 'var(--primary)', fontWeight: 600 }}>Reenviar / trocar email</button>
            </p>
          </>
        )}
      </div>
    </div>
  )
}