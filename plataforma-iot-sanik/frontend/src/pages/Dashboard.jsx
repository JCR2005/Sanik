import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ClienteLayout from '../components/sanik/ClienteLayout'
import { devices as devicesApi } from '../services/api'
import { Activity, Cpu, AlertTriangle, MapPin, Navigation } from 'lucide-react'
import useAuthStore from '../store/auth'

// Importes para el Mapa
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Arreglo para los íconos por defecto de Leaflet en React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function ClientDashboard() {
  const navigate = useNavigate()
  const { user, org } = useAuthStore()
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    devicesApi.list().then(setDevices).finally(() => setLoading(false))
  }, [])

  const activeCount = devices.filter(d => d.status === 'online' || d.status === 'active').length
  const offlineCount = devices.filter(d => d.status === 'offline' || d.status === 'inactive').length

  const today = new Intl.DateTimeFormat('es-GT', {
    weekday: 'long', day: 'numeric', month: 'long'
  }).format(new Date())

  const STAT_CARDS = [
    { label: 'Total Estaciones', value: devices.length, icon: Cpu, color: '#67B7E8', bg: 'rgba(103,183,232,0.12)' },
    { label: 'En Línea', value: activeCount, icon: Activity, color: '#2BA8A0', bg: 'rgba(43,168,160,0.1)' },
    { label: 'Sin Conexión', value: offlineCount, icon: AlertTriangle, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  ]

  // Coordenadas por defecto por si no hay dispositivos
  const defaultCenter = [14.8347, -91.5185] 
  const mapCenter = devices.length > 0 && devices[0].lat ? [devices[0].lat, devices[0].lng] : defaultCenter

  // Lógica para mostrar un saludo más elegante
  const greetingName = org?.name || user?.name || '';

  if (loading) return (
    <ClienteLayout>
      <div className="flex items-center justify-center h-screen text-sm font-medium" style={{color:'var(--text2)'}}>
        Preparando tu panel...
      </div>
    </ClienteLayout>
  )

  return (
    <ClienteLayout>
      <div 
        className="min-h-full px-10 py-10"
        style={{ 
          backgroundImage: 'radial-gradient(circle at 50% -20%, rgba(103,183,232,0.18) 0%, rgba(103,183,232,0.05) 30%, transparent 70%)'
        }}
      >
        
        {/* Encabezado */}
        <div className="mb-10 flex flex-col gap-1">
          <p className="text-sm font-semibold capitalize tracking-wide" style={{ color: '#67B7E8' }}>
            {today}
          </p>
          <h1 className="text-4xl font-bold tracking-tight" style={{ color: 'var(--text)', fontFamily: "'Syne', sans-serif" }}>
            {greetingName ? `Bienvenido, ${greetingName}` : 'Bienvenido'}
          </h1>
          <p className="text-base mt-2" style={{ color: 'var(--text2)' }}>
            Panel general de monitoreo {org?.name ? `para ${org.name}` : 'de estaciones'}.
          </p>
        </div>

        {/* Tarjetas KPI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {STAT_CARDS.map(({ label, value, icon: Icon, color, bg }) => (
            <div 
              key={label} 
              className="group rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1.5 cursor-default" 
              style={{ 
                background: 'var(--card)', 
                border: '1px solid var(--border)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: bg }}>
                  <Icon size={22} strokeWidth={2.5} style={{ color }} />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-5xl font-bold tracking-tight" style={{ color: 'var(--text)', fontFamily: "'Syne', sans-serif" }}>
                  {value}
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--text2)' }}>
                  {label}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Mapa de Ubicaciones */}
          <div className="lg:col-span-2 rounded-3xl p-6 flex flex-col overflow-hidden relative" style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: '0 4px 24px rgba(0,0,0,0.02)', minHeight: '450px' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(103,183,232,0.12)', color: '#67B7E8' }}>
                <MapPin size={20} strokeWidth={2.5} />
              </div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--text)', fontFamily: "'Syne', sans-serif" }}>
                Ubicación en tiempo real
              </h2>
            </div>
            
            <div className="flex-1 w-full h-full relative z-0 rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
              <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%', minHeight: '350px' }}>
  <TileLayer
    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  />
  {devices.map((device) => (
    device.lat && device.lng && (
      <Marker key={device.id} position={[device.lat, device.lng]}>
        <Popup>
          <div className="text-center font-sans">
            <strong className="block mb-2 text-sm">{device.name}</strong>
            
            {/* Nuevo diseño de estado sin emojis y con diseño premium */}
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
              device.status === 'online' 
                ? 'bg-teal-50 text-teal-700 border-teal-200' 
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              <span 
                className="w-1.5 h-1.5 rounded-full" 
                style={{ 
                  background: device.status === 'online' ? '#2BA8A0' : '#F59E0B',
                  boxShadow: `0 0 6px ${device.status === 'online' ? '#2BA8A0' : '#F59E0B'}`
                }} 
              />
              {device.status === 'online' ? 'En línea' : 'Desconectado'}
            </div>

          </div>
        </Popup>
      </Marker>
    )
  ))}
</MapContainer>
             </div>
          </div>

          {/* Lista Rápida de Dispositivos */}
          <div className="rounded-3xl p-8 flex flex-col" style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: '0 4px 24px rgba(0,0,0,0.02)' }}>
            <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text)', fontFamily: "'Syne', sans-serif" }}>Estado de red</h2>
            
            <div className="space-y-2 overflow-y-auto overflow-x-hidden max-h-[350px] pr-2">
              {devices.slice(0, 6).map((device) => (
                <div key={device.id} className="flex items-center justify-between py-3 border-b last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] px-2 rounded-xl transition-colors" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                      style={{ 
                        background: device.status === 'online' ? '#2BA8A0' : '#F59E0B', 
                        boxShadow: `0 0 10px ${device.status === 'online' ? '#2BA8A080' : '#F59E0B80'}` 
                      }} 
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>{device.name}</p>
                      <p className="text-xs font-medium mt-0.5 truncate" style={{ color: 'var(--text2)' }}>{device.label}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate('/dispositivos')}
                    className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex-shrink-0"
                    style={{ color: 'var(--text2)' }}
                    title="Ver detalle"
                  >
                    <Navigation size={16} />
                  </button>
                </div>
              ))}
              
              {devices.length === 0 && (
                <p className="text-sm text-center py-6 font-medium" style={{ color: 'var(--text2)' }}>
                  No hay estaciones registradas aún.
                </p>
              )}
            </div>

            {devices.length > 6 && (
              <button 
                onClick={() => navigate('/dispositivos')}
                className="mt-6 w-full py-3 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
                style={{ background: 'var(--primary)', color: '#fff' }}
              >
                Ver todas las estaciones
              </button>
            )}
          </div>

        </div>
      </div>
    </ClienteLayout>
  )
}