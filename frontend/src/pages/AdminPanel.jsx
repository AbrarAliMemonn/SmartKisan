import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  BarChart3, Users, Store, Package, Wallet, Wifi, Sprout, Settings, RefreshCw,
} from 'lucide-react'
import Button from '../components/common/Button'
import { useAuthContext } from '../context/AuthContext'
import useAdminQueues from '../hooks/useAdminQueues'
import AdminOverview from '../components/admin/AdminOverview'
import AdminUsers from '../components/admin/AdminUsers'
import AdminModeration from '../components/admin/AdminModeration'
import AdminSystem from '../components/admin/AdminSystem'

const NAV = [
  {
    group: 'Dashboard',
    items: [{ id: 'overview', label: 'Overview', icon: BarChart3 }],
  },
  {
    group: 'People',
    items: [{ id: 'users', label: 'Users', icon: Users }],
  },
  {
    group: 'Marketplace',
    items: [
      { id: 'sellers', label: 'Seller requests', icon: Store, badge: 'sellers' },
      { id: 'products', label: 'Product approvals', icon: Package, badge: 'products' },
      { id: 'payments', label: 'Payments', icon: Wallet, badge: 'payments' },
    ],
  },
  {
    group: 'System',
    items: [
      { id: 'sensors', label: 'Sensors', icon: Wifi },
      { id: 'crops', label: 'Crop database', icon: Sprout },
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
]

const ALL = NAV.flatMap((g) => g.items)

export default function AdminPanel() {
  const { users, fetchUsers } = useAuthContext()
  const [params, setParams] = useSearchParams()
  const [usersLoading, setUsersLoading] = useState(true)
  const { queues, counts, busyId, load, act } = useAdminQueues()

  const requested = params.get('section')
  const section = ALL.some((i) => i.id === requested) ? requested : 'overview'
  const current = ALL.find((i) => i.id === section)

  const go = (id) => setParams(id === 'overview' ? {} : { section: id }, { replace: false })

  useEffect(() => {
    let live = true
    fetchUsers().finally(() => live && setUsersLoading(false))
    return () => {
      live = false
    }
  }, [fetchUsers])

  const refreshAll = async () => {
    setUsersLoading(true)
    await Promise.all([fetchUsers(), load('sellers'), load('products'), load('payments')])
    setUsersLoading(false)
  }

  const queuesLoading = queues.sellers.loading || queues.products.loading || queues.payments.loading
  const totalPending = counts.sellers + counts.products + counts.payments

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Admin Panel</h1>
          <p className="page-subtitle">
            {totalPending > 0 ? `${totalPending} item${totalPending === 1 ? '' : 's'} waiting for your review` : 'Manage users, marketplace and system'}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={refreshAll} leftIcon={<RefreshCw className={`h-4 w-4 ${usersLoading ? 'animate-spin' : ''}`} />}>
          Refresh data
        </Button>
      </div>

      {/* Mobile section picker */}
      <div className="lg:hidden">
        <label htmlFor="admin-section" className="sr-only">Admin section</label>
        <select id="admin-section" value={section} onChange={(e) => go(e.target.value)} className="input-field font-semibold">
          {NAV.map((g) => (
            <optgroup key={g.group} label={g.group}>
              {g.items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.label}
                  {i.badge && counts[i.badge] > 0 ? ` (${counts[i.badge]})` : ''}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start lg:gap-8">
        <nav aria-label="Admin sections" className="sticky top-0 hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-card lg:block dark:border-white/10 dark:bg-night-raised">
          {NAV.map((g) => (
            <div key={g.group} className="mb-1 last:mb-0">
              <p className="px-3 pb-1 pt-3 text-xs font-semibold text-slate-400">{g.group}</p>
              {g.items.map((i) => {
                const active = i.id === section
                const n = i.badge ? counts[i.badge] : 0
                return (
                  <button
                    key={i.id}
                    onClick={() => go(i.id)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-green-50 text-green-800 dark:bg-green-500/15 dark:text-green-300'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'
                    }`}
                  >
                    <i.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                    <span className="flex-1 truncate text-left">{i.label}</span>
                    {n > 0 && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">{n}</span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        <section aria-label={current.label} className="mt-6 min-w-0 lg:mt-0">
          {section === 'overview' && (
            <AdminOverview users={users} usersLoading={usersLoading} counts={counts} queuesLoading={queuesLoading} onNavigate={go} />
          )}
          {section === 'users' && <AdminUsers users={users} loading={usersLoading} />}
          {['sellers', 'products', 'payments'].includes(section) && (
            <AdminModeration
              key={section}
              kind={section}
              queue={queues[section]}
              busyId={busyId}
              onRefresh={() => load(section)}
              onAct={act}
            />
          )}
          {['sensors', 'crops', 'settings'].includes(section) && <AdminSystem section={section} />}
        </section>
      </div>
    </div>
  )
}
