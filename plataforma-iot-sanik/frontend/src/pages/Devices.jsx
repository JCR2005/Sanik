import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import ClienteLayout from "../components/sanik/ClienteLayout"
import { devices as devicesApi } from '../services/api'
import { Search, MapPin, Eye, Wifi, WifiOff, Server, ArrowRight, Clock } from 'lucide-react'

// Mapa con marcadores custom y click para navegar
function DevicesMap({ devices, onSelect }) {
  const mapRef = useRef(null)
  const instanceRef = useRef(null)

  useEffect(() => {
    const withGPS = devices.filter(d => d.lat && d.lng)
    if (!withGPS.length) return

    const init = () => {
      if (!mapRef.current || instanceRef.current) return
      const L = window.L
      const center = [withGPS[0].lat, withGPS[0].lng]
      const map = L.map(mapRef.current, { scrollWheelZoom: false, zoomControl: true })
      instanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(map)

      withGPS.forEach(d => {
        const isOnline = d.status === 'online'
        const color = isOnline ? '#2BA8A0' : '#F59E0B'
        const icon = L.divIcon({
          html: `
            <div style="position:relative;width:20px;height:20px;cursor:pointer">
              ${isOnline ? `<div style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:.3;animation:ping 1.5s cubic-bezier(0,0,.2,1) infinite"></div>` : ''}
              <div style="position:absolute;inset:3px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 2px 8px ${color}88"></div>
            </div>`,
          className: '',
          iconAnchor: [10, 10]
        })

        const marker = L.marker([d.lat, d.lng], { icon }).addTo(map)
        marker.bindTooltip(`<b>${d.name}</b><br/><span style="color:${color}">${isOnline ? '● En línea' : '● Sin señal'}</span>`, {
          direction: 'top', offset: [0, -8], className: 'leaflet-tooltip-custom'
        })
        marker.on('click', () => onSelect(d))
      })

      if (withGPS.length === 1) {
        map.setView(center, 14)
      } else {
        map.fitBounds(L.latLngBounds(withGPS.map(d => [d.lat, d.lng])), { padding: [40, 40] })
      }
    }

    if (!window.L) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = init
      document.head.appendChild(script)
    } else {
      init()
    }

    return () => {
      if (instanceRef.current) {
        instanceRef.current.remove()
        instanceRef.current = null
      }
    }
  }, [devices])

  const withGPS = devices.filter(d => d.lat && d.lng)
  if (!withGPS.length) return null

  return (
    <>
      <style>{`
        @keyframes ping { 75%,100%{transform:scale(2);opacity:0} }
        .leaflet-tooltip-custom { background:white;border:1px solid #D6E8F5;border-radius:8px;padding:6px 10px;font-size:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1); }
        .leaflet-tooltip-custom::before { display:none; }
      `}</style>
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
    </>
  )
}

export default function ClientDevices() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    devicesApi.list().then(data => {
      setDevices(data)
      setLoading(false)
    })
  }, [])

  const filtered = devices.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.label.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || d.status === filter
    return matchSearch && matchFilter
  })

  const online  = devices.filter(d => d.status === 'online').length
  const offline = devices.length - online
  const withGPS = devices.filter(d => d.lat && d.lng).length

  return (
    <ClienteLayout>
      <div className="min-h-full px-8 py-10"
        style={{ backgroundImage: 'radial-gradient(circle at 50% -20%, rgba(103,183,232,0.15) 0%, rgba(103,183,232,0.04) 30%, transparent 70%)' }}>

        {/* Header */}
        <div className="mb-8 flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--text)', fontFamily: "'Syne',sans-serif" }}>
              Mis Estaciones
            </h1>
            <p className="text-sm" style={{ color: 'var(--text2)' }}>
              {devices.length} estaciones · <span style={{color:'#2BA8A0'}}>{online} en línea</span> · <span style={{color:'#F59E0B'}}>{offline} sin señal</span>
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Filtros */}
            <div className="flex items-center gap-1 p-1 rounded-xl border" style={{background:'var(--card)', borderColor:'var(--border)'}}>
              {[['all','Todas'],['online','En línea'],['offline','Sin señal']].map(([key, label]) => (
                <button key={key} onClick={() => setFilter(key)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={filter === key ? {background:'#67B7E8', color:'white'} : {color:'var(--text2)'}}>
                  {label}
                </button>
              ))}
            </div>
            {/* Búsqueda */}
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{color:'var(--text2)'}}/>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar estación..."
                className="pl-10 pr-4 py-2.5 rounded-xl text-sm border outline-none w-56"
                style={{background:'var(--card)', borderColor:'var(--border)', color:'var(--text)'}}/>
            </div>
          </div>
        </div>

        {/* Mapa + Panel lateral */}
        {withGPS > 0 && (
          <div className="rounded-3xl border overflow-hidden mb-8 flex" style={{background:'var(--card)', borderColor:'var(--border)', height:360}}>
            
            {/* Mapa */}
            <div className="flex-1 relative" style={{zIndex:0}}>
              <div className="absolute top-3 left-3 z-10 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{background:'var(--card)', color:'#67B7E8', border:'1px solid var(--border)'}}>
                <MapPin size={11} className="inline mr-1"/> Clic en una estación para ver detalles
              </div>
              <DevicesMap devices={devices} onSelect={setSelected}/>
            </div>

            {/* Panel lateral del mapa */}
            <div className="w-72 border-l flex flex-col" style={{borderColor:'var(--border)'}}>
              <div className="p-4 border-b" style={{borderColor:'var(--border)'}}>
                <h3 className="font-bold text-sm" style={{color:'var(--text)'}}>
                  {selected ? selected.name : 'Seleccioná una estación'}
                </h3>
                {selected && <p className="text-xs font-mono mt-0.5" style={{color:'var(--text2)'}}>{selected.label}</p>}
              </div>

              {selected ? (
                <div className="flex-1 p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold ${selected.status === 'online' ? 'bg-[#2BA8A0]/10 text-[#2BA8A0]' : 'bg-amber-500/10 text-amber-500'}`}>
                      {selected.status === 'online' ? <Wifi size={10}/> : <WifiOff size={10}/>}
                      {selected.status === 'online' ? 'En línea' : 'Sin señal'}
                    </span>
                  </div>
                  {selected.lat && (
                    <div className="text-xs flex items-center gap-1.5" style={{color:'var(--text2)'}}>
                      <MapPin size={11}/> {Number(selected.lat).toFixed(5)}, {Number(selected.lng).toFixed(5)}
                    </div>
                  )}
                  {selected.last_seen && (
                    <div className="text-xs flex items-center gap-1.5" style={{color:'var(--text2)'}}>
                      <Clock size={11}/> {new Date(selected.last_seen).toLocaleString('es-GT')}
                    </div>
                  )}
                  <div className="flex-1"/>
                  <button onClick={() => navigate(`/devices/${selected.id}`)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                    style={{background:'#67B7E8'}}>
                    Ver detalles <ArrowRight size={14}/>
                  </button>
                  <button onClick={() => setSelected(null)}
                    className="w-full text-xs py-2 rounded-xl border transition-all"
                    style={{borderColor:'var(--border)', color:'var(--text2)'}}>
                    Cerrar
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center" style={{color:'var(--text2)'}}>
                  <MapPin size={28} className="mb-2 opacity-20"/>
                  <p className="text-xs">Presioná un punto<br/>en el mapa</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tarjetas de dispositivos */}
        {loading ? (
          <div className="text-center py-12 text-sm" style={{color:'var(--text2)'}}>Cargando estaciones...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed" style={{borderColor:'var(--border)', color:'var(--text2)'}}>
            <Server size={32} className="mx-auto mb-3 opacity-20"/>
            <p className="text-sm font-medium">Sin resultados</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(d => {
              const isOnline = d.status === 'online'
              return (
                <div key={d.id}
                  onClick={() => navigate(`/devices/${d.id}`)}
                  className="group rounded-2xl p-5 border cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg"
                  style={{background:'var(--card)', borderColor: isOnline ? 'rgba(43,168,160,.25)' : 'var(--border)'}}>

                  {/* Top */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{background: isOnline ? 'rgba(43,168,160,.1)' : 'rgba(103,183,232,.1)', color: isOnline ? '#2BA8A0' : '#67B7E8'}}>
                      <Server size={18}/>
                    </div>
                    <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold ${isOnline ? 'bg-[#2BA8A0]/10 text-[#2BA8A0]' : 'bg-amber-500/10 text-amber-500'}`}>
                      {isOnline
                        ? <><span className="w-1.5 h-1.5 rounded-full bg-[#2BA8A0] animate-pulse"/><Wifi size={9}/> En línea</>
                        : <><WifiOff size={9}/> Sin señal</>}
                    </span>
                  </div>

                  {/* Nombre */}
                  <h3 className="font-bold text-sm mb-0.5 truncate" style={{color:'var(--text)'}}>{d.name}</h3>
                  <p className="text-xs font-mono mb-3" style={{color:'var(--text2)'}}>{d.label}</p>

                  {/* Info */}
                  <div className="space-y-1 mb-4">
                    {d.lat && (
                      <div className="flex items-center gap-1.5 text-xs" style={{color:'var(--text2)'}}>
                        <MapPin size={11}/> {Number(d.lat).toFixed(4)}, {Number(d.lng).toFixed(4)}
                      </div>
                    )}
                    {d.last_seen && (
                      <div className="flex items-center gap-1.5 text-xs" style={{color:'var(--text2)'}}>
                        <Clock size={11}/> {new Date(d.last_seen).toLocaleString('es-GT')}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t" style={{borderColor:'var(--border)'}}>
                    <span className="text-xs" style={{color:'var(--text2)'}}>
                      {d.variable_count || 0} variables
                    </span>
                    <span className="flex items-center gap-1 text-xs font-semibold group-hover:gap-2 transition-all" style={{color:'#67B7E8'}}>
                      <Eye size={12}/> Ver detalles <ArrowRight size={11}/>
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </ClienteLayout>
  )
}