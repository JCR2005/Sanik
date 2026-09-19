import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ClienteLayout from '../components/sanik/ClienteLayout'
import { spaces as spacesApi } from '../services/api'
import {
  Plus, X, Check, ChevronDown, Pencil, ArrowRight,
  Layers, Server, MapPin,
  Wind, Droplets, Mountain, Volume2, Type,
  Sun, Leaf, Flame, Cloud, Waves, Thermometer, HeartPulse, Cpu,
  Moon, Star, Sunrise, Sunset, CloudRain, CloudSnow, CloudLightning, CloudSun, Cloudy, Snowflake,
  Bug, Sprout, Flower2, Factory, Building2, Warehouse, Rabbit, Briefcase, Zap,
  BatteryFull, Timer, Hourglass, Lock, Shield, ShieldAlert, Key, Radar, Network, Satellite, Bluetooth, Target, Heart, Database, Brain, Gauge
} from 'lucide-react'

const COLORS = { primary: '#67B7E8' }

const generateLabel = (text) => text
  .toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
   .replace(/(^-|-$)+/g, '')

const iconByLabel = {
  aire: Wind, tierra: Leaf, agua: Droplets, suelo: Mountain, ruido: Volume2,
  otro: Layers, 'map-pin': MapPin,
  sensor: Cpu, gota: Droplets, viento: Wind, sol: Sun, hoja: Leaf, llama: Flame,
  thermo: Thermometer, nube: Cloud, onda: Waves, servidor: Server,
  heart: HeartPulse, luna: Moon, estrella: Star, amanecer: Sunrise, atardecer: Sunset,
  lluvia: CloudRain, nieve: CloudSnow, tormenta: CloudLightning, solnube: CloudSun,
  nublado: Cloudy, copo: Snowflake, insecto: Bug, brote: Sprout, flor: Flower2,
  fabrica: Factory, edificio: Building2, deposito: Warehouse, conejo: Rabbit,
  negocio: Briefcase, relampago: Zap, bateria: BatteryFull, tiempo: Timer,
  horas: Hourglass, candado: Lock, escudo: Shield, alerta: ShieldAlert, llave: Key,
  radar: Radar, red: Network, blue: Bluetooth, satelite: Satellite, blanco: Target,
  base: Database, cerebro: Brain, medidor: Gauge
}

const spaceIcon = (label, fallback, size = 18) => {
  const C = (label && iconByLabel[label]) ? iconByLabel[label]
            : (iconByLabel[fallback] || Layers)
  return <C size={size} />
}

export default function Spaces() {
  const navigate = useNavigate()

  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)

  const [creating, setCreating] = useState(false)   // modal nuevo espacio
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('aire')
  const [newCustomType, setNewCustomType] = useState('')
  const [newCustomIcon, setNewCustomIcon] = useState('Type')
  const [newDescription, setNewDescription] = useState('')

  const loadSpaces = () => {
    spacesApi.list()
      .then(d => { setList(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    loadSpaces()
  }, [])

  const createSpace = async () => {
    if (!newName.trim()) return
    const finalType = newType === 'otro' ? (newCustomType.trim() || 'otro') : newType
    const TYPE_ICONS = { aire: 'aire', agua: 'agua', suelo: 'suelo', ruido: 'ruido' }
    const finalIcon = newType === 'otro'
      ? (newCustomIcon && newCustomIcon !== 'Type' ? newCustomIcon : 'otro')
      : (TYPE_ICONS[newType] || 'otro')
    const s = await spacesApi.create({ name: newName.trim(), slug: generateLabel(newName.trim()), type: finalType, icon: finalIcon })
    setCreating(false)
    setNewName(''); setNewType('aire'); setNewCustomType(''); setNewCustomIcon(''); setNewDescription('')
    await loadSpaces()
    navigate(`/espacios/${s.id}`)
  }

  return (
    <ClienteLayout>
      <div className="min-h-full px-4 py-6 md:px-8 md:py-10 page-bg">
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
        {loading ? (
          <div className="text-center py-12 text-sm" style={{ color: 'var(--text2)' }}>Cargando...</div>
        ) : list.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed" style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}>
            <Layers size={32} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">Aún no tenés espacios</p>
            <button
              onClick={() => setCreating(true)}
              className="mt-5 inline-flex items-center gap-2 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
              style={{ background: '#67B7E8' }}
            >
              <Plus size={15} /> Crear el primero
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map(s => (
              <div
                key={s.id}
                onClick={() => navigate(`/espacios/${s.id}`)}
                className="group rounded-2xl p-5 border cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg"
                style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(103,183,232,0.12)', color: '#67B7E8' }}>
                    {spaceIcon(s.icon, s.type, 18)}
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
                <div className="flex items-center gap-1 text-xs font-semibold mt-3 group-hover:gap-2 transition-all" style={{ color: '#67B7E8' }}>
                  Ver espacio <ArrowRight size={11} />
                </div>
              </div>
            ))}
          </div>
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
                    onClick={() => setNewType(t.v)}
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