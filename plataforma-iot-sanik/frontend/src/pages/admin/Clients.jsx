import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import { Search, Plus, X, ChevronRight } from 'lucide-react'

const MOCK_CLIENTS = [
  { id: '1', name: 'Municipalidad Xela', slug: 'municipalidad-xela', plan: 'Pro', devices: 3, activeDevices: 2, email: 'admin@xela.gob.gt', phone: '77612345', location: 'Quetzaltenango', status: 'active', paidUntil: '2026-06-01', createdAt: '2026-01-15' },
  { id: '2', name: 'CUNOC', slug: 'cunoc', plan: 'Empresarial', devices: 2, activeDevices: 2, email: 'investigacion@cunoc.edu.gt', phone: '77612346', location: 'Quetzaltenango', status: 'active', paidUntil: '2026-07-01', createdAt: '2026-02-01' },
  { id: '3', name: 'Empresa Industrial S.A.', slug: 'empresa-industrial', plan: 'Pro', devices: 1, activeDevices: 1, email: 'admin@industrial.com', phone: '55123456', location: 'Xela, Zona Industrial', status: 'suspended', paidUntil: '2026-04-01', createdAt: '2026-03-10' },
]

const INPUT = "w-full border rounded-lg px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#1D9E75]"
const inputStyle = { background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }

// Modal FUERA del componente padre para evitar re-renders que pierden el foco
function CreateClientModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ orgName: '', email: '', phone: '', location: '', plan: 'free' })
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      onCreate({
        id: Date.now().toString(),
        name: form.orgName,
        slug: form.orgName.toLowerCase().replace(/\s/g, '-'),
        plan: form.plan, devices: 0, activeDevices: 0,
        email: form.email, phone: form.phone, location: form.location,
        status: 'active', paidUntil: null, createdAt: new Date().toISOString()
      })
      setLoading(false)
      onClose()
    }, 800)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-lg" style={{ color: 'var(--text)' }}>Nuevo cliente</h2>
          <button onClick={onClose} style={{ color: 'var(--text2)' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
          <label className="text-xs block mb-1.5" style={{ color: 'var(--text2)' }}>
            Nombre de la organización <span style={{ color: '#EF4444' }}>*</span>
          </label>            
          <input className={INPUT} style={inputStyle} value={form.orgName} onChange={set('orgName')} placeholder="Municipalidad de..." required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs block mb-1.5" style={{ color: 'var(--text2)' }}>
                Correo electrónico <span style={{ color: 'var(--text2)', fontSize: '0.65rem' }}>(opcional)</span>
              </label>
              <input className={INPUT} style={inputStyle} type="email" value={form.email} onChange={set('email')} placeholder="admin@org.com" />
            </div>
            <div>
            <label className="text-xs block mb-1.5" style={{ color: 'var(--text2)' }}>
              Teléfono <span style={{ color: 'var(--text2)', fontSize: '0.65rem' }}>(opcional)</span>
            </label>
              <input
                className={INPUT}
                style={inputStyle}
                value={form.phone}
                onChange={e => {
                  const d = e.target.value.replace(/\D/g, '').slice(0, 8)
                  setForm(prev => ({ ...prev, phone: d.length > 4 ? `${d.slice(0,4)}-${d.slice(4)}` : d }))
                }}
                placeholder="7761-2345"
                maxLength={9}
              />
            </div>
          </div>
          <div>
            <label className="text-xs block mb-1.5" style={{ color: 'var(--text2)' }}>
              Ubicación <span style={{ color: 'var(--text2)', fontSize: '0.65rem' }}>(opcional)</span>
            </label>
            <input className={INPUT} style={inputStyle} value={form.location} onChange={set('location')} placeholder="Quetzaltenango, Guatemala" />
          </div>
        
          <div>
            <label className="text-xs block mb-1.5" style={{ color: 'var(--text2)' }}>Plan inicial</label>
            <select className={INPUT} style={inputStyle} value={form.plan} onChange={set('plan')}>
              <option value="free">Gratuito — Q0/mes</option>
              <option value="pro">Pro — Q299/mes</option>
              <option value="enterprise">Empresarial — Personalizado</option>
            </select>
          </div>
           
          <div className="flex gap-3 pt-2">
           
            <button type="button" onClick={onClose} className="flex-1 border rounded-lg py-2.5 text-sm transition-colors" style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}>Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 bg-[#1D9E75] hover:bg-[#25C48F] text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50">
              {loading ? 'Creando...' : 'Crear cliente'}
            </button>
          </div>
          <p className="text-center text-xs" style={{ color: 'var(--text2)' }}>
              <span style={{ color: '#EF4444' }}>*</span> Campo obligatorio
            </p>
        </form>
      </div>
    </div>
  )
}

export default function AdminClients() {
  const navigate = useNavigate()
  const [clients, setClients] = useState(MOCK_CLIENTS)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  const planColor = { free: 'var(--text2)', pro: '#1D9E75', empresarial: '#A78BFA', pro: '#1D9E75' }
  const statusBadge = { active: 'bg-[#1D9E75]/10 text-[#1D9E75]', suspended: 'bg-red-500/10 text-red-400', pending: 'bg-amber-500/10 text-amber-400' }
  const statusLabel = { active: 'Activo', suspended: 'Suspendido', pending: 'Pendiente' }

  return (
    <AdminLayout>
      {showModal && (
        <CreateClientModal
          onClose={() => setShowModal(false)}
          onCreate={c => { setClients(prev => [c, ...prev]); setShowModal(false) }}
        />
      )}
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Clientes</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text2)' }}>{clients.length} organizaciones registradas</p>
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-[#1D9E75] hover:bg-[#25C48F] text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} /> Nuevo cliente
          </button>
        </div>

        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text2)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            className="w-full max-w-md border rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[#1D9E75]"
            style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)' }}
          />
        </div>

        <div className="border rounded-2xl overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                {['Organización', 'Plan', 'Dispositivos', 'Estado', 'Pago hasta', ''].map(h => (
                  <th key={h} className="text-left text-xs font-medium px-5 py-3" style={{ color: 'var(--text2)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} onClick={() => navigate(`/admin/clientes/${c.id}`)}
                  className="border-b last:border-0 cursor-pointer transition-colors hover:opacity-80"
                  style={{ borderColor: 'var(--border)' }}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#1D9E75]/10 flex items-center justify-center text-[#1D9E75] font-bold text-sm">{c.name[0]}</div>
                      <div>
                        <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>{c.name}</div>
                        <div className="text-xs" style={{ color: 'var(--text2)' }}>{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm capitalize" style={{ color: planColor[c.plan?.toLowerCase()] || 'var(--text2)' }}>{c.plan}</td>
                  <td className="px-5 py-4">
                    <span className="text-sm" style={{ color: 'var(--text)' }}>{c.activeDevices}/{c.devices}</span>
                    <span className="text-xs ml-1" style={{ color: 'var(--text2)' }}>activos</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full ${statusBadge[c.status]}`}>{statusLabel[c.status]}</span>
                  </td>
                  <td className="px-5 py-4 text-sm" style={{ color: 'var(--text2)' }}>
                    {c.paidUntil ? new Date(c.paidUntil).toLocaleDateString('es-GT') : '—'}
                  </td>
                  <td className="px-5 py-4"><ChevronRight size={16} style={{ color: 'var(--text2)' }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}
