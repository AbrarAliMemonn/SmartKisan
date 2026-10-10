import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Edit2, Eye, Plus, Search, Trash2, Users } from 'lucide-react'
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
  const { user: me, adminAddUser, adminUpdateUser, adminDeleteUser } = useAuthContext()

  const [query, setQuery] = useState('')
  const [role, setRole] = useState('ALL')
  const [type, setType] = useState('ALL')
  const [page, setPage] = useState(1)

  const [form, setForm] = useState(null) // { mode: 'add' | 'edit', id?, data }
  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

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

  const actions = (u) => (
    <div className="flex items-center justify-end gap-0.5">
      <button onClick={() => navigate(`/admin/users/${u.id}`)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white" aria-label={`View ${u.name}`} title="View profile">
        <Eye className="h-4 w-4" />
      </button>
      <button onClick={() => openEdit(u)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white" aria-label={`Edit ${u.name}`} title="Edit">
        <Edit2 className="h-4 w-4" />
      </button>
      <button
        onClick={() => setToDelete(u)}
        disabled={me?.id === u.id}
        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:pointer-events-none disabled:opacity-30 dark:hover:bg-red-500/10 dark:hover:text-red-400"
        aria-label={`Delete ${u.name}`}
        title={me?.id === u.id ? 'You cannot delete your own account' : 'Delete'}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )

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
                    <th className="px-5 py-3">Phone</th>
                    <th className="px-5 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                  {rows.map((u) => (
                    <tr key={u.id} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-white/5">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name} />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900 dark:text-white">{u.name}{me?.id === u.id && <span className="ml-2 text-xs font-medium text-slate-400">(you)</span>}</p>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3"><Badge tone={(u.role || '').toUpperCase() === 'ADMIN' ? 'red' : 'slate'}>{(u.role || 'USER').toLowerCase()}</Badge></td>
                      <td className="px-5 py-3"><Badge tone={typeTone(u.userType)}>{(u.userType || 'user').toLowerCase()}</Badge></td>
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
                        <Badge tone={(u.role || '').toUpperCase() === 'ADMIN' ? 'red' : 'slate'}>{(u.role || 'USER').toLowerCase()}</Badge>
                        <Badge tone={typeTone(u.userType)}>{(u.userType || 'user').toLowerCase()}</Badge>
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
    </div>
  )
}
