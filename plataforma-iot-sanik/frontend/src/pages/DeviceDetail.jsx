import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import ClienteLayout from '../components/sanik/ClienteLayout'
import { devices as devicesApi, dots as dotsApi } from '../services/api'
import MapPicker from '../components/MapPicker'

import { 
  ArrowLeft, Wifi, WifiOff, MapPin, Bell, Tag, Info,
  Thermometer, Droplets, Wind, Sun, Cloud, Cpu, Gauge, 
  Battery, Zap, Factory, Waves, Flame, Trees, Shield, 
  Activity, CloudLightning, Clock, Leaf, Eye, EyeOff
} from 'lucide-react'

const RANGES = ['1h', '6h', '24h', '7d', '30d']
const COLORS = ['#4DB6FF','#60A5FA','#F59E0B','#A78BFA','#F87171','#34D399','#FB923C','#C084FC','#22D3EE','#FBBF24','#818CF8','#E879F9']

const AVAILABLE_ICONS = {
  'map-pin': MapPin, 'thermometer': Thermometer, 'droplets': Droplets,
  'wind': Wind, 'sun': Sun, 'cloud': Cloud, 'cloud-lightning': CloudLightning,
  'cpu': Cpu, 'gauge': Gauge, 'battery': Battery, 'zap': Zap,
  'factory': Factory, 'waves': Waves, 'flame': Flame, 'trees': Trees,
  'shield': Shield, 'activity': Activity
}

function SensorKPI({ name, unit, value, iconName }) {
  const IconComponent = AVAILABLE_ICONS[iconName?.toLowerCase()] || Activity
  return (
    <div className="border rounded-2xl p-6 flex flex-col justify-center text-center shadow-sm hover:shadow-md transition-shadow h-full" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
      <div className="flex justify-center mb-2">
        <IconComponent size={22} className="text-[#67B7E8]" />
      </div>
      <span className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text2)' }}>{name}</span>
      <div className="text-3xl font-black" style={{ color: 'var(--text)' }}>
        {value != null ? Number(value).toFixed(1) : '—'}
        <span className="text-lg font-medium ml-1" style={{ color: 'var(--text2)' }}>{unit}</span>
      </div>
    </div>
  )
}

export default function ClientDeviceDetail() {
  const { id: deviceId } = useParams() 
  const navigate = useNavigate()
  
  const [device, setDevice] = useState(null)
  const [variables, setVariables] = useState([])
  const [lastValues, setLastValues] = useState({})
  const [chartData, setChartData] = useState([])
  const [range, setRange] = useState('24h')
  const [activeVars, setActiveVars] = useState([])
  const [loading, setLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [aqiData, setAqiData] = useState({ aqi: null, category: 'Sin Datos', color: '#9CA3AF' })
  const [activeView, setActiveView] = useState('variables') 

  const getAqiColor = (category) => {
    if (!category) return '#9CA3AF'
    const cat = category.toLowerCase()
    if (cat.includes('excelente')) return '#10B981'  
    if (cat.includes('buena')) return '#34D399'      
    if (cat.includes('precaución')) return '#F59E0B' 
    if (cat.includes('mala')) return '#F97316'       
    return '#EF4444'                                 
  }

  const areAllVarsSelected = variables.length > 0 && activeVars.length === variables.length

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [dev, vars, lv, aqiRes] = await Promise.all([
          devicesApi.get(deviceId),
          devicesApi.variables(deviceId),
          devicesApi.lastValues(deviceId),
          devicesApi.aqi(deviceId).catch(() => null) 
        ])
        
        if (!active) return
        setDevice(dev)
        
        const varList = vars || []
        setVariables(varList)
        
        if (varList.length) {
          setActiveVars(varList.slice(0, 2).map(v => v.label))
        }

        const map = {}
        ;(lv || []).forEach(v => { map[v.label] = v.last_value })
        setLastValues(map)

        if (aqiRes) {
          setAqiData({
            aqi: aqiRes.aqi,
            category: aqiRes.category,
            color: getAqiColor(aqiRes.category)
          })
        }
      } catch (err) {
        if (active) setError(err.message || 'No se pudo cargar la estación')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [deviceId])

  useEffect(() => {
    if (!deviceId) return
    const fetchLiveUpdates = () => {
      devicesApi.lastValues(deviceId).then(lv => {
        const map = {}
        ;(lv || []).forEach(v => { map[v.label] = v.last_value })
        setLastValues(map)
      }).catch(() => {})

      devicesApi.aqi(deviceId).then(aqiRes => {
        if (aqiRes) {
          setAqiData({
            aqi: aqiRes.aqi,
            category: aqiRes.category,
            color: getAqiColor(aqiRes.category)
          })
        }
      }).catch(() => {})
    }

    const interval = setInterval(fetchLiveUpdates, 5000)
    return () => clearInterval(interval)
  }, [deviceId])

  useEffect(() => {
    if (!deviceId || !activeVars.length || activeView !== 'grafica') {
      if (activeView === 'grafica' && !activeVars.length) {
        setChartData([]) 
      }
      return
    }
    
    setChartLoading(true)
    dotsApi.getMultiple(deviceId, activeVars, range).then(data => {
      const timeMap = {}
      for (const [variable, points] of Object.entries(data || {})) {
        if (!Array.isArray(points)) continue
        points.forEach(p => {
          const t = new Date(p.time).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })
          if (!timeMap[t]) {
            timeMap[t] = { time: t, _rawTime: new Date(p.time).getTime() }
          }
          timeMap[t][variable] = p.value
        })
      }
      const sortedData = Object.values(timeMap).sort((a, b) => a._rawTime - b._rawTime)
      setChartData(sortedData)
    }).catch((err) => {
      console.error("Error en la gráfica:", err)
    }).finally(() => {
      setChartLoading(false)
    })
  }, [deviceId, range, activeVars, activeView])

  const DynamicIcon = AVAILABLE_ICONS[device?.icon] || Activity
  const latValue = device?.lat != null ? parseFloat(device.lat) : null
  const lngValue = device?.lng != null ? parseFloat(device.lng) : null
  const hasValidGPS = latValue != null && lngValue != null && !isNaN(latValue) && !isNaN(lngValue)

  const temp = lastValues['temperatura'] ?? lastValues['Temperatura'] ?? lastValues['temperature'] ?? null
  const hum = lastValues['humedad'] ?? lastValues['Humedad'] ?? lastValues['humidity'] ?? null
  const co2 = lastValues['co2'] ?? lastValues['CO2'] ?? null
  const co = lastValues['co'] ?? lastValues['CO'] ?? null

  const varTempObj = variables.find(v => ['temperatura', 'temperature'].includes(v.label?.toLowerCase()))
  const varHumObj = variables.find(v => ['humedad', 'humidity'].includes(v.label?.toLowerCase()))
  const varCo2Obj = variables.find(v => ['co2'].includes(v.label?.toLowerCase()))
  const varCoObj = variables.find(v => ['co'].includes(v.label?.toLowerCase()))

  const TempIcon = AVAILABLE_ICONS[varTempObj?.icon?.toLowerCase()] || Thermometer
  const HumIcon = AVAILABLE_ICONS[varHumObj?.icon?.toLowerCase()] || Droplets
  const Co2Icon = AVAILABLE_ICONS[varCo2Obj?.icon?.toLowerCase()] || Cloud
  const CoIcon = AVAILABLE_ICONS[varCoObj?.icon?.toLowerCase()] || Flame

  const handleToggleAllVariables = () => {
    if (areAllVarsSelected) {
      setActiveVars([]) 
    } else {
      setActiveVars(variables.map(v => v.label)) 
    }
  }

  const scrollToDetails = () => {
    document.getElementById('detalles-view')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <ClienteLayout>
      <div className="p-8">
        {loading ? (
          <div className="flex items-center justify-center h-64" style={{ color: 'var(--text2)' }}>Cargando...</div>
        ) : error ? (
          <div className="mb-4 border rounded-lg px-3 py-2 text-xs" style={{ borderColor: '#F97316', color: '#FDBA74', background: 'rgba(249,115,22,0.1)' }}>
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">

            <div className="space-y-6 lg:sticky lg:top-8 z-10">
              <aside className="rounded-2xl border p-4" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <button onClick={() => navigate('/dispositivos')} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--text2)' }}>
                    <ArrowLeft size={16} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <DynamicIcon size={18} className="text-[#67B7E8] flex-shrink-0" />
                      <h1 className="text-lg font-bold truncate" style={{ color: 'var(--text)' }}>{device?.name}</h1>
                    </div>
                    <span className="text-xs block truncate" style={{ color: 'var(--text2)' }}>{device?.label}</span>
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
                    <div style={{ color: 'var(--text)' }}>
                      {hasValidGPS ? `${latValue.toFixed(6)}, ${lngValue.toFixed(6)}` : '—'}
                    </div>
                  </div>
                </div>

                <Link to={`/alerts/${deviceId}`}
                  className="flex items-center justify-center gap-2 mt-6 border px-3 py-2 rounded-lg text-sm transition-colors"
                  style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}>
                  <Bell size={14} /> Alertas
                </Link>
              </aside>

              <div className="border rounded-2xl p-4" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Info size={15} className="text-[#67B7E8]" />
                  <h3 className="font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text)' }}>Metadatos</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text2)' }}>Descripción</span>
                    <p className="text-xs rounded-xl p-2.5 border min-h-[50px]" style={{ color: 'var(--text)', borderColor: 'var(--border)', background: 'var(--bg)' }}>
                      {device?.description || 'Sin descripción asignada.'}
                    </p>
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text2)' }}>Ícono Asignado</span>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg border" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
                        <DynamicIcon size={16} className="text-[#67B7E8]" />
                      </div>
                      <span className="font-mono text-xs" style={{ color: 'var(--text)' }}>{device?.icon || 'map-pin'}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                    <span className="block text-[11px] font-semibold mb-1.5" style={{ color: 'var(--text2)' }}>
                      <Tag size={11} className="inline mr-1" /> Etiquetas
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {device?.tags?.length > 0 ? (
                        device.tags.map((tag, i) => (
                          <span key={i} className="text-[10px] font-bold px-2 py-0.5 bg-[#67B7E8]/10 text-[#67B7E8] rounded-md border border-[#67B7E8]/20">{tag}</span>
                        ))
                      ) : (
                        <span className="text-xs italic" style={{ color: 'var(--text2)' }}>Sin etiquetas</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded-2xl p-4 flex flex-col" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={15} className="text-[#1D9E75]" />
                  <h3 className="font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text)' }}>Ubicación GPS</h3>
                </div>
                {hasValidGPS ? (
                  <div className="relative z-0 rounded-xl overflow-hidden border h-[180px]" style={{ borderColor: 'var(--border)' }}>
                    <MapPicker lat={latValue} lng={lngValue} height={180} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center border border-dashed rounded-xl h-[150px]" style={{ borderColor: 'var(--border)' }}>
                    <MapPin size={22} className="mb-1 opacity-20" style={{ color: 'var(--text)' }} />
                    <span className="text-xs" style={{ color: 'var(--text2)' }}>GPS no establecido</span>
                  </div>
                )}
              </div>

              <div className="border rounded-2xl p-4 flex flex-col bg-white dark:bg-gray-900" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Info size={16} className="text-[#67B7E8]" />
                  <h3 className="font-bold text-[13px] uppercase tracking-wider text-slate-800 dark:text-slate-200">Datos del Hardware</h3>
                </div>
                <div className="space-y-4">
                  
                  <div className="flex items-center justify-center border border-dashed rounded-xl h-[110px]" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}>
                    <span className="text-[13px] text-slate-500 font-medium">Sin foto del equipo</span>
                  </div>

                  {/* Número de serie */}
                  <div>
                    <span className="block text-[12px] font-bold mb-1.5 text-slate-700 dark:text-slate-300">Número de Serie</span>
                    <div className="inline-block px-3 py-1.5 border rounded-lg text-xs font-mono font-medium bg-green-50/50 dark:bg-green-900/20 text-slate-800 dark:text-slate-200" style={{ borderColor: '#E2E8F0' }}>
                      {device?.serial_number || 'SN-NO-ASIGNADO'}
                    </div>
                  </div>

                </div>
              </div>

            </div>

            <section className="flex flex-col min-h-[calc(100vh-4rem)]">

              <div className="flex-1 flex flex-col justify-center min-h-[70vh] mb-12 mt-4">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 w-full">
                  
                  <div className="border rounded-[3rem] p-10 flex flex-col items-center justify-between shadow-sm relative overflow-visible min-h-[450px]" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                    <div className="flex flex-col items-center gap-4 w-full z-20">
                      <div className="flex items-center gap-2 group relative">
                        <h3 className="text-lg font-black uppercase tracking-widest text-center" style={{ color: 'var(--text2)' }}>
                          Calidad del Aire
                        </h3>
                        <div className="cursor-help p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-[#67B7E8]">
                          <Info size={18} />
                        </div>
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-72 p-5 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 pointer-events-none" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                          <h4 className="text-xs font-black uppercase mb-3 text-center tracking-wider" style={{ color: 'var(--text)' }}>Niveles de Riesgo y AQI</h4>
                          <ul className="space-y-2.5 text-xs font-medium">
                            <li className="flex items-center justify-between"><span className="text-[#10B981] font-bold">0 - 20 Excelente</span><span style={{ color: 'var(--text2)' }}>Sin riesgo</span></li>
                            <li className="flex items-center justify-between"><span className="text-[#34D399] font-bold">21 - 40 Buena</span><span style={{ color: 'var(--text2)' }}>Riesgo bajo</span></li>
                            <li className="flex items-center justify-between"><span className="text-[#F59E0B] font-bold">41 - 60 Precaución</span><span style={{ color: 'var(--text2)' }}>Sensibles moderarse</span></li>
                            <li className="flex items-center justify-between"><span className="text-[#F97316] font-bold">61 - 80 Mala</span><span style={{ color: 'var(--text2)' }}>Riesgo respiratorio</span></li>
                            <li className="flex items-center justify-between"><span className="text-[#EF4444] font-bold">81 - 100 Peligrosa</span><span style={{ color: 'var(--text2)' }}>Evitar exteriores</span></li>
                          </ul>
                        </div>
                      </div>

                      <div className="w-full max-w-[250px] relative mt-2">
                        <div className="flex w-full h-2.5 rounded-full overflow-hidden shadow-inner opacity-80">
                          <div className="h-full w-1/5 bg-[#10B981]"></div>
                          <div className="h-full w-1/5 bg-[#34D399]"></div>
                          <div className="h-full w-1/5 bg-[#F59E0B]"></div>
                          <div className="h-full w-1/5 bg-[#F97316]"></div>
                          <div className="h-full w-1/5 bg-[#EF4444]"></div>
                        </div>
                        {aqiData.aqi != null && (
                          <div 
                            className="absolute top-3.5 w-3 h-3 bg-white border border-gray-400 rounded-full shadow-md transition-all duration-700"
                            style={{ left: `calc(${Math.min(100, Math.max(0, aqiData.aqi))}% - 6px)` }}
                          />
                        )}
                        <div className="flex justify-between w-full mt-2 text-[10px] font-bold" style={{ color: 'var(--text2)' }}>
                          <span>0</span>
                          <span>100</span>
                        </div>
                      </div>
                    </div>

                    <div 
                      className="w-64 h-64 sm:w-72 sm:h-72 rounded-full flex flex-col items-center justify-center text-white shadow-2xl transition-all duration-500 hover:scale-105 relative z-10 my-4"
                      style={{ backgroundColor: aqiData.color, boxShadow: `0 25px 50px -12px ${aqiData.color}90` }}
                    >
                      <Leaf size={40} className="mb-2 opacity-90" />
                      <span className="text-6xl font-black drop-shadow-lg mb-1">
                        {aqiData.aqi != null ? Math.round(aqiData.aqi) : '--'}
                      </span>
                      <span className="text-xl font-bold text-center leading-none px-4 drop-shadow-lg">
                        {aqiData.category}
                      </span>
                    </div>

                    <div className="w-full px-4 text-center animate-in fade-in duration-500 mt-2">
                      <div className="inline-block px-4 py-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                        <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                          {aqiData.category?.toLowerCase().includes('excelente') && 'El aire es ideal. No hay impacto en la salud respiratoria.'}
                          {aqiData.category?.toLowerCase().includes('buena') && 'Calidad aceptable. Riesgo mínimo para grupos vulnerables.'}
                          {aqiData.category?.toLowerCase().includes('precaución') && 'Personas con asma deben limitar el esfuerzo prolongado.'}
                          {aqiData.category?.toLowerCase().includes('mala') && 'Riesgo respiratorio. Reducir actividades al aire libre.'}
                          {aqiData.category?.toLowerCase().includes('peligrosa') && 'Peligro inminente. Permanecer en interiores.'}
                          {!aqiData.category && 'Esperando datos de la estación...'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-[3rem] p-8 flex flex-col justify-center shadow-sm min-h-[450px]" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                    <div className="grid grid-cols-2 gap-y-12 gap-x-4 w-full h-full items-center">
                      
                      <div className="text-center transition-transform duration-300 hover:scale-105">
                        <div className="flex items-center justify-center gap-2 mb-3">
                          <TempIcon size={24} className="text-rose-500" />
                          <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text2)' }}>Temperatura</span>
                        </div>
                        <div className="text-5xl xl:text-6xl font-black tracking-tighter" style={{ color: 'var(--text)' }}>
                          {temp != null ? Number(temp).toFixed(1) : '--'}
                          <span className="text-2xl xl:text-3xl font-medium ml-1 text-rose-500/80">°C</span>
                        </div>
                      </div>
                      
                      <div className="text-center transition-transform duration-300 hover:scale-105">
                        <div className="flex items-center justify-center gap-2 mb-3">
                          <HumIcon size={24} className="text-blue-500" />
                          <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text2)' }}>Humedad</span>
                        </div>
                        <div className="text-5xl xl:text-6xl font-black tracking-tighter" style={{ color: 'var(--text)' }}>
                          {hum != null ? Number(hum).toFixed(1) : '--'}
                          <span className="text-2xl xl:text-3xl font-medium ml-1 text-blue-500/80">%</span>
                        </div>
                      </div>

                      <div className="col-span-2 w-full h-px max-w-[80%] mx-auto" style={{ background: 'var(--border)' }}></div>

                      <div className="text-center transition-transform duration-300 hover:scale-105">
                        <div className="flex items-center justify-center gap-2 mb-3">
                          <Co2Icon size={24} className="text-[#8B5CF6]" />
                          <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text2)' }}>Dióxido de Carbono</span>
                        </div>
                        <div className="text-5xl xl:text-6xl font-black tracking-tighter" style={{ color: 'var(--text)' }}>
                          {co2 != null ? Number(co2).toFixed(0) : '--'}
                          <span className="text-2xl xl:text-3xl font-medium ml-1 text-[#8B5CF6]/80">ppm</span>
                        </div>
                      </div>

                      <div className="text-center transition-transform duration-300 hover:scale-105">
                        <div className="flex items-center justify-center gap-2 mb-3">
                          <CoIcon size={24} className="text-orange-500" />
                          <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text2)' }}>Monóxido</span>
                        </div>
                        <div className="text-5xl xl:text-6xl font-black tracking-tighter" style={{ color: 'var(--text)' }}>
                          {co != null ? Number(co).toFixed(1) : '--'}
                          <span className="text-2xl xl:text-3xl font-medium ml-1 text-orange-500/80">ppm</span>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              </div>

              <div id="detalles-view" className="flex justify-center mb-8 scroll-mt-8">
                <div className="inline-flex p-2 rounded-[2rem] shadow-sm" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <button
                    onClick={() => { setActiveView('variables'); scrollToDetails(); }}
                    className={`px-10 py-4 rounded-3xl text-sm font-black tracking-wide transition-all duration-300 ${activeView === 'variables' ? 'bg-[#1D9E75] text-white shadow-lg scale-105' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                    style={activeView !== 'variables' ? { color: 'var(--text2)' } : {}}
                  >
                    Métricas Detalladas
                  </button>
                  <button
                    onClick={() => { setActiveView('grafica'); scrollToDetails(); }}
                    className={`px-10 py-4 rounded-3xl text-sm font-black tracking-wide transition-all duration-300 ${activeView === 'grafica' ? 'bg-[#1D9E75] text-white shadow-lg scale-105' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                    style={activeView !== 'grafica' ? { color: 'var(--text2)' } : {}}
                  >
                    Gráfica Histórica
                  </button>
                </div>
              </div>

              <div className="pb-12">
                {activeView === 'variables' ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Enlace al detalle de la variable */}
                    {variables.map(v => (
                      <Link 
                        to={`/variableDetail/${deviceId}/${v.label}`} 
                        key={v.label} 
                        className="block transition-transform hover:-translate-y-1"
                      >
                        <SensorKPI 
                          name={v.name} 
                          unit={v.unit} 
                          value={lastValues[v.label]} 
                          iconName={v.icon} 
                        />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="border rounded-[2.5rem] p-8 shadow-sm relative animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                    
                    {chartLoading && (
                      <div className="absolute inset-0 bg-white/70 dark:bg-black/70 rounded-[2.5rem] z-30 flex items-center justify-center backdrop-blur-sm">
                        <div className="text-sm font-bold text-[#1D9E75] animate-pulse">Procesando millones de datos...</div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-8 flex-wrap gap-6">
                      
                      <div className="flex flex-wrap gap-2 items-center">
                        
                        {variables.length > 0 && (
                          <button
                            onClick={handleToggleAllVariables}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all border shadow-sm hover:scale-105 mr-2"
                            style={{
                              background: areAllVarsSelected ? 'var(--bg)' : '#1D9E75',
                              color: areAllVarsSelected ? 'var(--text)' : '#fff',
                              borderColor: areAllVarsSelected ? 'var(--border)' : '#1D9E75'
                            }}
                          >
                            {areAllVarsSelected ? (
                              <>
                                <EyeOff size={13} />
                                Ocultar todas
                              </>
                            ) : (
                              <>
                                <Eye size={13} />
                                Mostrar todas
                              </>
                            )}
                          </button>
                        )}

                        {variables.map((v, i) => {
                          const isAct = activeVars.includes(v.label)
                          const col = COLORS[i % COLORS.length]
                          return (
                            <button key={v.label}
                              onClick={() => setActiveVars(prev => prev.includes(v.label) ? prev.filter(x => x !== v.label) : [...prev, v.label])}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
                              style={{
                                background: isAct ? `${col}15` : 'transparent',
                                color: isAct ? col : 'var(--text2)',
                                border: `2px solid ${isAct ? col + '40' : 'var(--border)'}`
                              }}>
                              <span className="w-3 h-3 rounded-full" style={{ background: col, opacity: isAct ? 1 : 0.3 }} />
                              {v.name}
                            </button>
                          )
                        })}
                      </div>
                      
                      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                        {RANGES.map(r => (
                          <button key={r} onClick={() => setRange(r)}
                            className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${range === r ? 'bg-[#1D9E75] text-white shadow-md scale-105' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                            style={range !== r ? { color: 'var(--text2)' } : {}}>
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>

                    <ResponsiveContainer width="100%" height={450}>
                      <LineChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="time" stroke="var(--text2)" tick={{ fontSize: 12, fontWeight: 700 }} tickMargin={15} interval="preserveStartEnd" axisLine={false} tickLine={false} />
                        <YAxis stroke="var(--text2)" tick={{ fontSize: 12, fontWeight: 700 }} tickMargin={15} axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, color: 'var(--text)', padding: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
                          itemStyle={{ fontWeight: '900', paddingTop: '4px' }}
                        />
                        {variables.map((v, i) => (
                          activeVars.includes(v.label) && (
                            <Line key={v.label} type="monotone" dataKey={v.label}
                              stroke={COLORS[i % COLORS.length]} strokeWidth={4} dot={false} activeDot={{ r: 8, strokeWidth: 0 }} name={v.name} />
                          )
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

            </section>
          </div>
        )}
      </div>
    </ClienteLayout>
  )
}