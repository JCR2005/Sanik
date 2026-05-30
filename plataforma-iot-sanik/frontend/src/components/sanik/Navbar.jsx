import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import logo from '../../assets/airsunbox-logo.svg'
import { Cpu, User, LogOut, Shield, Sun, Moon, Menu, X } from 'lucide-react'
import useAuthStore from '../../store/auth'
import useThemeStore from '../../store/theme'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { org, user, logout } = useAuthStore()
  const { dark, toggle } = useThemeStore()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }
  const isActive = (path) => location.pathname.startsWith(path)

  const navLinks = [
    { to: '/devices', icon: Cpu, label: 'Dispositivos' },
    ...( ['admin','superadmin','worker'].includes(user?.role) 
      ? [{ to: '/admin', icon: Shield, label: 'Admin' }] 
      : [] )
  ]

  return (
    <header className="sticky top-0 z-50 backdrop-blur border-b" style={{background:'var(--bg)90',borderColor:'var(--border)'}}>
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/devices" className="flex items-center gap-2">
            <img src={logo} alt="AirSunBox" className="h-9 w-auto object-contain" />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors`}
                style={{ background: isActive(link.to) ? 'rgba(29,158,117,.1)' : 'transparent', color: isActive(link.to) ? 'var(--green)' : 'var(--text2)' }}>
                <link.icon size={14} /> {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle tema */}
          <button onClick={toggle} className="p-2 rounded-lg transition-colors"
            style={{color:'var(--text2)',background:'transparent'}}
            title={dark ? 'Modo claro' : 'Modo oscuro'}>
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border" style={{background:'var(--card)',borderColor:'var(--border)'}}>
            <div className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold" style={{background:'rgba(29,158,117,.2)',color:'var(--green)'}}>
              {org?.name?.[0]}
            </div>
            <span className="text-sm" style={{color:'var(--text)'}}>{org?.name}</span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            <Link to="/profile" className="p-2 rounded-lg transition-colors" style={{color:'var(--text2)'}}>
              <User size={18} />
            </Link>

            <button onClick={handleLogout} className="p-2 rounded-lg transition-colors hover:text-red-400" style={{color:'var(--text2)'}}>
              <LogOut size={18} />
            </button>
          </div>

          {/* Hamburger Menu Button */}
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg transition-colors"
            style={{color:'var(--text2)'}}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t py-4 px-4 space-y-4 shadow-xl" style={{background:'var(--card)', borderColor:'var(--border)'}}>
          <nav className="flex flex-col gap-2">
            {navLinks.map(link => (
              <Link 
                key={link.to} 
                to={link.to} 
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors"
                style={{ background: isActive(link.to) ? 'rgba(29,158,117,.1)' : 'transparent', color: isActive(link.to) ? 'var(--green)' : 'var(--text2)' }}
              >
                <link.icon size={20} /> {link.label}
              </Link>
            ))}
          </nav>

          <div className="pt-4 border-t flex flex-col gap-2" style={{borderColor:'var(--border)'}}>
            <div className="flex items-center gap-3 px-4 py-2">
              <div className="w-8 h-8 rounded flex items-center justify-center text-sm font-bold" style={{background:'rgba(29,158,117,.2)',color:'var(--green)'}}>
                {org?.name?.[0]}
              </div>
              <span className="text-sm font-medium" style={{color:'var(--text)'}}>{org?.name}</span>
            </div>
            
            <Link 
              to="/profile" 
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium" 
              style={{color:'var(--text2)'}}
            >
              <User size={20} /> Mi Perfil
            </Link>

            <button 
              onClick={() => { setMenuOpen(false); handleLogout(); }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-red-400"
            >
              <LogOut size={20} /> Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
