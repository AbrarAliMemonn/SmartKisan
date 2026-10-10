import { useState } from 'react'
import { Search, Filter, Sprout, Calendar, Droplet, Thermometer, X } from 'lucide-react'
import Card from '../components/common/Card'
import Button from '../components/common/Button'

export default function CropGuide() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCrop, setSelectedCrop] = useState(null)

  const crops = [
    {
      id: 1,
      name: 'Rice',
      season: 'Kharif (June-Oct)',
      waterRequirement: 'High',
      tempRange: '20-35°C',
      soilType: 'Clay loam',
      duration: '120-150 days',
      image: '🌾',
    },
    {
      id: 2,
      name: 'Wheat',
      season: 'Rabi (Nov-Apr)',
      waterRequirement: 'Medium',
      tempRange: '15-25°C',
      soilType: 'Loamy',
      duration: '100-120 days',
      image: '🌾',
    },
    {
      id: 3,
      name: 'Maize',
      season: 'Kharif (June-Oct)',
      waterRequirement: 'Medium',
      tempRange: '21-27°C',
      soilType: 'Well-drained loam',
      duration: '90-110 days',
      image: '🌽',
    },
    {
      id: 4,
      name: 'Cotton',
      season: 'Kharif (May-June)',
      waterRequirement: 'Low-Medium',
      tempRange: '20-30°C',
      soilType: 'Black soil',
      duration: '150-180 days',
      image: '🌿',
    },
  ]

  const filteredCrops = crops.filter((crop) =>
    crop.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
          Crop Guide
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 sm:text-base">
          Comprehensive information about different crops
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search crops..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
        </div>
        <Button variant="secondary">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filteredCrops.map((crop) => {
          const isSelected = selectedCrop?.id === crop.id
          return (
            <Card
              key={crop.id}
              hover
              onClick={() => setSelectedCrop(isSelected ? null : crop)}
              className={isSelected ? 'ring-2 ring-green-500/30' : ''}
            >
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 text-5xl ring-1 ring-green-100 dark:from-green-500/10 dark:to-emerald-500/10 dark:ring-green-500/20">
                  {crop.image}
                </div>
                <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  {crop.name}
                </h3>
                <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  {crop.season}
                </p>
              </div>

              {isSelected && (
                <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 dark:border-white/10">
                  <div className="flex items-center gap-2.5 text-sm">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500 dark:bg-blue-500/10">
                      <Droplet className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-slate-600 dark:text-slate-300">
                      Water: <span className="font-semibold text-slate-800 dark:text-white">{crop.waterRequirement}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 text-sm">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500 dark:bg-red-500/10">
                      <Thermometer className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-slate-600 dark:text-slate-300">
                      Temperature: <span className="font-semibold text-slate-800 dark:text-white">{crop.tempRange}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 text-sm">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-500 dark:bg-green-500/10">
                      <Sprout className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-slate-600 dark:text-slate-300">
                      Soil: <span className="font-semibold text-slate-800 dark:text-white">{crop.soilType}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 text-sm">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-500 dark:bg-purple-500/10">
                      <Calendar className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-slate-600 dark:text-slate-300">
                      Duration: <span className="font-semibold text-slate-800 dark:text-white">{crop.duration}</span>
                    </span>
                  </div>

                  <Button variant="primary" size="sm" fullWidth className="mt-3">
                    Get Detailed Guide
                  </Button>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {filteredCrops.length === 0 && (
        <Card className="py-12 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5">
            <X className="h-6 w-6 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            No crops match &quot;{searchTerm}&quot;
          </p>
        </Card>
      )}
    </div>
  )
}