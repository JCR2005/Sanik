import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/sanik/Navbar'
import { devices as devicesApi } from '../services/api'
import useAuthStore from '../store/auth'
import { Plus, Search, Wifi, WifiOff, MapPin, Clock, X } from 'lucide-react'

function DeviceCard({ device, onClick }) {
  const isOnline = device.status === 'online'
  return (
    <div
      onClick={() => onClick(device.id)}
      className="bg-[#121A16] border border-[#1E2E28] hover:border-[#1D9E75]/40 rounded-2xl p-5 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-[#1D9E75]/5"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-white font-semibold">{device.name}</h3>
        <span className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${isOnline ? 'bg-[#1D9E75]/10 text-[#1D9E75]' : 'bg-[#1E2E28] text-[#8FA899]'}`}>
          {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-[#8FA899] text-sm mb-4">
        <MapPin size={12} />
        <span>{device.label}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-[#0A0F0D] rounded-lg p-2.5">
          <div className="text-[#8FA899] text-xs mb-1">Temperatura</div>
          <div className="text-white font-medium">{device.last_temp ?? '—'} °C</div>
        </div>
        <div className="bg-[#0A0F0D] rounded-lg p-2.5">
          <div className="text-[#8FA899] text-xs mb-1">Humedad</div>
          <div className="text-white font-medium">{device.last_hum ?? '—'} %</div>
        </div>
      </div>

      {device.last_seen && (
        <div className="flex items-center gap-1.5 text-[#8FA899] text-xs mt-3">
          <Clock size={10} />
          <span>Última conexión: {new Date(device.last_seen).toLocaleString('es-GT')}</span>
        </div>
      )}
    </div>
  )
}

function AddDeviceModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ label: '', name: '', lat: '', lng: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const device = await devicesApi.create({
        ...form,
        lat: parseFloat(form.lat) || null,
        lng: parseFloat(form.lng) || null
      })
      onCreated(device)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#121A16] border border-[#1E2E28] rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold text-lg">Nuevo dispositivo</h2>
          <button onClick={onClose} className="text-[#8FA899] hover:text-white"><X size={20} /></button>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg p-3 mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[#8FA899] text-sm block mb-1.5">Nombre</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Estación Central" className="w-full bg-[#0A0F0D] border border-[#1E2E28] rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-[#1D9E75]" required />
          </div>
          <div>
            <label className="text-[#8FA899] text-sm block mb-1.5">Label (ID en URL)</label>
            <input value={form.label} onChange={e => setForm({...form, label: e.target.value})} placeholder="estacion-central" className="w-full bg-[#0A0F0D] border border-[#1E2E28] rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-[#1D9E75]" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#8FA899] text-sm block mb-1.5">Latitud</label>
              <input value={form.lat} onChange={e => setForm({...form, lat: e.target.value})} placeholder="14.8347" type="number" step="any" className="w-full bg-[#0A0F0D] border border-[#1E2E28] rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-[#1D9E75]" />
            </div>
            <div>
              <label className="text-[#8FA899] text-sm block mb-1.5">Longitud</label>
              <input value={form.lng} onChange={e => setForm({...form, lng: e.target.value})} placeholder="-91.5181" type="number" step="any" className="w-full bg-[#0A0F0D] border border-[#1E2E28] rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-[#1D9E75]" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-[#1E2E28] text-[#8FA899] hover:text-white py-2.5 rounded-lg text-sm transition-colors">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 bg-[#1D9E75] hover:bg-[#25C48F] text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">{loading ? 'Creando...' : 'Crear'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Devices() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [deviceList, setDeviceList] = useState([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    devicesApi.list().then(setDeviceList).finally(() => setLoading(false))
  }, [])

  const filtered = deviceList.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.label.toLowerCase().includes(search.toLowerCase())
  )

  const online = deviceList.filter(d => d.status === 'online').length

  return (
    <div className="min-h-screen bg-[#0A0F0D]">
      <Navbar />
      {showModal && (
        <AddDeviceModal
          onClose={() => setShowModal(false)}
          onCreated={(d) => { setDeviceList(prev => [d, ...prev]); setShowModal(false) }}
        />
      )}

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-white text-2xl font-bold">Mis Dispositivos</h1>
            <p className="text-[#8FA899] text-sm mt-1">{deviceList.length} estaciones · {online} en línea</p>
          </div>
          {user?.role === 'admin' && (
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-[#1D9E75] hover:bg-[#25C48F] text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
              <Plus size={16} /> Agregar dispositivo
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total', value: deviceList.length, color: 'text-white' },
            { label: 'En línea', value: online, color: 'text-[#1D9E75]' },
            { label: 'Sin conexión', value: deviceList.length - online, color: 'text-[#8FA899]' },
            { label: 'Variables', value: 9, color: 'text-[#1D9E75]' },
          ].map(s => (
            <div key={s.label} className="bg-[#121A16] border border-[#1E2E28] rounded-xl p-4">
              <div className="text-[#8FA899] text-xs mb-1">{s.label}</div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8FA899]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar dispositivos..."
            className="w-full max-w-md bg-[#121A16] border border-[#1E2E28] rounded-lg pl-10 pr-4 py-2.5 text-white text-sm outline-none focus:border-[#1D9E75] transition-colors"
          />
        </div>

        {loading ? (
          <div className="text-center text-[#8FA899] py-12">Cargando dispositivos...</div>
        ) : filtered.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(d => <DeviceCard key={d.id} device={d} onClick={(id) => navigate(`/dashboard/${id}`)} />)}
          </div>
        ) : (
          <div className="text-center text-[#8FA899] py-12">
            {deviceList.length === 0 ? 'No hay dispositivos todavía.' : 'No se encontraron resultados.'}
          </div>
        )}
      </main>
    </div>
  )
}
