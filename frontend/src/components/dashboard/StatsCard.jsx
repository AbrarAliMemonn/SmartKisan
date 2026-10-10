import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

const tones = {
  green: {
    bg: 'bg-green-50 dark:bg-green-500/10',
    text: 'text-green-600 dark:text-green-400',
    ring: 'ring-green-500/20',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    text: 'text-blue-600 dark:text-blue-400',
    ring: 'ring-blue-500/20',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-500/10',
    text: 'text-orange-600 dark:text-orange-400',
    ring: 'ring-orange-500/20',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-500/10',
    text: 'text-purple-600 dark:text-purple-400',
    ring: 'ring-purple-500/20',
  },
  cyan: {
    bg: 'bg-cyan-50 dark:bg-cyan-500/10',
    text: 'text-cyan-600 dark:text-cyan-400',
    ring: 'ring-cyan-500/20',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-500/10',
    text: 'text-red-600 dark:text-red-400',
    ring: 'ring-red-500/20',
  },
  yellow: {
    bg: 'bg-yellow-50 dark:bg-yellow-500/10',
    text: 'text-yellow-600 dark:text-yellow-400',
    ring: 'ring-yellow-500/20',
  },
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  tone = 'green',
  trend,
  unit = '',
}) {
  const isUp = trend?.startsWith('+')
  const style = tones[tone] || tones.green

  return (
    <motion.div
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-card dark:border-white/10 dark:bg-night-raised"
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {value}
            {unit && (
              <span className="ml-1 text-sm font-medium text-slate-400">
                {unit}
              </span>
            )}
          </p>
          {trend && (
            <p
              className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold ${
                isUp
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {isUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              {trend}
              <span className="font-normal text-slate-400">
                vs last hour
              </span>
            </p>
          )}
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset  ${style.bg} ${style.text} ${style.ring}`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </motion.div>
  )
}