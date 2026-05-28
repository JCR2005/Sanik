import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import Navbar from '../components/sanik/Navbar'
import { devices as devicesApi, dots as dotsApi } from '../services/api'
import { ArrowLeft, Wifi, WifiOff, MapPin, Bell, RefreshCw } from 'lucide-react'

const RANGES = ['1h', '6h', '24h', '7d', '30d']
const VARS = ['temperatura','humedad','so2','pm25','pm1','pm10','o3','nox','nh3','mq135_adc']
const COLORS = ['#1D9E75','#60A5FA','#F59E0B','#A78BFA','#F87171','#34D399','#FB923C','#C084FC','#22D3EE','#FBBF24']

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
  const colors = { good: '#1D9E75', moderate: '#F59E0B', bad: '#EF4444' }
  const bgs = { good: 'bg-[#1D9E75]/10', moderate: 'bg-amber-500/10', bad: 'bg-red-500/10' }
  const labels = { good: 'Bueno', moderate: 'Moderado', bad: 'Alto' }

  return (
    <div className="bg-[#121A16] border border-[#1E2E28] rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[#8FA899] text-xs">{name}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${bgs[status]}`} style={{ color: colors[status] }}>
          {labels[status]}
        </span>
      </div>
      <div className="text-white text-xl font-bold">
        {value != null ? value.toFixed(1) : '—'}
        <span className="text-[#8FA899] text-sm font-normal ml-1">{unit}</span>
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
    <div className="min-h-screen bg-[#0A0F0D]">
      <Navbar />
      <div className="flex items-center justify-center h-64 text-[#8FA899]">Cargando...</div>
    </div>
  )

  const varMap = {}
  variables.forEach(v => { varMap[v.label] = v })

  return (
    <div className="min-h-screen bg-[#0A0F0D]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/devices')} className="text-[#8FA899] hover:text-white p-2 rounded-lg hover:bg-[#121A16] transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-white text-xl font-bold">{device?.name}</h1>
              <span className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${device?.status === 'online' ? 'bg-[#1D9E75]/10 text-[#1D9E75]' : 'bg-[#1E2E28] text-[#8FA899]'}`}>
                {device?.status === 'online' ? <Wifi size={10} /> : <WifiOff size={10} />}
                {device?.status === 'online' ? 'En línea' : 'Sin conexión'}
              </span>
              {device?.lat && (
                <span className="flex items-center gap-1 text-[#8FA899] text-xs">
                  <MapPin size={10} /> {device.lat?.toFixed(4)}, {device.lng?.toFixed(4)}
                </span>
              )}
            </div>
          </div>
          <Link to={`/alerts/${id}`} className="flex items-center gap-2 border border-[#1E2E28] text-[#8FA899] hover:text-white hover:border-[#1D9E75] px-3 py-2 rounded-lg text-sm transition-colors">
            <Bell size={14} /> Alertas
          </Link>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          {VARS.map((v, i) => (
            <SensorKPI
              key={v}
              variable={v}
              name={varMap[v]?.name || v}
              unit={varMap[v]?.unit || ''}
              value={lastValues[v]}
            />
          ))}
        </div>

        {/* Chart */}
        <div className="bg-[#121A16] border border-[#1E2E28] rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-white font-semibold">Histórico de sensores</h2>
            <div className="flex items-center gap-2">
              {RANGES.map(r => (
                <button key={r} onClick={() => setRange(r)} className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${range === r ? 'bg-[#1D9E75] text-white' : 'bg-[#0A0F0D] text-[#8FA899] hover:text-white border border-[#1E2E28]'}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Variable toggles */}
          <div className="flex flex-wrap gap-2 mb-4">
            {VARS.filter(v => varMap[v]).map((v, i) => (
              <button key={v} onClick={() => setActiveVars(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-all"
                style={{ background: activeVars.includes(v) ? `${COLORS[i]}20` : '#0A0F0D', color: activeVars.includes(v) ? COLORS[i] : '#8FA899', border: `1px solid ${activeVars.includes(v) ? COLORS[i] + '40' : '#1E2E28'}` }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />
                {varMap[v]?.name || v}
              </button>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2E28" />
              <XAxis dataKey="time" stroke="#8FA899" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis stroke="#8FA899" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#121A16', border: '1px solid #1E2E28', borderRadius: 8, color: '#F0F5F2' }} />
              {activeVars.map((v, i) => (
                <Line key={v} type="monotone" dataKey={v} stroke={COLORS[VARS.indexOf(v)]} strokeWidth={2} dot={false} name={varMap[v]?.name || v} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Map placeholder */}
        {device?.lat && (
          <div className="bg-[#121A16] border border-[#1E2E28] rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-4">Ubicación</h2>
            <div className="h-40 bg-[#0A0F0D] rounded-xl flex items-center justify-center border border-[#1E2E28]">
              <div className="text-center">
                <MapPin size={24} className="text-[#1D9E75] mx-auto mb-2" />
                <p className="text-white text-sm">{device.name}</p>
                <p className="text-[#8FA899] text-xs mt-1">{device.lat?.toFixed(6)}, {device.lng?.toFixed(6)}</p>
                <a href={`https://www.google.com/maps?q=${device.lat},${device.lng}`} target="_blank" rel="noopener noreferrer" className="text-[#1D9E75] text-xs hover:underline mt-1 inline-block">
                  Ver en Google Maps →
                </a>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
