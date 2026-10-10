import { useMemo } from 'react'
import {
  Users, Sprout, Store, Package, Wallet, ChevronRight, CheckCircle2, UserPlus, BarChart3,
} from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Card from '../common/Card'
import { Avatar, Badge, EmptyState, SectionHeader } from './AdminUi'

const createdOf = (u) => u.createdAt ?? u.created_at ?? u.registeredAt ?? u.joinDate ?? null
const dayKey = (d) => new Date(d).toLocaleDateString('en-CA')

function lastDays(n) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (n - 1 - i))
    return d
  })
}

function Kpi({ icon: Icon, label, value, hint, tone = 'green' }) {
  const tones = {
    green: 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  }
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 tabular-nums dark:text-white">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
    </Card>
  )
}

export default function AdminOverview({ users, usersLoading, counts, queuesLoading, onNavigate }) {
  const farmers = users.filter((u) => (u.userType || '').toUpperCase() === 'FARMER').length
  const admins = users.filter((u) => (u.userType || u.role || '').toUpperCase() === 'ADMIN').length
  const pendingTotal = counts.sellers + counts.products + counts.payments

  const { chart, hasDates, newThisWeek, recent } = useMemo(() => {
    const days = lastDays(7)
    const buckets = Object.fromEntries(days.map((d) => [dayKey(d), 0]))
    let dated = 0
    users.forEach((u) => {
      const c = createdOf(u)
      if (!c) return
      dated += 1
      const k = dayKey(c)
      if (k in buckets) buckets[k] += 1
    })
    const rows = days.map((d) => ({
      day: d.toLocaleDateString('en-GB', { weekday: 'short' }),
      full: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      signups: buckets[dayKey(d)],
    }))
    const sorted = users
      .filter((u) => createdOf(u))
      .sort((a, b) => new Date(createdOf(b)) - new Date(createdOf(a)))
    return {
      chart: rows,
      hasDates: dated > 0,
      newThisWeek: rows.reduce((s, r) => s + r.signups, 0),
      recent: (sorted.length ? sorted : [...users].reverse()).slice(0, 5),
    }
  }, [users])

  const attention = [
    { id: 'sellers', icon: Store, label: 'Seller requests', text: 'applications waiting for review', n: counts.sellers },
    { id: 'products', icon: Package, label: 'Product approvals', text: 'listings waiting to go live', n: counts.products },
    { id: 'payments', icon: Wallet, label: 'Payment proofs', text: 'transfers waiting to be verified', n: counts.payments },
  ]

  const typeRows = [
    { label: 'Farmers', n: farmers, bar: 'bg-green-600' },
    { label: 'Admins', n: admins, bar: 'bg-slate-500' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <Kpi icon={Users} label="Total users" value={usersLoading ? '–' : users.length} hint={hasDates ? `${newThisWeek} joined in the last 7 days` : 'All registered accounts'} />
        <Kpi icon={Sprout} label="Farmers" value={usersLoading ? '–' : farmers} hint={`${admins} admin${admins === 1 ? '' : 's'}`} tone="blue" />
        <Kpi icon={Store} label="Pending sellers" value={queuesLoading ? '–' : counts.sellers} hint="Awaiting approval" tone="amber" />
        <Kpi icon={Package} label="Pending products" value={queuesLoading ? '–' : counts.products} hint="Awaiting approval" tone="amber" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card noPadding className="xl:col-span-2">
          <div className="border-b border-slate-100 p-5 dark:border-white/10">
            <SectionHeader
              title="Needs your attention"
              subtitle={pendingTotal > 0 ? `${pendingTotal} item${pendingTotal === 1 ? '' : 's'} waiting for a decision` : 'Nothing is waiting for you'}
            />
          </div>
          {pendingTotal === 0 && !queuesLoading ? (
            <EmptyState icon={CheckCircle2} title="You're all caught up" text="New seller applications, product listings and payment proofs will show up here." />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-white/10">
              {attention.map((a) => (
                <li key={a.id}>
                  <button
                    onClick={() => onNavigate(a.id)}
                    className="group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300">
                      <a.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-900 dark:text-white">{a.label}</span>
                      <span className="block truncate text-sm text-slate-500 dark:text-slate-400">
                        {queuesLoading ? 'Checking…' : a.n === 0 ? 'Nothing pending' : `${a.n} ${a.text}`}
                      </span>
                    </span>
                    {!queuesLoading && a.n > 0 && <Badge tone="amber">{a.n}</Badge>}
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card noPadding>
          <div className="border-b border-slate-100 p-5 dark:border-white/10">
            <SectionHeader title="Users by type" />
          </div>
          <div className="space-y-4 p-5">
            {typeRows.map((r) => (
              <div key={r.label}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-200">{r.label}</span>
                  <span className="tabular-nums text-slate-500 dark:text-slate-400">{r.n}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                  <div className={`h-full rounded-full ${r.bar}`} style={{ width: users.length ? `${(r.n / users.length) * 100}%` : '0%' }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card noPadding className="xl:col-span-2">
          <div className="border-b border-slate-100 p-5 dark:border-white/10">
            <SectionHeader title="New users, last 7 days" subtitle={hasDates ? `${newThisWeek} sign-ups this week` : undefined} />
          </div>
          {hasDates ? (
            <div className="h-64 p-4 pr-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart} margin={{ top: 8, right: 0, left: -24, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="currentColor" className="text-slate-200 dark:text-white/10" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#8f9d93' }} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#8f9d93' }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(52,135,88,0.08)' }}
                    contentStyle={{ borderRadius: 12, border: '1px solid var(--toast-border)', background: 'var(--toast-bg)', color: 'var(--toast-fg)', fontSize: 13 }}
                    labelFormatter={(_, p) => p?.[0]?.payload?.full}
                    formatter={(v) => [v, 'Sign-ups']}
                  />
                  <Bar dataKey="signups" fill="#348758" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon={BarChart3} title="No sign-up dates available" text="The users API does not return a created date yet, so this chart cannot be drawn." />
          )}
        </Card>

        <Card noPadding>
          <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-white/10">
            <SectionHeader title={hasDates ? 'Recent sign-ups' : 'Latest users'} />
            <button onClick={() => onNavigate('users')} className="text-sm font-semibold text-green-700 hover:underline dark:text-green-400">View all</button>
          </div>
          {recent.length === 0 ? (
            <EmptyState icon={UserPlus} title="No users yet" />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-white/10">
              {recent.map((u) => (
                <li key={u.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar name={u.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{u.name}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                  </div>
                  <Badge tone={(u.userType || '').toUpperCase() === 'ADMIN' ? 'red' : 'green'}>
                    {(u.userType || 'USER').toLowerCase()}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
