export default function Card({
  children,
  className = '',
  hover = false,
  onClick,
  noPadding = false,
}) {
  const interactive = Boolean(onClick)

  const onKeyDown = interactive
    ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick(e)
        }
      }
    : undefined

  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={onKeyDown}
      onClick={onClick}
      className={`
        rounded-2xl border border-slate-200 bg-white shadow-card
        dark:border-white/10 dark:bg-night-raised
        ${noPadding ? '' : 'p-5 sm:p-6'}
        ${hover ? 'cursor-pointer transition-[box-shadow,border-color] duration-200 hover:border-green-300 hover:shadow-card-hover dark:hover:border-white/25' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
