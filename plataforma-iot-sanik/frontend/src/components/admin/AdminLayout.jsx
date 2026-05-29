import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/auth'
import useThemeStore from '../../store/theme'
import logo from '../../assets/airsunbox-logo.svg'
import { LayoutDashboard, Users, Cpu, Settings, LogOut, Shield, FileText, ChevronRight, Sun, Moon } from 'lucide-react'

const NAV = [
  { label: 'Dashboard',   icon: LayoutDashboard, path: '/admin' },
  { label: 'Clientes',    icon: Users,           path: '/admin/clientes' },
  { label: 'Solicitudes', icon: FileText,        path: '/admin/solicitudes' },
  { label: 'Variables',   icon: Settings,        path: '/admin/variables' },
  { label: 'Equipo',      icon: Shield,          path: '/admin/equipo' },
]

export default function AdminLayout({ children }) {
  const location = useLocation()
  const navigate  = useNavigate()
  const { user, logout } = useAuthStore()
  const { dark, toggle } = useThemeStore()

  const handleLogout = () => { logout(); navigate('/login') }
  const isActive = (path) => path === '/admin'
    ? location.pathname === '/admin'
    : location.pathname.startsWith(path)

  return (
    <div className="min-h-screen flex" style={{background:'var(--bg)'}}>
      {/* Sidebar */}
      <aside className="w-64 border-r flex flex-col fixed h-full z-40" style={{background:'var(--card)',borderColor:'var(--border)'}}>
        {/* Logo */}
        <div className="p-5 border-b flex items-center justify-between" style={{borderColor:'var(--border)'}}>
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="AirSunBox" className="h-10 w-auto object-contain" />
            <div className="text-xs" style={{color:'var(--green)'}}>Panel Admin</div>
          </div>
          {/* Toggle tema */}
          <button onClick={toggle} className="p-1.5 rounded-lg transition-colors" style={{color:'var(--text2)'}} title={dark ? 'Modo claro' : 'Modo oscuro'}>
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ label, icon: Icon, path }) => (
            <Link key={path} to={path}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
              style={{
                background: isActive(path) ? 'rgba(29,158,117,.1)' : 'transparent',
                color: isActive(path) ? 'var(--green)' : 'var(--text2)',
                fontWeight: isActive(path) ? 500 : 400
              }}>
              <Icon size={16} />
              {label}
              {isActive(path) && <ChevronRight size={12} className="ml-auto" />}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t" style={{borderColor:'var(--border)'}}>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-2" style={{background:'var(--bg)'}}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{background:'rgba(29,158,117,.2)',color:'var(--green)'}}>
              {user?.email?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate" style={{color:'var(--text)'}}>{user?.email}</div>
              <div className="text-xs capitalize" style={{color:'var(--text2)'}}>{user?.role}</div>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all hover:text-red-400"
            style={{color:'var(--text2)'}}>
            <LogOut size={14} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 ml-64 min-h-screen" style={{background:'var(--bg)'}}>
        {children}
      </main>
    </div>
  )
}
