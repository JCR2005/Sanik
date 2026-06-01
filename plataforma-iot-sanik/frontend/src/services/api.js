const BASE = import.meta.env.VITE_API_BASE || '/api'

function getToken() {
  return localStorage.getItem('sanik_token') || localStorage.getItem('token')
}

async function request(path, options = {}) {
  let res
  try {
    const token = getToken()
    res = await fetch(`${BASE}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      ...options
    })
  } catch (err) {
    throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté activo.')
  }

  const contentType = res.headers.get('content-type') || ''
  const data = contentType && contentType.includes('application/json') ? await res.json() : null
  
  if (!res.ok) {
    throw new Error(data?.error || data?.message || 'Error del servidor')
  }
  return data
}

// ── Auth ──────────────────────────────────────
export const auth = {
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
  me: () => request('/auth/me')
}

// ── Devices ───────────────────────────────────
export const devices = {
  list: (orgId) => request(`/devices${orgId ? `?orgId=${orgId}` : ''}`),
  get: (id, orgId) => request(`/devices/${id}${orgId ? `?orgId=${orgId}` : ''}`),
  create: (data) => request('/devices', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data, orgId) => request(`/devices/${id}${orgId ? `?orgId=${orgId}` : ''}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id, orgId) => request(`/devices/${id}${orgId ? `?orgId=${orgId}` : ''}`, { method: 'DELETE' }),
  variables: (id, orgId) => request(`/devices/${id}/variables${orgId ? `?orgId=${orgId}` : ''}`),
  lastValues: (id, orgId) => request(`/devices/${id}/last-values${orgId ? `?orgId=${orgId}` : ''}`),
  catalog: () => request('/devices/catalog')
}

// ── Variables (Catálogo Maestro) ──────────────
export const variables = {
  list: () => request('/variables/catalog'),
  create: (data) => request('/variables/catalog', { method: 'POST', body: JSON.stringify(data) }),
  delete: (label) => request(`/variables/catalog/${label}`, { method: 'DELETE' })
}

// ── Dots (datos históricos) ────────────────────
export const dots = {
  get: (deviceId, variable, range = '24h', orgId) =>
    request(`/dots/${deviceId}/${variable}?range=${range}${orgId ? `&orgId=${orgId}` : ''}`),
  getMultiple: (deviceId, variables, range = '24h', orgId) =>
    request(`/dots/${deviceId}?variables=${variables.join(',')}&range=${range}${orgId ? `&orgId=${orgId}` : ''}`)
}

// ── Alerts ────────────────────────────────────
export const alerts = {
  list: (deviceId) => request(`/alerts/${deviceId}`),
  create: (data) => request('/alerts', { method: 'POST', body: JSON.stringify(data) }),
  toggle: (id, active) => request(`/alerts/${id}`, { method: 'PATCH', body: JSON.stringify({ active }) }),
  delete: (id) => request(`/alerts/${id}`, { method: 'DELETE' })
}

// ── Organizaciones (admin) ─────────────────────
export const organizations = {
  list: () => request('/organizations'),
  get: (id) => request(`/organizations/${id}`),
  create: (data) => request('/organizations', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/organizations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateStatus: (id, status) => request(`/organizations/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  revealCredentials: (id, adminPassword) => request(`/organizations/${id}/reveal-credentials`, {
    method: 'POST',
    body: JSON.stringify({ adminPassword })
  }),
  resetPassword: (id) => request(`/organizations/${id}/reset-client-password`, {
    method: 'POST',
    body: JSON.stringify({})
  })
}
