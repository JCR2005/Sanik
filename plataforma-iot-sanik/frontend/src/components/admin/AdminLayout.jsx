import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/auth'
import useThemeStore from '../../store/theme'
import { LayoutDashboard, Users, Cpu, Settings, LogOut, Shield, FileText, ChevronRight, Sun, Moon, Menu, X } from 'lucide-react'

const COLORS = {
  primary: "#67B7E8",
  primaryBg: "rgba(103, 183, 232, 0.15)",
  primaryAvatarBg: "rgba(103, 183, 232, 0.2)"
};

const AirSunBoxLogo = ({ size = 110 }) => (
  <svg width={size} height={(size * 500) / 900} viewBox="0 0 900 500" xmlns="http://www.w3.org/2000/svg">
    <style>{`
      .lbl-sidebar { stroke: ${COLORS.primary}; fill: none; stroke-width: 10; stroke-linecap: round; stroke-linejoin: round; }
      .lbt-sidebar { fill: ${COLORS.primary}; font-family: 'Syne', Arial, sans-serif; font-size: 72px; font-weight: bold; }
    `}</style>
    <circle className="lbl-sidebar" cx="260" cy="220" r="110" />
    <line className="lbl-sidebar" x1="260" y1="60" x2="260" y2="10" />
    <line className="lbl-sidebar" x1="260" y1="380" x2="260" y2="430" />
    <line className="lbl-sidebar" x1="110" y1="220" x2="50" y2="220" />
    <line className="lbl-sidebar" x1="410" y1="220" x2="470" y2="220" />
    <line className="lbl-sidebar" x1="150" y1="110" x2="105" y2="65" />
    <line className="lbl-sidebar" x1="370" y1="330" x2="415" y2="375" />
    <line className="lbl-sidebar" x1="370" y1="110" x2="415" y2="65" />
    <line className="lbl-sidebar" x1="150" y1="330" x2="105" y2="375" />
    <line className="lbl-sidebar" x1="205" y1="80" x2="185" y2="35" />
    <line className="lbl-sidebar" x1="315" y1="80" x2="335" y2="35" />
    <line className="lbl-sidebar" x1="205" y1="360" x2="185" y2="405" />
    <line className="lbl-sidebar" x1="315" y1="360" x2="335" y2="405" />
    <path className="lbl-sidebar" d="M470 180 C540 180,560 180,600 180 C650 180,670 120,620 120 C585 120,575 150,590 160" />
    <path className="lbl-sidebar" d="M450 220 C560 220,620 220,720 220 C790 220,810 140,740 140 C700 140,690 180,715 190" />
    <path className="lbl-sidebar" d="M470 280 C560 280,620 280,680 280 C740 280,760 350,700 350 C660 350,655 310,680 300" />
    <path className="lbl-sidebar" d="M720 270 C780 270,790 270,810 270 C850 270,860 330,820 330 C790 330,785 300,800 290" />
    <text className="lbt-sidebar" x="340" y="430">AirSunBox</text>
  </svg>
)

const NAV = [
  { label: 'Dashboard',   icon: LayoutDashboard, path: '/admin', roles: ['superadmin', 'admin', 'worker'] },
  { label: 'Clientes',    icon: Users,           path: '/admin/clientes', roles: ['superadmin', 'admin'] },
  { label: 'Solicitudes', icon: FileText,        path: '/admin/solicitudes', roles: ['superadmin', 'admin', 'worker'] },
  { label: 'Variables',   icon: Settings,        path: '/admin/variables', roles: ['superadmin', 'admin'] },
  { label: 'Equipo',      icon: Shield,          path: '/admin/equipo', roles: ['superadmin'] },
]

export default function AdminLayout({ children }) {
  const location = useLocation()
  const navigate  = useNavigate()
  const { user, logout } = useAuthStore()
  const { dark, toggle } = useThemeStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }
  const isActive = (path) => path === '/admin'
    ? location.pathname === '/admin'
    : location.pathname.startsWith(path)

  // Filtrar navegación por rol
  const filteredNav = NAV.filter(item => item.roles.includes(user?.role))

  return (
    <div className="min-h-screen flex font-sans" style={{background:'var(--bg)'}}>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`w-64 border-r flex flex-col fixed h-full z-50 transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} 
        style={{background:'var(--card)',borderColor:'var(--border)'}}
      >
        
        {/* Logo - Ahora centrado y limpio */}
        <div className="p-5 border-b flex items-center justify-center relative" style={{borderColor:'var(--border)'}}>
          <div className="flex flex-col items-center gap-1">
            <AirSunBoxLogo />
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full mt-1" style={{background: COLORS.primaryBg, color: COLORS.primary}}>
              Panel Admin
            </span>
          </div>
          {/* Close button for mobile */}
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden absolute right-4 top-1/2 -translate-y-1/2 p-2" style={{color:'var(--text2)'}}>
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {filteredNav.map(({ label, icon: Icon, path }) => (
            <Link key={path} to={path}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
              style={{
                background: isActive(path) ? COLORS.primaryBg : 'transparent',
                color: isActive(path) ? COLORS.primary : 'var(--text2)',
                fontWeight: isActive(path) ? 600 : 500
              }}>
              <Icon size={18} strokeWidth={isActive(path) ? 2.5 : 2} />
              {label}
              {isActive(path) && <ChevronRight size={14} className="ml-auto" />}
            </Link>
          ))}
        </nav>

        {/* User & Settings Section */}
        <div className="p-3 border-t" style={{borderColor:'var(--border)'}}>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-2" style={{background:'var(--bg)'}}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{background: COLORS.primaryAvatarBg, color: COLORS.primary}}>
              {user?.email?.[0]?.toUpperCase() || 'S'}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold truncate" style={{color:'var(--text)'}}>{user?.email || 'superadmin@sanik.io'}</div>
              <div className="text-xs capitalize font-medium" style={{color:'var(--text2)'}}>{user?.role || 'Superadmin'}</div>
            </div>

            {/* BOTÓN DE TEMA MOVIDO ACÁ */}
            <button onClick={toggle} className="p-1.5 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/10" style={{color:'var(--text2)'}} title={dark ? 'Modo claro' : 'Modo oscuro'}>
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
          
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-red-500/10 hover:text-red-500"
            style={{color:'var(--text2)'}}>
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 border-b flex items-center px-4 sticky top-0 z-30 backdrop-blur" style={{background:'var(--bg)90',borderColor:'var(--border)'}}>
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 rounded-lg" style={{color:'var(--text2)'}}>
            <Menu size={24} />
          </button>
          <div className="ml-4 font-bold text-lg" style={{color:'var(--text)', fontFamily: 'Syne'}}>Sanik Admin</div>
        </header>

        <main className="flex-1 lg:ml-64 min-h-screen" style={{background:'var(--bg)'}}>
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}