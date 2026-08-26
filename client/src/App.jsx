import { BrowserRouter, Routes, Route, Navigate, NavLink, Link, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth.jsx'
import Login from './pages/Login.jsx'
import logo from './assets/lilas-logo.svg'
import Feed from './pages/Feed.jsx'
import Post from './pages/Post.jsx'
import Create from './pages/Create.jsx'
import Communities from './pages/Communities.jsx'
import Community from './pages/Community.jsx'
import Profile from './pages/Profile.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import AdminReports from './pages/AdminReports.jsx'
import BottomNav from './components/BottomNav.jsx'
import Icon from './components/Icons.jsx'
import { useState } from 'react'

function Topbar() {
  const { profile, signOut } = useAuth()
  const [q, setQ] = useState('')
  const [menu, setMenu] = useState(false)
  const [searchExpanded, setSearchExpanded] = useState(false)
  const navigate = useNavigate()

  return (
    <header className="topbar">
      <div className={`topbar-inner ${searchExpanded ? 'search-expanded' : ''}`}>
        {!searchExpanded ? (
          <>
            <Link to="/" className="logo">
              <img src={logo} alt="Lilás" className="logo-img" />
              Lilás
            </Link>
            <div className="search search-desktop">
              <input placeholder="Buscar..." value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && q.trim()) navigate(`/?q=${encodeURIComponent(q.trim())}`) }} />
            </div>
            <button className="topbar-search-trigger" onClick={() => setSearchExpanded(true)} title="Buscar">
              <Icon name="search" size={20} />
            </button>
            <nav className="topbar-nav">
              <NavLink to="/" end>Feed</NavLink>
              <NavLink to="/comunidades">Comunidades</NavLink>
              {profile?.is_admin && <NavLink to="/denuncias">Denúncias</NavLink>}
              <Link to="/criar" className="btn btn-primary">+ Criar</Link>
              <button className="topbar-bell" title="Alertas">
                <Icon name="bell" size={18} />
              </button>
              <div className="avatar-menu">
                <button className="avatar-link desktop-only" title={profile?.apelido} onClick={() => setMenu(m => !m)}>
                  <span className="avatar">{(profile?.apelido || '?')[0].toUpperCase()}</span>
                </button>
                <Link to="/perfil" className="avatar-link mobile-only" title={profile?.apelido}>
                  <span className="avatar">{(profile?.apelido || '?')[0].toUpperCase()}</span>
                </Link>
                <div className={`avatar-dropdown ${menu ? 'open' : ''}`}>
                  <Link to="/perfil" onClick={() => setMenu(false)}>
                    <Icon name="person" size={14} /> Meu perfil
                  </Link>
                  <button onClick={async () => { setMenu(false); await signOut(); navigate('/login') }}>
                    Sair da conta
                  </button>
                </div>
              </div>
            </nav>
          </>
        ) : (
          <div className="mobile-search-bar">
            <button className="btn-back" onClick={() => setSearchExpanded(false)} aria-label="Voltar">
              <Icon name="chevron-left" size={20} />
            </button>
            <form onSubmit={e => { e.preventDefault(); if (q.trim()) { navigate(`/?q=${encodeURIComponent(q.trim())}`); setSearchExpanded(false); } }} className="mobile-search-form-top">
              <input autoFocus placeholder="Buscar..." value={q} onChange={e => setQ(e.target.value)} />
            </form>
            {q && (
              <button className="search-clear-btn-top" onClick={() => setQ('')} aria-label="Limpar">
                <Icon name="x-close" size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

function Shell({ children }) {
  return (
    <>
      <Topbar />
      {children}
      <BottomNav />
    </>
  )
}

function RequireAuth({ children }) {
  const { session, loading } = useAuth()
  if (loading) return null
  if (!session) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  const { session, loading } = useAuth()
  if (loading) return null

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/redefinir-senha" element={<ResetPassword />} />
      <Route path="/" element={<RequireAuth><Shell><Feed /></Shell></RequireAuth>} />
      <Route path="/post/:id" element={<RequireAuth><Shell><Post /></Shell></RequireAuth>} />
      <Route path="/criar" element={<RequireAuth><Shell><Create /></Shell></RequireAuth>} />
      <Route path="/comunidades" element={<RequireAuth><Shell><Communities /></Shell></RequireAuth>} />
      <Route path="/c/:slug" element={<RequireAuth><Shell><Community /></Shell></RequireAuth>} />
      <Route path="/denuncias" element={<RequireAuth><Shell><AdminReports /></Shell></RequireAuth>} />
      <Route path="/u/:apelido" element={<RequireAuth><Profile /></RequireAuth>} />
      <Route path="/perfil" element={<RequireAuth><Profile /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}