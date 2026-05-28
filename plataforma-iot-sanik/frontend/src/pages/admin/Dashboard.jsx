import { useState, useEffect } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { devices as devicesApi } from '../../services/api'
import { Users, Cpu, Activity, Clock, TrendingUp, AlertTriangle } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalClients: 0, activeDevices: 0, pendingDevices: 0,
    offlineDevices: 0, pendingRequests: 0, pendingPayments: 0
  })

  // Por ahora datos de ejemplo — después se conecta al backend
  useEffect(() => {
    setStats({
      totalClients: 3,
      activeDevices: 5,
      pendingDevices: 2,
      offlineDevices: 1,
      pendingRequests: 1,
      pendingPayments: 2
    })
  }, [])

  const STAT_CARDS = [
    { label: 'Clientes activos', value: stats.totalClients, icon: Users, color: '#1D9E75', bg: 'rgba(29,158,117,.1)' },
    { label: 'Dispositivos activos', value: stats.activeDevices, icon: Activity, color: '#60A5FA', bg: 'rgba(96,165,250,.1)' },
    { label: 'Dispositivos pendientes', value: stats.pendingDevices, icon: Clock, color: '#F59E0B', bg: 'rgba(245,158,11,.1)' },
    { label: 'Sin conexión', value: stats.offlineDevices, icon: Cpu, color: '#8FA899', bg: 'rgba(143,168,153,.1)' },
    { label: 'Solicitudes nuevas', value: stats.pendingRequests, icon: TrendingUp, color: '#A78BFA', bg: 'rgba(167,139,250,.1)' },
    { label: 'Pagos pendientes', value: stats.pendingPayments, icon: AlertTriangle, color: '#F87171', bg: 'rgba(248,113,113,.1)' },
  ]

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-white text-2xl font-bold">Dashboard</h1>
          <p className="text-[#8FA899] text-sm mt-1">Resumen general de la plataforma</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {STAT_CARDS.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-[#121A16] border border-[#1E2E28] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[#8FA899] text-sm">{label}</span>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                  <Icon size={16} style={{ color }} />
                </div>
              </div>
              <div className="text-3xl font-bold" style={{ color, fontFamily: 'Syne,sans-serif' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Actividad reciente */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-[#121A16] border border-[#1E2E28] rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-4">Actividad reciente</h2>
            <div className="space-y-3">
              {[
                { msg: 'Municipalidad Xela — nuevo dispositivo creado', time: 'Hace 2h', color: '#1D9E75' },
                { msg: 'Estación Centro — sin conexión', time: 'Hace 5h', color: '#F59E0B' },
                { msg: 'CUNOC — pago registrado', time: 'Hace 1 día', color: '#60A5FA' },
                { msg: 'Nueva solicitud de dispositivo', time: 'Hace 2 días', color: '#A78BFA' },
              ].map((a, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-[#1E2E28] last:border-0">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: a.color }} />
                  <span className="text-[#8FA899] text-sm flex-1">{a.msg}</span>
                  <span className="text-[#8FA899] text-xs">{a.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#121A16] border border-[#1E2E28] rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-4">Pagos pendientes</h2>
            <div className="space-y-3">
              {[
                { org: 'Municipalidad Xela', plan: 'Pro Q299', vence: '01 Jun 2026', dias: 5 },
                { org: 'Empresa Industrial S.A.', plan: 'Pro Q299', vence: '15 Jun 2026', dias: 19 },
              ].map((p, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-[#1E2E28] last:border-0">
                  <div>
                    <div className="text-white text-sm">{p.org}</div>
                    <div className="text-[#8FA899] text-xs">{p.plan} · vence {p.vence}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${p.dias <= 7 ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    {p.dias} días
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
