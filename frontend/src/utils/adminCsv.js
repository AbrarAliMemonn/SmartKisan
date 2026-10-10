// Client-side CSV download used by the admin screens.
export function downloadCsv(rows, baseName, { exclude = ['password'] } = {}) {
  if (!rows || rows.length === 0) return false
  const columns = Object.keys(rows[0]).filter(
    (k) => typeof rows[0][k] !== 'object' && !exclude.includes(k)
  )
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = [columns.join(','), ...rows.map((r) => columns.map((c) => esc(r[c])).join(','))].join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `smartkisan-${baseName}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  return true
}
