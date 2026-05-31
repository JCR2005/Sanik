import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { auth } from '../services/api'
import useAuthStore from '../store/auth'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'

// Paleta sincronizada con la Landing
const COLORS = {
  primary: "#67B7E8",
  accent: "#2BA8A0",
  bgLight: "#F0F7FC",    // Fondo exacto de la landing
  text: "#0A0F18",
  textMuted: "#5A7080",
  border: "#D6E8F5",
  card: "#FFFFFF"
};

// Logo exacto de la Landing
const AirSunBoxLogo = ({ size = 48 }) => (
  <svg
    width={size}
    height={(size * 500) / 900}
    viewBox="0 0 900 500"
    xmlns="http://www.w3.org/2000/svg"
  >
    <style>{`
      .lbl { stroke: #67B7E8; fill: none; stroke-width: 10; stroke-linecap: round; stroke-linejoin: round; }
      .lbt { fill: #67B7E8; font-family: 'Syne', Arial, sans-serif; font-size: 72px; font-weight: bold; }
    `}</style>
    <circle className="lbl" cx="260" cy="220" r="110" />
    <line className="lbl" x1="260" y1="60" x2="260" y2="10" />
    <line className="lbl" x1="260" y1="380" x2="260" y2="430" />
    <line className="lbl" x1="110" y1="220" x2="50" y2="220" />
    <line className="lbl" x1="410" y1="220" x2="470" y2="220" />
    <line className="lbl" x1="150" y1="110" x2="105" y2="65" />
    <line className="lbl" x1="370" y1="330" x2="415" y2="375" />
    <line className="lbl" x1="370" y1="110" x2="415" y2="65" />
    <line className="lbl" x1="150" y1="330" x2="105" y2="375" />
    <line className="lbl" x1="205" y1="80" x2="185" y2="35" />
    <line className="lbl" x1="315" y1="80" x2="335" y2="35" />
    <line className="lbl" x1="205" y1="360" x2="185" y2="405" />
    <line className="lbl" x1="315" y1="360" x2="335" y2="405" />
    <path className="lbl" d="M470 180 C540 180,560 180,600 180 C650 180,670 120,620 120 C585 120,575 150,590 160" />
    <path className="lbl" d="M450 220 C560 220,620 220,720 220 C790 220,810 140,740 140 C700 140,690 180,715 190" />
    <path className="lbl" d="M470 280 C560 280,620 280,680 280 C740 280,760 350,700 350 C660 350,655 310,680 300" />
    <path className="lbl" d="M720 270 C780 270,790 270,810 270 C850 270,860 330,820 330 C790 330,785 300,800 290" />
    <text className="lbt" x="340" y="430">AirSunBox</text>
  </svg>
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
      className="min-h-screen flex flex-col relative overflow-hidden" 
      style={{ 
        fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif',
        // Fondo idéntico al Hero de tu Landing
        background: `radial-gradient(ellipse 80% 60% at 50% 0%, rgba(103,183,232,.15) 0%, transparent 60%), ${COLORS.bgLight}` 
      }}
    >
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .logo-float {
          animation: float 5s ease-in-out infinite;
        }
      `}</style>

     

      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md">
          
          {/* Encabezado del Formulario (Logo flotando libre como en la landing) */}
          <div className="text-center mb-8">
            <div className="logo-float flex justify-center mb-6">
               <Link to="/" className="transition-transform hover:scale-105 duration-300">
                <AirSunBoxLogo size={200} />
              </Link>
            
            </div>
            <h1 
              className="text-3xl font-bold tracking-tight mb-2" 
              style={{ fontFamily: "'Syne', sans-serif", color: COLORS.text }}
            >
              Bienvenido
            </h1>
            <p className="text-base" style={{ color: COLORS.textMuted }}>
              Ingresá al panel de monitoreo ambiental
            </p>
          </div>

          {/* Tarjeta del Formulario Blanca y Limpia */}
          <div 
            className="rounded-[20px] p-6 sm:p-8 shadow-xl bg-white"
            style={{ border: `1.5px solid ${COLORS.border}` }}
          >
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
                <label className="text-sm font-semibold block mb-1.5" style={{ color: COLORS.text }}>
                  Correo electrónico
                </label>
                <div className="relative group">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#67B7E8]" style={{ color: COLORS.textMuted }} />
                  <input
                    type="email"
                    placeholder="admin@empresa.com"
                    value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                    className="w-full bg-white border rounded-xl pl-12 pr-4 py-3.5 text-sm outline-none transition-all duration-300 focus:ring-4"
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
                <label className="text-sm font-semibold block mb-1.5" style={{ color: COLORS.text }}>
                  Contraseña
                </label>
                <div className="relative group">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#67B7E8]" style={{ color: COLORS.textMuted }} />
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})}
                    className="w-full bg-white border rounded-xl pl-12 pr-12 py-3.5 text-sm outline-none transition-all duration-300 focus:ring-4"
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

              <button
                type="submit"
                disabled={loading}
                className="w-full text-white font-bold py-3.5 rounded-xl transition-all duration-300 mt-4 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ 
                  backgroundColor: COLORS.primary,
                  boxShadow: '0 4px 14px rgba(103, 183, 232, 0.4)' 
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#52A8E0';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(103, 183, 232, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.primary;
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(103, 183, 232, 0.4)';
                }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Autenticando...</span>
                  </>
                ) : 'Ingresar al panel'}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer minimalista */}
      <footer className="p-6 text-center text-xs relative z-10 font-medium" style={{ color: COLORS.textMuted }}>
        © {new Date().getFullYear()} AirSunBox · Monitoreo ambiental para Guatemala
      </footer>
    </div>
  )
}