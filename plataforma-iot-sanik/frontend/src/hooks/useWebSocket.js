import { useEffect, useRef, useState } from 'react'

export function useWebSocket(deviceId) {
  const [lastValues, setLastValues] = useState({})
  const ws = useRef(null)

  useEffect(() => {
    if (!deviceId) return

    ws.current = new WebSocket(`ws://localhost:3000/ws`)

    ws.current.onopen = () => {
      ws.current.send(JSON.stringify({ type: 'subscribe', deviceId }))
    }

    ws.current.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.deviceId === deviceId) {
          setLastValues(prev => ({
            ...prev,
            [data.variable]: { value: data.value, time: data.time }
          }))
        }
      } catch {}
    }

    return () => ws.current?.close()
  }, [deviceId])

  return lastValues
}
