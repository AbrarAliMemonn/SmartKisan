import { useMemo, useState } from 'react'
import * as Icons from 'lucide-react'
import { Download } from 'lucide-react'
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import SearchableTable from '../components/common/SearchableTable'
import { useSensorFeed } from '../hooks/useSensorFeed'
import { sensorDefinitions } from '../utils/constants'

function statusOf(value, thresholds) {
  if (value < thresholds.low)
    return {
      label: 'Low',
      badge:
        'bg-amber-50 text-amber-700 ring-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400',
    }
  if (value > thresholds.high)
    return {
      label: 'High',
      badge:
        'bg-red-50 text-red-700 ring-red-500/20 dark:bg-red-500/10 dark:text-red-400',
    }
  return {
    label: 'Normal',
    badge:
      'bg-green-50 text-green-700 ring-green-500/20 dark:bg-green-500/10 dark:text-green-400',
  }
}

export default function SensorDetails() {
  const { readings, history } = useSensorFeed()
  const [selected, setSelected] = useState(sensorDefinitions[0].id)
  const sensor = sensorDefinitions.find((s) => s.id === selected)
  const Icon = Icons[sensor.icon] || Icons.Activity

  const tableData = useMemo(() => {
    return (history[selected] || [])
      .map((point, idx) => {
        const status = statusOf(point.value, sensor.thresholds)
        return {
          id: idx,
          time: point.time,
          value: point.value,
          unit: sensor.unit,
          status: status.label,
          statusBadge: status.badge,
        }
      })
      .reverse()
  }, [history, selected, sensor])

  const columns = [
    { key: 'time', label: 'Timestamp', sortable: true },
    { key: 'value', label: `Reading (${sensor.unit})`, sortable: true },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${row.statusBadge}`}
        >
          {row.status}
        </span>
      ),
    },
  ]

  const currentStatus = statusOf(readings[sensor.id] ?? 0, sensor.thresholds)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Sensor Details
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 sm:text-base">
            Inspect readings, thresholds and history per sensor module
          </p>
        </div>
        <Button variant="secondary" size="sm">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
        {/* Sensor list */}
        <Card noPadding className="overflow-hidden lg:col-span-1">
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {sensorDefinitions.map((s) => {
              const SIcon = Icons[s.icon] || Icons.Activity
              const active = s.id === selected
              return (
                <button
                  key={s.id}
                  onClick={() => setSelected(s.id)}
                  className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                    active
                      ? 'bg-green-50 dark:bg-green-500/10'
                      : 'hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-inset"
                    style={{
                      backgroundColor: `${s.color}1a`,
                      color: s.color,
                    }}
                  >
                    <SIcon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm font-semibold ${
                        active
                          ? 'text-green-700 dark:text-green-400'
                          : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {s.name}
                    </p>
                    <p className="truncate text-[11px] text-slate-400">
                      {s.module}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </Card>

        {/* Detail */}
        <div className="space-y-5 lg:col-span-3">
          <Card>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ring-inset"
                  style={{
                    backgroundColor: `${sensor.color}1a`,
                    color: sensor.color,
                  }}
                >
                  <Icon size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                    {sensor.name}
                  </h2>
                  <p className="text-xs font-medium text-slate-400">
                    {sensor.module}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <p className="text-[10px] font-bold text-slate-400">
                    Current
                  </p>
                  <p className="mt-0.5 text-lg font-bold text-slate-900 dark:text-white">
                    {readings[sensor.id]}
                    <span className="ml-1 text-xs font-medium text-slate-400">
                      {sensor.unit}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400">
                    Safe Range
                  </p>
                  <p className="mt-0.5 text-lg font-bold text-slate-900 dark:text-white">
                    {sensor.thresholds.low}–{sensor.thresholds.high}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400">
                    Status
                  </p>
                  <span
                    className={`mt-1 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${currentStatus.badge}`}
                  >
                    {currentStatus.label}
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              {sensor.description}
            </p>

            <div className="mt-4">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={history[selected] || []}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="currentColor"
                    opacity={0.1}
                  />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    domain={[sensor.min, sensor.max]}
                  />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={sensor.color}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">
              Reading History
            </h3>
            <SearchableTable
              columns={columns}
              data={tableData}
              searchPlaceholder="Search readings..."
            />
          </Card>
        </div>
      </div>
    </div>
  )
}