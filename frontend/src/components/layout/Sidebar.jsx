import { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Radio,
  Gauge,
  Sprout,
  CloudRain,
  ShoppingBag,
  PackageCheck,
  Heart,
  MessageCircle,
  UserCircle,
  Settings as SettingsIcon,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Leaf,
  X,
} from 'lucide-react'
import useStore from '../../store/useStore'
import { useAuthContext } from '../../context/AuthContext'

// `isActive` can be overridden per item so "Marketplace" stays highlighted on
// product / cart / checkout pages but not on the Orders and Wishlist pages,
// which have their own entries.
const menuGroups = [
  {
    label: 'Overview',
    items: [
      { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/live-monitoring', icon: Radio, label: 'Live Monitoring' },
      { path: '/sensor-details', icon: Gauge, label: 'Sensor Details' },
    ],
  },
  {
    label: 'Farm management',
    items: [
      { path: '/crop-guide', icon: Sprout, label: 'Crop Guide' },
      { path: '/weather', icon: CloudRain, label: 'Live Weather' },
    ],
  },
  {
    label: 'Marketplace',
    items: [
      {
        path: '/marketplace',
        icon: ShoppingBag,
        label: 'Marketplace',
        isActive: (p) =>
          p.startsWith('/marketplace') &&
          !p.startsWith('/marketplace/orders') &&
          !p.startsWith('/marketplace/wishlist'),
      },
      { path: '/marketplace/orders', icon: PackageCheck, label: 'My Orders' },
      { path: '/marketplace/wishlist', icon: Heart, label: 'Wishlist' },
    ],
  },
  {
    label: 'Tools',
    items: [{ path: '/chatbot', icon: MessageCircle, label: 'AI Chatbot' }],
  },
  {
    label: 'Account',
    items: [
      { path: '/profile', icon: UserCircle, label: 'Profile' },
      { path: '/settings', icon: SettingsIcon, label: 'Settings' },
      { path: '/admin', icon: ShieldCheck, label: 'Admin Panel', adminOnly: true },
    ],
  },
]

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar, mobileSidebarOpen, closeMobileSidebar } = useStore()
  const { isAdmin } = useAuthContext()
  const { pathname } = useLocation()

  const collapsed = !sidebarOpen

  // Close the mobile drawer with Escape
  useEffect(() => {
    if (!mobileSidebarOpen) return undefined
    const onKey = (e) => e.key === 'Escape' && closeMobileSidebar()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileSidebarOpen, closeMobileSidebar])

  const content = (
    <>
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4">
        <div
          className={`flex items-center gap-3 overflow-hidden ${
            collapsed ? 'lg:w-full lg:justify-center' : ''
          }`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lime-300/15 text-lime-300 ring-1 ring-lime-300/25">
            <Leaf size={19} aria-hidden="true" />
          </div>
          <div className={`whitespace-nowrap ${collapsed ? 'lg:hidden' : ''}`}>
            <p className="text-[15px] font-bold leading-tight tracking-tight">SmartKisan</p>
            <p className="text-[11px] font-medium leading-tight text-white/50">
              Smart farming & marketplace
            </p>
          </div>
        </div>

        <button
          onClick={closeMobileSidebar}
          className="rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Main navigation">
        {menuGroups.map((group) => {
          const items = group.items.filter((item) => !(item.adminOnly && !isAdmin))
          if (items.length === 0) return null

          return (
            <div key={group.label} className="mb-2">
              <p
                className={`px-3 pb-1 pt-3 text-xs font-semibold text-white/40 ${
                  collapsed ? 'lg:hidden' : ''
                }`}
              >
                {group.label}
              </p>

              {items.map((item) => {
                const active = item.isActive
                  ? item.isActive(pathname)
                  : pathname === item.path || pathname.startsWith(`${item.path}/`)

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={closeMobileSidebar}
                    title={collapsed ? item.label : undefined}
                    aria-current={active ? 'page' : undefined}
                    className={`
                      group relative my-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium
                      transition-colors duration-150 focus-visible:outline-lime-300
                      ${active ? 'bg-white/12 text-white' : 'text-white/65 hover:bg-white/8 hover:text-white'}
                      ${collapsed ? 'lg:justify-center' : ''}
                    `}
                  >
                    {active && (
                      <span className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-lime-300" />
                    )}
                    <item.icon
                      size={19}
                      className={`shrink-0 ${active ? 'text-lime-300' : ''}`}
                      aria-hidden="true"
                    />
                    <span className={`whitespace-nowrap ${collapsed ? 'lg:sr-only' : ''}`}>
                      {item.label}
                    </span>
                  </NavLink>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className={`shrink-0 border-t border-white/10 px-4 py-3 ${collapsed ? 'lg:hidden' : ''}`}>
        <p className="text-xs text-white/40">SmartKisan v2.0.0</p>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] lg:hidden"
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col
          bg-gradient-to-b from-secondary to-secondary-dark text-white
          transition-[width,transform] duration-300 ease-in-out
          ${sidebarOpen ? 'lg:w-64' : 'lg:w-[76px]'}
          w-72 ${
            mobileSidebarOpen
              ? 'translate-x-0 shadow-2xl'
              : '-translate-x-full lg:translate-x-0'
          }
        `}
      >
        {content}

        {/* Desktop collapse handle, sits on the sidebar edge */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-[26px] hidden h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:text-green-700 lg:flex dark:border-white/15 dark:bg-night-raised dark:text-slate-300 dark:hover:text-white"
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          aria-expanded={sidebarOpen}
        >
          {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </aside>
    </>
  )
}
