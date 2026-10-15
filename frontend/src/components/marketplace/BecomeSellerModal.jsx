import { useState } from 'react'
import { X, Store, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../common/Button'
import ImageUploader from '../common/ImageUploader'

export default function BecomeSellerModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    shopName: '',
    description: '',
    storeLogoUrl: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    province: '',
    location: '',
    sellerType: '',
  })

  const [submitting, setSubmitting] = useState(false)

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.shopName.trim()) {
      toast.error('Please enter a shop / farm name')
      return
    }

    if (!form.sellerType) {
      toast.error('Please select your seller type')
      return
    }

    if (!form.location.trim()) {
      toast.error('Please enter your pickup / business location')
      return
    }

    setSubmitting(true)

    try {
      await onSubmit({
        ...form,
        shopName: form.shopName.trim(),
        description: form.description.trim(),
        storeLogoUrl: form.storeLogoUrl.trim() || undefined,
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        province: form.province.trim(),
        location: form.location.trim(),
        sellerType: form.sellerType,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const inputBase =
    'mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white'

  const labelBase =
    'text-[13px] font-semibold text-slate-700 dark:text-slate-200'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5 dark:bg-night-raised">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur-sm dark:border-white/10 dark:bg-night-raised/95">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-md shadow-green-600/25">
              <Store size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Become a Seller
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Submit your application to become a seller (Requires Admin Approval)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 space-y-5 overflow-y-auto px-5 py-5"
        >
          {/* Info banner */}
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 dark:border-amber-500/20 dark:bg-amber-500/5">
            <Info
              size={16}
              className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
            />
            <p className="text-xs leading-relaxed text-amber-900/90 dark:text-amber-200/90">
              Submit your farm or store details to apply as a seller. An <strong>Admin must approve your application</strong> before your seller account is activated and you can start listing and selling products.
            </p>
          </div>

          {/* Shop Name */}
          <div>
            <label className={labelBase}>
              Shop / Farm Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={inputBase}
              placeholder="e.g. Green Valley Farms"
              value={form.shopName}
              onChange={(e) => handleChange('shopName', e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          {/* Seller Type */}
          <div>
            <label className={labelBase}>
              Seller Type <span className="text-red-500">*</span>
            </label>
            <select
              className={inputBase}
              value={form.sellerType}
              onChange={(e) => handleChange('sellerType', e.target.value)}
              disabled={submitting}
              required
            >
              <option value="">Select seller type</option>
              <option value="INDIVIDUAL_FARMER">Individual Farmer</option>
              <option value="AGRICULTURAL_BUSINESS">
                Agricultural Business
              </option>
              <option value="MANUFACTURER">Manufacturer</option>
              <option value="DISTRIBUTOR">Distributor</option>
              <option value="RETAILER">Retailer</option>
              <option value="WHOLESALER">Wholesaler</option>
            </select>
          </div>

          {/* Store logo */}
          <ImageUploader
            label="Store Logo (optional)"
            folder="stores"
            value={form.storeLogoUrl}
            onChange={(url) => handleChange('storeLogoUrl', url)}
            disabled={submitting}
          />

          {/* Description */}
          <div>
            <label className={labelBase}>About your business</label>
            <textarea
              className={`${inputBase} resize-none`}
              rows={3}
              maxLength={500}
              placeholder="Tell buyers what you grow or sell..."
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              disabled={submitting}
            />
            <p className="mt-1 text-right text-[11px] font-medium text-slate-400">
              {form.description.length}/500
            </p>
          </div>

          {/* Phone + Email */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelBase}>Phone</label>
              <input
                type="tel"
                className={inputBase}
                placeholder="03XXXXXXXXX"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                disabled={submitting}
              />
            </div>

            <div>
              <label className={labelBase}>Email</label>
              <input
                type="email"
                className={inputBase}
                placeholder="seller@example.com"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className={labelBase}>Business / Pickup Address</label>
            <input
              type="text"
              className={inputBase}
              placeholder="Street, area, landmark..."
              value={form.address}
              onChange={(e) => handleChange('address', e.target.value)}
              disabled={submitting}
            />
          </div>

          {/* City + Province */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelBase}>City</label>
              <input
                type="text"
                className={inputBase}
                placeholder="e.g. Karachi"
                value={form.city}
                onChange={(e) => handleChange('city', e.target.value)}
                disabled={submitting}
              />
            </div>

            <div>
              <label className={labelBase}>Province</label>
              <input
                type="text"
                className={inputBase}
                placeholder="e.g. Sindh"
                value={form.province}
                onChange={(e) => handleChange('province', e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className={labelBase}>
              Pickup / Business Location{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={inputBase}
              placeholder="e.g. Karachi, Sindh"
              value={form.location}
              onChange={(e) => handleChange('location', e.target.value)}
              disabled={submitting}
              required
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Buyers may see this location when viewing your seller profile.
            </p>
          </div>
        </form>

        {/* Sticky Footer */}
        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 dark:border-white/10 dark:bg-white/5">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Not now
          </Button>

          <Button
            type="button"
            variant="primary"
            loading={submitting}
            disabled={submitting}
            onClick={handleSubmit}
          >
            Submit for Admin Approval
          </Button>
        </div>
      </div>
    </div>
  )
}