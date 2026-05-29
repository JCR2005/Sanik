import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import Navbar from '../components/sanik/Navbar'
import { devices as devicesApi, dots as dotsApi } from '../services/api'
import { ArrowLeft, Wifi, WifiOff, MapPin, Bell, RefreshCw } from 'lucide-react'

const RANGES = ['1h', '6h', '24h', '7d', '30d']
const VARS = ['temperatura','humedad','so2','pm25','pm1','pm10','o3','nox','nh3','mq135_adc']
const COLORS = ['#4DB6FF','#60A5FA','#F59E0B','#A78BFA','#F87171','#34D399','#FB923C','#C084FC','#22D3EE','#FBBF24']

const STATUS = {
  temperatura: { good: [0,28], mod: [28,35] },
  humedad: { good: [30,70], mod: [70,85] },
  pm25: { good: [0,25], mod: [25,50] },
  pm10: { good: [0,50], mod: [50,100] },
  so2: { good: [0,50], mod: [50,100] },
  o3: { good: [0,50], mod: [50,100] },
  nox: { good: [0,40], mod: [40,80] },
  nh3: { good: [0,25], mod: [25,50] },
}

function getStatus(variable, value) {
  const s = STATUS[variable]
  if (!s || value == null) return 'good'
  if (value >= s.good[0] && value <= s.good[1]) return 'good'
  if (value >= s.mod[0] && value <= s.mod[1]) return 'moderate'
  return 'bad'
}

function SensorKPI({ variable, name, unit, value }) {
  const status = getStatus(variable, value)
  const colors = { good: 'var(--green)', moderate: '#F59E0B', bad: '#EF4444' }
  const bgs = { good: 'bg-[#1D9E75]/10', moderate: 'bg-amber-500/10', bad: 'bg-red-500/10' }
  const labels = { good: 'Bueno', moderate: 'Moderado', bad: 'Alto' }

  return (
    <div className="border rounded-xl p-4" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs" style={{ color: 'var(--text2)' }}>{name}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${bgs[status]}`} style={{ color: colors[status] }}>
          {labels[status]}
        </span>
      </div>
      <div className="text-xl font-bold" style={{ color: 'var(--text)' }}>
        {value != null ? value.toFixed(1) : '—'}
        <span className="text-sm font-normal ml-1" style={{ color: 'var(--text2)' }}>{unit}</span>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [device, setDevice] = useState(null)
  const [variables, setVariables] = useState([])
  const [lastValues, setLastValues] = useState({})
  const [chartData, setChartData] = useState([])
  const [range, setRange] = useState('24h')
  const [activeVars, setActiveVars] = useState(['temperatura', 'humedad', 'pm25'])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      devicesApi.get(id),
      devicesApi.variables(id),
      devicesApi.lastValues(id)
    ]).then(([dev, vars, lv]) => {
      setDevice(dev)
      setVariables(vars)
      const map = {}
      lv.forEach(v => { map[v.label] = v.last_value })
      setLastValues(map)
    }).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!id) return
    dotsApi.getMultiple(id, activeVars, range).then(data => {
      // Merge all variables into time-based array
      const timeMap = {}
      for (const [variable, points] of Object.entries(data)) {
        points.forEach(p => {
          const t = new Date(p.time).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })
          if (!timeMap[t]) timeMap[t] = { time: t }
          timeMap[t][variable] = p.value
        })
      }
      setChartData(Object.values(timeMap).slice(-60))
    })
  }, [id, range, activeVars])

  if (loading) return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <div className="flex items-center justify-center h-64" style={{ color: 'var(--text2)' }}>Cargando...</div>
    </div>
  )

  const varMap = {}
  variables.forEach(v => { varMap[v.label] = v })

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Panel lateral tipo Ubidots */}
          <aside className="rounded-2xl border p-4 h-fit" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => navigate('/devices')} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--text2)' }}>
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
                <div className="uppercase tracking-wide">Última actividad</div>
                <div style={{ color: 'var(--text)' }}>{device?.last_seen ? new Date(device.last_seen).toLocaleString('es-GT') : '—'}</div>
              </div>
              <div>
                <div className="uppercase tracking-wide">Ubicación</div>
                <div style={{ color: 'var(--text)' }}>{device?.lat ? `${device.lat?.toFixed(6)}, ${device.lng?.toFixed(6)}` : '—'}</div>
              </div>
            </div>

            <Link
              to={`/alerts/${id}`}
              className="flex items-center justify-center gap-2 mt-6 border px-3 py-2 rounded-lg text-sm transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}
            >
              <Bell size={14} /> Alertas
            </Link>
          </aside>

          {/* Panel principal */}
          <section>
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

            <div className="border rounded-2xl p-6 mb-6" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
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
                  {activeVars.map((v, i) => (
                    <Line key={v} type="monotone" dataKey={v} stroke={COLORS[VARS.indexOf(v)]} strokeWidth={2} dot={false} name={varMap[v]?.name || v} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {device?.lat && (
              <div className="border rounded-2xl p-6" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                <h3 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>Ubicación</h3>
                <div className="h-40 rounded-xl flex items-center justify-center border" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                  <div className="text-center">
                    <MapPin size={24} className="mx-auto mb-2" style={{ color: 'var(--green)' }} />
                    <p className="text-sm" style={{ color: 'var(--text)' }}>{device.name}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text2)' }}>{device.lat?.toFixed(6)}, {device.lng?.toFixed(6)}</p>
                    <a href={`https://www.google.com/maps?q=${device.lat},${device.lng}`} target="_blank" rel="noopener noreferrer" className="text-xs hover:underline mt-1 inline-block" style={{ color: 'var(--green)' }}>
                      Ver en Google Maps →
                    </a>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
