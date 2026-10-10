import { motion } from 'framer-motion'
import * as Icons from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'

function getStatus(value, thresholds) {
  if (!thresholds) return 'normal'

  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) return 'normal'

  if (
    thresholds.low !== undefined &&
    numericValue < Number(thresholds.low)
  ) {
    return 'low'
  }

  if (
    thresholds.high !== undefined &&
    numericValue > Number(thresholds.high)
  ) {
    return 'high'
  }

  return 'normal'
}

const statusStyles = {
  normal:
    'bg-green-50 text-green-700 ring-green-500/20 dark:bg-green-500/10 dark:text-green-400',

  low:
    'bg-amber-50 text-amber-700 ring-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400',

  high:
    'bg-red-50 text-red-700 ring-red-500/20 dark:bg-red-500/10 dark:text-red-400',
}

const statusLabel = {
  normal: 'Optimal',
  low: 'Below range',
  high: 'Above range',
}

export default function SensorCard({
  sensor,
  value,
  history = [],
  onClick,
}) {
  /*
   * Safety defaults
   * ---------------------------------------------------------
   * Prevent the card from crashing if sensor data is temporarily
   * unavailable while the API/WebSocket is loading.
   */
  const safeSensor = sensor || {}

  const Icon =
    (safeSensor.icon && Icons[safeSensor.icon]) || Icons.Activity

  const safeValue =
    value !== undefined && value !== null && value !== ''
      ? value
      : '--'

  const status = getStatus(value, safeSensor.thresholds)

  /*
   * Recharts requires a valid positive container size.
   * Filter invalid history entries before sending them to the chart.
   */
  const safeHistory = Array.isArray(history)
    ? history.filter((item) => {
        if (!item) return false

        const numericValue = Number(item.value)

        return Number.isFinite(numericValue)
      })
    : []

  /*
   * Sensor IDs may contain spaces/special characters.
   * Convert them into a safe SVG gradient ID.
   */
  const gradientId = `sensor-gradient-${String(
    safeSensor.id ?? safeSensor.name ?? 'default'
  ).replace(/[^a-zA-Z0-9_-]/g, '-')}`

  const sensorColor = safeSensor.color || '#22c55e'

  return (
    <motion.div
      whileTap={onClick ? { scale: 0.99 } : undefined}
      onClick={onClick}
      {...(onClick
        ? {
            role: 'button',
            tabIndex: 0,
            onKeyDown: (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick(e)
              }
            },
          }
        : {})}
      className={`group flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition-[border-color,box-shadow] hover:border-green-300 hover:shadow-card-hover dark:border-white/10 dark:bg-night-raised dark:hover:border-white/25 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* =====================================================
          HEADER
      ===================================================== */}
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset "
            style={{
              backgroundColor: `${sensorColor}1a`,
              color: sensorColor,
              '--tw-ring-color': `${sensorColor}30`,
            }}
          >
            <Icon className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
              {safeSensor.name || 'Sensor'}
            </p>

            <p className="truncate text-[11px] font-medium text-slate-400">
              {safeSensor.module || 'Sensor module'}
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

      {/* =====================================================
          VALUE + CHART
      ===================================================== */}
      <div className="mt-5 flex min-w-0 items-end justify-between gap-4">
        {/* Current value */}
        <div className="min-w-0">
          <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {safeValue}

            <span className="ml-1 text-sm font-medium text-slate-400">
              {safeSensor.unit || ''}
            </span>
          </p>

          <p className="mt-0.5 text-[11px] font-medium text-slate-400">
            Live reading
          </p>
        </div>

        {/* =================================================
            MINI AREA CHART

            IMPORTANT:
            The wrapper has explicit width/height and
            min-width/min-height so ResponsiveContainer
            never receives -1 dimensions.
        ================================================= */}
        {safeHistory.length > 1 && (
          <div
            className="relative h-11 w-24 min-w-[96px] min-h-[44px] shrink-0 overflow-hidden"
            style={{
              width: '96px',
              height: '44px',
            }}
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={0}
            >
              <AreaChart
                data={safeHistory}
                margin={{
                  top: 2,
                  right: 0,
                  left: 0,
                  bottom: 2,
                }}
              >
                <defs>
                  <linearGradient
                    id={gradientId}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={sensorColor}
                      stopOpacity={0.5}
                    />

                    <stop
                      offset="100%"
                      stopColor={sensorColor}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={sensorColor}
                  strokeWidth={2}
                  fill={`url(#${gradientId})`}
                  isAnimationActive={false}
                  connectNulls
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </motion.div>
  )
}
