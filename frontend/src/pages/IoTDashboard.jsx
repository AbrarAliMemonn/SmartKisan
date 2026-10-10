import { useEffect, useState } from 'react'
import { Activity, Wifi, WifiOff, Gauge, ShieldCheck, Zap } from 'lucide-react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import StatsCard from '../components/dashboard/StatsCard'
import SensorCard from '../components/dashboard/SensorCard'
import WeatherWidget from '../components/dashboard/WeatherWidget'
import CropStatus from '../components/dashboard/CropStatus'
import Card from '../components/common/Card'
import { SkeletonCard, SkeletonChart } from '../components/common/Skeleton'
import { useSensorFeed } from '../hooks/useSensorFeed'
import { sensorDefinitions } from '../utils/constants'

export default function IoTDashboard() {
  const { readings, history, isConnected, isHardwareLive } = useSensorFeed()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700)
    return () => clearTimeout(t)
  }, [])

  const combinedTrend = history.soilMoisture?.map((point, i) => ({
    time: point.time,
    moisture: point.value,
    temperature: history.temperature?.[i]?.value,
    humidity: history.humidity?.[i]?.value,
  })) || []

  const activeAlerts = sensorDefinitions.filter((s) => {
    const v = readings[s.id]
    return v !== undefined && (v < s.thresholds.low || v > s.thresholds.high)
  }).length

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <SkeletonChart />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Farm Dashboard</h1>
          <p className="page-subtitle">Real-time sensor monitoring across your fields</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
            isHardwareLive
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isHardwareLive ? 'bg-emerald-500 animate-ping' : 'bg-blue-500'}`} />
            {isHardwareLive ? 'Hardware: Live ESP32' : 'Sensors: Simulated Test Data'}
          </div>

          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
            isConnected ? 'bg-success/10 text-success' : 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300'
          }`}>
            {isConnected ? <Wifi size={13} /> : <WifiOff size={13} />}
            <span>{isConnected ? 'Live Telemetry' : 'Local Feed'}</span>
          </div>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Soil Moisture" value={readings.soilMoisture} icon={Gauge} tone="green" trend="+5%" unit="%" />
        <StatsCard title="Active Alerts" value={activeAlerts} icon={ShieldCheck} tone={activeAlerts > 0 ? 'red' : 'green'} unit="sensors" />
        <StatsCard title="System Uptime" value="99.8" icon={Activity} tone="blue" trend="+0.1%" unit="%" />
        <StatsCard title="Power Draw" value="4.2" icon={Zap} tone="orange" trend="-3%" unit="kWh" />
      </div>

      {/* 6 Sensor Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Sensor Fleet</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sensorDefinitions.map((sensor) => (
            <SensorCard
              key={sensor.id}
              sensor={sensor}
              value={readings[sensor.id]}
              history={history[sensor.id]}
            />
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold mb-4">Soil Moisture Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={combinedTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
              <XAxis dataKey="time" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="moisture" stroke="#2e7d32" fill="#4caf50" fillOpacity={0.25} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold mb-4">Temperature &amp; Humidity (DHT22)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={combinedTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
              <XAxis dataKey="time" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="temperature" name="Temp (°C)" stroke="#f97316" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#0ea5e9" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeatherWidget />
        <CropStatus />
      </div>

      {/* Irrigation Status */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Irrigation System</h3>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-success" />
            <span className="text-sm text-success font-medium">Active</span>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Zone 1 - Wheat Field</span>
              <span className="text-sm font-medium">65%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-2">
              <div className="bg-primary rounded-full h-2 transition-all duration-500" style={{ width: '65%' }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Zone 2 - Rice Field</span>
              <span className="text-sm font-medium">45%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-2">
              <div className="bg-warning rounded-full h-2 transition-all duration-500" style={{ width: '45%' }} />
            </div>
          </div>
          <button className="btn-primary w-full mt-4">
            Manual Irrigation Control
          </button>
        </div>
      </Card>
    </div>
  )
}
