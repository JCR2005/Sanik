const BASE = '/api'

function getToken() {
  return localStorage.getItem('sanik_token')
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { 'X-Auth-Token': getToken() } : {})
    },
    ...options
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error del servidor')
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
  list: () => request('/devices'),
  get: (id) => request(`/devices/${id}`),
  create: (data) => request('/devices', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/devices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/devices/${id}`, { method: 'DELETE' }),
  variables: (id) => request(`/devices/${id}/variables`),
  lastValues: (id) => request(`/devices/${id}/last-values`)
}

// ── Dots (datos históricos) ────────────────────
export const dots = {
  get: (deviceId, variable, range = '24h') =>
    request(`/dots/${deviceId}/${variable}?range=${range}`),
  getMultiple: (deviceId, variables, range = '24h') =>
    request(`/dots/${deviceId}?variables=${variables.join(',')}&range=${range}`)
}

// ── Alerts ────────────────────────────────────
export const alerts = {
  list: (deviceId) => request(`/alerts/${deviceId}`),
  create: (data) => request('/alerts', { method: 'POST', body: JSON.stringify(data) }),
  toggle: (id, active) => request(`/alerts/${id}`, { method: 'PATCH', body: JSON.stringify({ active }) }),
  delete: (id) => request(`/alerts/${id}`, { method: 'DELETE' })
}
