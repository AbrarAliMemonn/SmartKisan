import { motion } from 'framer-motion'
import * as Icons from 'lucide-react'
import { Radio } from 'lucide-react'

function getStatus(value, thresholds) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue) || numericValue === 0) return 'offline'
  if (!thresholds) return 'normal'
  if (thresholds.low !== undefined && numericValue < Number(thresholds.low)) return 'low'
  if (thresholds.high !== undefined && numericValue > Number(thresholds.high)) return 'high'
  return 'normal'
}

const statusStyles = {
  offline: 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-white/10 dark:text-slate-400',
  normal: 'bg-emerald-50 text-emerald-700 ring-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400',
  low: 'bg-amber-50 text-amber-700 ring-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400',
  high: 'bg-rose-50 text-rose-700 ring-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400',
}

const statusLabel = {
  offline: 'Offline (0)',
  normal: 'Optimal',
  low: 'Below Threshold',
  high: 'Above Threshold',
}

export default function SensorCard({
  sensor,
  value,
  onClick,
}) {
  const safeSensor = sensor || {}
  const Icon = (safeSensor.icon && Icons[safeSensor.icon]) || Icons.Activity

  const numericValue = Number(value)
  const isOffline = !Number.isFinite(numericValue) || numericValue === 0
  const safeValue = isOffline ? 0 : numericValue
  const status = isOffline ? 'offline' : getStatus(numericValue, safeSensor.thresholds)
  const sensorColor = safeSensor.color || '#16a34a'

  // Calculate percentage fill relative to min/max
  const min = safeSensor.min ?? 0
  const max = safeSensor.max ?? 100
  const pct = isOffline
    ? 0
    : Math.min(100, Math.max(0, ((numericValue - min) / (max - min)) * 100))

  return (
    <motion.div
      whileTap={onClick ? { scale: 0.99 } : undefined}
      onClick={onClick}
      {...(onClick ? { role: 'button', tabIndex: 0 } : {})}
      className={`group flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-[border-color,box-shadow] hover:border-emerald-500/30 hover:shadow-md dark:border-white/10 dark:bg-night-raised ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Header */}
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset"
            style={{
              backgroundColor: isOffline ? 'rgba(148, 163, 184, 0.1)' : `${sensorColor}18`,
              color: isOffline ? '#94a3b8' : sensorColor,
              ringColor: isOffline ? '#cbd5e1' : `${sensorColor}30`,
            }}
          >
            <Icon className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
              {safeSensor.name || 'Sensor'}
            </p>
            <p className="truncate text-[11px] font-medium text-slate-400">
              {safeSensor.module || 'Hardware Sensor'}
            </p>
          </div>
        </div>

        <span
          className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${
            statusStyles[status]
          }`}
        >
          {statusLabel[status]}
        </span>
      </div>

      {/* Value & Channel Information */}
      <div className="mt-5 flex min-w-0 items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
            {safeValue}
            <span className="ml-1 text-sm font-normal text-slate-400">
              {safeSensor.unit || ''}
            </span>
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${
                isOffline ? 'bg-slate-300 dark:bg-white/20' : 'bg-emerald-500 animate-pulse'
              }`}
            />
            {isOffline ? 'Awaiting hardware packet' : 'Live hardware stream'}
          </p>
        </div>

        {/* Physical GPIO / ADC Hardware Mapping Badge */}
        <div className="text-right shrink-0">
          <span className="inline-block rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
            {safeSensor.pin || 'GPIO / ADC'}
          </span>
          <p className="mt-1 text-[10px] text-slate-400">
            {isOffline ? 'ADC: 0' : `Range: ${min}-${max}`}
          </p>
        </div>
      </div>

      {/* Hardware Calibration Gauge Bar */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5">
        <div className="flex items-center justify-between text-[11px] mb-1.5 text-slate-500 dark:text-slate-400 font-mono">
          <span>Calibration Level</span>
          <span>{isOffline ? '0%' : `${Math.round(pct)}%`}</span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              backgroundColor: isOffline ? '#94a3b8' : sensorColor,
            }}
          />
        </div>
      </div>
    </motion.div>
  )
}
