import { useRef, useState } from 'react'
import {
  Camera, Mail, Phone, MapPin, Sprout, Save, Lock, Eye, EyeOff, BadgeCheck,
  Calendar,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import { useAuthContext } from '../context/AuthContext'

export default function UserProfile() {
  const { user, updateUser, changePassword } = useAuthContext()
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
    farmSize: user?.farmSize || '',
  })

  const [passwordForm, setPasswordForm] = useState({
    current: '',
    next: '',
    confirm: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file')
      return
    }
    const reader = new FileReader()
    reader.onload = async () => {
      await updateUser({ avatarImage: reader.result })
    }
    reader.readAsDataURL(file)
  }

  const handleProfileSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Name and email are required')
      return
    }
    setSavingProfile(true)
    try {
      await updateUser(form)
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordSave = async (e) => {
    e.preventDefault()
    if (!passwordForm.current || !passwordForm.next) {
      toast.error('Please fill in all password fields')
      return
    }
    if (passwordForm.next !== passwordForm.confirm) {
      toast.error('New passwords do not match')
      return
    }
    if (passwordForm.next.length < 6) {
      toast.error('Password should be at least 6 characters')
      return
    }
    setSavingPassword(true)
    try {
      const result = await changePassword({
        currentPassword: passwordForm.current,
        newPassword: passwordForm.next,
      })
      if (result.success) {
        setPasswordForm({ current: '', next: '', confirm: '' })
      }
    } finally {
      setSavingPassword(false)
    }
  }

  const roleBadge = () => {
    const role = user?.role?.toLowerCase()
    if (role === 'admin')
      return {
        label: 'Administrator',
        style:
          'bg-red-50 text-red-700 ring-red-500/20 dark:bg-red-500/10 dark:text-red-400',
      }
    if (role === 'expert')
      return {
        label: 'Agricultural Expert',
        style:
          'bg-blue-50 text-blue-700 ring-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400',
      }
    return {
      label: 'Verified Farmer',
      style:
        'bg-green-50 text-green-700 ring-green-500/20 dark:bg-green-500/10 dark:text-green-400',
    }
  }

  const badge = roleBadge()

  const inputBase =
    'w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white'

  const labelBase =
    'mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-slate-700 dark:text-slate-200'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
          My Profile
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 sm:text-base">
          View and manage your account details
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Summary */}
        <Card className="text-center lg:col-span-1">
          <div className="relative mx-auto h-24 w-24">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-green-400 to-emerald-600 text-4xl text-white shadow-lg shadow-green-600/25">
              {user?.avatarImage ? (
                <img
                  src={user.avatarImage}
                  alt="avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{user?.avatar || '🧑‍🌾'}</span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-md transition-transform hover:scale-110"
              title="Change profile picture"
            >
              <Camera size={14} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <h2 className="mt-4 text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            {user?.name}
          </h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {user?.email}
          </p>

          <div className="mt-3 flex justify-center">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold ring-1 ring-inset ${badge.style}`}
            >
              <BadgeCheck size={12} />
              {badge.label}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 text-left text-sm">
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
              <p className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                <Calendar size={10} /> Joined
              </p>
              <p className="mt-1 font-medium text-slate-800 dark:text-white">
                {user?.joinDate || '—'}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
              <p className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                <Sprout size={10} /> Farm Size
              </p>
              <p className="mt-1 font-medium text-slate-800 dark:text-white">
                {user?.farmSize || '—'}
              </p>
            </div>
          </div>
        </Card>

        {/* Forms */}
        <div className="space-y-5 lg:col-span-2">
          {/* Profile Info */}
          <Card>
            <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">
              Profile Information
            </h3>

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelBase}>
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    className={inputBase}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    disabled={savingProfile}
                  />
                </div>
                <div>
                  <label className={labelBase}>
                    <Mail size={13} /> Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    className={inputBase}
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    required
                    disabled={savingProfile}
                  />
                </div>
                <div>
                  <label className={labelBase}>
                    <Phone size={13} /> Phone
                  </label>
                  <input
                    className={inputBase}
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    disabled={savingProfile}
                  />
                </div>
                <div>
                  <label className={labelBase}>
                    <MapPin size={13} /> Location
                  </label>
                  <input
                    className={inputBase}
                    value={form.location}
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                    disabled={savingProfile}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelBase}>
                    <Sprout size={13} /> Farm Size
                  </label>
                  <input
                    className={inputBase}
                    value={form.farmSize}
                    onChange={(e) =>
                      setForm({ ...form, farmSize: e.target.value })
                    }
                    disabled={savingProfile}
                  />
                </div>
              </div>

              <Button type="submit" variant="primary" loading={savingProfile}>
                <Save size={16} /> Save Changes
              </Button>
            </form>
          </Card>

          {/* Change Password */}
          <Card>
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
              <Lock size={16} /> Change Password
            </h3>

            <form onSubmit={handlePasswordSave} className="space-y-4">
              <div>
                <label className={labelBase}>
                  Current Password <span className="text-red-500">*</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={inputBase}
                  value={passwordForm.current}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      current: e.target.value,
                    })
                  }
                  required
                  disabled={savingPassword}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelBase}>
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={inputBase}
                    value={passwordForm.next}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, next: e.target.value })
                    }
                    required
                    minLength={6}
                    disabled={savingPassword}
                  />
                </div>
                <div>
                  <label className={labelBase}>
                    Confirm New Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={inputBase}
                    value={passwordForm.confirm}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirm: e.target.value,
                      })
                    }
                    required
                    minLength={6}
                    disabled={savingPassword}
                  />
                </div>
              </div>

              <label className="flex w-fit cursor-pointer items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={() => setShowPassword((v) => !v)}
                  disabled={savingPassword}
                  className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-2 focus:ring-green-500/30"
                />
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                Show passwords
              </label>

              <Button
                type="submit"
                variant="secondary"
                loading={savingPassword}
              >
                Update Password
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}