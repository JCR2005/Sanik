import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { auth } from '../services/api'
import useAuthStore from '../store/auth'
import { Mail, Lock, Eye, EyeOff, Activity, Bell, ArrowLeft } from 'lucide-react'

import logoImg from "../assets/logo2.svg";

const COLORS = {
  primary: "#67B7E8",
  accent: "#2BA8A0",
  bgLight: "#F0F7FC",
  text: "#0A0F18",
  textMuted: "#5A7080",
  border: "#D6E8F5",
  card: "#FFFFFF",
  featureBg: "rgba(103, 183, 232, 0.1)"
};

const AirSunBoxLogo = ({ size = 48 }) => (
  <img 
    src={logoImg} 
    alt="AirSunBox Logo" 
    style={{
      width: size,
      height: "auto", 
      display: "block"
    }}
  />
);

export default function Login() {
  const navigate = useNavigate()
  const login = useAuthStore(s => s.login)

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await auth.login(form.email, form.password)
      login(res.token, res.user, res.org)
      navigate(res.redirect || '/dispositivos')
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen flex flex-col md:flex-row overflow-hidden" 
      style={{ fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif' }}
    >
      {/* ===== LADO IZQUIERDO (Información y Branding) ===== */}
      <div 
        className="hidden md:flex w-full md:w-1/2 p-10 lg:p-20 flex-col justify-center relative"
        style={{ 
          background: `radial-gradient(circle at -10% 50%, rgba(103, 183, 232, 0.4) 0%, rgba(103, 183, 232, 0.15) 45%, ${COLORS.bgLight} 85%)` 
        }}
      >
        <div className="max-w-lg z-10">
          {/* Título Principal */}
          <h1 
            className="text-4xl lg:text-5xl font-bold tracking-tight mb-4 leading-tight" 
            style={{ color: COLORS.text, fontFamily: "'Syne', sans-serif" }}
          >
            Bienvenido a <br />
            <span style={{ color: COLORS.primary }}>Monitoreo Ambiental</span>
          </h1>
          
          <p className="text-base mb-12" style={{ color: COLORS.textMuted }}>
            Conecta, visualiza y gestiona la calidad del aire con tecnología avanzada y en tiempo real.
          </p>

          {/* Lista de características */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div 
                className="p-3 rounded-xl flex-shrink-0"
                style={{ backgroundColor: COLORS.featureBg, color: COLORS.primary }}
              >
                <Activity size={24} />
              </div>
              <div>
                <h3 className="font-bold text-sm mb-1" style={{ color: COLORS.text }}>Monitoreo en Tiempo Real</h3>
                <p className="text-sm" style={{ color: COLORS.textMuted }}>
                  Accede a datos precisos de temperatura, humedad y CO2 instantáneamente.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div 
                className="p-3 rounded-xl flex-shrink-0"
                style={{ backgroundColor: 'rgba(43, 168, 160, 0.1)', color: COLORS.accent }}
              >
                <Bell size={24} />
              </div>
              <div>
                <h3 className="font-bold text-sm mb-1" style={{ color: COLORS.text }}>Alertas y Notificaciones</h3>
                <p className="text-sm" style={{ color: COLORS.textMuted }}>
                  Recibe avisos inmediatos ante variaciones críticas en la calidad del aire.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== LADO DERECHO (Formulario) ===== */}
      <div className="w-full md:w-1/2 bg-white flex flex-col justify-center items-center p-6 md:p-12 relative overflow-y-auto">
        
        {/* NUEVO: BOTÓN PARA IR A LA PÁGINA PRINCIPAL */}
        <div className="absolute top-6 right-6 z-20">
          <a 
            href="https://voluble-creponne-e6c74f.netlify.app/" 
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl border transition-all duration-200 hover:shadow-sm"
            style={{ 
              borderColor: COLORS.border, 
              color: COLORS.textMuted,
              background: '#FFFFFF'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = COLORS.primary;
              e.currentTarget.style.color = COLORS.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = COLORS.border;
              e.currentTarget.style.color = COLORS.textMuted;
            }}
          >
            <ArrowLeft size={14} />
            Volver al inicio
          </a>
        </div>

        <div className="w-full max-w-md py-8">
          <div className="text-center mb-8 md:mb-10">
            
            {/* ENLACE EN EL LOGO HACIA LA LANDING */}
            <div className="mb-6 flex justify-center">
              <a 
                href="https://voluble-creponne-e6c74f.netlify.app/"
                className="transition-transform duration-200 hover:scale-105 inline-block"
                title="Ir a la página principal"
              >
                <AirSunBoxLogo size={200} />
              </a>
            </div>

            <h2 className="text-xl md:text-2xl font-bold mb-2 font-syne" style={{ color: COLORS.text }}>
              Inicia sesión
            </h2>
            <p className="text-sm" style={{ color: COLORS.textMuted }}>
              Usa tus credenciales para acceder al panel
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-3.5 mb-5 flex items-start gap-2.5">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: COLORS.textMuted }}>
                Correo electrónico
              </label>
              <div className="relative group">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#67B7E8]" style={{ color: COLORS.textMuted }} />
                <input
                  type="email"
                  placeholder="admin@AirSunBox.com"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full bg-[#F8FAFC] border rounded-xl pl-11 pr-4 py-3.5 text-sm outline-none transition-all duration-300 focus:bg-white focus:ring-4"
                  style={{ 
                    borderColor: COLORS.border,
                    color: COLORS.text,
                    '--tw-ring-color': 'rgba(103, 183, 232, 0.2)'
                  }}
                  onFocus={(e) => e.target.style.borderColor = COLORS.primary}
                  onBlur={(e) => e.target.style.borderColor = COLORS.border}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: COLORS.textMuted }}>
                Contraseña
              </label>
              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#67B7E8]" style={{ color: COLORS.textMuted }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  className="w-full bg-[#F8FAFC] border rounded-xl pl-11 pr-12 py-3.5 text-sm outline-none transition-all duration-300 focus:bg-white focus:ring-4"
                  style={{ 
                    borderColor: COLORS.border,
                    color: COLORS.text,
                    '--tw-ring-color': 'rgba(103, 183, 232, 0.2)'
                  }}
                  onFocus={(e) => e.target.style.borderColor = COLORS.primary}
                  onBlur={(e) => e.target.style.borderColor = COLORS.border}
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPass(!showPass)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors hover:scale-110"
                  style={{ color: COLORS.textMuted }}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-gray-300 text-[#67B7E8] focus:ring-[#67B7E8]"
                />
                <span className="text-xs font-medium" style={{ color: COLORS.textMuted }}>Recordarme</span>
              </label>
              <a href="#" className="text-xs font-semibold hover:underline" style={{ color: COLORS.primary }}>
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white font-bold py-3.5 rounded-xl transition-all duration-300 mt-6 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ 
                background: `linear-gradient(to right, #3bb4ffff , #80ceffff)`,
                boxShadow: '0 4px 14px rgba(103, 183, 232, 0.3)' 
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#52A8E0';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(103, 183, 232, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.primary;
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(103, 183, 232, 0.3)';
              }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Ingresando...</span>
                </>
              ) : 'Ingresar'}
            </button>
          </form>

          <p className="text-center text-sm mt-8" style={{ color: COLORS.textMuted }}>
            ¿No tienes cuenta?{' '}
            <a href="#" className="font-bold hover:underline" style={{ color: COLORS.primary }}>
              Crear cuenta
            </a>
          </p>
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 w-full text-center text-xs font-medium" style={{ color: COLORS.textMuted }}>
          © {new Date().getFullYear()} AirSunBox
        </div>
      </div>
    </div>
  )
}