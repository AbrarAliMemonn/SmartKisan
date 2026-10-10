import { useRef, useState } from 'react'
import { Upload, X, Loader2, ImagePlus, Link2, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { mediaAPI } from '../../services/api'
import { UPLOAD_MAX_BYTES, UPLOAD_ACCEPTED_TYPES } from '../../utils/constants'
import { getApiErrorMessage } from '../../utils/apiError'

export default function ImageUploader({
  value,
  onChange,
  multiple = false,
  max = 6,
  folder = 'products',
  label = 'Image',
  allowUrl = true,
  disabled = false,
}) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlDraft, setUrlDraft] = useState('')

  const urls = multiple
    ? Array.isArray(value)
      ? value.filter(Boolean)
      : []
    : value
    ? [value]
    : []

  const emit = (nextUrls) => {
    onChange(multiple ? nextUrls : nextUrls[0] || '')
  }

  const validate = (files) => {
    for (const file of files) {
      if (!UPLOAD_ACCEPTED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: only JPG, PNG, WEBP or GIF images are allowed`)
        return false
      }
      if (file.size > UPLOAD_MAX_BYTES) {
        toast.error(`${file.name} is larger than 5 MB`)
        return false
      }
    }
    return true
  }

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || [])
    if (!files.length) return

    const room = multiple ? max - urls.length : 1
    if (room <= 0) {
      toast.error(`You can upload at most ${max} images`)
      return
    }

    const selected = files.slice(0, room)
    if (!validate(selected)) return

    setUploading(true)
    setProgress(0)

    try {
      const onProgress = (e) => {
        if (e.total) setProgress(Math.round((e.loaded * 100) / e.total))
      }

      let uploaded = []

      if (selected.length === 1) {
        const res = await mediaAPI.upload(selected[0], folder, onProgress)
        const data = res.data?.data ?? res.data
        if (data?.url) uploaded = [data.url]
      } else {
        const res = await mediaAPI.uploadMultiple(selected, folder, onProgress)
        const data = res.data?.data ?? res.data ?? []
        uploaded = (Array.isArray(data) ? data : [])
          .map((d) => d.url)
          .filter(Boolean)
      }

      if (!uploaded.length) {
        toast.error('Upload finished but no image URL came back. Please try again.')
        return
      }

      emit(multiple ? [...urls, ...uploaded] : uploaded)
      toast.success(
        uploaded.length > 1
          ? `${uploaded.length} images uploaded`
          : 'Image uploaded'
      )
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, {
          401: 'Please login to upload images.',
          413: 'That image is too large. Maximum size is 5 MB.',
        })
      )
    } finally {
      setUploading(false)
      setProgress(0)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const removeAt = (index) => emit(urls.filter((_, i) => i !== index))

  const addUrl = () => {
    const trimmed = urlDraft.trim()
    if (!trimmed) return
    if (!/^https?:\/\//i.test(trimmed) && !trimmed.startsWith('/')) {
      toast.error('Please enter a valid image URL')
      return
    }
    emit(multiple ? [...urls, trimmed] : [trimmed])
    setUrlDraft('')
    setShowUrlInput(false)
  }

  const canAddMore = multiple ? urls.length < max : urls.length === 0
  const busy = disabled || uploading

  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {label}
        </label>
        {allowUrl && (
          <button
            type="button"
            disabled={busy}
            onClick={() => setShowUrlInput((v) => !v)}
            className="flex items-center gap-1 text-xs font-medium text-slate-400 transition-colors hover:text-green-600 disabled:opacity-50"
          >
            <Link2 size={12} />
            {showUrlInput ? 'Hide URL field' : 'Use a URL instead'}
          </button>
        )}
      </div>

      {/* Existing images */}
      {urls.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2.5">
          {urls.map((url, i) => (
            <div
              key={`${url}-${i}`}
              className="group relative h-24 w-24 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm transition-all hover:shadow-md dark:border-white/10 dark:bg-white/5"
            >
              <img
                src={url}
                alt={`Upload ${i + 1}`}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />

              {i === 0 && multiple && (
                <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-gradient-to-t from-black/80 to-transparent py-1 text-[10px] font-semibold text-white">
                  <CheckCircle2 size={10} />
                  Cover
                </span>
              )}

              <button
                type="button"
                disabled={busy}
                onClick={() => removeAt(i)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-red-600 opacity-0 shadow-md transition-all hover:scale-110 hover:bg-white group-hover:opacity-100 disabled:opacity-50"
                title="Remove"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {canAddMore && (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            if (!busy) setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            if (!busy) handleFiles(e.dataTransfer.files)
          }}
          onClick={() => !busy && inputRef.current?.click()}
          className={`
            mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-7 transition-all
            ${
              dragging
                ? 'border-green-500 bg-green-50/60 dark:bg-green-500/10'
                : 'border-slate-200 bg-slate-50/40 hover:border-green-400 hover:bg-green-50/40 dark:border-white/10 dark:bg-white/5 dark:hover:border-green-500/50 dark:hover:bg-green-500/5'
            }
            ${busy ? 'cursor-not-allowed opacity-60' : ''}
          `}
        >
          {uploading ? (
            <>
              <Loader2 size={22} className="animate-spin text-green-600" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Uploading… {progress}%
              </p>
              <div className="h-1.5 w-40 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-100 dark:bg-white/10 dark:ring-white/10">
                {urls.length ? (
                  <ImagePlus size={18} className="text-slate-400" />
                ) : (
                  <Upload size={18} className="text-slate-400" />
                )}
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Click to upload {multiple ? 'images' : 'an image'}
              </p>
              <p className="text-[11px] text-slate-400">
                or drag &amp; drop · JPG, PNG, WEBP or GIF · up to 5 MB
                {multiple ? ` · ${urls.length}/${max} added` : ''}
              </p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={UPLOAD_ACCEPTED_TYPES.join(',')}
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {showUrlInput && (
        <div className="mt-3 flex gap-2">
          <input
            type="url"
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
            placeholder="https://example.com/photo.jpg"
            value={urlDraft}
            disabled={busy}
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addUrl()
              }
            }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={addUrl}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:border-green-500 hover:text-green-600 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
          >
            Add
          </button>
        </div>
      )}
    </div>
  )
}