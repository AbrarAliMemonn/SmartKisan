import { useState } from 'react'
import { Sprout, Calendar, TrendingUp } from 'lucide-react'
import Card from '../common/Card'

export default function CropStatus() {
  const [crops] = useState([
    { name: 'Rice', stage: 'Vegetative', health: 85, daysToHarvest: 45 },
    { name: 'Wheat', stage: 'Flowering', health: 92, daysToHarvest: 30 },
    { name: 'Maize', stage: 'Ripening', health: 78, daysToHarvest: 20 },
  ])

  const getHealthStyle = (health) => {
    if (health > 80) return { badge: 'bg-green-50 text-green-700 ring-green-500/20 dark:bg-green-500/10 dark:text-green-400', bar: 'bg-gradient-to-r from-green-400 to-emerald-500' }
    if (health > 60) return { badge: 'bg-amber-50 text-amber-700 ring-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400', bar: 'bg-gradient-to-r from-amber-400 to-orange-500' }
    return { badge: 'bg-red-50 text-red-700 ring-red-500/20 dark:bg-red-500/10 dark:text-red-400', bar: 'bg-gradient-to-r from-red-400 to-rose-500' }
  }

  return (
    <Card>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Active Crops
          </h3>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Currently growing in your farm
          </p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400">
          <Sprout size={18} />
        </div>
      </div>

      <div className="space-y-4">
        {crops.map((crop, idx) => {
          const style = getHealthStyle(crop.health)
          return (
            <div
              key={idx}
              className="rounded-xl border border-slate-100 bg-slate-50/40 p-3.5 transition-colors hover:border-slate-200 hover:bg-slate-50 dark:border-white/5 dark:bg-white/5 dark:hover:border-white/10"
            >
              <div className="mb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-green-600 shadow-sm ring-1 ring-slate-100 dark:bg-white/10 dark:text-green-400 dark:ring-white/10">
                    <Sprout size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {crop.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {crop.stage}
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${style.badge}`}
                >
                  <TrendingUp size={11} />
                  {crop.health}%
                </span>
              </div>

              <div className="mb-2 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-[10px] font-semibold text-slate-400">
                    Stage
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                    {crop.stage}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400">
                    To Harvest
                  </p>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                    <Calendar size={11} className="text-slate-400" />
                    {crop.daysToHarvest} days
                  </p>
                </div>
              </div>

              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${style.bar}`}
                  style={{ width: `${crop.health}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}