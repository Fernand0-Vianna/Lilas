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
  const { profile } = useAuth()
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="logo">
          <img src={logo} alt="Lilás" className="logo-img" />
          Lilás
        </Link>
        <div className="search">
          <input placeholder="Buscar no Lilás..." value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && q.trim()) navigate(`/?q=${encodeURIComponent(q.trim())}`) }} />
        </div>
        <nav className="topbar-nav">
          <NavLink to="/" end>Feed</NavLink>
          <NavLink to="/comunidades">Comunidades</NavLink>
          {profile?.is_admin && <NavLink to="/denuncias">Denúncias</NavLink>}
          <Link to="/criar" className="btn btn-primary">+ Criar</Link>
          <button className="topbar-bell" title="Alertas"><Icon name="bell" size={18} /></button>
          <Link to={`/u/${profile?.apelido || ''}`} className="avatar-link" title={profile?.apelido}>
            <span className="avatar">{(profile?.apelido || '?')[0].toUpperCase()}</span>
          </Link>
        </nav>
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