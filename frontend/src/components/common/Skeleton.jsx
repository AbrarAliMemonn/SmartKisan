export function SkeletonLine({ className = '' }) {
  return (
    <div
      className={`h-4 animate-pulse rounded-md bg-slate-200/80 dark:bg-white/10 ${className}`}
    />
  )
}

export function SkeletonCircle({ size = 40, className = '' }) {
  return (
    <div
      className={`animate-pulse rounded-full bg-slate-200/80 dark:bg-white/10 ${className}`}
      style={{ width: size, height: size }}
    />
  )
}

export function SkeletonCard({ className = '' }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-night-raised ${className}`}
    >
      <div className="flex items-center justify-between">
        <SkeletonLine className="w-1/3" />
        <SkeletonCircle size={36} />
      </div>
      <div className="mt-4 space-y-3">
        <SkeletonLine className="h-8 w-2/3" />
        <SkeletonLine className="w-1/2" />
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-night-raised">
      <SkeletonLine className="mb-4 h-5 w-1/4" />
      <div className="mt-2 space-y-3">
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: cols }).map((_, c) => (
              <SkeletonLine key={c} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonChart({ height = 280 }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-night-raised">
      <SkeletonLine className="mb-4 h-5 w-1/3" />
      <div
        className="animate-pulse rounded-xl bg-slate-200/80 dark:bg-white/10"
        style={{ height }}
      />
    </div>
  )
}