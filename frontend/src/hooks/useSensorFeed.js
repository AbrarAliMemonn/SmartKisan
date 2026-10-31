import { useEffect, useState } from 'react'
import { sensorDefinitions } from '../utils/constants'
import { useWebSocket } from './useWebSocket'
import useStore from '../store/useStore'
import { iotAPI } from '../services/api'

const HISTORY_LENGTH = 30

const legacyFieldMap = {
  soilMoisture: 'moisture',
}

/**
 * Real-time Hardware Telemetry Hook
 * Reads live telemetry from physical ESP32 via Azure backend.
 * When hardware is offline, all readings strictly default to 0 (no fake AI jitter).
 */
export function useSensorFeed() {
  const { sensorData, updateSensorData } = useStore()
  const { isConnected } = useWebSocket('sensorData', (data) => updateSensorData(data))
  const [isHardwareLive, setIsHardwareLive] = useState(false)
  const [deviceInfo, setDeviceInfo] = useState(null)

  // Initialize all sensor channels to 0 (Offline State)
  const [readings, setReadings] = useState(() => {
    const init = {}
    sensorDefinitions.forEach((s) => { init[s.id] = 0 })
    return init
  })

  const [history, setHistory] = useState(() => {
    const init = {}
    sensorDefinitions.forEach((s) => { init[s.id] = [] })
    return init
  })

  // Poll IoT backend
  const fetchIoT = async () => {
    try {
      const res = await iotAPI.getSensors()
      const data = res?.data || {}
      if (data.readings) {
        updateSensorData(data.readings)
        const live = Boolean(data.isHardwareLive)
        setIsHardwareLive(live)
        setDeviceInfo({
          deviceId: data.deviceId || 'ESP32_FARM_1',
          deviceName: data.deviceName || "Abrar's Main Field Node",
          deviceKey: data.deviceKey || '',
          farmerId: data.farmerId,
          farmerName: data.farmerName,
          status: live ? 'ONLINE' : 'OFFLINE',
          lastHardwarePing: data.lastHardwarePing,
          mode: data.mode,
          zone1Pump: data.zone1Pump,
          zone2Pump: data.zone2Pump,
        })
      }
    } catch {
      setIsHardwareLive(false)
    }
  }

  useEffect(() => {
    let mounted = true
    fetchIoT()
    const timer = setInterval(() => {
      if (mounted) fetchIoT()
    }, 3000)
    return () => {
      mounted = false
      clearInterval(timer)
    }
  }, [updateSensorData])

  // Sync readings with store / live hardware
  useEffect(() => {
    setReadings(() => {
      const next = {}
      sensorDefinitions.forEach((sensor) => {
        if (!isHardwareLive) {
          // Hardware offline: strictly 0
          next[sensor.id] = 0
        } else {
          const backendValue = sensorData?.[sensor.id] ?? sensorData?.[legacyFieldMap[sensor.id]]
          next[sensor.id] = (backendValue !== undefined && backendValue !== null)
            ? Number(backendValue)
            : 0
        }
      })
      return next
    })
  }, [sensorData, isHardwareLive])

  // Only append history when real hardware is actively streaming
  useEffect(() => {
    if (!isHardwareLive) {
      setHistory(() => {
        const reset = {}
        sensorDefinitions.forEach((s) => { reset[s.id] = [] })
        return reset
      })
      return
    }

    setHistory((prev) => {
      const next = {}
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      sensorDefinitions.forEach((sensor) => {
        const val = readings[sensor.id] || 0
        const arr = [...(prev[sensor.id] || []), {
          time: timeStr,
          value: val,
        }]
        next[sensor.id] = arr.slice(-HISTORY_LENGTH)
      })
      return next
    })
  }, [readings, isHardwareLive])

  return { readings, history, isConnected, isHardwareLive, deviceInfo, refetchSensors: fetchIoT }
}
