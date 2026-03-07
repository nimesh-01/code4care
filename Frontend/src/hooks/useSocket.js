import { useEffect, useRef, useCallback, useState } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || ''

export default function useSocket(user) {
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const handlersRef = useRef({})

  useEffect(() => {
    if (!user) return

    const token = localStorage.getItem('token')
    if (!token) return

    const socket = io(SOCKET_URL, {
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling'],
    })

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    socketRef.current = socket

    return () => {
      socket.disconnect()
      socketRef.current = null
      setConnected(false)
    }
  }, [user])

  const on = useCallback((event, handler) => {
    const socket = socketRef.current
    if (!socket) return
    // Remove previous handler for this event key if any
    if (handlersRef.current[event]) {
      socket.off(event, handlersRef.current[event])
    }
    handlersRef.current[event] = handler
    socket.on(event, handler)
  }, [])

  const off = useCallback((event) => {
    const socket = socketRef.current
    if (!socket) return
    if (handlersRef.current[event]) {
      socket.off(event, handlersRef.current[event])
      delete handlersRef.current[event]
    }
  }, [])

  const emit = useCallback((event, data, callback) => {
    const socket = socketRef.current
    if (!socket?.connected) return
    socket.emit(event, data, callback)
  }, [])

  return { socket: socketRef, connected, on, off, emit }
}
