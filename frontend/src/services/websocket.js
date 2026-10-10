import { io } from 'socket.io-client'
import { WS_URL } from '../utils/constants'
import useStore from '../store/useStore'

class WebSocketService {
  constructor() {
    this.socket = null
    this.listeners = new Map()
  }

  connect() {
    if (this.socket?.connected) return

    let user = null
    try {
      const stored = localStorage.getItem('user')
      if (stored) user = JSON.parse(stored)
    } catch (e) {
      // ignore
    }

    this.socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      query: user?.id ? { userId: user.id } : {},
    })

    this.socket.on('connect', () => {
      console.log('WebSocket connected')
      this.trigger('connected', true)
    })

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected')
      this.trigger('disconnected', false)
    })

    this.socket.on('sensor-data', (data) => {
      useStore.getState().updateSensorData(data)
      this.trigger('sensorData', data)
    })

    this.socket.on('chat_message', (message) => {
      this.trigger('chatMessage', message)
    })

    this.socket.on('notification', (notif) => {
      useStore.getState().addNotification(notif)
      this.trigger('notification', notif)
    })

    this.socket.on('alert', (alert) => {
      useStore.getState().addNotification(alert)
      this.trigger('alert', alert)
    })

    this.socket.on('irrigation-status', (status) => {
      this.trigger('irrigationStatus', status)
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)
      const index = callbacks.indexOf(callback)
      if (index !== -1) callbacks.splice(index, 1)
    }
  }

  trigger(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data))
    }
  }

  send(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data)
    }
  }

  subscribeToSensor(sensorId) {
    this.send('subscribe', { sensorId })
  }

  unsubscribeFromSensor(sensorId) {
    this.send('unsubscribe', { sensorId })
  }
}

export default new WebSocketService()