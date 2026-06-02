import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/auth'
import useThemeStore from '../../store/theme'
import { LayoutDashboard, Cpu, FileText, LogOut, ChevronRight, Sun, Moon, Bell, User, Menu, X } from 'lucide-react'

const COLORS = {
  primary: "#67B7E8",
  primaryHover: "rgba(103, 183, 232, 0.1)",
  primaryActive: "rgba(103, 183, 232, 0.15)",
};

const AirSunBoxLogo = ({ size = 140 }) => (
  <svg width={size} height={(size * 500) / 900} viewBox="0 0 900 500" xmlns="http://www.w3.org/2000/svg">
    <style>{`
      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-8px); }
      }
      .logo-float-admin { animation: float 5s ease-in-out infinite; }
      .lbl-sidebar { stroke: #67B7E8; fill: none; stroke-width: 10; stroke-linecap: round; stroke-linejoin: round; }
      .lbt-sidebar { fill: #67B7E8; font-family: 'Syne', Arial, sans-serif; font-size: 72px; font-weight: bold; }
    `}</style>
    <circle className="lbl-sidebar" cx="260" cy="220" r="110"/>
    <line className="lbl-sidebar" x1="260" y1="60" x2="260" y2="10"/>
    <line className="lbl-sidebar" x1="260" y1="380" x2="260" y2="430"/>
    <line className="lbl-sidebar" x1="110" y1="220" x2="50" y2="220"/>
    <line className="lbl-sidebar" x1="410" y1="220" x2="470" y2="220"/>
    <line className="lbl-sidebar" x1="150" y1="110" x2="105" y2="65"/>
    <line className="lbl-sidebar" x1="370" y1="330" x2="415" y2="375"/>
    <line className="lbl-sidebar" x1="370" y1="110" x2="415" y2="65"/>
    <line className="lbl-sidebar" x1="150" y1="330" x2="105" y2="375"/>
    <line className="lbl-sidebar" x1="205" y1="80" x2="185" y2="35"/>
    <line className="lbl-sidebar" x1="315" y1="80" x2="335" y2="35"/>
    <line className="lbl-sidebar" x1="205" y1="360" x2="185" y2="405"/>
    <line className="lbl-sidebar" x1="315" y1="360" x2="335" y2="405"/>
    <path className="lbl-sidebar" d="M470 180 C540 180,560 180,600 180 C650 180,670 120,620 120 C585 120,575 150,590 160"/>
    <path className="lbl-sidebar" d="M450 220 C560 220,620 220,720 220 C790 220,810 140,740 140 C700 140,690 180,715 190"/>
    <path className="lbl-sidebar" d="M470 280 C560 280,620 280,680 280 C740 280,760 350,700 350 C660 350,655 310,680 300"/>
    <path className="lbl-sidebar" d="M720 270 C780 270,790 270,810 270 C850 270,860 330,820 330 C790 330,785 300,800 290"/>
    <text className="lbt-sidebar" x="340" y="430">AirSunBox</text>
  </svg>
)

const CLIENT_NAV = [
  { label: 'Dashboard',    icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Estaciones',   icon: Cpu,             path: '/dispositivos' },
  { label: 'Reportes',     icon: FileText,        path: '/reportes' },
  { label: 'Alertas',      icon: Bell,            path: '/alerts' },
  { label: 'Solicitudes',  icon: FileText,        path: '/solicitudes' },
  { label: 'Mi Perfil',    icon: User,            path: '/profile' },
]

export default function ClienteLayout({ children }) {
  const location = useLocation()
  const navigate  = useNavigate()

  const { user, org, logout } = useAuthStore() 
  const { dark, toggle } = useThemeStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  const isActive = (path) => path === '/dashboard'
    ? location.pathname === '/dashboard'
    : location.pathname.startsWith(path)

  const displayLabel = org?.name ? org.name.toUpperCase() : 'PANEL CLIENTE'

  return (
    <div className="min-h-screen flex font-sans selection:bg-[#67B7E8] selection:text-white" style={{background:'var(--bg)'}}>

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar con el ancho y sombra de AdminLayout */}
      <aside 
        className={`w-[280px] flex flex-col fixed h-full z-50 transition-all duration-300 shadow-[4px_0_24px_rgba(0,0,0,0.02)] lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} 
        style={{background:'var(--card)'}}
      >

        {/* Header Logo Animado */}
        <div className="pt-8 pb-6 px-8 flex flex-col items-start gap-2 relative">
           <div className="logo-float-admin">
              <AirSunBoxLogo size={160} />
            </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wide" style={{background: COLORS.primaryHover, color: COLORS.primary}}>
            {displayLabel}
          </span>

          {/* Botón cerrar para móvil */}
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute right-4 top-8 p-2 text-[var(--text2)]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto">
          {CLIENT_NAV.map(({ label, icon: Icon, path }) => {
            const active = isActive(path);
            return (
              <Link 
                key={path} 
                to={path}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all duration-200 group"
                style={{
                  background: active ? COLORS.primaryActive : 'transparent',
                  color: active ? COLORS.primary : 'var(--text2)',
                  fontWeight: active ? 600 : 500
                }}
              >
                <Icon 
                  size={18} 
                  strokeWidth={active ? 2.5 : 2} 
                  className={`transition-transform duration-200 ${!active && 'group-hover:scale-110'}`} 
                />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight size={14} strokeWidth={3} className="opacity-70" />}
              </Link>
            )
          })}
        </nav>

        {/* Footer de Usuario Integrado (Estilo Tarjeta) */}
        <div className="p-4">
          <div className="rounded-2xl p-4 flex flex-col gap-4 border" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm" style={{background: COLORS.primary, color: '#fff'}}>
                {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'C'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate" style={{color:'var(--text)'}}>
                  {user?.name || user?.email || 'Usuario'}
                </div>
                <div className="text-xs font-medium mt-0.5 capitalize truncate" style={{color:'var(--text2)'}}>
                  Cliente
                </div>
              </div>
            </div>

            <div className="h-px w-full" style={{ background: 'var(--border)' }} />

            <div className="flex items-center justify-between gap-2">
              <button onClick={toggle} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{color:'var(--text2)'}}>
                {dark ? <Sun size={14} /> : <Moon size={14} />}
                {dark ? 'Claro' : 'Oscuro'}
              </button>

              <div className="w-px h-4" style={{ background: 'var(--border)' }} />

              <button onClick={() => { handleLogout(); setSidebarOpen(false); }} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-colors hover:bg-red-500/10 hover:text-red-500" style={{color:'var(--text2)'}}>
                <LogOut size={14} />
                Salir
              </button>
            </div>

          </div>
        </div>
      </aside>

      {/* Contenedor Principal ajustado al nuevo ancho */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen lg:ml-[280px]" style={{background:'var(--bg)'}}>

        {/* Header móvil */}
        <header className="lg:hidden h-16 border-b flex items-center px-6 sticky top-0 z-30 backdrop-blur-md" style={{background:'var(--bg)dd', borderColor:'var(--border)'}}>
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-xl"
            style={{color:'var(--text2)'}}
          >
            <Menu size={24} />
          </button>
          <div className="ml-4 font-bold text-lg" style={{color:'var(--text)', fontFamily: 'Syne'}}>Sanik Cloud</div>
        </header>

        <main className="flex-1 relative overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}