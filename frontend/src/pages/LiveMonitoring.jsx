import { useState } from 'react'
import * as Icons from 'lucide-react'
import { Wifi, WifiOff, AlertTriangle, RadioTower, Radio, Cpu, Terminal, CheckCircle2, ShieldCheck } from 'lucide-react'
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

        {/* Real-Time Hardware Diagnostic Metrics (Graphs removed) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 p-3.5">
            <span className="text-[11px] font-mono text-slate-400">Current Reading</span>
            <p className="mt-1 text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {isHardwareLive ? readings[selected] : 0}
              <span className="ml-1 text-xs font-normal text-slate-400">{activeSensor.unit}</span>
            </p>
          </div>

          <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 p-3.5">
            <span className="text-[11px] font-mono text-slate-400">Transducer Pin</span>
            <p className="mt-1 text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {activeSensor.pin || 'GPIO 34'}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 p-3.5">
            <span className="text-[11px] font-mono text-slate-400">Safe Operating Band</span>
            <p className="mt-1 text-base font-bold font-mono text-slate-800 dark:text-slate-200">
              {activeSensor.thresholds.low} – {activeSensor.thresholds.high} {activeSensor.unit}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 p-3.5">
            <span className="text-[11px] font-mono text-slate-400">Hardware Line State</span>
            <p className="mt-1 text-xs font-bold font-mono text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span className={`inline-block h-2 w-2 rounded-full ${isHardwareLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-white/20'}`} />
              {isHardwareLive ? 'LIVE_STREAM_3V3' : 'OFFLINE (HIGH-Z / 0V)'}
            </p>
          </div>
        </div>

        {/* Streaming Telemetry Packets Log (Tabular, zero-graph) */}
        <div className="mt-4 rounded-xl border border-slate-200/80 dark:border-white/10 overflow-hidden">
          <div className="bg-slate-100/70 dark:bg-white/5 px-4 py-2.5 flex items-center justify-between border-b border-slate-200/80 dark:border-white/10">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-slate-500" />
              <span className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Telemetry Ingestion Stream Log (Pin: {activeSensor.pin || 'ADC'})
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              {chartData.length} packets logged
            </span>
          </div>

          {chartData.length > 0 ? (
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 text-[10px] uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Timestamp</th>
                    <th className="py-2 px-3">Pin</th>
                    <th className="py-2 px-3">Calibrated Reading</th>
                    <th className="py-2 px-3">Threshold Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {chartData.slice(-10).reverse().map((pkt, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-white/5 transition-colors">
                      <td className="py-2 px-3 text-slate-400">#{chartData.length - idx}</td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{pkt.time}</td>
                      <td className="py-2 px-3 text-slate-500">{activeSensor.pin || 'GPIO 34'}</td>
                      <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">
                        {pkt.value} {activeSensor.unit}
                      </td>
                      <td className="py-2 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-300">
                          LOGGED
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50/50 dark:bg-white/5">
              <div className="h-10 w-10 mx-auto rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-400 mb-2.5">
                <Cpu size={20} />
              </div>
              <h5 className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">
                Channel Offline — Reading: 0 {activeSensor.unit}
              </h5>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                Awaiting physical telemetry transmission from <strong>ESP32_FARM_1</strong> on pin <code>{activeSensor.pin}</code>. Simulated artificial graphs have been completely removed.
              </p>
            </div>
          )}
        </div>

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
