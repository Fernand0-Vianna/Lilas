import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import Icon from './Icons.jsx'

export default function BottomNav() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const searchInputRef = useRef(null)

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50)
    }
  }, [searchOpen])

  function handleSearch(e) {
    e.preventDefault()
    if (q.trim()) {
      navigate(`/?q=${encodeURIComponent(q.trim())}`)
      setSearchOpen(false)
      setQ('')
    }
  }

  return (
    <>
      <nav className="bottomnav" aria-label="Navegação inferior móvel">
        <NavLink to="/" end>
          <span className="ico"><Icon name="home" size={20} /></span>
          <span>Início</span>
        </NavLink>
        <NavLink to="/comunidades">
          <span className="ico"><Icon name="users" size={20} /></span>
          <span>Comunidades</span>
        </NavLink>
        <NavLink to="/criar" className="bnav-create" title="Criar nova publicação">
          <span className="ico bnav-create-ico"><Icon name="add" size={20} /></span>
          <span>Criar</span>
        </NavLink>
        <button
          type="button"
          className={`bnav-item ${searchOpen ? 'active' : ''}`}
          onClick={() => setSearchOpen(o => !o)}
          aria-label="Buscar publicações"
        >
          <span className="ico"><Icon name="search" size={20} /></span>
          <span>Buscar</span>
        </button>
        <NavLink to="/perfil">
          <span className="ico"><Icon name="person" size={20} /></span>
          <span>Perfil</span>
        </NavLink>
      </nav>

      {searchOpen && (
        <div className="modal-overlay mobile-search-overlay" onClick={() => setSearchOpen(false)}>
          <div className="modal-sheet mobile-search-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Buscar no Lilás</h3>
              <button className="modal-close" onClick={() => setSearchOpen(false)} aria-label="Fechar busca">
                <Icon name="x-close" size={20} />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSearch} className="mobile-search-form">
                <div className="search-input-wrap">
                  <Icon name="search" size={18} className="search-icon-inside" />
                  <input
                    ref={searchInputRef}
                    type="search"
                    placeholder="Pesquisar posts, temas, relatos..."
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    className="mobile-search-input"
                  />
                  {q && (
                    <button type="button" className="search-clear-btn" onClick={() => setQ('')}>
                      <Icon name="x-close" size={16} />
                    </button>
                  )}
                </div>
                <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 12 }}>
                  Pesquisar
                </button>
              </form>
              <div className="mobile-quick-links" style={{ marginTop: 16 }}>
                <span className="hint" style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>Tópicos sugeridos:</span>
                <div className="comm-select" style={{ marginBottom: 0 }}>
                  {['Apoio', 'História Real', 'Desabafo', 'Dúvida', 'Lei Maria da Penha'].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      className="comm-chip"
                      onClick={() => {
                        navigate(`/?q=${encodeURIComponent(tag)}`)
                        setSearchOpen(false)
                        setQ('')
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}