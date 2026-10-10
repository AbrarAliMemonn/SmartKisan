import { useState } from 'react'
import { Edit2, Info, Plus, Sprout, Trash2, Wifi } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../common/Button'
import Card from '../common/Card'
import { Badge, ConfirmModal, EmptyState, Modal, SectionHeader } from './AdminUi'

const SENSORS = [
  { id: 1, name: 'Field Sensor A1', type: 'Soil Moisture', location: 'North Field', status: 'active', battery: '85%' },
  { id: 2, name: 'Weather Station', type: 'Weather', location: 'Central', status: 'active', battery: '92%' },
  { id: 3, name: 'Irrigation Controller', type: 'Irrigation', location: 'South Field', status: 'maintenance', battery: '67%' },
]
const CROPS = [
  { id: 1, name: 'Rice', season: 'Kharif', duration: '120 days', waterReq: 'High' },
  { id: 2, name: 'Wheat', season: 'Rabi', duration: '100 days', waterReq: 'Medium' },
  { id: 3, name: 'Maize', season: 'Kharif', duration: '90 days', waterReq: 'Medium' },
]

const CONFIG = {
  sensors: {
    title: 'Sensors',
    subtitle: 'Registered field devices.',
    icon: Wifi,
    noun: 'sensor',
    columns: [['name', 'Name'], ['type', 'Type'], ['location', 'Location'], ['status', 'Status'], ['battery', 'Battery']],
    fields: [
      { k: 'name', label: 'Sensor name' },
      { k: 'type', label: 'Type', options: ['Soil Moisture', 'Weather', 'Irrigation', 'Temperature'] },
      { k: 'location', label: 'Location' },
      { k: 'status', label: 'Status', options: ['active', 'inactive', 'maintenance'] },
    ],
  },
  crops: {
    title: 'Crop database',
    subtitle: 'Crops shown to farmers in the Crop Guide.',
    icon: Sprout,
    noun: 'crop',
    columns: [['name', 'Crop'], ['season', 'Season'], ['duration', 'Duration'], ['waterReq', 'Water need']],
    fields: [
      { k: 'name', label: 'Crop name' },
      { k: 'season', label: 'Season', options: ['Kharif', 'Rabi', 'Zaid'] },
      { k: 'duration', label: 'Duration' },
      { k: 'waterReq', label: 'Water requirement' },
    ],
  },
}

function DemoNotice() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-200">
      <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p>Demo data. Changes here are kept in the browser only and reset on refresh. This section gets a real API in the next phase.</p>
    </div>
  )
}

function ManageList({ kind }) {
  const cfg = CONFIG[kind]
  const [items, setItems] = useState(kind === 'sensors' ? SENSORS : CROPS)
  const [form, setForm] = useState(null)
  const [toDelete, setToDelete] = useState(null)

  const save = (e) => {
    e.preventDefault()
    if (form.id) setItems((p) => p.map((i) => (i.id === form.id ? form : i)))
    else setItems((p) => [...p, { ...form, id: Math.max(0, ...p.map((i) => i.id)) + 1 }])
    toast.success(form.id ? 'Changes saved' : `${cfg.noun[0].toUpperCase()}${cfg.noun.slice(1)} added`)
    setForm(null)
  }

  return (
    <div className="space-y-5">
      <SectionHeader title={cfg.title} subtitle={cfg.subtitle} actions={<Button size="sm" onClick={() => setForm({})} leftIcon={<Plus className="h-4 w-4" />}>Add {cfg.noun}</Button>} />
      <DemoNotice />
      <Card noPadding className="overflow-hidden">
        {items.length === 0 ? (
          <EmptyState icon={cfg.icon} title={`No ${cfg.noun}s yet`} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                <tr>
                  {cfg.columns.map(([k, l]) => <th key={k} className="px-5 py-3">{l}</th>)}
                  <th className="px-5 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                {items.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50/70 dark:hover:bg-white/5">
                    {cfg.columns.map(([k]) => (
                      <td key={k} className="whitespace-nowrap px-5 py-3 text-slate-700 dark:text-slate-200">
                        {k === 'status' ? <Badge tone={i[k] === 'active' ? 'green' : i[k] === 'maintenance' ? 'amber' : 'slate'}>{i[k]}</Badge> : i[k] ?? '—'}
                      </td>
                    ))}
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-0.5">
                        <button onClick={() => setForm(i)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white" aria-label={`Edit ${i.name}`}><Edit2 className="h-4 w-4" /></button>
                        <button onClick={() => setToDelete(i)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400" aria-label={`Delete ${i.name}`}><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={Boolean(form)} onClose={() => setForm(null)} title={`${form?.id ? 'Edit' : 'Add'} ${cfg.noun}`}>
        {form && (
          <form onSubmit={save} className="space-y-4 px-5 py-5">
            {cfg.fields.map((f) => (
              <div key={f.k}>
                <label htmlFor={`f-${f.k}`} className="mb-1.5 block text-[13px] font-semibold text-slate-700 dark:text-slate-200">{f.label}</label>
                {f.options ? (
                  <select id={`f-${f.k}`} required value={form[f.k] || ''} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })} className="input-field">
                    <option value="">Select…</option>
                    {f.options.map((o) => <option key={o}>{o}</option>)}
                  </select>
                ) : (
                  <input id={`f-${f.k}`} required value={form[f.k] || ''} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })} className="input-field" />
                )}
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setForm(null)}>Cancel</Button>
              <Button type="submit">{form.id ? 'Save changes' : `Add ${cfg.noun}`}</Button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmModal
        open={Boolean(toDelete)}
        title={`Delete ${cfg.noun}`}
        message={toDelete ? `Delete ${toDelete.name}? This cannot be undone.` : ''}
        confirmLabel="Delete"
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          setItems((p) => p.filter((i) => i.id !== toDelete.id))
          toast.success('Deleted')
          setToDelete(null)
        }}
      />
    </div>
  )
}

function SettingRow({ label, text, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">{label}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{text}</p>
      </div>
      {children}
    </div>
  )
}

function SettingToggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-green-600' : 'bg-slate-200 dark:bg-white/10'}`}
    >
      <span className={`absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

function SettingsPanel() {
  const [s, setS] = useState({ email: true, backup: false, retention: '90 days' })
  return (
    <div className="space-y-5">
      <SectionHeader title="System settings" subtitle="Platform-wide preferences." />
      <DemoNotice />
      <Card className="divide-y divide-slate-100 !py-2 dark:divide-white/10">
        <SettingRow label="Email notifications" text="Receive email alerts for system events">
          <SettingToggle checked={s.email} onChange={() => setS({ ...s, email: !s.email })} label="Email notifications" />
        </SettingRow>
        <SettingRow label="Automatic backup" text="Back up data every day">
          <SettingToggle checked={s.backup} onChange={() => setS({ ...s, backup: !s.backup })} label="Automatic backup" />
        </SettingRow>
        <SettingRow label="Data retention" text="Keep historical data for">
          <select value={s.retention} onChange={(e) => setS({ ...s, retention: e.target.value })} aria-label="Data retention" className="input-field !w-auto">
            <option>30 days</option>
            <option>90 days</option>
            <option>1 year</option>
          </select>
        </SettingRow>
      </Card>
    </div>
  )
}

export default function AdminSystem({ section }) {
  if (section === 'settings') return <SettingsPanel />
  return <ManageList key={section} kind={section} />
}
