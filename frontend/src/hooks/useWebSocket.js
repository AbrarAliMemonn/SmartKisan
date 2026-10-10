import { useEffect, useState } from 'react'
import webSocketService from '../services/websocket'

export const useWebSocket = (event, handler) => {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    webSocketService.connect()
    
    const handleConnect = () => setIsConnected(true)
    const handleDisconnect = () => setIsConnected(false)
    
    webSocketService.on('connected', handleConnect)
    webSocketService.on('disconnected', handleDisconnect)
    
    if (event && handler) {
      webSocketService.on(event, handler)
    }
    
    return () => {
      if (event && handler) {
        webSocketService.off(event, handler)
      }
      webSocketService.off('connected', handleConnect)
      webSocketService.off('disconnected', handleDisconnect)
    }
  }, [event, handler])

  return { isConnected, send: webSocketService.send.bind(webSocketService) }
}