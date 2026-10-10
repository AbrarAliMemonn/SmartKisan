import { useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Mail, Phone, MapPin, Calendar, BadgeCheck,
  Map, Wifi, Sprout, Activity, Battery,
} from 'lucide-react'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import { useAuthContext } from '../context/AuthContext'
import { generateUserFarmData } from '../utils/mockUserData'

const userTypeBadge = {
  admin: 'bg-red-50 text-red-700 ring-red-500/20 dark:bg-red-500/10 dark:text-red-400',
  farmer: 'bg-green-50 text-green-700 ring-green-500/20 dark:bg-green-500/10 dark:text-green-400',
}

export default function AdminUserDetail() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { users, fetchUsers } = useAuthContext()

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const targetUser = users.find((u) => String(u.id) === String(userId))

  const farmData = useMemo(() => generateUserFarmData(userId), [userId])

  if (!targetUser) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin Panel
        </Button>
        <Card className="py-12 text-center">
          <p className="text-sm font-medium text-slate-500">User not found.</p>
        </Card>
      </div>
    )
  }

  const userType = (targetUser.userType || '').toLowerCase()

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin Panel
      </Button>

      {/* Profile summary */}
      <Card>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 text-3xl text-white shadow-lg shadow-green-600/25">
              <span>{targetUser.avatar || '🧑‍🌾'}</span>
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
                {targetUser.name}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" /> {targetUser.email}
                </span>
                {targetUser.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" /> {targetUser.phone}
                  </span>
                )}
                {targetUser.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> {targetUser.location}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold capitalize ring-1 ring-inset ${
                userTypeBadge[userType] || userTypeBadge.farmer
              }`}
            >
              <BadgeCheck size={12} /> {targetUser.userType || 'Unknown'}
            </span>
            <span className="text-xs text-slate-400">
              Security role: {targetUser.role || '—'}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Calendar className="h-3 w-3" />
              Joined{' '}
              {targetUser.joinDate
                ? new Date(targetUser.joinDate).toLocaleDateString()
                : '—'}
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
            <p className="text-[10px] font-semibold text-slate-400">
              Farm Size
            </p>
            <p className="mt-0.5 font-medium text-slate-800 dark:text-slate-100">
              {targetUser.farmSize || '—'}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
            <p className="text-[10px] font-semibold text-slate-400">
              Specialization
            </p>
            <p className="mt-0.5 font-medium text-slate-800 dark:text-slate-100">
              {targetUser.specialization || '—'}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
            <p className="text-[10px] font-semibold text-slate-400">
              Experience
            </p>
            <p className="mt-0.5 font-medium text-slate-800 dark:text-slate-100">
              {targetUser.experience || '—'}
            </p>
          </div>
        </div>
      </Card>

      {/* Fields */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
          <Map className="h-5 w-5 text-green-600" /> Fields ({farmData.fields.length})
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {farmData.fields.map((field) => (
            <Card key={field.id}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  {field.name}
                </h3>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ring-1 ring-inset ${
                    field.status === 'active'
                      ? 'bg-green-50 text-green-700 ring-green-500/20 dark:bg-green-500/10 dark:text-green-400'
                      : 'bg-amber-50 text-amber-700 ring-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400'
                  }`}
                >
                  {field.status}
                </span>
              </div>
              <div className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                <p>
                  Size: {field.size} {field.unit}
                </p>
                <p>Crop: {field.crop}</p>
                <p>Soil: {field.soilType}</p>
                <p>
                  Soil Health: {field.soilHealth}% · Moisture: {field.moisture}%
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Sensors */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
          <Wifi className="h-5 w-5 text-green-600" /> Sensors ({farmData.sensors.length})
        </h2>
        <Card noPadding className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50/80 dark:border-white/10 dark:bg-white/5">
                <tr>
                  {['Name', 'Type', 'Location', 'Status', 'Battery'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {farmData.sensors.map((sensor) => (
                  <tr
                    key={sensor.id}
                    className="transition-colors hover:bg-slate-50/60 dark:hover:bg-white/5"
                  >
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
                      {sensor.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
                      {sensor.type}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
                      {sensor.location}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ring-1 ring-inset ${
                          sensor.status === 'active'
                            ? 'bg-green-50 text-green-700 ring-green-500/20 dark:bg-green-500/10 dark:text-green-400'
                            : 'bg-amber-50 text-amber-700 ring-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400'
                        }`}
                      >
                        {sensor.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
                        <Battery className="h-3.5 w-3.5" /> {sensor.battery}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Crops */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
          <Sprout className="h-5 w-5 text-green-600" /> Crops ({farmData.crops.length})
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {farmData.crops.map((crop) => (
            <Card key={crop.id}>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {crop.name}
              </h3>
              <div className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                <p>Season: {crop.season}</p>
                <p>Planted: {crop.plantedOn}</p>
                <p>Expected Yield: {crop.expectedYield}</p>
                <p>Status: {crop.status}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Activities */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
          <Activity className="h-5 w-5 text-green-600" /> Recent Activity
        </h2>
        <Card>
          <div className="space-y-3">
            {farmData.activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between border-b border-slate-100 pb-3 text-sm last:border-0 last:pb-0 dark:border-white/10"
              >
                <span className="text-slate-700 dark:text-slate-200">
                  {activity.description}
                </span>
                <span className="text-xs text-slate-400">{activity.timestamp}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}