import { Link, useLocation, useNavigate } from 'react-router-dom'
import logo from '../../assets/airsunbox-logo.svg'
import { Cpu, User, LogOut, Shield, Sun, Moon } from 'lucide-react'
import useAuthStore from '../../store/auth'
import useThemeStore from '../../store/theme'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { org, user, logout } = useAuthStore()
  const { dark, toggle } = useThemeStore()

  const handleLogout = () => { logout(); navigate('/login') }
  const isActive = (path) => location.pathname.startsWith(path)

  return (
    <header className="sticky top-0 z-50 backdrop-blur border-b" style={{background:'var(--bg)90',borderColor:'var(--border)'}}>
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/devices" className="flex items-center gap-2">
            <img src={logo} alt="AirSunBox" className="h-9 w-auto object-contain" />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link to="/devices" className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors`}
              style={{ background: isActive('/devices') ? 'rgba(29,158,117,.1)' : 'transparent', color: isActive('/devices') ? 'var(--green)' : 'var(--text2)' }}>
              <Cpu size={14} /> Dispositivos
            </Link>
            {['admin','superadmin','worker'].includes(user?.role) && (
              <Link to="/admin" className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
                style={{ background: isActive('/admin') ? 'rgba(29,158,117,.1)' : 'transparent', color: isActive('/admin') ? 'var(--green)' : 'var(--text2)' }}>
                <Shield size={14} /> Admin
              </Link>
            )}
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

          <Link to="/profile" className="p-2 rounded-lg transition-colors" style={{color:'var(--text2)'}}>
            <User size={18} />
          </Link>

          <button onClick={handleLogout} className="p-2 rounded-lg transition-colors hover:text-red-400" style={{color:'var(--text2)'}}>
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}
