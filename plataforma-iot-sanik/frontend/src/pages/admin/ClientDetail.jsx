import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import MapPicker from '../../components/MapPicker'
import { ArrowLeft, Plus, Wifi, WifiOff, Clock, CreditCard, Ban, CheckCircle, MapPin, X, ChevronRight } from 'lucide-react'
import { devices as devicesApi, organizations as orgsApi } from '../../services/api'

const EMPTY_CLIENT = {
  id: '',
  name: '',
  email: '',
  phone: '',
  location: '',
  plan: 'free',
  status: 'active',
  paidUntil: null,
  devices: [],
  payments: []
}

function AddDeviceModal({ clientId, onClose, onAdd }) {
  const [form, setForm] = useState({ name: '', label: '', lat: '', lng: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        orgId: clientId,
        name: form.name,
        label: form.label,
        lat: form.lat ? parseFloat(form.lat) : null,
        lng: form.lng ? parseFloat(form.lng) : null
      }
      const device = await devicesApi.create(payload)
      onAdd({
        id: device.id,
        name: device.name,
        label: device.label,
        status: device.status === 'online' ? 'active' : (device.status || 'pending'),
        lat: device.lat,
        lng: device.lng,
        lastSeen: device.last_seen || null,
        serial: device.serial || device.label || `SNK-${String(device.id).slice(0, 3)}`,
        token: device.token
      })
      onClose()
    } catch (err) {
      setError(err.message || 'No se pudo crear el dispositivo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#121A16] border border-[#1E2E28] rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold">Nuevo dispositivo</h2>
          <button onClick={onClose} className="text-[#8FA899] hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="border rounded-lg px-3 py-2 text-xs" style={{ borderColor: '#EF4444', color: '#FCA5A5', background: 'rgba(239,68,68,0.1)' }}>
              {error}
            </div>
          )}
          {[['Nombre','name','Estación Central','text'],['Label (ID)','label','estacion-central','text']].map(([l,n,p,t]) => (
            <div key={n}>
              <label className="text-[#8FA899] text-xs block mb-1.5">{l}</label>
              <input type={t} value={form[n]} onChange={e => setForm({...form, [n]: e.target.value})} placeholder={p} className="w-full bg-[#0A0F0D] border border-[#1E2E28] rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#1D9E75]" required />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            {[['Latitud','lat','14.8347'],['Longitud','lng','-91.5181']].map(([l,n,p]) => (
              <div key={n}>
                <label className="text-[#8FA899] text-xs block mb-1.5">{l}</label>
                <input type="number" step="any" value={form[n]} onChange={e => setForm({...form, [n]: e.target.value})} placeholder={p} className="w-full bg-[#0A0F0D] border border-[#1E2E28] rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#1D9E75]" />
              </div>
            ))}
          </div>
          <div>
            <label className="text-[#8FA899] text-xs block mb-2">Seleccioná ubicación en el mapa</label>
            <MapPicker
              lat={form.lat ? parseFloat(form.lat) : null}
              lng={form.lng ? parseFloat(form.lng) : null}
              onChange={({ lat, lng }) => setForm(prev => ({ ...prev, lat: lat.toFixed(6), lng: lng.toFixed(6) }))}
              height={180}
            />
          </div>
          <div className="bg-[#1D9E75]/10 border border-[#1D9E75]/20 rounded-lg p-3 text-xs text-[#25C48F]">
            Al crear, el estado será <strong>Pendiente</strong>. Cambialo a Activo cuando entregues la estación al cliente.
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 border border-[#1E2E28] text-[#8FA899] py-2.5 rounded-lg text-sm">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 bg-[#1D9E75] hover:bg-[#25C48F] text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50">{loading ? 'Creando...' : 'Crear'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminClientDetail() {
  const { clientId } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(EMPTY_CLIENT)
  const [showAddDevice, setShowAddDevice] = useState(false)
  const [tab, setTab] = useState('devices')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const statusConfig = {
    active:  { label: 'Activo',    bg: 'bg-[#1D9E75]/10',    text: 'text-[#1D9E75]' },
    pending: { label: 'Pendiente', bg: 'bg-amber-500/10',    text: 'text-amber-400' },
    offline: { label: 'Sin señal', bg: 'bg-[#DFF1FF]',       text: 'text-[#2E8ED3]' },
    inactive:{ label: 'Inactivo',  bg: 'bg-red-500/10',      text: 'text-red-400' },
  }

  const normalizeDeviceStatus = (status) => {
    if (!status) return 'offline'
    if (status === 'online') return 'active'
    if (status === 'offline') return 'offline'
    return status
  }

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setLoadError('')
      try {
        const [org, devices] = await Promise.all([
          orgsApi.get(clientId),
          devicesApi.list(clientId)
        ])

        if (!active) return

        setClient({
          id: org.id,
          name: org.name,
          email: org.email || '',
          phone: org.phone || '',
          location: org.location || '',
          plan: org.plan || 'free',
          status: org.status || 'active',
          paidUntil: org.paid_until || org.paidUntil || null,
          devices: (devices || []).map(d => ({
            id: d.id,
            name: d.name,
            label: d.label,
            status: normalizeDeviceStatus(d.status),
            lat: d.lat,
            lng: d.lng,
            lastSeen: d.last_seen || d.lastSeen || null,
            serial: d.serial || d.label || `SNK-${String(d.id).slice(0, 3)}`,
            token: d.token
          })),
          payments: []
        })
      } catch (err) {
        if (active) setLoadError(err.message || 'No se pudo cargar el cliente')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [clientId])

  const handleActivate = (deviceId) => {
    setClient(prev => ({ ...prev, devices: prev.devices.map(d => d.id === deviceId ? { ...d, status: 'active' } : d) }))
  }

  const handlePayment = (paymentId) => {
    setClient(prev => ({ ...prev, payments: prev.payments.map(p => p.id === paymentId ? { ...p, status: 'paid' } : p) }))
  }

  return (
    <AdminLayout>
      {showAddDevice && (
        <AddDeviceModal
          clientId={clientId}
          onClose={() => setShowAddDevice(false)}
          onAdd={d => { setClient(prev => ({ ...prev, devices: [...prev.devices, d] })); setShowAddDevice(false) }}
        />
      )}

      <div className="p-8">
        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <button onClick={() => navigate('/admin/clientes')} className="text-[#8FA899] hover:text-white p-2 rounded-lg hover:bg-[#121A16] mt-1 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-white text-2xl font-bold">{loading ? 'Cargando...' : (client.name || 'Cliente')}</h1>
              <span className={`text-xs px-2.5 py-1 rounded-full ${client.status === 'active' ? 'bg-[#1D9E75]/10 text-[#1D9E75]' : 'bg-red-500/10 text-red-400'}`}>
                {client.status === 'active' ? 'Activo' : 'Suspendido'}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-[#1E2E28] text-[#8FA899] capitalize">{client.plan}</span>
            </div>
            <p className="text-[#8FA899] text-sm mt-1">{client.email} · {client.phone} · {client.location}</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 border border-[#1E2E28] text-[#8FA899] hover:text-white px-3 py-2 rounded-lg text-sm transition-colors">
              <Ban size={14} /> Suspender
            </button>
            <button onClick={() => setShowAddDevice(true)} className="flex items-center gap-2 bg-[#1D9E75] hover:bg-[#25C48F] text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
              <Plus size={14} /> Nuevo dispositivo
            </button>
          </div>
        </div>

        {loadError && (
          <div className="mb-4 border rounded-lg px-3 py-2 text-xs" style={{ borderColor: '#F97316', color: '#FDBA74', background: 'rgba(249,115,22,0.1)' }}>
            {loadError}
          </div>
        )}

        {/* Stats rápidos */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            ['Dispositivos', client.devices.length, '#F0F5F2'],
            ['Activos', client.devices.filter(d=>d.status==='active').length, '#1D9E75'],
            ['Pendientes', client.devices.filter(d=>d.status==='pending').length, '#F59E0B'],
            ['Pago hasta', client.paidUntil ? new Date(client.paidUntil).toLocaleDateString('es-GT') : '—', '#60A5FA'],
          ].map(([l, v, c]) => (
            <div key={l} className="bg-[#121A16] border border-[#1E2E28] rounded-xl p-4">
              <div className="text-[#8FA899] text-xs mb-1">{l}</div>
              <div className="text-lg font-bold" style={{ color: c, fontFamily: 'Syne,sans-serif' }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[#121A16] border border-[#1E2E28] rounded-xl p-1 w-fit">
          {[['devices','Dispositivos'],['payments','Pagos']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === key ? 'bg-[#1D9E75] text-white' : 'text-[#8FA899] hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Dispositivos */}
        {tab === 'devices' && (
          <div className="space-y-3">
            {client.devices.map(d => {
              const sc = statusConfig[d.status] || statusConfig.offline
              return (
                <div key={d.id} className="bg-[#121A16] border border-[#1E2E28] rounded-xl p-4 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-white font-medium">{d.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>{sc.label}</span>
                      <span className="text-[#8FA899] text-xs font-mono">{d.serial}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#8FA899]">
                      {d.lat && <span className="flex items-center gap-1"><MapPin size={10} />{d.lat?.toFixed(4)}, {d.lng?.toFixed(4)}</span>}
                      {d.lastSeen && <span>Última señal: {new Date(d.lastSeen).toLocaleString('es-GT')}</span>}
                      <span className="font-mono text-[#8FA899]">Token: {(d.token || d.id).slice(0,8)}...</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {d.status === 'pending' && (
                      <button onClick={() => handleActivate(d.id)} className="flex items-center gap-1.5 bg-[#1D9E75]/10 hover:bg-[#1D9E75]/20 text-[#1D9E75] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                        <CheckCircle size={12} /> Activar
                      </button>
                    )}
                    <button onClick={() => navigate(`/admin/clientes/${clientId}/dispositivo/${d.id}`)} className="text-[#8FA899] hover:text-white p-1.5 rounded-lg hover:bg-[#1E2E28] transition-colors">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagos */}
        {tab === 'payments' && (
          <div className="bg-[#121A16] border border-[#1E2E28] rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1E2E28]">
                  {['Fecha','Monto','Estado','Nota',''].map(h => (
                    <th key={h} className="text-left text-[#8FA899] text-xs font-medium px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {client.payments.map(p => (
                  <tr key={p.id} className="border-b border-[#1E2E28] last:border-0">
                    <td className="px-5 py-3 text-white text-sm">{new Date(p.date).toLocaleDateString('es-GT')}</td>
                    <td className="px-5 py-3 text-white text-sm font-medium">Q{p.amount}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full ${p.status === 'paid' ? 'bg-[#1D9E75]/10 text-[#1D9E75]' : 'bg-amber-500/10 text-amber-400'}`}>
                        {p.status === 'paid' ? 'Pagado' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[#8FA899] text-sm">{p.note || '—'}</td>
                    <td className="px-5 py-3">
                      {p.status === 'pending' && (
                        <button onClick={() => handlePayment(p.id)} className="flex items-center gap-1.5 bg-[#1D9E75]/10 hover:bg-[#1D9E75]/20 text-[#1D9E75] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                          <CheckCircle size={12} /> Marcar pagado
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
