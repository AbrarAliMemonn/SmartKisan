import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Edit2, Eye, Plus, Search, Trash2, Users, ShieldAlert, Ban, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../common/Button'
import Card from '../common/Card'
import { useAuthContext } from '../../context/AuthContext'
import { downloadCsv } from '../../utils/adminCsv'
import { Avatar, Badge, ConfirmModal, EmptyState, Modal, RowsSkeleton, SectionHeader } from './AdminUi'

const PAGE_SIZE = 10

const typeTone = (t) => ((t || '').toUpperCase() === 'ADMIN' ? 'red' : 'green')

const field = 'input-field'

export default function AdminUsers({ users, loading }) {
  const navigate = useNavigate()
  const { user: me, adminAddUser, adminUpdateUser, adminDeleteUser, adminSuspendUser, adminUnsuspendUser, adminApproveService } = useAuthContext()

  const [query, setQuery] = useState('')
  const [role, setRole] = useState('ALL')
  const [type, setType] = useState('ALL')
  const [page, setPage] = useState(1)

  const [form, setForm] = useState(null) // { mode: 'add' | 'edit', id?, data }
  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [approvingId, setApprovingId] = useState(null)

  // Account Suspension state
  const [suspendModalUser, setSuspendModalUser] = useState(null)
  const [suspendForm, setSuspendForm] = useState({ type: 'TEMPORARY', days: 7, reason: '' })
  const [suspending, setSuspending] = useState(false)
  const [toUnsuspend, setToUnsuspend] = useState(null)
  const [unsuspending, setUnsuspending] = useState(false)

  const handleApproveService = async (uId, serviceKey) => {
    setApprovingId(`${uId}:${serviceKey}`)
    try {
      await adminApproveService(uId, serviceKey)
    } finally {
      setApprovingId(null)
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users.filter((u) => {
      if (role !== 'ALL' && (u.role || '').toUpperCase() !== role) return false
      if (type !== 'ALL' && (u.userType || '').toUpperCase() !== type) return false
      if (!q) return true
      return [u.name, u.email, u.phone, u.location].some((v) => (v || '').toString().toLowerCase().includes(q))
    })
  }, [users, query, role, type])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const hasFilters = query || role !== 'ALL' || type !== 'ALL'

  const reset = () => {
    setQuery('')
    setRole('ALL')
    setType('ALL')
    setPage(1)
  }

  const openAdd = () => setForm({ mode: 'add', data: { role: 'USER', userType: 'FARMER' } })
  const openEdit = (u) => setForm({ mode: 'edit', id: u.id, data: { ...u, password: '' } })
  const set = (k) => (e) => setForm((f) => ({ ...f, data: { ...f.data, [k]: e.target.value } }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form.data }
      if (form.mode === 'edit' && !payload.password) delete payload.password
      const result = form.mode === 'add' ? await adminAddUser(payload) : await adminUpdateUser(form.id, payload)
      if (result?.success) setForm(null)
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await adminDeleteUser(toDelete.id)
      setToDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  const exportUsers = () => {
    if (!downloadCsv(filtered, 'users')) toast.error('There is nothing to export yet')
    else toast.success(`Exported ${filtered.length} users`)
  }

  const handleOpenSuspend = (u) => {
    setSuspendModalUser(u)
    setSuspendForm({ type: 'TEMPORARY', days: 7, reason: '' })
  }

  const handleSuspendSubmit = async (e) => {
    e.preventDefault()
    if (!suspendModalUser) return
    setSuspending(true)
    try {
      const payload = {
        type: suspendForm.type,
        days: suspendForm.type === 'TEMPORARY' ? Number(suspendForm.days || 7) : undefined,
        reason: suspendForm.reason.trim() || 'Violated terms of service',
      }
      const res = await adminSuspendUser(suspendModalUser.id, payload)
      if (res?.success) {
        setSuspendModalUser(null)
      }
    } finally {
      setSuspending(false)
    }
  }

  const confirmUnsuspend = async () => {
    if (!toUnsuspend) return
    setUnsuspending(true)
    try {
      const res = await adminUnsuspendUser(toUnsuspend.id)
      if (res?.success) {
        setToUnsuspend(null)
      }
    } finally {
      setUnsuspending(false)
    }
  }

  const isMe = (u) => {
    if (!me) return false
    if (me.id && u.id && String(me.id) === String(u.id)) return true
    if (me.email && u.email && me.email.toLowerCase() === u.email.toLowerCase()) return true
    return false
  }

  const actions = (u) => {
    const isSelf = isMe(u)
    return (
      <div className="flex items-center justify-end gap-1.5">
        <button
          onClick={() => navigate(`/admin/users/${u.id}`)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
          title="View full user details"
        >
          <Eye className="h-3.5 w-3.5 text-slate-500" />
          <span className="hidden xl:inline">View</span>
        </button>

        <button
          onClick={() => openEdit(u)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
          title="Edit user details"
        >
          <Edit2 className="h-3.5 w-3.5 text-slate-500" />
          <span className="hidden xl:inline">Edit</span>
        </button>

        {/* Suspend / Reactivate action */}
        {!isSelf && (
          u.suspended ? (
            <button
              onClick={() => setToUnsuspend(u)}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 shadow-sm hover:bg-emerald-100 transition-colors dark:border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-300 cursor-pointer"
              title="Click to reactivate this account"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              <span>Reactivate</span>
            </button>
          ) : (
            <button
              onClick={() => handleOpenSuspend(u)}
              className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-800 shadow-sm hover:bg-amber-100 transition-colors dark:border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-300 cursor-pointer"
              title="Suspend this user (temporary or permanent)"
            >
              <Ban className="h-3.5 w-3.5" />
              <span>Suspend</span>
            </button>
          )
        )}

        {/* Delete user action */}
        <button
          onClick={() => setToDelete(u)}
          disabled={isSelf}
          className="inline-flex items-center gap-1 rounded-lg border border-red-300 bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-700 shadow-sm hover:bg-red-100 transition-colors disabled:pointer-events-none disabled:opacity-30 dark:border-red-500/30 dark:bg-red-500/20 dark:text-red-400 cursor-pointer"
          title={isSelf ? 'You cannot delete your own account' : `Delete ${u.name}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete</span>
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Users"
        subtitle={loading ? 'Loading…' : `${filtered.length} of ${users.length} accounts`}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={exportUsers} leftIcon={<Download className="h-4 w-4" />}>Export CSV</Button>
            <Button size="sm" onClick={openAdd} leftIcon={<Plus className="h-4 w-4" />}>Add user</Button>
          </>
        }
      />

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1) }}
            placeholder="Search name, email, phone or location"
            aria-label="Search users"
            className={`${field} pl-10`}
          />
        </div>
        <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1) }} aria-label="Filter by role" className={`${field} sm:w-40`}>
          <option value="ALL">All roles</option>
          <option value="ADMIN">Admin</option>
          <option value="USER">User</option>
        </select>
        <select value={type} onChange={(e) => { setType(e.target.value); setPage(1) }} aria-label="Filter by type" className={`${field} sm:w-40`}>
          <option value="ALL">All types</option>
          <option value="FARMER">Farmer</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      <Card noPadding className="overflow-hidden">
        {loading ? (
          <RowsSkeleton rows={6} />
        ) : users.length === 0 ? (
          <EmptyState icon={Users} title="No users yet" text="Accounts will appear here as people sign up." action={<Button size="sm" onClick={openAdd}>Add the first user</Button>} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Search} title="No users match your filters" action={hasFilters && <Button variant="secondary" size="sm" onClick={reset}>Clear filters</Button>} />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-3">User</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Requested Services &amp; Approvals</th>
                    <th className="px-5 py-3">Phone</th>
                    <th className="px-5 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                  {rows.map((u) => (
                    <tr key={u.id} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-white/5">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name} />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900 dark:text-white">
                              {u.name}
                              {me?.id === u.id && <span className="ml-2 text-xs font-medium text-slate-400">(you)</span>}
                              {u.suspended && (
                                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-500/20 dark:text-red-400" title={u.suspensionReason || 'Account suspended'}>
                                  <Ban size={10} /> Suspended ({u.suspensionType === 'TEMPORARY' ? 'Temp' : 'Perm'})
                                </span>
                              )}
                            </p>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3"><Badge tone={(u.role || '').toUpperCase() === 'ADMIN' ? 'red' : 'slate'}>{(u.role || 'USER').toLowerCase()}</Badge></td>
                      <td className="px-5 py-3"><Badge tone={typeTone(u.userType)}>{(u.userType || 'user').toLowerCase()}</Badge></td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* IoT */}
                          {(u.requestedServices?.includes('IOT_FARMING') || u.serviceApprovals?.IOT_FARMING) && (
                            u.serviceApprovals?.IOT_FARMING === 'APPROVED' ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-300">
                                📡 IoT (Approved)
                              </span>
                            ) : (
                              <button
                                onClick={() => handleApproveService(u.id, 'IOT_FARMING')}
                                disabled={approvingId === `${u.id}:IOT_FARMING`}
                                className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-600/20 hover:bg-amber-100 transition-colors dark:bg-amber-500/20 dark:text-amber-300"
                                title="Click to grant IoT sensor access"
                              >
                                <span>📡 Approve IoT</span>
                              </button>
                            )
                          )}

                          {/* Seller */}
                          {(u.isSeller || u.requestedServices?.includes('BECOME_SELLER') || u.serviceApprovals?.BECOME_SELLER) && (
                            (u.isSeller || u.serviceApprovals?.BECOME_SELLER === 'APPROVED') ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700 ring-1 ring-green-600/20 dark:bg-green-500/15 dark:text-green-300">
                                🏪 Seller (Approved)
                              </span>
                            ) : (
                              <button
                                onClick={() => handleApproveService(u.id, 'BECOME_SELLER')}
                                disabled={approvingId === `${u.id}:BECOME_SELLER`}
                                className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-600/20 hover:bg-amber-100 transition-colors dark:bg-amber-500/20 dark:text-amber-300"
                                title="Click to approve seller store"
                              >
                                <span>🏪 Approve Seller</span>
                              </button>
                            )
                          )}

                          {/* AI */}
                          {u.requestedServices?.includes('AI_ADVISORY') && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-600/20 dark:bg-indigo-500/15 dark:text-indigo-300">
                              🤖 AI Doctor
                            </span>
                          )}

                          {/* Buyer */}
                          {(!u.requestedServices || u.requestedServices.includes('BUY_PRODUCTS')) && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                              🛒 Buyer
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{u.phone || <span className="text-slate-400">—</span>}</td>
                      <td className="px-5 py-3">{actions(u)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="divide-y divide-slate-100 md:hidden dark:divide-white/10">
              {rows.map((u) => (
                <li key={u.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar name={u.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900 dark:text-white">{u.name}</p>
                      <p className="truncate text-sm text-slate-500 dark:text-slate-400">{u.email}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {u.suspended && (
                          <Badge tone="red">
                            Suspended ({u.suspensionType === 'TEMPORARY' ? 'Temp' : 'Perm'})
                          </Badge>
                        )}
                        <Badge tone={(u.role || '').toUpperCase() === 'ADMIN' ? 'red' : 'slate'}>{(u.role || 'USER').toLowerCase()}</Badge>
                        <Badge tone={typeTone(u.userType)}>{(u.userType || 'user').toLowerCase()}</Badge>
                        {u.isSeller && <Badge tone="green">seller</Badge>}
                        {u.requestedServices?.includes('IOT_FARMING') && (
                          u.serviceApprovals?.IOT_FARMING === 'APPROVED' ? (
                            <Badge tone="green">IoT</Badge>
                          ) : (
                            <button
                              onClick={() => handleApproveService(u.id, 'IOT_FARMING')}
                              className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-800"
                            >
                              Approve IoT
                            </button>
                          )
                        )}
                      </div>
                    </div>
                    {actions(u)}
                  </div>
                </li>
              ))}
            </ul>

            {filtered.length > PAGE_SIZE && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 dark:border-white/10">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Showing {(current - 1) * PAGE_SIZE + 1}–{Math.min(current * PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" disabled={current === 1} onClick={() => setPage(current - 1)}>Previous</Button>
                  <Button variant="secondary" size="sm" disabled={current === pages} onClick={() => setPage(current + 1)}>Next</Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <Modal open={Boolean(form)} onClose={() => !saving && setForm(null)} title={form?.mode === 'add' ? 'Add user' : 'Edit user'}>
        {form && (
          <form onSubmit={submit} className="space-y-4 px-5 py-5">
            <div>
              <label htmlFor="u-name" className="mb-1.5 block text-[13px] font-semibold text-slate-700 dark:text-slate-200">Full name <span className="text-red-500">*</span></label>
              <input id="u-name" required value={form.data.name || ''} onChange={set('name')} className={field} />
            </div>
            <div>
              <label htmlFor="u-email" className="mb-1.5 block text-[13px] font-semibold text-slate-700 dark:text-slate-200">Email <span className="text-red-500">*</span></label>
              <input id="u-email" type="email" required value={form.data.email || ''} onChange={set('email')} className={field} />
            </div>
            <div>
              <label htmlFor="u-pass" className="mb-1.5 block text-[13px] font-semibold text-slate-700 dark:text-slate-200">Password {form.mode === 'add' && <span className="text-red-500">*</span>}</label>
              <input id="u-pass" type="password" required={form.mode === 'add'} value={form.data.password || ''} onChange={set('password')} placeholder={form.mode === 'edit' ? 'Leave blank to keep the current password' : undefined} autoComplete="new-password" className={field} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="u-role" className="mb-1.5 block text-[13px] font-semibold text-slate-700 dark:text-slate-200">Security role</label>
                <select id="u-role" value={form.data.role || 'USER'} onChange={set('role')} className={field}>
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div>
                <label htmlFor="u-type" className="mb-1.5 block text-[13px] font-semibold text-slate-700 dark:text-slate-200">User type</label>
                <select id="u-type" value={form.data.userType || 'FARMER'} onChange={set('userType')} className={field}>
                  <option value="FARMER">Farmer</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="u-phone" className="mb-1.5 block text-[13px] font-semibold text-slate-700 dark:text-slate-200">Phone</label>
                <input id="u-phone" value={form.data.phone || ''} onChange={set('phone')} className={field} />
              </div>
              <div>
                <label htmlFor="u-loc" className="mb-1.5 block text-[13px] font-semibold text-slate-700 dark:text-slate-200">Location</label>
                <input id="u-loc" value={form.data.location || ''} onChange={set('location')} className={field} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setForm(null)} disabled={saving}>Cancel</Button>
              <Button type="submit" loading={saving}>{form.mode === 'add' ? 'Create user' : 'Save changes'}</Button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmModal
        open={Boolean(toDelete)}
        title="Delete user"
        message={toDelete ? `Delete ${toDelete.name} (${toDelete.email})? This removes the account and cannot be undone.` : ''}
        confirmLabel="Delete user"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />

      {/* Suspend User Modal */}
      <Modal
        open={Boolean(suspendModalUser)}
        title={`Suspend Account: ${suspendModalUser?.name || ''}`}
        onClose={() => setSuspendModalUser(null)}
      >
        {suspendModalUser && (
          <form onSubmit={handleSuspendSubmit} className="space-y-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 text-xs text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
              <p className="font-semibold">Account Suspension Policy</p>
              <p className="mt-1">
                Suspending this user will prevent them from logging in or conducting transactions. You can lift this suspension at any time.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-slate-700 dark:text-slate-200">
                Suspension Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-xs font-semibold transition-all ${
                  suspendForm.type === 'TEMPORARY'
                    ? 'border-amber-500 bg-amber-50/40 text-amber-900 ring-2 ring-amber-500/20 dark:border-amber-400 dark:bg-amber-500/10 dark:text-amber-200'
                    : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'
                }`}>
                  <input
                    type="radio"
                    name="suspendType"
                    value="TEMPORARY"
                    checked={suspendForm.type === 'TEMPORARY'}
                    onChange={(e) => setSuspendForm({ ...suspendForm, type: e.target.value })}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500"
                  />
                  <span>⏱️ Temporary</span>
                </label>

                <label className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-xs font-semibold transition-all ${
                  suspendForm.type === 'PERMANENT'
                    ? 'border-red-500 bg-red-50/40 text-red-900 ring-2 ring-red-500/20 dark:border-red-400 dark:bg-red-500/10 dark:text-red-200'
                    : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'
                }`}>
                  <input
                    type="radio"
                    name="suspendType"
                    value="PERMANENT"
                    checked={suspendForm.type === 'PERMANENT'}
                    onChange={(e) => setSuspendForm({ ...suspendForm, type: e.target.value })}
                    className="h-4 w-4 text-red-600 focus:ring-red-500"
                  />
                  <span>🚫 Permanent</span>
                </label>
              </div>
            </div>

            {suspendForm.type === 'TEMPORARY' && (
              <div>
                <label htmlFor="suspend-days" className="mb-1.5 block text-[13px] font-semibold text-slate-700 dark:text-slate-200">
                  Suspension Duration
                </label>
                <select
                  id="suspend-days"
                  value={suspendForm.days}
                  onChange={(e) => setSuspendForm({ ...suspendForm, days: Number(e.target.value) })}
                  className={field}
                >
                  <option value={3}>3 Days</option>
                  <option value={7}>7 Days (1 Week)</option>
                  <option value={14}>14 Days (2 Weeks)</option>
                  <option value={30}>30 Days (1 Month)</option>
                  <option value={90}>90 Days (3 Months)</option>
                </select>
              </div>
            )}

            <div>
              <label htmlFor="suspend-reason" className="mb-1.5 block text-[13px] font-semibold text-slate-700 dark:text-slate-200">
                Reason for Suspension <span className="text-red-500">*</span>
              </label>
              <textarea
                id="suspend-reason"
                required
                rows={3}
                value={suspendForm.reason}
                onChange={(e) => setSuspendForm({ ...suspendForm, reason: e.target.value })}
                placeholder="Explain the reason for this account suspension (shown to user upon login)..."
                className={`${field} resize-none`}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setSuspendModalUser(null)} disabled={suspending}>
                Cancel
              </Button>
              <Button type="submit" variant="danger" loading={suspending}>
                Confirm Suspension
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Unsuspend Confirm Modal */}
      <ConfirmModal
        open={Boolean(toUnsuspend)}
        tone="primary"
        title="Reactivate Account"
        message={toUnsuspend ? `Reactivate account for ${toUnsuspend.name} (${toUnsuspend.email})? The user will immediately be able to log in and use the platform.` : ''}
        confirmLabel="Reactivate Account"
        loading={unsuspending}
        onConfirm={confirmUnsuspend}
        onClose={() => setToUnsuspend(null)}
      />
    </div>
  )
}
