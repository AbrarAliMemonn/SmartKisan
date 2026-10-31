import { useState } from 'react'
import * as Icons from 'lucide-react'
import { Wifi, WifiOff, AlertTriangle, RadioTower, Radio, Cpu, RefreshCw } from 'lucide-react'
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import Card from '../components/common/Card'
import { useSensorFeed } from '../hooks/useSensorFeed'
import { sensorDefinitions } from '../utils/constants'

function statusOf(value, thresholds, isHardwareLive) {
  if (!isHardwareLive || value === 0 || value === undefined) return 'offline'
  if (value < thresholds.low) return 'low'
  if (value > thresholds.high) return 'high'
  return 'normal'
}

export default function LiveMonitoring() {
  const { readings, history, isConnected, isHardwareLive } = useSensorFeed()
  const [selected, setSelected] = useState(sensorDefinitions[0].id)

  const activeSensor = sensorDefinitions.find((s) => s.id === selected) || sensorDefinitions[0]
  const ActiveIcon = Icons[activeSensor.icon] || Icons.Activity
  const chartData = history[selected] || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center border-b border-slate-200/80 dark:border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Live Hardware Monitoring
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Real-time physical telemetry stream from field station ESP32_FARM_1
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${
              isHardwareLive
                ? 'bg-emerald-50 text-emerald-700 ring-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-400'
                : 'bg-rose-50 text-rose-700 ring-rose-500/20 dark:bg-rose-950/40 dark:text-rose-400'
            }`}
          >
            <Radio size={14} className={isHardwareLive ? 'animate-pulse text-emerald-600' : ''} />
            {isHardwareLive ? 'Hardware: Active ESP32 Stream' : 'Hardware: OFFLINE (Channels 0)'}
          </div>

          <div
            className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${
              isConnected
                ? 'bg-emerald-50 text-emerald-700 ring-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-400'
                : 'bg-slate-100 text-slate-600 ring-slate-300 dark:bg-white/10 dark:text-slate-300'
            }`}
          >
            {isConnected ? <Wifi size={13} /> : <WifiOff size={13} />}
            {isConnected ? 'Telemetry WebSocket' : 'Direct Polling'}
          </div>
        </div>
      </div>

      {/* Sensor Channel Selector Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {sensorDefinitions.map((sensor) => {
          const Icon = Icons[sensor.icon] || Icons.Activity
          const status = statusOf(readings[sensor.id], sensor.thresholds, isHardwareLive)
          const isActive = selected === sensor.id
          const val = isHardwareLive ? readings[sensor.id] : 0

          return (
            <button
              key={sensor.id}
              onClick={() => setSelected(sensor.id)}
              className={`group rounded-2xl border bg-white p-3.5 text-left shadow-sm transition-all dark:bg-night-raised ${
                isActive
                  ? 'border-emerald-500 ring-4 ring-emerald-500/10'
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-md dark:border-white/10 dark:hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-inset"
                  style={{
                    backgroundColor: isHardwareLive ? `${sensor.color}1a` : 'rgba(148, 163, 184, 0.1)',
                    color: isHardwareLive ? sensor.color : '#94a3b8',
                  }}
                >
                  <Icon size={16} />
                </div>
                <span
                  className={`h-2 w-2 rounded-full ${
                    status === 'normal'
                      ? 'bg-emerald-500 animate-pulse'
                      : status === 'low'
                        ? 'bg-amber-500'
                        : status === 'high'
                          ? 'bg-rose-500'
                          : 'bg-slate-300 dark:bg-white/20'
                  }`}
                />
              </div>
              <p className="mt-2.5 truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {sensor.name}
              </p>
              <p className="mt-0.5 text-lg font-bold tracking-tight text-slate-900 dark:text-white font-mono">
                {val}
                <span className="ml-0.5 text-xs font-normal text-slate-400">
                  {sensor.unit}
                </span>
              </p>
              <p className="mt-1 text-[10px] text-slate-400 font-mono">
                {sensor.pin || 'Pin ADC'}
              </p>
            </button>
          )
        })}
      </div>

      {/* Main Channel Diagnostic View */}
      <Card>
        <div className="mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-inset"
              style={{
                backgroundColor: isHardwareLive ? `${activeSensor.color}1a` : 'rgba(148, 163, 184, 0.1)',
                color: isHardwareLive ? activeSensor.color : '#94a3b8',
              }}
            >
              <ActiveIcon size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  {activeSensor.name}
                </h3>
                <span className="rounded bg-slate-100 dark:bg-white/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  {activeSensor.pin || 'GPIO / ADC'}
                </span>
              </div>
              <p className="text-xs text-slate-400">{activeSensor.module}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2.5 py-1 rounded bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300">
              Current: <strong className="text-slate-900 dark:text-white">{isHardwareLive ? readings[selected] : 0} {activeSensor.unit}</strong>
            </span>
            <div className="flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500 ring-1 ring-inset ring-slate-200 dark:bg-white/5 dark:text-slate-400 dark:ring-white/10">
              <RadioTower size={13} className={isHardwareLive ? 'text-emerald-500 animate-pulse' : ''} />
              {isHardwareLive ? 'Live Streaming' : 'Channel Muted (0)'}
            </div>
          </div>
        </div>

        {isHardwareLive && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
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
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl bg-slate-50 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10 my-2">
            <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-400 mb-3">
              <Cpu size={24} />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Channel Offline — Value: 0 {activeSensor.unit}
            </h4>
            <p className="text-xs text-slate-500 max-w-md mt-1.5 leading-relaxed">
              No live telemetry packet received from <strong>ESP32_FARM_1</strong> for <strong>{activeSensor.name}</strong> on physical pin <code>{activeSensor.pin}</code>. Simulated artificial graphs have been completely removed. Connect your physical ESP32 or click &quot;Send Test Ping&quot; on the dashboard to view real-time waveforms.
            </p>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-500">
          <p>{activeSensor.description}</p>
          <span className="font-mono text-[11px] text-slate-400 shrink-0">
            Optimal Range: {activeSensor.thresholds.low} - {activeSensor.thresholds.high} {activeSensor.unit}
          </span>
        </div>
      </Card>
    </div>
  )
}
