import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ClienteLayout from "../components/sanik/ClienteLayout";
import { devices as devicesApi } from '../services/api'
import { Search, MapPin, Eye, Wifi, WifiOff, Server } from 'lucide-react'

export default function ClientDevices() {
  const navigate = useNavigate()
  const [search,  setSearch]  = useState('')
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    devicesApi.list().then(setDevices).finally(() => setLoading(false))
  }, [])

  const filtered = devices.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.label.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <ClienteLayout>
      <div
        className="min-h-full px-10 py-10"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% -20%, rgba(103,183,232,0.18) 0%, rgba(103,183,232,0.05) 30%, transparent 70%)',
        }}
      >
        <div className="mb-10 flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>
              Mis Estaciones
            </h1>
            <p className="text-sm" style={{ color: 'var(--text2)' }}>
              Monitoreo y estado en tiempo real de todos tus equipos.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text2)' }}
              />
              <input
                type="text"
                placeholder="Buscar estación..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2.5 rounded-xl text-sm border outline-none w-64 focus:ring-2 focus:ring-[#67B7E8]/20"
                style={{
                  background: 'var(--card)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.02)' }} className="dark:bg-white/[0.02] border-b border-[var(--border)]">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text2)' }}>Estación</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text2)' }}>ID / Etiqueta</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text2)' }}>Estado</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text2)' }}>Última transmisión</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm" style={{ color: 'var(--text2)' }}>
                    Cargando estaciones...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                      No se encontraron resultados
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((dev) => (
                  <tr
                    key={dev.id}
                    className="border-b last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(103,183,232,0.12)', color: '#67B7E8' }}
                        >
                          <Server size={20} />
                        </div>
                        <div>
                          <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                            {dev.name}
                          </div>
                          {dev.location && (
                            <div className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'var(--text2)' }}>
                              <MapPin size={12} /> {dev.location}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm font-mono opacity-80" style={{ color: 'var(--text2)' }}>
                      {dev.label}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          dev.status === 'online'
                            ? 'bg-[#1D9E75]/10 text-[#1D9E75]'
                            : 'bg-[#DFF1FF] text-[#2E8ED3]'
                        }`}
                      >
                        {dev.status === 'online' ? <Wifi size={12} /> : <WifiOff size={12} />}
                        {dev.status === 'online' ? 'En línea' : 'Sin señal'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--text2)' }}>
                      {dev.last_seen
                        ? new Date(dev.last_seen).toLocaleString('es-GT')
                        : '—'}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/dashboard/${dev.id}`)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5"
                        style={{ background: 'rgba(103,183,232,0.12)', color: '#67B7E8' }}
                      >
                        <Eye size={14} />
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ClienteLayout>
  )
}