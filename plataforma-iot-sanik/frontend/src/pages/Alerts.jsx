import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import ClienteLayout from '../components/sanik/ClienteLayout'
import { alerts as alertsApi, devices as devicesApi } from '../services/api'
import { Bell, Plus, Trash2, ToggleLeft, ToggleRight, X } from 'lucide-react'

const VARIABLES = ['temperatura','humedad','so2','pm25','pm1','pm10','o3','nox','nh3']
const CONDITIONS = [{ value: '>', label: 'Mayor que' }, { value: '<', label: 'Menor que' }, { value: '=', label: 'Igual a' }]

export default function Alerts() {
  const { deviceId } = useParams()
  const [alertList, setAlertList] = useState([])
  const [device, setDevice] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ variable: 'pm25', condition: '>', threshold: '', channel: 'email', destination: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (deviceId) {
      devicesApi.get(deviceId).then(setDevice)
      alertsApi.list(deviceId).then(setAlertList)
    }
  }, [deviceId])

  const handleCreate = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const alert = await alertsApi.create({ deviceId, ...form, threshold: parseFloat(form.threshold) })
      setAlertList(prev => [alert, ...prev])
      setShowModal(false)
      setForm({ variable: 'pm25', condition: '>', threshold: '', channel: 'email', destination: '' })
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (alert) => {
    const updated = await alertsApi.toggle(alert.id, !alert.active)
    setAlertList(prev => prev.map(a => a.id === alert.id ? { ...a, active: updated.active } : a))
  }

  const handleDelete = async (id) => {
    await alertsApi.delete(id)
    setAlertList(prev => prev.filter(a => a.id !== id))
  }

  return (
    <ClienteLayout>
      <div className="p-6 lg:p-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Bell size={24} style={{ color: 'var(--primary)' }} /> Alertas
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text2)' }}>
              {device ? `Configuración para ${device.name}` : 'Configura tus notificaciones automáticas'}
            </p>
          </div>
          {deviceId && (
            <button 
              onClick={() => setShowModal(true)} 
              className="flex items-center gap-2 bg-[#67B7E8] hover:bg-[#52A8E0] text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-[#67B7E8]/20"
            >
              <Plus size={18} /> Nueva alerta
            </button>
          )}
        </div>

        {!deviceId ? (
          <div className="rounded-3xl p-12 text-center border border-dashed" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
             <Bell size={48} className="mx-auto mb-4 opacity-20" style={{ color: 'var(--text)' }} />
             <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>Selecciona un dispositivo</h3>
             <p className="text-sm" style={{ color: 'var(--text2)' }}>Para ver o crear alertas, primero selecciona una estación desde la sección de Dispositivos.</p>
          </div>
        ) : alertList.length === 0 ? (
          <div className="rounded-3xl p-12 text-center border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <Bell size={48} className="mx-auto mb-4 opacity-10" style={{ color: 'var(--text)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text2)' }}>No hay alertas configuradas para esta estación</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {alertList.map(alert => (
              <div 
                key={alert.id} 
                className={`group rounded-2xl p-5 border flex items-center gap-4 transition-all hover:shadow-md ${alert.active ? 'opacity-100' : 'opacity-60 grayscale'}`}
                style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#67B7E8]/10 text-[#67B7E8]">
                  <Bell size={20} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold capitalize" style={{ color: 'var(--text)' }}>
                    {alert.variable.replace('_', ' ')}
                  </div>
                  <div className="text-xs font-semibold mt-0.5" style={{ color: 'var(--text2)' }}>
                    Cuando sea {CONDITIONS.find(c => c.value === alert.condition)?.label.toLowerCase()} {alert.threshold}
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text2)' }}>Canal</div>
                    <div className="text-xs font-bold" style={{ color: 'var(--text)' }}>{alert.channel === 'email' ? 'Email' : 'Webhook'}</div>
                  </div>
                  
                  <button 
                    onClick={() => handleToggle(alert)} 
                    className="p-1 rounded-lg transition-colors"
                  >
                    {alert.active 
                      ? <ToggleRight size={28} style={{ color: 'var(--primary)' }} /> 
                      : <ToggleLeft size={28} style={{ color: 'var(--text2)' }} />
                    }
                  </button>
                  
                  <button 
                    onClick={() => handleDelete(alert.id)} 
                    className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="rounded-3xl p-8 w-full max-w-md border shadow-2xl" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-bold text-xl" style={{ color: 'var(--text)' }}>Nueva alerta</h2>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5" style={{ color: 'var(--text2)' }}>
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleCreate} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider block mb-2" style={{ color: 'var(--text2)' }}>Variable</label>
                    <select 
                      value={form.variable} 
                      onChange={e => setForm({...form, variable: e.target.value})} 
                      className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#67B7E8]/20"
                      style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                    >
                      {VARIABLES.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider block mb-2" style={{ color: 'var(--text2)' }}>Condición</label>
                    <select 
                      value={form.condition} 
                      onChange={e => setForm({...form, condition: e.target.value})} 
                      className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#67B7E8]/20"
                      style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                    >
                      {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-2" style={{ color: 'var(--text2)' }}>Valor Umbral</label>
                  <input 
                    value={form.threshold} 
                    onChange={e => setForm({...form, threshold: e.target.value})} 
                    placeholder="Ej. 50" 
                    type="number" 
                    step="any" 
                    required 
                    className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#67B7E8]/20"
                    style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider block mb-2" style={{ color: 'var(--text2)' }}>Canal</label>
                    <select 
                      value={form.channel} 
                      onChange={e => setForm({...form, channel: e.target.value})} 
                      className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#67B7E8]/20"
                      style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                    >
                      <option value="email">Email</option>
                      <option value="webhook">Webhook</option>
                    </select>
                  </div>
                  <div className="flex flex-col justify-end">
                    <p className="text-[10px] italic leading-tight" style={{ color: 'var(--text2)' }}>
                      {form.channel === 'email' ? 'Recibe un correo cuando se cumpla la condición.' : 'Se enviará un POST JSON a la URL indicada.'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-2" style={{ color: 'var(--text2)' }}>
                    {form.channel === 'email' ? 'Correo de destino' : 'URL del Webhook'}
                  </label>
                  <input 
                    value={form.destination} 
                    onChange={e => setForm({...form, destination: e.target.value})} 
                    placeholder={form.channel === 'email' ? 'ejemplo@correo.com' : 'https://api.tuweb.com/hook'} 
                    required 
                    className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#67B7E8]/20"
                    style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)} 
                    className="flex-1 rounded-xl py-3 text-sm font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    style={{ color: 'var(--text2)' }}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="flex-1 bg-[#67B7E8] hover:bg-[#52A8E0] text-white py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                  >
                    {loading ? 'Guardando...' : 'Crear Alerta'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ClienteLayout>
  )
}
