import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import AdminLayout from '../../components/admin/AdminLayout'
import { devices as devicesApi, dots as dotsApi } from '../../services/api'
import { ArrowLeft, Wifi, WifiOff, MapPin, Bell } from 'lucide-react'
import MapPicker from '../../components/MapPicker'

const RANGES = ['1h', '6h', '24h', '7d', '30d']
const VARS = ['temperatura','humedad','so2','pm25','pm1','pm10','o3','nox','nh3','mq135_adc']
const COLORS = ['#4DB6FF','#60A5FA','#F59E0B','#A78BFA','#F87171','#34D399','#FB923C','#C084FC','#22D3EE','#FBBF24']

function SensorKPI({ variable, name, unit, value }) {
  return (
    <div className="border rounded-xl p-4" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs" style={{ color: 'var(--text2)' }}>{name}</span>
      </div>
      <div className="text-xl font-bold" style={{ color: 'var(--text)' }}>
        {value != null ? value.toFixed(1) : '—'}
        <span className="text-sm font-normal ml-1" style={{ color: 'var(--text2)' }}>{unit}</span>
      </div>
    </div>
  )
}

export default function AdminDeviceDetail() {
  const { clientId, deviceId } = useParams()
  const navigate = useNavigate()
  const [device, setDevice] = useState(null)
  const [variables, setVariables] = useState([])
  const [lastValues, setLastValues] = useState({})
  const [chartData, setChartData] = useState([])
  const [range, setRange] = useState('24h')
  const [activeVars, setActiveVars] = useState(['temperatura', 'humedad', 'pm25'])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', label: '', lat: '', lng: '' })

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [dev, vars, lv] = await Promise.all([
          devicesApi.get(deviceId, clientId),
          devicesApi.variables(deviceId, clientId),
          devicesApi.lastValues(deviceId, clientId)
        ])

        if (!active) return
        setDevice(dev)
        setEditForm({
          name: dev.name || '',
          label: dev.label || '',
          lat: dev.lat != null ? dev.lat.toString() : '',
          lng: dev.lng != null ? dev.lng.toString() : ''
        })
        setVariables(vars || [])
        const map = {}
        ;(lv || []).forEach(v => { map[v.label] = v.last_value })
        setLastValues(map)
      } catch (err) {
        if (active) setError(err.message || 'No se pudo cargar el dispositivo')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [clientId, deviceId])

  useEffect(() => {
    if (!deviceId) return
    dotsApi.getMultiple(deviceId, activeVars, range, clientId).then(data => {
      const timeMap = {}
      for (const [variable, points] of Object.entries(data || {})) {
        points.forEach(p => {
          const t = new Date(p.time).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })
          if (!timeMap[t]) timeMap[t] = { time: t }
          timeMap[t][variable] = p.value
        })
      }
      setChartData(Object.values(timeMap).slice(-60))
    }).catch(() => {})
  }, [clientId, deviceId, range, activeVars])

  const varMap = {}
  variables.forEach(v => { varMap[v.label] = v })

  const handleSave = async () => {
    const payload = {
      name: editForm.name || undefined,
      label: editForm.label || undefined,
      lat: editForm.lat ? parseFloat(editForm.lat) : null,
      lng: editForm.lng ? parseFloat(editForm.lng) : null
    }
    const updated = await devicesApi.update(deviceId, payload, clientId)
    setDevice(updated)
    setShowEdit(false)
  }

  const tokenPreview = device?.token ? device.token : '—'

  return (
    <AdminLayout>
      <div className="p-8">
        {loading ? (
          <div className="flex items-center justify-center h-64" style={{ color: 'var(--text2)' }}>Cargando...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
            <aside className="rounded-2xl border p-4 h-fit" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-3 mb-4">
                <button onClick={() => navigate(`/admin/clientes/${clientId}`)} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--text2)' }}>
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>{device?.name}</h1>
                  <span className="text-xs" style={{ color: 'var(--text2)' }}>{device?.label}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${device?.status === 'online' ? 'bg-[#1D9E75]/10 text-[#1D9E75]' : 'bg-[#DFF1FF] text-[#2E8ED3]'}`}>
                  {device?.status === 'online' ? <Wifi size={10} /> : <WifiOff size={10} />}
                  {device?.status === 'online' ? 'En línea' : 'Sin señal'}
                </span>
              </div>

              <div className="space-y-3 text-xs" style={{ color: 'var(--text2)' }}>
                <div>
                  <div className="uppercase tracking-wide">ID</div>
                  <div className="font-mono" style={{ color: 'var(--text)' }}>{device?.id}</div>
                </div>
                <div>
                  <div className="uppercase tracking-wide">Token</div>
                  <div className="font-mono break-all" style={{ color: 'var(--text)' }}>{tokenPreview}</div>
                </div>
                <div>
                  <div className="uppercase tracking-wide">Última actividad</div>
                  <div style={{ color: 'var(--text)' }}>{device?.last_seen ? new Date(device.last_seen).toLocaleString('es-GT') : '—'}</div>
                </div>
                <div>
                  <div className="uppercase tracking-wide">Ubicación</div>
                  <div style={{ color: 'var(--text)' }}>{device?.lat ? `${device.lat?.toFixed(6)}, ${device.lng?.toFixed(6)}` : '—'}</div>
                </div>
              </div>

              <Link
                to={`/alerts/${deviceId}`}
                className="flex items-center justify-center gap-2 mt-6 border px-3 py-2 rounded-lg text-sm transition-colors"
                style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}
              >
                <Bell size={14} /> Alertas
              </Link>

              <button
                onClick={() => setShowEdit(true)}
                className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--green)', color: 'white' }}
              >
                Editar dispositivo
              </button>
            </aside>

            <section>
              {error && (
                <div className="mb-4 border rounded-lg px-3 py-2 text-xs" style={{ borderColor: '#F97316', color: '#FDBA74', background: 'rgba(249,115,22,0.1)' }}>
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Variables</h2>
                <div className="flex items-center gap-2">
                  {RANGES.map(r => (
                    <button key={r} onClick={() => setRange(r)} className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${range === r ? 'bg-[#1D9E75] text-white' : 'bg-transparent'}`}
                      style={range === r ? {} : { color: 'var(--text2)', border: `1px solid var(--border)` }}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                {VARS.map((v) => (
                  <SensorKPI
                    key={v}
                    variable={v}
                    name={varMap[v]?.name || v}
                    unit={varMap[v]?.unit || ''}
                    value={lastValues[v]}
                  />
                ))}
              </div>

              <div className="border rounded-2xl p-6" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                <div className="flex flex-wrap gap-2 mb-4">
                  {VARS.filter(v => varMap[v]).map((v, i) => (
                    <button key={v} onClick={() => setActiveVars(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-all"
                      style={{ background: activeVars.includes(v) ? `${COLORS[i]}20` : 'transparent', color: activeVars.includes(v) ? COLORS[i] : 'var(--text2)', border: `1px solid ${activeVars.includes(v) ? COLORS[i] + '40' : 'var(--border)'}` }}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />
                      {varMap[v]?.name || v}
                    </button>
                  ))}
                </div>

                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="time" stroke="var(--text2)" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis stroke="var(--text2)" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: 'var(--card)', border: `1px solid var(--border)`, borderRadius: 8, color: 'var(--text)' }} />
                    {activeVars.map((v) => (
                      <Line key={v} type="monotone" dataKey={v} stroke={COLORS[VARS.indexOf(v)]} strokeWidth={2} dot={false} name={varMap[v]?.name || v} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
        )}
      </div>

      {showEdit && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl p-6 w-full max-w-lg border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold" style={{ color: 'var(--text)' }}>Editar dispositivo</h2>
              <button onClick={() => setShowEdit(false)} style={{ color: 'var(--text2)' }}>✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs block mb-1.5" style={{ color: 'var(--text2)' }}>Nombre</label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                />
              </div>
              <div>
                <label className="text-xs block mb-1.5" style={{ color: 'var(--text2)' }}>Etiqueta (label)</label>
                <input
                  value={editForm.label}
                  onChange={(e) => setEditForm(prev => ({ ...prev, label: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs block mb-1.5" style={{ color: 'var(--text2)' }}>Latitud</label>
                  <input
                    value={editForm.lat}
                    onChange={(e) => setEditForm(prev => ({ ...prev, lat: e.target.value }))}
                    type="number"
                    step="any"
                    className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none"
                    style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                </div>
                <div>
                  <label className="text-xs block mb-1.5" style={{ color: 'var(--text2)' }}>Longitud</label>
                  <input
                    value={editForm.lng}
                    onChange={(e) => setEditForm(prev => ({ ...prev, lng: e.target.value }))}
                    type="number"
                    step="any"
                    className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none"
                    style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs block mb-2" style={{ color: 'var(--text2)' }}>Seleccioná ubicación en el mapa</label>
                <MapPicker
                  lat={editForm.lat ? parseFloat(editForm.lat) : null}
                  lng={editForm.lng ? parseFloat(editForm.lng) : null}
                  onChange={({ lat, lng }) => setEditForm(prev => ({ ...prev, lat: lat.toFixed(6), lng: lng.toFixed(6) }))}
                  height={200}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEdit(false)}
                className="flex-1 border rounded-lg py-2.5 text-sm"
                style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex-1 rounded-lg py-2.5 text-sm font-medium"
                style={{ background: 'var(--green)', color: 'white' }}
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
