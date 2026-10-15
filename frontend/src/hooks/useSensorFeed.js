import { useEffect, useRef, useState } from 'react'
import { sensorDefinitions } from '../utils/constants'
import { useWebSocket } from './useWebSocket'
import useStore from '../store/useStore'
import { iotAPI } from '../services/api'

const HISTORY_LENGTH = 24

const seedValue = (sensor) => {
  const mid = (sensor.thresholds.low + sensor.thresholds.high) / 2
  return Math.round(mid * 100) / 100
}

const jitter = (value, sensor) => {
  const range = (sensor.max - sensor.min) * 0.03
  let next = value + (Math.random() - 0.5) * range
  next = Math.max(sensor.min, Math.min(sensor.max, next))
  return Math.round(next * 100) / 100
}

const legacyFieldMap = {
  soilMoisture: 'moisture',
}

/**
 * Provides current readings + rolling history for all sensors.
 * Fetches from iot-service backend (/api/iot/sensors) and prefers real hardware data.
 * Falls back to realistic simulated dummy data if hardware is not yet attached.
 */
export function useSensorFeed() {
  const { sensorData, updateSensorData } = useStore()
  const { isConnected } = useWebSocket('sensorData', (data) => updateSensorData(data))
  const [isHardwareLive, setIsHardwareLive] = useState(false)
  const [deviceInfo, setDeviceInfo] = useState(null)

  const [readings, setReadings] = useState(() => {
    const init = {}
    sensorDefinitions.forEach((s) => { init[s.id] = seedValue(s) })
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
        setIsHardwareLive(!!data.isHardwareLive)
        setDeviceInfo({
          deviceId: data.deviceId || 'ESP32_FIELD_NODE',
          deviceName: data.deviceName || 'Field Sensor Node',
          deviceKey: data.deviceKey || '',
          farmerId: data.farmerId,
          farmerName: data.farmerName,
          status: data.status || (data.isHardwareLive ? 'ONLINE' : 'OFFLINE'),
          lastHardwarePing: data.lastHardwarePing,
          mode: data.mode,
          zone1Pump: data.zone1Pump,
          zone2Pump: data.zone2Pump,
        })
      }
    } catch {
      // Server offline - smooth client-side simulation takes over
    }
  }

  useEffect(() => {
    let mounted = true
    fetchIoT()
    const timer = setInterval(() => {
      if (mounted) fetchIoT()
    }, 3500)
    return () => {
      mounted = false
      clearInterval(timer)
    }
  }, [updateSensorData])

  useEffect(() => {
    const interval = setInterval(() => {
      setReadings((prev) => {
        const next = { ...prev }
        sensorDefinitions.forEach((sensor) => {
          const backendValue = sensorData?.[sensor.id] ?? sensorData?.[legacyFieldMap[sensor.id]]
          if (backendValue !== undefined && backendValue !== null) {
            // When real hardware is sending data, use real data directly
            next[sensor.id] = isHardwareLive ? backendValue : jitter(backendValue, sensor)
          } else {
            next[sensor.id] = jitter(prev[sensor.id], sensor)
          }
        })
        return next
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [sensorData, isHardwareLive])

  useEffect(() => {
    setHistory((prev) => {
      const next = {}
      sensorDefinitions.forEach((sensor) => {
        const arr = [...(prev[sensor.id] || []), {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          value: readings[sensor.id]
        }]
        next[sensor.id] = arr.slice(-HISTORY_LENGTH)
      })
      return next
    })
  }, [readings])

  return { readings, history, isConnected, isHardwareLive, deviceInfo, refetchSensors: fetchIoT }
}
