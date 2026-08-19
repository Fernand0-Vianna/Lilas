import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { ptError } from '../lib/errors.js'
import logo from '../assets/lilas-logo.svg'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [hasToken, setHasToken] = useState(false)
  const [pw1, setPw1] = useState('')
  const [pw2, setPw2] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((e, s) => {
      if (e === 'PASSWORD_RECOVERY' && s) setHasToken(true)
    })
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setHasToken(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function submit() {
    setError('')
    setInfo('')
    if (!pw1 || pw1.length < 6) { setError('A senha deve ter ao menos 6 caracteres.'); return }
    if (pw1 !== pw2) { setError('As senhas não conferem.'); return }
    setLoading(true)
    const { error: e } = await supabase.auth.updateUser({ password: pw1 })
    setLoading(false)
    if (e) { setError(ptError(e)); return }
    await supabase.auth.signOut()
    setInfo('Senha atualizada!')
    setTimeout(() => navigate('/login'), 1500)
  }

  return (
    <div className="login-wrap" style={{ background: 'linear-gradient(160deg,#5b3fc4,#7c5ce0 55%,#ff6b9d)' }}>
      <div className="login-card">
        <div className="login-logo"><img src={logo} alt="Lilás" className="login-logo-img" /><h1>Lilás</h1></div>
        {hasToken ? (
          <>
            <p className="login-sub">Escolha sua nova senha.</p>
            <div className="field">
              <label>Nova senha</label>
              <input type="password" placeholder="••••••••" value={pw1} onChange={e => setPw1(e.target.value)} />
            </div>
            <div className="field">
              <label>Repetir senha</label>
              <input type="password" placeholder="••••••••" value={pw2} onChange={e => setPw2(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
            </div>
            {error && <div className="error">{error}</div>}
            {info && <div className="ok">{info}</div>}
            <button className="btn btn-primary btn-block" onClick={submit} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar nova senha'}
            </button>
          </>
        ) : (
          <p className="login-sub">Link de redefinição inválido ou expirado. Volte para o login e solicite novamente.</p>
        )}
      </div>
    </div>
  )
}