import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../services/api'
import useAuthStore from '../store/auth'
import logo from '../assets/airsunbox-logo.svg'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'

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
      navigate(res.redirect || '/devices')
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0F0D] flex flex-col">
      {/* Header mínimo */}
      <div className="p-6">
        <a href="/" className="flex items-center gap-2 w-fit">
          <img src={logo} alt="AirSunBox" className="h-9 w-auto object-contain" />
        </a>
      </div>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{background:'rgba(77,182,255,.12)'}}>
              <img src={logo} alt="AirSunBox" className="w-20 h-20 object-contain" />
            </div>
            <h1 className="text-white text-2xl font-bold mb-1">Ingresar a AirSunBox</h1>
            <p className="text-[#8FA899] text-sm">Plataforma de monitoreo ambiental IoT</p>
          </div>

          <div className="bg-[#121A16] border border-[#1E2E28] rounded-2xl p-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg p-3 mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[#8FA899] text-sm block mb-1.5">Correo electrónico</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8FA899]" />
                  <input
                    type="email"
                    placeholder="admin@empresa.com"
                    value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                    className="w-full bg-[#0A0F0D] border border-[#1E2E28] rounded-lg pl-10 pr-4 py-3 text-white text-sm outline-none focus:border-[#1D9E75] transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[#8FA899] text-sm block mb-1.5">Contraseña</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8FA899]" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})}
                    className="w-full bg-[#0A0F0D] border border-[#1E2E28] rounded-lg pl-10 pr-10 py-3 text-white text-sm outline-none focus:border-[#1D9E75] transition-colors"
                    required
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8FA899] hover:text-white">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1D9E75] hover:bg-[#25C48F] disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors mt-2"
              >
                {loading ? 'Ingresando...' : 'Ingresar'}
              </button>
            </form>
          </div>

          <p className="text-center text-[#8FA899] text-xs mt-6">
            ¿Necesitás acceso? Contactanos a{' '}
            <a href="mailto:contacto@AirSunBox.io" className="text-[#1D9E75] hover:underline">
              contacto@AirSunBox.io
            </a>
          </p>
        </div>
      </main>

      <footer className="p-4 text-center text-[#8FA899] text-xs">
        © 2026 AirSunBox · Monitoreo ambiental para Guatemala
      </footer>
    </div>
  )
}
