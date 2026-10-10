import { useState } from 'react'
import { X, Package, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../common/Button'
import ImageUploader from '../common/ImageUploader'
import {
  productCategories,
  productUnits,
  productConditions,
} from '../../utils/constants'

export default function ProductFormModal({ initialData, onClose, onSave }) {
  const [form, setForm] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: initialData?.category || productCategories[0].id,
    price: initialData?.price ?? '',
    originalPrice: initialData?.originalPrice ?? '',
    unit: initialData?.unit || productUnits[0],
    stock: initialData?.stock ?? '',
    condition: initialData?.condition || 'NEW',
    imageUrl: initialData?.imageUrl || '',
    images: Array.isArray(initialData?.images)
      ? initialData.images.filter((img) => img && img !== initialData?.imageUrl)
      : [],
    city: initialData?.city || '',
    province: initialData?.province || '',
    organic: initialData?.organic || false,
    negotiable: initialData?.negotiable || false,
  })
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.title.trim()) {
      toast.error('Please enter a product title')
      return
    }
    if (form.price === '' || Number(form.price) <= 0) {
      toast.error('Please enter a valid price')
      return
    }
    if (form.stock === '' || Number(form.stock) < 0) {
      toast.error('Please enter the available stock')
      return
    }
    if (
      form.originalPrice !== '' &&
      Number(form.originalPrice) <= Number(form.price)
    ) {
      toast.error('Original price should be higher than the current price')
      return
    }

    setSubmitting(true)
    try {
      await onSave(form)
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
              <Package size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                {initialData ? 'Edit Listing' : 'List a New Product'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {initialData
                  ? 'Update the product details below'
                  : 'Add your product to the marketplace'}
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

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 space-y-5 overflow-y-auto px-5 py-5"
        >
          {/* Info banner */}
          <div className="flex items-start gap-3 rounded-xl border border-green-100 bg-green-50/60 p-3.5 dark:border-green-500/20 dark:bg-green-500/5">
            <Info
              size={16}
              className="mt-0.5 shrink-0 text-green-600 dark:text-green-400"
            />
            <p className="text-xs leading-relaxed text-green-900/80 dark:text-green-200/90">
              Fill in the details below to publish your listing. Fields marked
              with <span className="text-red-500">*</span> are required.
            </p>
          </div>

          {/* Title */}
          <div>
            <label className={labelBase}>
              Product Title <span className="text-red-500">*</span>
            </label>
            <input
              className={inputBase}
              placeholder="e.g. Fresh Organic Tomatoes"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              disabled={submitting}
              maxLength={100}
              required
            />
            <p className="mt-1 text-right text-[11px] font-medium text-slate-400">
              {form.title.length}/100
            </p>
          </div>

          {/* Description */}
          <div>
            <label className={labelBase}>Description</label>
            <textarea
              className={`${inputBase} resize-none`}
              rows={3}
              maxLength={500}
              placeholder="Describe quality, harvest date, delivery options..."
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              disabled={submitting}
            />
            <p className="mt-1 text-right text-[11px] font-medium text-slate-400">
              {form.description.length}/500
            </p>
          </div>

          {/* Category */}
          <div>
            <label className={labelBase}>Category</label>
            <select
              className={inputBase}
              value={form.category}
              onChange={(e) => handleChange('category', e.target.value)}
              disabled={submitting}
            >
              {productCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Price + Original Price */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelBase}>
                Price (Rs.) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputBase}
                value={form.price}
                onChange={(e) => handleChange('price', e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <div>
              <label className={labelBase}>Original Price (Rs.)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputBase}
                placeholder="Optional — shows discount"
                value={form.originalPrice}
                onChange={(e) => handleChange('originalPrice', e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          {/* Unit + Stock */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelBase}>Unit</label>
              <select
                className={inputBase}
                value={form.unit}
                onChange={(e) => handleChange('unit', e.target.value)}
                disabled={submitting}
              >
                {productUnits.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelBase}>
                Stock <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                className={inputBase}
                value={form.stock}
                onChange={(e) => handleChange('stock', e.target.value)}
                disabled={submitting}
                required
              />
            </div>
          </div>

          {/* Condition + City */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelBase}>Condition</label>
              <select
                className={inputBase}
                value={form.condition}
                onChange={(e) => handleChange('condition', e.target.value)}
                disabled={submitting}
              >
                {productConditions.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0) + c.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelBase}>City</label>
              <input
                className={inputBase}
                placeholder="e.g. Karachi"
                value={form.city}
                onChange={(e) => handleChange('city', e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          {/* Cover Photo */}
          <ImageUploader
            label="Cover Photo"
            folder="products"
            value={form.imageUrl}
            onChange={(url) => handleChange('imageUrl', url)}
            disabled={submitting}
          />

          {/* Gallery Photos */}
          <ImageUploader
            label="More Photos (optional)"
            folder="products"
            multiple
            max={6}
            value={form.images}
            onChange={(urls) => handleChange('images', urls)}
            disabled={submitting}
          />

          {/* Toggles */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-slate-100 bg-slate-50/40 p-4 dark:border-white/5 dark:bg-white/5">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={form.organic}
                onChange={(e) => handleChange('organic', e.target.checked)}
                disabled={submitting}
                className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-2 focus:ring-green-500/30"
              />
              Organic / Certified
            </label>

            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={form.negotiable}
                onChange={(e) => handleChange('negotiable', e.target.checked)}
                disabled={submitting}
                className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-2 focus:ring-green-500/30"
              />
              Price negotiable
            </label>
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
            Cancel
          </Button>

          <Button
            type="button"
            variant="primary"
            loading={submitting}
            disabled={submitting}
            onClick={handleSubmit}
          >
            {initialData ? 'Save Changes' : 'Publish Listing'}
          </Button>
        </div>
      </div>
    </div>
  )
}