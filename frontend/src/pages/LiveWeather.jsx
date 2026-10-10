import { useState, useEffect } from 'react'
import {
  Cloud, CloudRain, Sun, Wind, Droplet, Thermometer,
  MapPin, RefreshCw, Gauge, Sunrise, Sunset,
} from 'lucide-react'

import Card from '../components/common/Card'
import Button from '../components/common/Button'
import { weatherAPI } from '../services/api'

export default function LiveWeather() {
  const [weather, setWeather] = useState(null)
  const [forecast, setForecast] = useState([])
  const [city, setCity] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const getWeatherIcon = (condition, size = 'large') => {
    const value = condition?.toLowerCase() || ''
    const cls = size === 'large' ? 'h-16 w-16' : 'h-8 w-8'

    if (value.includes('rain') || value.includes('drizzle') || value.includes('thunderstorm')) {
      return <CloudRain className={`${cls} text-blue-400`} />
    }
    if (value.includes('cloud') || value.includes('overcast')) {
      return <Cloud className={`${cls} text-slate-300`} />
    }
    if (value.includes('clear') || value.includes('sun')) {
      return <Sun className={`${cls} text-amber-300`} />
    }
    return <Sun className={`${cls} text-amber-300`} />
  }

  const loadWeather = async () => {
    try {
      setLoading(true)
      setError('')

      const storedUser = localStorage.getItem('user')
      if (!storedUser) {
        setError('User information not found. Please login again.')
        return
      }

      const user = JSON.parse(storedUser)
      const userLocation = user.location || ''
      const userCity = userLocation.split(',')[0].trim()

      if (!userCity) {
        setError('Your city is not available in your profile.')
        return
      }

      setCity(userCity)

      const currentResponse = await weatherAPI.getCurrentWeather(userCity)
      if (currentResponse.data?.success) {
        setWeather(currentResponse.data.data)
      } else {
        setError('Weather data could not be loaded.')
      }

      const forecastResponse = await weatherAPI.getForecast(userCity)
      if (forecastResponse.data?.success) {
        setForecast(forecastResponse.data.data || [])
      } else {
        setForecast([])
      }
    } catch (err) {
      console.error('Weather error:', err)
      if (err.response) {
        setError(
          err.response.data?.message ||
            `Weather service error (${err.response.status})`
        )
      } else {
        setError('Unable to connect to weather service.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWeather()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 dark:bg-green-500/10">
            <RefreshCw className="h-6 w-6 animate-spin text-green-600 dark:text-green-400" />
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Loading weather data...
          </p>
        </div>
      </div>
    )
  }

  if (error && !weather) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Live Weather
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 sm:text-base">
            Real-time weather updates for your farm
          </p>
        </div>

        <Card className="py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5">
            <Cloud className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Unable to load weather
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{error}</p>
          <Button variant="primary" className="mt-5" onClick={loadWeather}>
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Live Weather
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 sm:text-base">
            Real-time weather updates for your farm
          </p>
        </div>

        <Button variant="secondary" size="sm" onClick={loadWeather} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Current weather */}
      {weather && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Card className="relative overflow-hidden !border-0 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 text-white shadow-lg lg:col-span-2">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-white/5 blur-3xl" />

            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-white/90">
                    <MapPin className="h-5 w-5" />
                    <span className="text-base font-medium">{city}</span>
                  </div>

                  <div className="mt-5 flex items-baseline gap-3">
                    <span className="text-6xl font-bold tracking-tight">
                      {Number(weather.temp || 0).toFixed(0)}
                      <span className="text-3xl">°</span>
                    </span>
                    <div>
                      <p className="text-xl font-semibold capitalize">
                        {weather.condition}
                      </p>
                      <p className="text-sm text-white/70">
                        Feels like {Number(weather.temp || 0).toFixed(0)}°C
                      </p>
                    </div>
                  </div>
                </div>

                <div className="shrink-0">{getWeatherIcon(weather.condition)}</div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-4 border-t border-white/15 pt-5">
                <div className="flex flex-col items-center text-center">
                  <Wind className="mb-1.5 h-5 w-5 text-white/80" />
                  <p className="text-sm font-semibold">
                    {Number(weather.windSpeed || 0).toFixed(1)} km/h
                  </p>
                  <p className="text-[10px] text-white/60">
                    Wind
                  </p>
                </div>
                <div className="flex flex-col items-center border-x border-white/10 text-center">
                  <Droplet className="mb-1.5 h-5 w-5 text-white/80" />
                  <p className="text-sm font-semibold">{weather.humidity}%</p>
                  <p className="text-[10px] text-white/60">
                    Humidity
                  </p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <Thermometer className="mb-1.5 h-5 w-5 text-white/80" />
                  <p className="text-sm font-semibold">UV {weather.uvIndex ?? '—'}</p>
                  <p className="text-[10px] text-white/60">
                    UV Index
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Highlights */}
          <Card>
            <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">
              Weather Highlights
            </h3>

            <div className="space-y-3">
              <HighlightRow
                icon={<Gauge className="h-4 w-4" />}
                label="Pressure"
                value={`${Number(weather.pressure || 0).toFixed(0)} hPa`}
              />
              <HighlightRow
                icon={<Droplet className="h-4 w-4" />}
                label="Humidity"
                value={`${weather.humidity}%`}
              />
              <HighlightRow
                icon={<Wind className="h-4 w-4" />}
                label="Wind Speed"
                value={`${Number(weather.windSpeed || 0).toFixed(1)} km/h`}
              />
              <HighlightRow
                icon={<Sun className="h-4 w-4" />}
                label="UV Index"
                value={weather.uvIndex ?? '—'}
              />
            </div>
          </Card>
        </div>
      )}

      {/* Forecast */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            7-Day Forecast
          </h3>
          <span className="text-xs font-medium text-slate-400">
            {city}
          </span>
        </div>

        {forecast.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-white/5">
              <Cloud className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Forecast data is not available.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
            {forecast.map((day, index) => (
              <div
                key={index}
                className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-center transition-all hover:border-slate-200 hover:bg-white dark:border-white/5 dark:bg-white/5 dark:hover:border-white/10"
              >
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {day.day}
                </p>

                <div className="my-3 flex justify-center">
                  {getWeatherIcon(day.condition, 'small')}
                </div>

                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {Number(day.temp || 0).toFixed(0)}°
                </p>

                <p className="mt-0.5 line-clamp-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {day.condition}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Location */}
      <Card>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400">
              Weather Location
            </p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {city}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

function HighlightRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-2.5 last:border-0 dark:border-white/5">
      <span className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <span className="text-slate-400">{icon}</span>
        {label}
      </span>
      <span className="text-sm font-semibold text-slate-800 dark:text-white">
        {value}
      </span>
    </div>
  )
}