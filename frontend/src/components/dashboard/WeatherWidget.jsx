import { useState, useEffect } from 'react'
import { Cloud, CloudRain, Sun, Wind, Droplet, Gauge, MapPin } from 'lucide-react'
import Card from '../common/Card'
import { weatherAPI } from '../../services/api'

export default function WeatherWidget() {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadWeather = async () => {
      try {
        setLoading(true)
        setError('')

        const user = JSON.parse(localStorage.getItem('user'))

        if (!user?.location) {
          setError('User location not available')
          return
        }

        const city = user.location.split(',')[0].trim()
        const response = await weatherAPI.getCurrentWeather(city)
        const data = response.data?.data

        if (!data) throw new Error('Weather data not found')

        setWeather(data)
      } catch (err) {
        console.error('Weather Widget error:', err)
        setError(err.response?.data?.message || 'Unable to load weather')
      } finally {
        setLoading(false)
      }
    }

    loadWeather()
  }, [])

  const getWeatherIcon = (size = 'lg') => {
    if (!weather) return null
    const cls = size === 'lg' ? 'h-12 w-12' : 'h-5 w-5'
    switch (weather.condition?.toLowerCase()) {
      case 'clear':
      case 'sunny':
        return <Sun className={`${cls} text-amber-300`} />
      case 'clouds':
      case 'cloudy':
        return <Cloud className={`${cls} text-slate-200`} />
      case 'rain':
      case 'rainy':
        return <CloudRain className={`${cls} text-blue-200`} />
      default:
        return <Cloud className={`${cls} text-slate-200`} />
    }
  }

  if (loading) {
    return (
      <Card className="overflow-hidden !border-0 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 text-white shadow-lg">
        <div className="flex items-center gap-3 py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          <span className="text-sm font-medium">Loading weather...</span>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="!border-0 bg-gradient-to-br from-slate-600 to-slate-700 text-white">
        <div className="py-6 text-center">
          <p className="text-sm font-semibold">Weather unavailable</p>
          <p className="mt-1 text-xs opacity-75">{error}</p>
        </div>
      </Card>
    )
  }

  if (!weather) return null

  return (
    <Card className="relative overflow-hidden !border-0 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 text-white shadow-lg">
      {/* Decorative circles */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-52 w-52 rounded-full bg-white/5 blur-3xl" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold text-white/70">
              Current Weather
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              <MapPin size={14} className="text-white/80" />
              <p className="text-sm font-medium">{weather.location}</p>
            </div>
          </div>
          {getWeatherIcon()}
        </div>

        {/* Temperature */}
        <div className="mt-5 flex items-baseline gap-3">
          <span className="text-5xl font-bold tracking-tight">
            {Number(weather.temp).toFixed(0)}
            <span className="text-3xl">°</span>
          </span>
          <div>
            <p className="text-lg font-semibold capitalize">
              {weather.condition}
            </p>
            <p className="text-xs text-white/70">Feels like {Number(weather.temp).toFixed(0)}°C</p>
          </div>
        </div>

        {/* Details */}
        <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/15 pt-4">
          <div className="flex flex-col items-center text-center">
            <Droplet className="mb-1.5 h-4 w-4 text-white/80" />
            <p className="text-sm font-semibold">{weather.humidity}%</p>
            <p className="text-[10px] text-white/60">
              Humidity
            </p>
          </div>

          <div className="flex flex-col items-center border-x border-white/10 text-center">
            <Wind className="mb-1.5 h-4 w-4 text-white/80" />
            <p className="text-sm font-semibold">{weather.windSpeed}</p>
            <p className="text-[10px] text-white/60">
              km/h Wind
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <Gauge className="mb-1.5 h-4 w-4 text-white/80" />
            <p className="text-sm font-semibold">{weather.pressure}</p>
            <p className="text-[10px] text-white/60">
              hPa
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}