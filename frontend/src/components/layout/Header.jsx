import { useState, useRef, useEffect, useMemo } from 'react'
import {
  Bell,
  Search,
  Menu,
  LogOut,
  Sun,
  Moon,
  Settings,
  UserCircle,
  ShoppingCart,
  Heart,
  ChevronDown,
  CornerDownLeft,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useStore from '../../store/useStore'
import { useAuthContext } from '../../context/AuthContext'

// Pages the quick-search can jump to
const SEARCH_TARGETS = [
  { label: 'Dashboard', path: '/dashboard', hint: 'Overview of all sensors', words: 'home farm overview stats' },
  { label: 'Live Monitoring', path: '/live-monitoring', hint: 'Streaming sensor charts', words: 'realtime stream chart' },
  { label: 'Sensor Details', path: '/sensor-details', hint: 'Thresholds and reading history', words: 'moisture temperature humidity ph readings export' },
  { label: 'Crop Guide', path: '/crop-guide', hint: 'Seasons, water and soil needs', words: 'rice wheat maize cotton season' },
  { label: 'Live Weather', path: '/weather', hint: 'Current weather and forecast', words: 'rain temperature forecast' },
  { label: 'Marketplace', path: '/marketplace', hint: 'Buy seeds, fertilizer, equipment', words: 'shop buy sell products store' },
  { label: 'My Orders', path: '/marketplace/orders', hint: 'Track your purchases', words: 'order tracking delivery' },
  { label: 'Wishlist', path: '/marketplace/wishlist', hint: 'Products you saved', words: 'saved favourites' },
  { label: 'Cart', path: '/marketplace/cart', hint: 'Review items before checkout', words: 'basket checkout' },
  { label: 'Seller Dashboard', path: '/marketplace/seller', hint: 'Listings, orders and payments', words: 'sell listings payouts' },
  { label: 'AI Chatbot', path: '/chatbot', hint: 'Ask the farming assistant', words: 'help advice assistant' },
  { label: 'Profile', path: '/profile', hint: 'Your account details', words: 'account password avatar' },
  { label: 'Settings', path: '/settings', hint: 'Theme, alerts and units', words: 'preferences dark mode notifications' },
  { label: 'Admin Panel', path: '/admin', hint: 'Users, approvals, system', words: 'users moderation sellers', adminOnly: true },
]

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent)

const iconBtn =
  'rounded-xl p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'

export default function Header() {
  const navigate = useNavigate()
  const { logout, user, isAdmin } = useAuthContext()
  const {
    toggleMobileSidebar,
    notifications,
    clearNotifications,
    darkMode,
    toggleDarkMode,
    cartItems,
    wishlist,
  } = useStore()

  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileSearch, setMobileSearch] = useState(false)
  const [active, setActive] = useState(0)

  const notifRef = useRef(null)
  const profileRef = useRef(null)
  const searchRef = useRef(null)
  const inputRef = useRef(null)
  const mobileInputRef = useRef(null)

  const unreadCount = notifications.filter((n) => !n.read).length
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return SEARCH_TARGETS.filter((t) => !(t.adminOnly && !isAdmin)).filter(
      (t) => !q || `${t.label} ${t.hint} ${t.words}`.toLowerCase().includes(q)
    )
  }, [query, isAdmin])

  // Outside click closes every popover
  useEffect(() => {
    const onDown = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false)
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  // Escape closes popovers, Cmd/Ctrl+K focuses search
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setShowNotifications(false)
        setShowProfile(false)
        setSearchOpen(false)
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        const el = window.innerWidth >= 768 ? inputRef.current : null
        if (el) {
          el.focus()
          setSearchOpen(true)
        } else {
          setMobileSearch(true)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (mobileSearch) mobileInputRef.current?.focus()
  }, [mobileSearch])

  const go = (path) => {
    navigate(path)
    setQuery('')
    setSearchOpen(false)
    setMobileSearch(false)
    inputRef.current?.blur()
  }

  const onSearchKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSearchOpen(true)
      setActive((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[active]) {
      e.preventDefault()
      go(results[active].path)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const role = user?.role?.toLowerCase()
  const roleBadge =
    role === 'admin'
      ? { label: 'Administrator', style: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-400/20' }
      : role === 'expert'
        ? { label: 'Agricultural Expert', style: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-400/20' }
        : { label: 'Verified Farmer', style: 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/10 dark:text-green-300 dark:ring-green-400/20' }

  const initial = (user?.name || 'U').trim().charAt(0).toUpperCase()

  const avatar = (size) =>
    user?.avatarImage ? (
      <img src={user.avatarImage} alt="" className="h-full w-full object-cover" />
    ) : (
      <span className={`font-bold ${size}`}>{initial}</span>
    )

  const menuItem =
    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5'

  const searchPanel = (
    <ul
      id="quick-search-list"
      role="listbox"
      className="max-h-80 overflow-y-auto p-1.5"
    >
      {results.length === 0 ? (
        <li className="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
          No pages match “{query}”.
        </li>
      ) : (
        results.map((t, i) => (
          <li key={t.path} role="option" aria-selected={i === active}>
            <button
              type="button"
              onMouseEnter={() => setActive(i)}
              onClick={() => go(t.path)}
              className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                i === active ? 'bg-green-50 dark:bg-green-500/10' : ''
              }`}
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-900 dark:text-white">{t.label}</span>
                <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{t.hint}</span>
              </span>
              {i === active && <CornerDownLeft size={14} className="shrink-0 text-green-600 dark:text-green-400" />}
            </button>
          </li>
        ))
      )}
    </ul>
  )

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur-xl dark:border-white/10 dark:bg-night/85">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* Left: menu + search */}
        <div className="flex min-w-0 items-center gap-2">
          <button onClick={toggleMobileSidebar} className={`shrink-0 lg:hidden ${iconBtn}`} aria-label="Open menu">
            <Menu size={22} />
          </button>

          <div ref={searchRef} className="relative hidden md:block">
            <div className="flex w-64 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition focus-within:border-green-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-green-500/15 lg:w-80 dark:border-white/10 dark:bg-white/5 dark:focus-within:bg-white/10">
              <Search size={17} className="shrink-0 text-slate-400" aria-hidden="true" />
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded={searchOpen}
                aria-controls="quick-search-list"
                aria-label="Jump to a page"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setActive(0)
                  setSearchOpen(true)
                }}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={onSearchKey}
                placeholder="Jump to a page"
                className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
              />
              <kbd className="hidden shrink-0 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] font-medium text-slate-500 lg:block dark:border-white/10 dark:bg-white/10 dark:text-slate-400">
                {isMac ? '⌘K' : 'Ctrl K'}
              </kbd>
            </div>
            {searchOpen && (
              <div className="absolute left-0 top-full mt-2 w-full min-w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-pop dark:border-white/10 dark:bg-night-raised">
                {searchPanel}
              </div>
            )}
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <button onClick={() => setMobileSearch((v) => !v)} className={`md:hidden ${iconBtn}`} aria-label="Search pages">
            {mobileSearch ? <X size={19} /> : <Search size={19} />}
          </button>

          <button
            onClick={() => navigate('/marketplace/wishlist')}
            className={`relative ${iconBtn} hover:!bg-rose-50 hover:!text-rose-600 dark:hover:!bg-rose-500/10 dark:hover:!text-rose-300`}
            aria-label={`Wishlist${wishlist.length ? `, ${wishlist.length} items` : ''}`}
            title="Wishlist"
          >
            <Heart size={19} />
            {wishlist.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-night">
                {wishlist.length}
              </span>
            )}
          </button>

          <button
            onClick={() => navigate('/marketplace/cart')}
            className={`relative ${iconBtn}`}
            aria-label={`Cart${cartCount ? `, ${cartCount} items` : ''}`}
            title="Cart"
          >
            <ShoppingCart size={19} />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-green-600 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-night">
                {cartCount}
              </span>
            )}
          </button>

          <button
            onClick={toggleDarkMode}
            className={iconBtn}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            title={darkMode ? 'Light mode' : 'Dark mode'}
          >
            {darkMode ? <Sun size={19} /> : <Moon size={19} />}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setShowNotifications((v) => !v)
                setShowProfile(false)
              }}
              className={`relative ${iconBtn}`}
              aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
              aria-haspopup="true"
              aria-expanded={showNotifications}
            >
              <Bell size={19} />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-night" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-80 origin-top-right overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-pop sm:w-80 dark:border-white/10 dark:bg-night-raised">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-white/10">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</h3>
                    {unreadCount > 0 && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">{unreadCount} unread</p>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearNotifications}
                      className="text-xs font-semibold text-green-700 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-white/5">
                        <Bell className="h-5 w-5 text-slate-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">You're all caught up</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Sensor alerts and order updates will show up here.
                      </p>
                    </div>
                  ) : (
                    notifications.map((notif, idx) => (
                      <div
                        key={idx}
                        className="border-b border-slate-100 px-4 py-3 last:border-0 dark:border-white/10"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400">
                            <Bell size={14} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{notif.title}</p>
                            <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{notif.message}</p>
                            <p className="mt-1 text-xs text-slate-400">{notif.time}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <span className="mx-1 hidden h-6 w-px bg-slate-200 sm:block dark:bg-white/10" aria-hidden="true" />

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => {
                setShowProfile((v) => !v)
                setShowNotifications(false)
              }}
              className="flex items-center gap-2 rounded-xl p-1 pr-2 transition-colors hover:bg-slate-100 dark:hover:bg-white/10"
              aria-haspopup="menu"
              aria-expanded={showProfile}
              aria-label="Account menu"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-green-700 text-sm text-white">
                {avatar('text-sm')}
              </div>
              <div className="hidden text-left md:block">
                <p className="max-w-32 truncate text-sm font-semibold leading-tight text-slate-900 dark:text-white">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs capitalize leading-tight text-slate-500 dark:text-slate-400">
                  {role || 'Farmer'}
                </p>
              </div>
              <ChevronDown
                size={14}
                className={`hidden text-slate-400 transition-transform md:block ${showProfile ? 'rotate-180' : ''}`}
              />
            </button>

            {showProfile && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-64 origin-top-right overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-pop dark:border-white/10 dark:bg-night-raised"
              >
                <div className="border-b border-slate-100 p-4 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-green-700 text-white">
                      {avatar('text-base')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{user?.name || 'User'}</p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
                    </div>
                  </div>
                  <span className={`mt-3 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${roleBadge.style}`}>
                    {roleBadge.label}
                  </span>
                </div>

                <div className="p-1.5">
                  <button role="menuitem" className={menuItem} onClick={() => { navigate('/profile'); setShowProfile(false) }}>
                    <UserCircle size={16} className="text-slate-400" />
                    My Profile
                  </button>
                  <button role="menuitem" className={menuItem} onClick={() => { navigate('/settings'); setShowProfile(false) }}>
                    <Settings size={16} className="text-slate-400" />
                    Settings
                  </button>
                  <div className="my-1 h-px bg-slate-100 dark:bg-white/10" />
                  <button
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                  >
                    <LogOut size={16} />
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search row */}
      {mobileSearch && (
        <div className="border-t border-slate-100 px-4 pb-3 pt-2 md:hidden dark:border-white/10">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/5">
            <Search size={17} className="text-slate-400" aria-hidden="true" />
            <input
              ref={mobileInputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActive(0) }}
              onKeyDown={onSearchKey}
              aria-label="Jump to a page"
              placeholder="Jump to a page"
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>
          <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-night-raised">
            {searchPanel}
          </div>
        </div>
      )}
    </header>
  )
}
