import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ClienteLayout from '../components/sanik/ClienteLayout'
import { spaces as spacesApi, devices as devicesApi, variables as variablesApi } from '../services/api'
import {
  Plus, Save, Trash2, ChevronUp, ChevronDown, Pencil, ArrowLeft,
  Layers, X, Check, Activity, Server, Wifi, WifiOff, ArrowRight, MapPin,
  Wind, Droplets, Mountain, Volume2, Type,
  Sun, Leaf, Flame, Cloud, Waves, Thermometer, HeartPulse, Cpu,
  Moon, Star, Sunrise, Sunset, CloudRain, CloudSnow, CloudLightning, CloudSun, Cloudy, Snowflake,
  Bug, Sprout, Flower2, Factory, Building2, Warehouse, Rabbit, Briefcase, Zap,
  BatteryFull, Timer, Hourglass, Lock, Shield, ShieldAlert, Key, Radar, Network, Satellite, Bluetooth, Target, Heart, Database, Brain, Gauge
} from 'lucide-react'

const COLORS = { primary: '#67B7E8' }
const INPUT = "w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-[#67B7E8]/20 focus:border-[#67B7E8]"
const inputStyle = { background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }

const DEFAULT_CATS = [
  { name: 'Bien',   color: '#10B981' },
  { name: 'Precaución', color: '#F59E0B' },
  { name: 'Mal',    color: '#EF4444' }
]

// Tramas equitativas del índice 0-100 según el nº de categorías
const generateLabel = (text) => text
  .toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
   .replace(/(^-|-$)+/g, '')

const iconByLabel = {
  aire: Wind, tierra: Leaf, agua: Droplets,
  otro: Layers,
  sensor: Cpu, gota: Droplets, viento: Wind, sol: Sun, hoja: Leaf, llama: Flame,
  thermo: Thermometer, nube: Cloud, onda: Waves, ruido: Volume2, servidor: Server,
  heart: HeartPulse, luna: Moon, estrella: Star, amanecer: Sunrise, atardecer: Sunset,
  lluvia: CloudRain, nieve: CloudSnow, tormenta: CloudLightning, solnube: CloudSun,
  nublado: Cloudy, copo: Snowflake, insecto: Bug, brote: Sprout, flor: Flower2,
  fabrica: Factory, edificio: Building2, deposito: Warehouse, conejo: Rabbit,
  negocio: Briefcase, relampago: Zap, bateria: BatteryFull, tiempo: Timer,
  horas: Hourglass, candado: Lock, escudo: Shield, alerta: ShieldAlert, llave: Key,
  radar: Radar, red: Network, blue: Bluetooth, satelite: Satellite, blanco: Target,
  base: Database, cerebro: Brain, medidor: Gauge
}

const spaceIcon = (label, size = 18) => {
  const C = iconByLabel[label] || Layers
  return <C size={size} />
}

function buildTram(n) {
  const out = []
  for (let i = 0; i < n; i++) {
    out.push({
      score_lo: Math.round((100 / n) * i),
      score_hi: Math.round((100 / n) * (i + 1)) - 1
    })
  }
  out[n - 1].score_hi = 100
  return out
}

function toConfig(categories, includedVars, ranges) {
  return {
    categories: categories.map((c, i) => ({
      name: c.name, color: c.color, score_lo: c.score_lo, score_hi: c.score_hi
    })),
    variables: includedVars.map((v, i) => ({ variable_label: v.label })),
    ranges
  }
}

// ─── Modal "Nueva estación" (estilo del modal admin de enlazar estación) ───
function AddDeviceModal({ spaceId, onClose, onAdd }) {
  const [form, setForm] = useState({ name: '', label: '', lat: '', lng: '' })
  const [catalog, setCatalog] = useState([])
  const [selectedVariables, setSelectedVariables] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const data = await devicesApi.catalog()
        setCatalog(data)
        setSelectedVariables(data.map(v => v.label))
      } catch { /* sin catálogo no se bloquea */ }
    }
    fetchCatalog()
  }, [])


  const handleToggleVariable = (label) => {
    setSelectedVariables(prev => prev.includes(label)
      ? prev.filter(x => x !== label)
      : [...prev, label])
  }

  const handleSelectAll = () => {
    if (selectedVariables.length === catalog.length) setSelectedVariables([])
    else setSelectedVariables(catalog.map(v => v.label))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const device = await devicesApi.create({
        name: form.name,
        label: form.label,
        lat: form.lat ? parseFloat(form.lat) : null,
        lng: form.lng ? parseFloat(form.lng) : null,
        selectedVariables,
        spaceId
      })
      setSuccess(true)
      setTimeout(() => { onAdd(device); onClose() }, 1500)
    } catch (err) {
      setError(err.message || 'No se pudo crear el dispositivo')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="rounded-[24px] p-8 w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        {success ? (
          <div className="flex flex-col items-center justify-center py-10 text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-[#2BA8A0]/10 text-[#2BA8A0] rounded-full flex items-center justify-center mb-4 shadow-sm shadow-[#2BA8A0]/10">
              <Check size={32} strokeWidth={3} />
            </div>
            <h3 className="text-xl font-bold tracking-tight mb-2" style={{ color: 'var(--text)', fontFamily: "'Syne', sans-serif" }}>
              ¡Estación enlazada!
            </h3>
            <p className="text-sm max-w-[280px] text-center" style={{ color: 'var(--text2)' }}>
              El dispositivo <strong>{form.name}</strong> quedó dentro de este espacio.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text)', fontFamily: "'Syne', sans-serif" }}>Nueva estación</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5" style={{ color: 'var(--text2)' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
                  {error}
                </div>
              )}

              <div>
                <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text)' }}>Nombre de la estación</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value, label: generateLabel(e.target.value) }))}
                  placeholder="Ej. Sensor principal"
                  className={INPUT}
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text)' }}>Identificador único (Label/ID)</label>
                <input
                  type="text"
                  required
                  value={form.label}
                  onChange={e => setForm({ ...form, label: e.target.value })}
                  placeholder="Ej. sensor-principal"
                  className={INPUT}
                  style={inputStyle}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text)' }}>Latitud</label>
                  <input type="number" step="any" value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })} placeholder="14.8347" className={INPUT} style={inputStyle} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text)' }}>Longitud</label>
                  <input type="number" step="any" value={form.lng} onChange={e => setForm({ ...form, lng: e.target.value })} placeholder="-91.5181" className={INPUT} style={inputStyle} />
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold tracking-tight" style={{ color: 'var(--text)' }}>Variables a medir</label>
                  <button type="button" onClick={handleSelectAll} className="text-[11px] font-bold px-2 py-1 rounded bg-black/5 dark:bg-white/5 hover:opacity-80 transition-all" style={{ color: COLORS.primary }}>
                    {selectedVariables.length === catalog.length ? 'Desmarcar todas' : 'Seleccionar todas'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 border rounded-xl p-3 max-h-[160px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                  {catalog.map(v => {
                    const isSelected = selectedVariables.includes(v.label)
                    return (
                      <button
                        key={v.label}
                        type="button"
                        onClick={() => handleToggleVariable(v.label)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs font-semibold transition-all border ${isSelected ? 'border-[#2BA8A0] bg-[#2BA8A0]/5 text-[#2BA8A0]' : 'border-transparent opacity-70'}`}
                        style={!isSelected ? { color: 'var(--text)', background: 'var(--card)' } : {}}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-[#2BA8A0] border-[#2BA8A0]' : 'border-neutral-400'}`}>
                          {isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
                        </div>
                        <span className="truncate">{v.name} <span className="opacity-50 text-[10px]">({v.unit})</span></span>
                      </button>
                    )
                  })}
                  {catalog.length === 0 && (
                    <p className="text-center text-[11px] py-4 col-span-2" style={{ color: 'var(--text2)' }}>Cargando catálogo maestro...</p>
                  )}
                </div>
              </div>

              <div className="bg-[#2BA8A0]/10 rounded-xl p-4 text-xs font-medium text-[#2BA8A0]">
                El estado inicial será <strong>Pendiente</strong> hasta que reporte señal física.
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="flex-1 rounded-xl py-3 text-sm font-semibold hover:bg-black/5 dark:hover:bg-white/5" style={{ color: 'var(--text2)' }}>Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 text-white py-3 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5 disabled:opacity-50" style={{ background: COLORS.primary, boxShadow: `0 4px 12px ${COLORS.primary}40` }}>{loading ? 'Creando...' : 'Crear'}</button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Tarjeta de estación dentro de un espacio ────────────────────────────
function getStatusColor(status) {
  return status === 'online' ? '#2BA8A0' : '#F59E0B'
}

function DeviceCard({ device, onDetail }) {
  const isOnline = device.status === 'online'
  const color = getStatusColor(device.status)
  return (
    <div
      onClick={() => onDetail(device.id)}
      className="group rounded-2xl p-5 border cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg"
      style={{ background: 'var(--card)', borderColor: isOnline ? color + '40' : 'var(--border)' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '1A', color }}>
          <Server size={18} />
        </div>
        <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: color + '1A', color }}>
          {isOnline
            ? <><span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color }} /><Wifi size={9} /> En línea</>
            : <><WifiOff size={9} /> Sin señal</>}
        </span>
      </div>
      <h4 className="font-bold text-sm mb-0.5 truncate" style={{ color: 'var(--text)' }}>{device.name}</h4>
      <p className="text-xs font-mono mb-3" style={{ color: 'var(--text2)' }}>{device.label}</p>
      <div className="space-y-1 mb-4">
        {device.lat && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text2)' }}>
            <MapPin size={11} /> {Number(device.lat).toFixed(4)}, {Number(device.lng).toFixed(4)}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <span className="text-xs" style={{ color: 'var(--text2)' }}>{device.variable_count || 0} variables</span>
        <span className="flex items-center gap-1 text-xs font-semibold group-hover:gap-2 transition-all" style={{ color: '#67B7E8' }}>
          Ver detalles <ArrowRight size={11} />
        </span>
      </div>
    </div>
  )
}

export default function Spaces() {
  const navigate = useNavigate()

  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [catalog, setCatalog] = useState([])

  const [space, setSpace] = useState(null)          // espacio seleccionado
  const [creating, setCreating] = useState(false)   // modal nuevo espacio
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('aire')
  const [newCustomType, setNewCustomType] = useState('')
  const [newCustomIcon, setNewCustomIcon] = useState('Type')
  const [newDescription, setNewDescription] = useState('')

  // Dispositivos del espacio abierto
  const [deviceList, setDeviceList] = useState([])
  const [loadingDevices, setLoadingDevices] = useState(false)
  const [showAddDevice, setShowAddDevice] = useState(false)

  // Estado del editor
  const [numCats, setNumCats] = useState(3)
  const [cats, setCats] = useState([])
  const [included, setIncluded] = useState([])      // [{label,nombre}]
  const [ranges, setRanges] = useState([])          // [{variable_label,cat_order,min_value,max_value}]
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const loadSpaces = () => {
    spacesApi.list()
      .then(d => { setList(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    loadSpaces()
    variablesApi.list().then(setCatalog).catch(() => {})
  }, [])

  // Al abrir un espacio, cargar su config y sus dispositivos
  const openSpace = async (id) => {
    setMsg('')
    const cfg = await spacesApi.config(id)
    setSpace(cfg)
    setDeviceList([])
    setLoadingDevices(true)
    spacesApi.devices(id)
      .then(setDeviceList)
      .catch(() => {})
      .finally(() => setLoadingDevices(false))

    const c = cfg.aqiConfig
    const nc = Math.max(c.categories.length, 2)
    setNumCats(nc)
    setCats(c.categories.map((x, i) => ({
      name: x.name, color: x.color, score_lo: x.score_lo, score_hi: x.score_hi, _id: i
    })))

    // Variables incluidas (en orden de prioridad)
    const inc = c.variables
      .map(v => {
        const catVar = catalog.find(x => x.label === v.variable_label)
        return { label: v.variable_label, nombre: catVar?.name || v.variable_label }
      })
    setIncluded(inc)

    // Rangos -> map variable -> {cat_order: max}
    const rangeMap = {}
    c.ranges.forEach(r => {
      if (!rangeMap[r.variable_label]) rangeMap[r.variable_label] = {}
      rangeMap[r.variable_label][r.cat_order] = r.max_value
    })
    const builtRanges = []
    inc.forEach(v => {
      for (let i = 0; i < nc; i++) {
        builtRanges.push({
          variable_label: v.label,
          cat_order: i + 1,
          min_value: i === 0 ? 0 : null, // se rellena desde la DB si existe
          max_value: (rangeMap[v.label] && rangeMap[v.label][i + 1] != null)
            ? rangeMap[v.label][i + 1]
            : null
        })
      }
    })
    setRanges(builtRanges)
  }

  // Ajustar tramas cuando cambia el nº de categorías
  const applyNumCats = (n) => {
    setNumCats(n)
    const tram = buildTram(n)
    let next = tram.map((t, i) => ({
      ...(cats[i] || DEFAULT_CATS[i] || { name: `Nivel ${i + 1}`, color: '#10B981' }),
      score_lo: t.score_lo, score_hi: t.score_hi, _id: i
    }))
    while (next.length < n) {
      next.push({ ...DEFAULT_CATS[next.length % DEFAULT_CATS.length], ...tram[next.length], _id: next.length })
    }
    next = next.slice(0, n)
    setCats(next)

    const newRanges = []
    included.forEach(v => {
      for (let i = 0; i < n; i++) {
        newRanges.push({
          variable_label: v.label,
          cat_order: i + 1,
          min_value: null,
          max_value: null
        })
      }
    })
    setRanges(newRanges)
  }

  const toggleVar = (label, nombre) => {
    const exists = included.find(v => v.label === label)
    if (exists) {
      const next = included.filter(v => v.label !== label)
      setIncluded(next)
      setRanges(ranges.filter(r => r.variable_label !== label))
    } else {
      const next = [...included, { label, nombre }]
      setIncluded(next)
      const extra = []
      for (let i = 0; i < numCats; i++) {
        extra.push({ variable_label: label, cat_order: i + 1, min_value: null, max_value: null })
      }
      setRanges([...ranges, ...extra])
    }
  }

  const moveVar = (idx, dir) => {
    const a = [...included]
    const b = idx + dir
    if (b < 0 || b >= a.length) return
    ;[a[idx], a[b]] = [a[b], a[idx]]
    setIncluded(a)
  }

  const setRangeMax = (label, catOrder, val) => {
    setRanges(ranges.map(r =>
      r.variable_label === label && r.cat_order === catOrder
        ? { ...r, max_value: val === '' ? null : Number(val) }
        : r
    ))
  }

  const createSpace = async () => {
    if (!newName.trim()) return
    setMsg('')
    const finalType = newType === 'otro' ? (newCustomType.trim() || 'otro') : newType
    const finalIcon = newType === 'otro' ? (newCustomIcon || 'Type') : ''
    const s = await spacesApi.create({ name: newName.trim(), slug: generateLabel(newName.trim()), type: finalType, icon: finalIcon })
    setCreating(false)
    setNewName(''); setNewType('aire'); setNewCustomType(''); setNewCustomIcon(''); setNewDescription('')
    await loadSpaces()
    await openSpace(s.id)
  }

  const save = async () => {
    setSaving(true); setMsg('')
    try {
      await spacesApi.saveConfig(space.id, toConfig(cats, included, ranges))
      setMsg('Configuración guardada correctamente.')
      loadSpaces()
    } catch (e) {
      setMsg('Error al guardar: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const close = () => { setSpace(null); setMsg(''); setDeviceList([]) }

  return (
    <ClienteLayout>
      <div
        className="min-h-full px-4 py-6 md:px-8 md:py-10"
        style={{ backgroundImage: 'radial-gradient(circle at 50% -20%, rgba(103,183,232,0.15) 0%, rgba(103,183,232,0.04) 30%, transparent 70%)' }}
      >
        <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1 font-syne" style={{ color: 'var(--text)' }}>
              Espacios
            </h1>
            <p className="text-xs md:text-sm" style={{ color: 'var(--text2)' }}>
              Gestioná tus espacios y el índice de calidad de cada uno
            </p>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
            style={{ background: '#67B7E8' }}
          >
            <Plus size={16} /> Nuevo espacio
          </button>
        </div>

        {/* ── Vista de lista ── */}
        {!space && (
          loading ? (
            <div className="text-center py-12 text-sm" style={{ color: 'var(--text2)' }}>Cargando...</div>
          ) : list.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed" style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}>
              <Layers size={32} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">Aún no tenés espacios</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {list.map(s => (
                <div
                  key={s.id}
                  onClick={() => openSpace(s.id)}
                  className="group rounded-2xl p-5 border cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg"
                  style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(103,183,232,0.12)', color: '#67B7E8' }}>
                      {spaceIcon(s.icon || s.type, 18)}
                    </div>
                    <Pencil size={15} className="opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: 'var(--text2)' }} />
                  </div>
                  <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--text)' }}>{s.name}</h3>
                  <span className="text-xs font-mono uppercase" style={{ color: '#67B7E8' }}>{s.slug}</span>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-[11px]" style={{ color: 'var(--text2)' }}>{s.type}</p>
                    <span className="text-[11px] font-semibold flex items-center gap-1" style={{ color: 'var(--text2)' }}>
                      <Server size={11} /> {s.device_count ?? 0} {s.device_count === 1 ? 'estación' : 'estaciones'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ── Editor de un espacio ── */}
        {space && (
          <div className="rounded-3xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-3">
                <button onClick={close} className="p-2 rounded-xl hover:opacity-70" style={{ color: 'var(--text2)' }}>
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h2 className="font-bold text-lg" style={{ color: 'var(--text)' }}>{space.name}</h2>
                  <p className="text-xs" style={{ color: 'var(--text2)' }}>Configuración del índice de calidad ({space.slug})</p>
                </div>
              </div>
            </div>

            <div className="p-5 md:p-6 space-y-8">
              {msg && (
                <div className="rounded-xl px-4 py-3 text-sm font-semibold" style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>
                  {msg}
                </div>
              )}

              {/* 0. Estaciones del espacio */}
              <section>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>Estaciones del espacio</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text2)' }}>
                      {deviceList.length === 0 ? 'Todavía no hay estaciones en este espacio.' : `${deviceList.length} estación(es) dentro de ${space.name}.`}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddDevice(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                    style={{ background: '#67B7E8' }}
                  >
                    <Plus size={15} /> Nueva estación
                  </button>
                </div>

                {loadingDevices ? (
                  <div className="text-center py-10 text-sm" style={{ color: 'var(--text2)' }}>Cargando estaciones...</div>
                ) : deviceList.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {deviceList.map(d => (
                      <DeviceCard key={d.id} device={d} onDetail={id => navigate(`/devices/${id}`)} />
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 text-center py-10 rounded-2xl border border-dashed" style={{ borderColor: 'var(--border)' }}>
                    <Server size={30} className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium" style={{ color: 'var(--text2)' }}>Sin estaciones aún</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text2)' }}>Creá la primera con "Nueva estación".</p>
                  </div>
                )}
              </section>

              {/* 1. Categorías */}
              <section>
                <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--text)' }}>1. Categorías del índice</h3>
                <p className="text-xs mb-3" style={{ color: 'var(--text2)' }}>
                  Cuántos niveles de calidad tiene tu índice (tramas de 0 a 100 auto).
                </p>
                <div className="flex items-center gap-2 mb-4">
                  {[2, 3, 4, 5, 6].map(n => (
                    <button
                      key={n}
                      onClick={() => applyNumCats(n)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                      style={numCats === n ? { background: '#67B7E8', color: 'white' } : { background: 'var(--bg)', color: 'var(--text2)', border: '1px solid var(--border)' }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {cats.map((c, i) => (
                    <div key={c._id} className="rounded-xl border p-3" style={{ borderColor: 'var(--border)' }}>
                      <label className="text-[10px] font-bold uppercase tracking-wide mb-1 block" style={{ color: 'var(--text2)' }}>
                        Nivel {i + 1} · {c.score_lo}–{c.score_hi}
                      </label>
                      <input
                        value={c.name}
                        onChange={e => setCats(cats.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                        className="w-full bg-transparent border-b text-sm font-semibold outline-none py-1"
                        style={{ color: 'var(--text)', borderColor: 'var(--border)' }}
                      />
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="color"
                          value={c.color}
                          onChange={e => setCats(cats.map((x, j) => j === i ? { ...x, color: e.target.value } : x))}
                          className="w-8 h-8 rounded cursor-pointer"
                        />
                        <span className="text-xs font-mono" style={{ color: 'var(--text2)' }}>{c.color}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 2. Variables */}
              <section>
                <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--text)' }}>2. Variables del índice</h3>
                <p className="text-xs mb-3" style={{ color: 'var(--text2)' }}>
                  Incluí las variables que participan y ordená la prioridad (arriba pesa más).
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {catalog.map(v => {
                    const on = included.find(x => x.label === v.label)
                    return (
                      <button
                        key={v.label}
                        onClick={() => toggleVar(v.label, v.name)}
                        className="px-3 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5"
                        style={on
                          ? { background: '#67B7E8', color: 'white', borderColor: '#67B7E8' }
                          : { background: 'var(--bg)', color: 'var(--text2)', borderColor: 'var(--border)' }}
                      >
                        {on ? <Check size={12} /> : <Activity size={12} />} {v.name}
                      </button>
                    )
                  })}
                </div>
                {included.length > 0 && (
                  <div className="space-y-2">
                    {included.map((v, idx) => (
                      <div key={v.label} className="flex items-center gap-2 rounded-xl border px-3 py-2" style={{ borderColor: 'var(--border)' }}>
                        <div className="flex flex-col">
                          <button onClick={() => moveVar(idx, -1)} className="text-[--text2] hover:text-[#67B7E8]" style={{ color: idx === 0 ? 'transparent' : 'var(--text2)' }} disabled={idx === 0}>
                            <ChevronUp size={14} />
                          </button>
                          <button onClick={() => moveVar(idx, 1)} className="hover:text-[#67B7E8]" style={{ color: idx === included.length - 1 ? 'transparent' : 'var(--text2)' }} disabled={idx === included.length - 1}>
                            <ChevronDown size={14} />
                          </button>
                        </div>
                        <div className="w-6 text-center text-xs font-bold" style={{ color: 'var(--text2)' }}>{idx + 1}</div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{v.nombre}</div>
                          <div className="text-[11px] font-mono" style={{ color: 'var(--text2)' }}>{v.label}</div>
                        </div>
                        <button onClick={() => toggleVar(v.label, v.nombre)} style={{ color: '#EF4444' }} className="hover:opacity-70">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* 3. Rangos */}
              {included.length > 0 && (
                <section>
                  <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--text)' }}>3. Límites de cada variable</h3>
                  <p className="text-xs mb-3" style={{ color: 'var(--text2)' }}>
                    Límite superior (max) de cada categoría. El límite del último nivel queda abierto.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse min-w-[560px]">
                      <thead>
                        <tr>
                          <th className="text-left py-2 pr-4 font-bold" style={{ color: 'var(--text2)' }}>Variable</th>
                          {cats.map((c, i) => (
                            <th key={c._id} className="text-left py-2 px-2 font-bold" style={{ color: c.color }}>{c.name}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {included.map(v => (
                          <tr key={v.label} style={{ borderTop: '1px solid var(--border)', }}>
                            <td className="py-2 pr-4 font-semibold whitespace-nowrap" style={{ color: 'var(--text)' }}>{v.nombre}</td>
                            {cats.map((c, i) => {
                              const r = ranges.find(x => x.variable_label === v.label && x.cat_order === c._id + 1)
                              if (i === cats.length - 1) {
                                return <td key={c._id} className="py-2 px-2 text-xs" style={{ color: 'var(--text2)' }}>sin límite</td>
                              }
                              return (
                                <td key={c._id} className="py-2 px-2">
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      placeholder="max"
                                      value={r?.max_value ?? ''}
                                      onChange={e => setRangeMax(v.label, c._id + 1, e.target.value)}
                                      className="w-24 bg-transparent border rounded-lg px-2 py-1 text-sm outline-none"
                                      style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                                    />
                                    <span className="text-[10px]" style={{ color: 'var(--text2)' }}>max</span>
                                  </div>
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* Guardar */}
              <div className="flex justify-end gap-3 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <button onClick={close} className="px-4 py-2.5 rounded-xl text-sm font-bold border" style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}>
                  Cancelar
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: '#67B7E8' }}
                >
                  <Save size={15} /> {saving ? 'Guardando...' : 'Guardar configuración'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal nueva estación ── */}
        {showAddDevice && space && (
          <AddDeviceModal
            spaceId={space.id}
            onClose={() => setShowAddDevice(false)}
            onAdd={() => {
              setDeviceList([])
              setLoadingDevices(true)
              spacesApi.devices(space.id)
                .then(setDeviceList)
                .catch(() => {})
                .finally(() => setLoadingDevices(false))
            }}
          />
        )}

        {/* ── Modal nuevo espacio ── */}
        {creating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <div className="w-full max-w-md rounded-2xl p-6" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-lg" style={{ color: 'var(--text)' }}>Nuevo espacio</h3>
                <button onClick={() => setCreating(false)} style={{ color: 'var(--text2)' }}><X size={18} /></button>
              </div>
              <label className="text-xs font-bold uppercase tracking-wide mb-1 block" style={{ color: 'var(--text2)' }}>Nombre</label>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Ej: Calidad de agua"
                className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none mb-1"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
              {newName.trim() && (
                <div className="flex items-center gap-1.5 mb-3 text-xs font-mono px-1" style={{ color: 'var(--text2)' }}>
                  <Check size={12} /> slug: {generateLabel(newName.trim())}
                </div>
              )}

              <label className="text-xs font-bold uppercase tracking-wide mb-2 block" style={{ color: 'var(--text2)' }}>Tipo de monitoreo</label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[
                  { v: 'aire',  l: 'Aire',   i: <Wind size={18} />, c: '#67B7E8' },
                  { v: 'agua',  l: 'Agua',   i: <Droplets size={18} />, c: '#43B6A0' },
                  { v: 'suelo', l: 'Suelo',  i: <Mountain size={18} />, c: '#B08460' },
                  { v: 'ruido', l: 'Ruido',  i: <Volume2 size={18} />, c: '#C0637D' },
                  { v: 'otro',  l: 'Otro',   i: <Type size={18} />, c: '#8B5CF6' }
                ].map(t => (
                  <button
                    key={t.v}
                    type="button"
                    onClick={() => { setNewType(t.v); if (t.v !== 'otro') {} }}
                    className="flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-bold transition-all outline-none"
                    style={{
                      borderColor: newType === t.v ? t.c : 'var(--border)',
                      background: newType === t.v ? t.c + '18' : 'var(--bg)',
                      color: newType === t.v ? t.c : 'var(--text2)',
                      boxShadow: newType === t.v ? `0 0 0 2px ${t.c}40` : 'none'
                    }}
                  >
                    {t.i}
                    {t.l}
                  </button>
                ))}
              </div>

              {newType === 'otro' && (
                <>
                  <label className="text-xs font-bold uppercase tracking-wide mb-1 block" style={{ color: 'var(--text2)' }}>Nombre de tu tipo</label>
                  <input
                    value={newCustomType}
                    onChange={e => setNewCustomType(e.target.value)}
                    placeholder="Ej: Presión"
                    className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none mb-3"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  />
                  <label className="text-xs font-bold uppercase tracking-wide mb-2 block" style={{ color: 'var(--text2)' }}>Elegí un icono</label>
                  <div className="grid grid-cols-6 gap-2 mb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ maxHeight: 224, overflowY: 'auto' }}>
                    {[
                      { n: 'sensor',  i: <Cpu size={18} /> },
                      { n: 'gota',    i: <Droplets size={18} /> },
                      { n: 'viento',  i: <Wind size={18} /> },
                      { n: 'sol',     i: <Sun size={18} /> },
                      { n: 'hoja',    i: <Leaf size={18} /> },
                      { n: 'llama',   i: <Flame size={18} /> },
                      { n: 'thermo',  i: <Thermometer size={18} /> },
                      { n: 'nube',    i: <Cloud size={18} /> },
                      { n: 'onda',    i: <Waves size={18} /> },
                      { n: 'ruido',   i: <Volume2 size={18} /> },
                      { n: 'servidor',i: <Server size={18} /> },
                      { n: 'heart',   i: <HeartPulse size={18} /> },
                      { n: 'luna',    i: <Moon size={18} /> },
                      { n: 'estrella',i: <Star size={18} /> },
                      { n: 'amanecer',i: <Sunrise size={18} /> },
                      { n: 'atardecer',i:<Sunset size={18} /> },
                      { n: 'lluvia',  i: <CloudRain size={18} /> },
                      { n: 'nieve',   i: <CloudSnow size={18} /> },
                      { n: 'tormenta',i: <CloudLightning size={18} /> },
                      { n: 'solnube', i: <CloudSun size={18} /> },
                      { n: 'nublado', i: <Cloudy size={18} /> },
                      { n: 'copo',    i: <Snowflake size={18} /> },
                      { n: 'insecto', i: <Bug size={18} /> },
                      { n: 'brote',   i: <Sprout size={18} /> },
                      { n: 'flor',    i: <Flower2 size={18} /> },
                      { n: 'fabrica', i: <Factory size={18} /> },
                      { n: 'edificio',i: <Building2 size={18} /> },
                      { n: 'deposito',i: <Warehouse size={18} /> },
                      { n: 'conejo',  i: <Rabbit size={18} /> },
                      { n: 'negocio', i: <Briefcase size={18} /> },
                      { n: 'relampago',i:<Zap size={18} /> },
                      { n: 'bateria', i: <BatteryFull size={18} /> },
                      { n: 'tiempo',  i: <Timer size={18} /> },
                      { n: 'horas',   i: <Hourglass size={18} /> },
                      { n: 'candado', i: <Lock size={18} /> },
                      { n: 'escudo',  i: <Shield size={18} /> },
                      { n: 'alerta',  i: <ShieldAlert size={18} /> },
                      { n: 'llave',   i: <Key size={18} /> },
                      { n: 'radar',   i: <Radar size={18} /> },
                      { n: 'red',     i: <Network size={18} /> },
                      { n: 'blue',    i: <Bluetooth size={18} /> },
                      { n: 'satelite',i: <Satellite size={18} /> },
                      { n: 'blanco',  i: <Target size={18} /> },
                      { n: 'base',    i: <Database size={18} /> },
                      { n: 'cerebro', i: <Brain size={18} /> },
                      { n: 'medidor', i: <Gauge size={18} /> }
                    ].map(ic => (
                      <button
                        key={ic.n}
                        type="button"
                        onClick={() => setNewCustomIcon(ic.n)}
                        className="flex items-center justify-center rounded-xl border py-3 transition-all outline-none"
                        style={{
                          borderColor: newCustomIcon === ic.n ? 'var(--primary)' : 'var(--border)',
                          background: newCustomIcon === ic.n ? '#67B7E8' + '18' : 'var(--bg)',
                          color: newCustomIcon === ic.n ? '#67B7E8' : 'var(--text2)',
                          boxShadow: newCustomIcon === ic.n ? '0 0 0 2px #67B7E840' : 'none'
                        }}
                      >
                        {ic.i}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    tabIndex={-1}
                    className="block mx-auto animate-bounce transition-all"
                    style={{ color: 'var(--text2)', cursor: 'default' }}
                    onClick={() => {
                      const gal = document.querySelector('[data-grilla-otro]');
                      gal?.scrollBy({ top: 90, behavior: 'smooth' });
                    }}
                    title="Hay más iconos — deslizá"
                  >
                    <ChevronDown size={16} />
                  </button>
                </>
              )}

              <label className="text-xs font-bold uppercase tracking-wide mb-1 block" style={{ color: 'var(--text2)' }}>Descripción (opcional)</label>
              <textarea
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                placeholder="Ej: Red de sensores subterráneos..."
                rows={2}
                className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none mb-1 resize-none"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
              <div className="flex justify-end gap-3 mt-5">
                <button onClick={() => setCreating(false)} className="px-4 py-2.5 rounded-xl text-sm font-bold border" style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}>Cancelar</button>
                <button onClick={createSpace} className="px-4 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: '#67B7E8' }}>Crear</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ClienteLayout>
  )
}
