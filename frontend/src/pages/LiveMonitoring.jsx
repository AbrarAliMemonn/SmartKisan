import { useState } from 'react'
import * as Icons from 'lucide-react'
import { Wifi, WifiOff, AlertTriangle, RadioTower } from 'lucide-react'
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import Card from '../components/common/Card'
import { useSensorFeed } from '../hooks/useSensorFeed'
import { sensorDefinitions } from '../utils/constants'

function statusOf(value, thresholds) {
  if (value === undefined) return 'normal'
  if (value < thresholds.low) return 'low'
  if (value > thresholds.high) return 'high'
  return 'normal'
}

export default function LiveMonitoring() {
  const { readings, history, isConnected, isHardwareLive } = useSensorFeed()
  const [selected, setSelected] = useState(sensorDefinitions[0].id)

  const alerts = sensorDefinitions.filter(
    (s) => statusOf(readings[s.id], s.thresholds) !== 'normal'
  )
  const activeSensor = sensorDefinitions.find((s) => s.id === selected)
  const ActiveIcon = Icons[activeSensor.icon] || Icons.Activity

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Live Monitoring
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 sm:text-base">
            Streaming sensor telemetry updated every few seconds
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${
              isHardwareLive
                ? 'bg-emerald-50 text-emerald-700 ring-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400'
                : 'bg-blue-50 text-blue-700 ring-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400'
            }`}
          >
            <RadioTower size={14} className={isHardwareLive ? 'animate-pulse text-emerald-600' : ''} />
            {isHardwareLive ? 'Hardware: Active ESP32' : 'Feed: Simulated Test Data'}
          </div>

          <div
            className={`inline-flex w-fit items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold ring-1 ring-inset ${
              isConnected
                ? 'bg-green-50 text-green-700 ring-green-500/20 dark:bg-green-500/10 dark:text-green-400'
                : 'bg-slate-100 text-slate-600 ring-slate-300 dark:bg-white/10 dark:text-slate-300'
            }`}
          >
            {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
            {isConnected ? 'Telemetry Online' : 'Buffered Feed'}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/60 dark:border-amber-500/20 dark:bg-amber-500/5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                {alerts.length} sensor{alerts.length > 1 ? 's' : ''} outside
                optimal range
              </p>
              <p className="mt-1 text-sm text-amber-800/80 dark:text-amber-300/80">
                {alerts.map((a) => a.name).join(', ')}{' '}
                {alerts.length > 1 ? 'need' : 'needs'} attention.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Sensor Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {sensorDefinitions.map((sensor) => {
          const Icon = Icons[sensor.icon] || Icons.Activity
          const status = statusOf(readings[sensor.id], sensor.thresholds)
          const isActive = selected === sensor.id

          return (
            <button
              key={sensor.id}
              onClick={() => setSelected(sensor.id)}
              className={`group rounded-2xl border bg-white p-3.5 text-left shadow-sm transition-all dark:bg-night-raised ${
                isActive
                  ? 'border-green-500 ring-4 ring-green-500/10'
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-md dark:border-white/10 dark:hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-inset"
                  style={{
                    backgroundColor: `${sensor.color}1a`,
                    color: sensor.color,
                  }}
                >
                  <Icon size={16} />
                </div>
                <span
                  className={`h-2 w-2 rounded-full ${
                    status === 'normal'
                      ? 'bg-green-500'
                      : status === 'low'
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                  }`}
                />
              </div>
              <p className="mt-2.5 truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {sensor.name}
              </p>
              <p className="mt-0.5 text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                {readings[sensor.id]}
                <span className="ml-0.5 text-xs font-medium text-slate-400">
                  {sensor.unit}
                </span>
              </p>
            </button>
          )
        })}
      </div>

      {/* Main Chart */}
      <Card>
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-inset"
              style={{
                backgroundColor: `${activeSensor.color}1a`,
                color: activeSensor.color,
              }}
            >
              <ActiveIcon size={20} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {activeSensor.name}
              </h3>
              <p className="text-xs text-slate-400">{activeSensor.module}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500 ring-1 ring-inset ring-slate-200 dark:bg-white/5 dark:text-slate-400 dark:ring-white/10">
            <RadioTower size={13} />
            Live feed
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={history[selected] || []}>
            <defs>
              <linearGradient id="liveGrad" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={activeSensor.color}
                  stopOpacity={0.4}
                />
                <stop
                  offset="100%"
                  stopColor={activeSensor.color}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              opacity={0.1}
            />
            <XAxis dataKey="time" tick={{ fontSize: 11 }} />
            <YAxis
              tick={{ fontSize: 11 }}
              domain={[activeSensor.min, activeSensor.max]}
            />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="value"
              stroke={activeSensor.color}
              strokeWidth={2}
              fill="url(#liveGrad)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>

        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          {activeSensor.description}
        </p>
      </Card>
    </div>
  )
}