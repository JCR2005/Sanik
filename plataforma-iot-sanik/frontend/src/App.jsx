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

function PrivateRoute({ children }) {
  const token = useAuthStore(s => s.token)
  return token ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { token, user } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  if (!['admin', 'superadmin', 'worker'].includes(user?.role)) return <Navigate to="/devices" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        <Route path="/devices" element={<PrivateRoute><Devices /></PrivateRoute>} />
        <Route path="/dashboard/:id" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/alerts/:deviceId" element={<PrivateRoute><Alerts /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />

        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/clientes" element={<AdminRoute><AdminClients /></AdminRoute>} />
        <Route path="/admin/clientes/:clientId" element={<AdminRoute><AdminClientDetail /></AdminRoute>} />
  <Route path="/admin/clientes/:clientId/dispositivo/:deviceId" element={<AdminRoute><AdminDeviceDetail /></AdminRoute>} />
        <Route path="/admin/equipo" element={<AdminRoute><AdminTeam /></AdminRoute>} />
        <Route path="/admin/variables" element={<AdminRoute><AdminVariables /></AdminRoute>} />
        <Route path="/admin/solicitudes" element={<AdminRoute><AdminRequests /></AdminRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}