import {
  Check,
  X,
  PackageCheck,
  Truck,
  ClipboardCheck,
  Clock,
  PackageSearch,
  Boxes,
  Bike,
} from 'lucide-react'
import { orderStatusLabel } from '../../utils/constants'

const STEPS = [
  { key: 'PENDING', label: 'Order Placed', icon: Clock },
  { key: 'CONFIRMED', label: 'Confirmed', icon: ClipboardCheck },
  { key: 'PROCESSING', label: 'Processing', icon: PackageSearch },
  { key: 'READY_TO_SHIP', label: 'Ready to Ship', icon: Boxes },
  { key: 'SHIPPED', label: 'Shipped', icon: Truck },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Bike },
  { key: 'DELIVERED', label: 'Delivered', icon: PackageCheck },
]

const TERMINAL = ['CANCELLED', 'RETURN_REQUESTED', 'RETURNED', 'REFUNDED']

export default function OrderTimeline({ status }) {
  const current = String(status || 'PENDING').toUpperCase()

  if (TERMINAL.includes(current)) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3.5 py-2 text-sm font-semibold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
        <X size={14} />
        {orderStatusLabel[current] || current}
      </div>
    )
  }

  const currentIndex = Math.max(
    0,
    STEPS.findIndex((s) => s.key === current)
  )

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex min-w-[640px] items-start">
        {STEPS.map((step, i) => {
          const done = i <= currentIndex
          const isCurrent = i === currentIndex
          const Icon = step.icon

          return (
            <div
              key={step.key}
              className="flex min-w-0 flex-1 items-start last:flex-none"
            >
              <div className="flex shrink-0 flex-col items-center gap-1.5">
                <div
                  className={`
                    flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-300
                    ${
                      isCurrent
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-600/30 ring-4 ring-green-500/20'
                        : done
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-100 text-slate-400 dark:bg-white/5'
                    }
                  `}
                >
                  {done && !isCurrent ? (
                    <Check size={15} strokeWidth={3} />
                  ) : (
                    <Icon size={15} />
                  )}
                </div>

                <span
                  className={`
                    w-16 text-center text-[11px] font-medium leading-tight
                    ${
                      isCurrent
                        ? 'text-green-700 dark:text-green-400'
                        : done
                        ? 'text-slate-700 dark:text-slate-200'
                        : 'text-slate-400'
                    }
                  `}
                >
                  {step.label}
                </span>
              </div>

              {i < STEPS.length - 1 && (
                <div
                  className={`
                    mx-1 mt-4 h-1 min-w-[12px] flex-1 rounded-full transition-colors duration-300
                    ${
                      i < currentIndex
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                        : 'bg-slate-200 dark:bg-white/10'
                    }
                  `}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}