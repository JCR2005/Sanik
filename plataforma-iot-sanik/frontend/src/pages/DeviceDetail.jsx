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
  Activity, CloudLightning, Clock, Leaf
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
    <div className="border rounded-2xl p-6 flex flex-col justify-center text-center shadow-sm hover:shadow-md transition-shadow" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
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
  const [error, setError] = useState('')
  
  // Estado para el Círculo de Calidad de Aire (AQI)
  const [aqiData, setAqiData] = useState({ aqi: null, category: 'Sin Datos', color: '#9CA3AF' })
  const [activeView, setActiveView] = useState('variables') 

  // Función auxiliar para asignar colores basados en las categorías de tu devices.js
  const getAqiColor = (category) => {
    if (!category) return '#9CA3AF'
    const cat = category.toLowerCase()
    if (cat.includes('excelente')) return '#10B981'  // Verde esmeralda
    if (cat.includes('buena')) return '#34D399'      // Verde claro
    if (cat.includes('precaución')) return '#F59E0B' // Ámbar/Naranja
    return '#EF4444'                                 // Mala / Peligrosa (Rojo)
  }

  // 1. Carga inicial de datos integrando el Endpoint del AQI recalculado
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
          devicesApi.aqi(deviceId).catch(() => null) // Evita romper si la formula falla por falta de datos
        ])
        
        if (!active) return
        setDevice(dev)
        
        const varList = vars || []
        setVariables(varList)
        if (varList.length) setActiveVars(varList.map(v => v.label))

        const map = {}
        ;(lv || []).forEach(v => { map[v.label] = v.last_value })
        setLastValues(map)

        // Setea el AQI real procesado por el backend
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

  // 2. Refresco continuo cada 5 segundos (Últimos valores + Recálculo de AQI del backend)
  useEffect(() => {
    if (!deviceId) return
    const fetchLiveUpdates = () => {
      // Actualiza tarjetas comunes
      devicesApi.lastValues(deviceId).then(lv => {
        const map = {}
        ;(lv || []).forEach(v => { map[v.label] = v.last_value })
        setLastValues(map)
      }).catch(() => {})

      // Actualiza cálculo dinámico de AQI
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

  // 3. Históricos de la gráfica
  useEffect(() => {
    if (!deviceId || !activeVars.length) return
    
    dotsApi.getMultiple(deviceId, activeVars, range).then(data => {
      const timeMap = {}
      for (const [variable, points] of Object.entries(data || {})) {
        if (!Array.isArray(points)) continue
        points.forEach(p => {
          const t = new Date(p.time).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          if (!timeMap[t]) {
            timeMap[t] = { time: t, _rawTime: new Date(p.time).getTime() }
          }
          timeMap[t][variable] = p.value
        })
      }
      const sortedData = Object.values(timeMap).sort((a, b) => a._rawTime - b._rawTime)
      setChartData(sortedData.slice(-60))
    }).catch((err) => {
      console.error("Error en la gráfica:", err)
    })
  }, [deviceId, range, activeVars])

  const DynamicIcon = AVAILABLE_ICONS[device?.icon] || Activity
  const latValue = device?.lat != null ? parseFloat(device.lat) : null
  const lngValue = device?.lng != null ? parseFloat(device.lng) : null
  const hasValidGPS = latValue != null && lngValue != null && !isNaN(latValue) && !isNaN(lngValue)

  // Extracción limpia para los KPIs principales del Hero (Mapeo flexible de nombres)
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

            {/* ── COLUMNA IZQUIERDA ── */}
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

              {/* Metadatos */}
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

              {/* Hardware */}
              <div className="border rounded-2xl p-4" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Info size={15} className="text-[#67B7E8]" />
                  <h3 className="font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text)' }}>Datos del Hardware</h3>
                </div>
                <div className="space-y-4">
                  {device?.image_url ? (
                    <div className="rounded-xl overflow-hidden border h-[150px]" style={{ borderColor: 'var(--border)' }}>
                      <img src={device.image_url} alt="Fotografía física" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                     <div className="rounded-xl border border-dashed flex items-center justify-center h-[100px]" style={{ borderColor: 'var(--border)' }}>
                      <span className="text-xs" style={{ color: 'var(--text2)' }}>Sin foto del equipo</span>
                    </div>
                  )}
                  <div>
                    <span className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text2)' }}>Número de Serie</span>
                    <span className="font-mono text-xs px-2 py-1 rounded-md border inline-block" style={{ background: 'var(--bg)', color: 'var(--text)', borderColor: 'var(--border)' }}>
                      {device?.serial || 'SN-NO-ASIGNADO'}
                    </span>
                  </div>
                </div>
              </div>

              {/* GPS Map */}
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
            </div>

            {/* ── COLUMNA DERECHA DOCK HERO ── */}
            <section className="flex flex-col min-h-[calc(100vh-4rem)]">

              {/* SECCIÓN HERO GIGANTE */}
              <div className="flex-1 flex flex-col justify-center min-h-[70vh] mb-12 mt-4">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 w-full">
                  
                  {/* Círculo AQI - TOTALMENTE ENLAZADO CON EL ENDPOINT DE TU BACKEND */}
                  <div className="border rounded-[3rem] p-10 flex flex-col items-center justify-center shadow-sm relative overflow-hidden min-h-[450px]" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                    <h3 className="text-lg font-black uppercase tracking-widest mb-8 text-center w-full absolute top-10" style={{ color: 'var(--text2)' }}>
                      Calidad del Aire
                    </h3>
                    
                    <div 
                      className="w-72 h-72 rounded-full flex flex-col items-center justify-center text-white shadow-2xl transition-all duration-500 hover:scale-105"
                      style={{ backgroundColor: aqiData.color, boxShadow: `0 25px 50px -12px ${aqiData.color}90` }}
                    >
                      <Leaf size={40} className="mb-2 opacity-90" />
                      
                      {/* Muestra el valor numérico del AQI ponderado */}
                      <span className="text-6xl font-black drop-shadow-lg mb-1">
                        {aqiData.aqi != null ? Math.round(aqiData.aqi) : '--'}
                      </span>

                      {/* Muestra la categoría textual devuelta por el Backend ('Excelente', 'Buena', etc.) */}
                      <span className="text-xl font-bold text-center leading-none px-4 drop-shadow-lg">
                        {aqiData.category}
                      </span>
                    </div>
                  </div>

                  {/* Cuadrícula de los 4 Sensores Clave */}
                  <div className="border rounded-[3rem] p-8 flex flex-col justify-center shadow-sm min-h-[450px]" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                    <div className="grid grid-cols-2 gap-y-12 gap-x-4 w-full h-full items-center">
                      
                      {/* Temperatura */}
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
                      
                      {/* Humedad */}
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

                      {/* CO2 */}
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

                      {/* CO */}
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

              {/* Tabs de Selección */}
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

              {/* Contenido Dinámico */}
              <div className="pb-12">
                {activeView === 'variables' ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {variables.map(v => (
                      <SensorKPI 
                        key={v.label} 
                        name={v.name} 
                        unit={v.unit} 
                        value={lastValues[v.label]} 
                        iconName={v.icon} 
                      />
                    ))}
                  </div>
                ) : (
                  <div className="border rounded-[2.5rem] p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                    
                    <div className="flex items-center justify-between mb-8 flex-wrap gap-6">
                      <div className="flex flex-wrap gap-2">
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