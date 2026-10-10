export default function Loader({ size = 'md', fullScreen = false, label }) {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-[3px]',
    lg: 'h-12 w-12 border-4',
  }

  const loader = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizes[size]} animate-spin rounded-full border-green-500 border-t-transparent`}
      />
      {label && (
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {label}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm dark:bg-night/90">
        {loader}
      </div>
    )
  }

  return loader
}