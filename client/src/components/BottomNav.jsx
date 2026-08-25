import { NavLink } from 'react-router-dom'
import Icon from './Icons.jsx'

export default function BottomNav() {
  const handleSearchClick = () => {
    // Procura o input da topbar e coloca o foco nele (abrindo o teclado no celular)
    const searchInput = document.querySelector('.search input')
    if (searchInput) {
      searchInput.focus()
    }
  }

  return (
    <nav className="bottomnav">
      <NavLink to="/" end>
        <span className="ico"><Icon name="home" size={20} /></span>Início
      </NavLink>
      
      {/* Clique aciona o foco no input superior */}
      <span className="bnav-item" onClick={handleSearchClick} style={{ cursor: 'pointer' }}>
        <span className="ico"><Icon name="search" size={20} /></span>Buscar
      </span>

      <NavLink to="/criar">
        <span className="ico"><Icon name="add" size={20} /></span>Criar
      </NavLink>
      <span className="bnav-item">
        <span className="ico"><Icon name="bell" size={20} /></span>Alertas
      </span>
      <NavLink to="/perfil">
        <span className="ico"><Icon name="person" size={20} /></span>Perfil
      </NavLink>
    </nav>
  )
}