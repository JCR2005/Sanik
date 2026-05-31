import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/auth'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Devices from './pages/Devices'
import Dashboard from './pages/Dashboard'
import Alerts from './pages/Alerts'
import Profile from './pages/Profile'
import AdminDashboard from './pages/admin/Dashboard'
import AdminClients from './pages/admin/Clients'
import AdminClientDetail from './pages/admin/ClientDetail'
import AdminDeviceDetail from './pages/admin/DeviceDetail'
import AdminTeam from './pages/admin/Team'
import AdminVariables from './pages/admin/Variables'
import AdminRequests from './pages/admin/Requests'

const ADMIN_ROLES = ['admin', 'superadmin', 'worker']

// ARREGLO 1: Cuando el cliente inicie sesión o se pierda, mandarlo a '/dashboard', no a '/devices'
const getRedirectPath = (role) => {
  return ADMIN_ROLES.includes(role) ? '/admin' : '/dashboard'
}

function GuestRoute({ children }) {
  const { token, user } = useAuthStore()
  
  if (token) {
    return <Navigate to={getRedirectPath(user?.role)} replace />
  }
  return children
}

function ClientRoute({ children }) {
  const { token, user } = useAuthStore()

  if (!token) return <Navigate to="/login" replace />
  if (ADMIN_ROLES.includes(user?.role)) {
    return <Navigate to="/admin" replace />
  }
  return children
}

function AdminRoute({ children }) {
  const { token, user } = useAuthStore()

  if (!token) return <Navigate to="/login" replace />
  if (!ADMIN_ROLES.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas / Invitados */}
        <Route path="/" element={<GuestRoute><Landing /></GuestRoute>} />
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />

        {/* --- RUTAS EXCLUSIVAS DE CLIENTES (CORREGIDAS) --- */}
        
        {/* ARREGLO 2: Ruta base del Dashboard agregada */}
        <Route path="/dashboard" element={<ClientRoute><Dashboard /></ClientRoute>} />
        
        {/* Ruta para ver el dashboard específico de 1 dispositivo (la que ya tenías) */}
        <Route path="/dashboard/:id" element={<ClientRoute><Dashboard /></ClientRoute>} />
        
        {/* ARREGLO 3: Cambiamos /devices por /dispositivos para que encaje con tu menú lateral */}
        <Route path="/dispositivos" element={<ClientRoute><Devices /></ClientRoute>} />
        
        <Route path="/alerts/:deviceId" element={<ClientRoute><Alerts /></ClientRoute>} />
        <Route path="/profile" element={<ClientRoute><Profile /></ClientRoute>} />

        {/* --- RUTAS EXCLUSIVAS DE ADMIN (INTACTAS) --- */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/clientes" element={<AdminRoute><AdminClients /></AdminRoute>} />
        <Route path="/admin/clientes/:clientId" element={<AdminRoute><AdminClientDetail /></AdminRoute>} />
        <Route path="/admin/clientes/:clientId/dispositivo/:deviceId" element={<AdminRoute><AdminDeviceDetail /></AdminRoute>} />
        <Route path="/admin/equipo" element={<AdminRoute><AdminTeam /></AdminRoute>} />
        <Route path="/admin/variables" element={<AdminRoute><AdminVariables /></AdminRoute>} />
        <Route path="/admin/solicitudes" element={<AdminRoute><AdminRequests /></AdminRoute>} />

        {/* Comodín de redirección */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}