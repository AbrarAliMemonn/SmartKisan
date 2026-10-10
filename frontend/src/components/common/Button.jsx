export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon = null,
  rightIcon = null,
  loadingText = 'Loading…',
  onClick,
  type = 'button',
  ...props
}) {
  const baseStyles = `
    relative inline-flex items-center justify-center gap-2
    font-semibold tracking-tight
    transition-colors duration-150 ease-out
    select-none whitespace-nowrap
    disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
    focus:outline-none focus-visible:ring-4
    dark:focus-visible:ring-offset-night
  `

  const variants = {
    primary: `
      bg-green-600 text-white shadow-sm
      hover:bg-green-700 active:bg-green-800
      focus-visible:ring-green-500/40
    `,
    secondary: `
      bg-white text-slate-700 border border-slate-300 shadow-sm
      hover:bg-slate-50 active:bg-slate-100
      focus-visible:ring-slate-400/30
      dark:bg-transparent dark:text-slate-200 dark:border-white/15
      dark:hover:bg-white/5 dark:active:bg-white/10
    `,
    danger: `
      bg-red-600 text-white shadow-sm
      hover:bg-red-700 active:bg-red-800
      focus-visible:ring-red-500/40
    `,
    warning: `
      bg-amber-500 text-amber-950 shadow-sm
      hover:bg-amber-600 active:bg-amber-700
      focus-visible:ring-amber-500/40
    `,
    success: `
      bg-green-600 text-white shadow-sm
      hover:bg-green-700 active:bg-green-800
      focus-visible:ring-green-500/40
    `,
    ghost: `
      bg-transparent text-slate-600
      hover:bg-slate-100 active:bg-slate-200
      focus-visible:ring-slate-400/30
      dark:text-slate-300 dark:hover:bg-white/5 dark:active:bg-white/10
    `,
    outline: `
      bg-transparent border border-slate-300 text-slate-700
      hover:border-green-600 hover:text-green-700 hover:bg-green-50
      active:bg-green-100
      focus-visible:ring-green-500/30
      dark:border-white/15 dark:text-slate-200
      dark:hover:border-green-500 dark:hover:text-green-300 dark:hover:bg-green-500/10
    `,
  }

  const sizes = {
    xs: 'px-2.5 py-1.5 text-xs rounded-lg gap-1.5',
    sm: 'px-3.5 py-2 text-sm rounded-lg gap-1.5',
    md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
    lg: 'px-6 py-3 text-base rounded-xl gap-2',
    xl: 'px-8 py-4 text-lg rounded-2xl gap-2.5',
  }

  const isDisabled = disabled || loading

  return (
    <button
      type={type}
      className={`
        ${baseStyles} 
        ${variants[variant] || variants.primary} 
        ${sizes[size] || sizes.md} 
        ${fullWidth ? 'w-full' : ''} 
        ${className}
      `}
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={loading}
      aria-disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <>
          <span
            className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
          <span>{loadingText}</span>
        </>
      ) : (
        <>
          {leftIcon && (
            <span className="flex shrink-0 items-center justify-center">
              {leftIcon}
            </span>
          )}
          <span className="inline-flex min-w-0 items-center justify-center">{children}</span>
          {rightIcon && (
            <span className="flex shrink-0 items-center justify-center">
              {rightIcon}
            </span>
          )}
        </>
      )}
    </button>
  )
}