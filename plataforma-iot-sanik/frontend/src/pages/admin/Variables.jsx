import { useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { Plus, Trash2, X, Thermometer, Droplets, Wind, Cloud, Sun, Flame, Activity } from 'lucide-react'

const ICONS = { Thermometer, Droplets, Wind, Cloud, Sun, Flame, Activity }
const INPUT = "w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#1D9E75] transition-colors"

const DEFAULT_VARS = [
  { id: '1', name: 'Temperatura', label: 'temperatura', unit: '°C', icon: 'Thermometer', description: 'Temperatura ambiental del aire' },
  { id: '2', name: 'Humedad', label: 'humedad', unit: '%', icon: 'Droplets', description: 'Humedad relativa del aire' },
  { id: '3', name: 'SO₂', label: 'so2', unit: 'ppb', icon: 'Cloud', description: 'Dióxido de azufre' },
  { id: '4', name: 'PM2.5', label: 'pm25', unit: 'µg/m³', icon: 'Wind', description: 'Material particulado 2.5 micras' },
  { id: '5', name: 'PM1', label: 'pm1', unit: 'µg/m³', icon: 'Wind', description: 'Material particulado 1 micra' },
  { id: '6', name: 'PM10', label: 'pm10', unit: 'µg/m³', icon: 'Wind', description: 'Material particulado 10 micras' },
  { id: '7', name: 'O₃', label: 'o3', unit: 'ppb', icon: 'Sun', description: 'Ozono troposférico' },
  { id: '8', name: 'NOx', label: 'nox', unit: 'ppb', icon: 'Flame', description: 'Óxidos de nitrógeno' },
  { id: '9', name: 'NH₃', label: 'nh3', unit: 'ppb', icon: 'Activity', description: 'Amoniaco' },
  { id: '10', name: 'MQ135 ADC', label: 'mq135_adc', unit: 'ADC', icon: 'Activity', description: 'Lectura analógica sensor MQ135' },
]

// Modal FUERA del componente padre
function NewVariableModal({ onClose, onCreate }) {
  const [name, setName] = useState('')
  const [label, setLabel] = useState('')
  const [unit, setUnit] = useState('')
  const [icon, setIcon] = useState('Activity')
  const [description, setDescription] = useState('')
  const s = { background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }

  const handleSubmit = (e) => {
    e.preventDefault()
    onCreate({ id: Date.now().toString(), name, label, unit, icon, description })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl p-6 w-full max-w-md border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold" style={{ color: 'var(--text)' }}>Nueva variable</h2>
          <button onClick={onClose} style={{ color: 'var(--text2)' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs block mb-1.5" style={{ color: 'var(--text2)' }}>Nombre para mostrar</label>
              <input className={INPUT} style={s} value={name} onChange={e => setName(e.target.value)} placeholder="Temperatura" required />
            </div>
            <div>
              <label className="text-xs block mb-1.5" style={{ color: 'var(--text2)' }}>Label técnico</label>
              <input className={`${INPUT} font-mono`} style={s} value={label} onChange={e => setLabel(e.target.value)} placeholder="temperatura" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs block mb-1.5" style={{ color: 'var(--text2)' }}>Unidad</label>
              <input className={INPUT} style={s} value={unit} onChange={e => setUnit(e.target.value)} placeholder="°C" required />
            </div>
            <div>
              <label className="text-xs block mb-1.5" style={{ color: 'var(--text2)' }}>Ícono</label>
              <select className={INPUT} style={s} value={icon} onChange={e => setIcon(e.target.value)}>
                {Object.keys(ICONS).map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs block mb-1.5" style={{ color: 'var(--text2)' }}>Descripción</label>
            <input className={INPUT} style={s} value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripción de la variable..." />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 border rounded-lg py-2.5 text-sm" style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}>Cancelar</button>
            <button type="submit" className="flex-1 bg-[#1D9E75] hover:bg-[#25C48F] text-white py-2.5 rounded-lg text-sm font-medium">Crear</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminVariables() {
  const [variables, setVariables] = useState(DEFAULT_VARS)
  const [showModal, setShowModal] = useState(false)

  return (
    <AdminLayout>
      {showModal && (
        <NewVariableModal
          onClose={() => setShowModal(false)}
          onCreate={v => { setVariables(prev => [...prev, v]); setShowModal(false) }}
        />
      )}
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Variables</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text2)' }}>Variables disponibles para los dispositivos</p>
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-[#1D9E75] hover:bg-[#25C48F] text-white px-4 py-2.5 rounded-lg text-sm font-medium">
            <Plus size={16} /> Nueva variable
          </button>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {variables.map(v => {
            const Icon = ICONS[v.icon] || Activity
            return (
              <div key={v.id} className="border rounded-xl p-4 flex items-center gap-4" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                <div className="w-10 h-10 rounded-xl bg-[#1D9E75]/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-[#1D9E75]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{v.name}</span>
                    <span className="text-xs" style={{ color: 'var(--text2)' }}>{v.unit}</span>
                  </div>
                  <div className="text-xs font-mono mt-0.5" style={{ color: 'var(--text2)' }}>{v.label}</div>
                  {v.description && <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--text2)' }}>{v.description}</div>}
                </div>
                <button onClick={() => setVariables(prev => prev.filter(x => x.id !== v.id))} className="p-2 rounded-lg hover:text-red-400 transition-colors flex-shrink-0" style={{ color: 'var(--text2)' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </AdminLayout>
  )
}
