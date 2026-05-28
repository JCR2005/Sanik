import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Navbar from '../components/sanik/Navbar'
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
    devicesApi.get(deviceId).then(setDevice)
    alertsApi.list(deviceId).then(setAlertList)
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
    <div className="min-h-screen bg-[#0A0F0D]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-white text-2xl font-bold flex items-center gap-2"><Bell size={20} className="text-[#1D9E75]" /> Alertas</h1>
            <p className="text-[#8FA899] text-sm mt-1">{device?.name}</p>
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-[#1D9E75] hover:bg-[#25C48F] text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} /> Nueva alerta
          </button>
        </div>

        {alertList.length === 0 ? (
          <div className="text-center text-[#8FA899] py-16 bg-[#121A16] border border-[#1E2E28] rounded-2xl">
            <Bell size={32} className="mx-auto mb-3 opacity-30" />
            <p>No hay alertas configuradas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alertList.map(alert => (
              <div key={alert.id} className={`bg-[#121A16] border rounded-xl p-4 flex items-center gap-4 ${alert.active ? 'border-[#1E2E28]' : 'border-[#1E2E28] opacity-50'}`}>
                <div className="flex-1">
                  <div className="text-white text-sm font-medium">
                    {alert.variable} {alert.condition} {alert.threshold}
                  </div>
                  <div className="text-[#8FA899] text-xs mt-1">
                    {alert.channel === 'email' ? '📧' : '🔗'} {alert.destination}
                  </div>
                </div>
                <button onClick={() => handleToggle(alert)} className="text-[#8FA899] hover:text-[#1D9E75] transition-colors">
                  {alert.active ? <ToggleRight size={24} className="text-[#1D9E75]" /> : <ToggleLeft size={24} />}
                </button>
                <button onClick={() => handleDelete(alert.id)} className="text-[#8FA899] hover:text-red-400 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#121A16] border border-[#1E2E28] rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white font-bold text-lg">Nueva alerta</h2>
                <button onClick={() => setShowModal(false)} className="text-[#8FA899] hover:text-white"><X size={20} /></button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="text-[#8FA899] text-xs block mb-1.5">Variable</label>
                    <select value={form.variable} onChange={e => setForm({...form, variable: e.target.value})} className="w-full bg-[#0A0F0D] border border-[#1E2E28] rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#1D9E75]">
                      {VARIABLES.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className="text-[#8FA899] text-xs block mb-1.5">Condición</label>
                    <select value={form.condition} onChange={e => setForm({...form, condition: e.target.value})} className="w-full bg-[#0A0F0D] border border-[#1E2E28] rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#1D9E75]">
                      {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className="text-[#8FA899] text-xs block mb-1.5">Valor</label>
                    <input value={form.threshold} onChange={e => setForm({...form, threshold: e.target.value})} placeholder="50" type="number" step="any" className="w-full bg-[#0A0F0D] border border-[#1E2E28] rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#1D9E75]" required />
                  </div>
                </div>
                <div>
                  <label className="text-[#8FA899] text-xs block mb-1.5">Canal</label>
                  <select value={form.channel} onChange={e => setForm({...form, channel: e.target.value})} className="w-full bg-[#0A0F0D] border border-[#1E2E28] rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#1D9E75]">
                    <option value="email">Correo electrónico</option>
                    <option value="webhook">Webhook</option>
                  </select>
                </div>
                <div>
                  <label className="text-[#8FA899] text-xs block mb-1.5">{form.channel === 'email' ? 'Correo destino' : 'URL del webhook'}</label>
                  <input value={form.destination} onChange={e => setForm({...form, destination: e.target.value})} placeholder={form.channel === 'email' ? 'admin@empresa.com' : 'https://...'} className="w-full bg-[#0A0F0D] border border-[#1E2E28] rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#1D9E75]" required />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-[#1E2E28] text-[#8FA899] hover:text-white py-2.5 rounded-lg text-sm transition-colors">Cancelar</button>
                  <button type="submit" disabled={loading} className="flex-1 bg-[#1D9E75] hover:bg-[#25C48F] text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">{loading ? 'Creando...' : 'Crear alerta'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
