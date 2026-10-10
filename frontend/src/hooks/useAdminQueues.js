import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { marketplaceAdminAPI as api } from '../services/api'

const LOADERS = {
  sellers: () => api.getPendingSellers(),
  products: () => api.getPendingProducts(),
  payments: () => api.getPendingPayments(),
}

const ACTIONS = {
  sellers: {
    approve: (id) => api.approveSeller(id),
    reject: (id, reason) => api.rejectSeller(id, reason),
  },
  products: {
    approve: (id) => api.approveProduct(id),
    reject: (id, reason) => api.rejectProduct(id, reason),
  },
  payments: {
    approve: (id) => api.approvePayment(id),
    reject: (id, reason) => api.rejectPayment(id, reason),
  },
}

const unwrap = (res) => {
  const d = res.data?.data ?? res.data ?? []
  return Array.isArray(d) ? d : d.content ?? []
}

const errorText = (err, fallback) =>
  err.response?.data?.message || err.response?.data?.error || err.message || fallback

// A payment row is identified by its order id.
export const queueItemId = (key, item) =>
  key === 'payments' ? item.orderId ?? item.order?.id ?? item.id : item.id

const empty = { items: [], loading: true, error: null }

/** Pending seller / product / payment queues plus approve and reject actions. */
export default function useAdminQueues() {
  const [queues, setQueues] = useState({ sellers: empty, products: empty, payments: empty })
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(async (key, { silent = false } = {}) => {
    if (!silent) setQueues((q) => ({ ...q, [key]: { ...q[key], loading: true, error: null } }))
    try {
      const res = await LOADERS[key]()
      setQueues((q) => ({ ...q, [key]: { items: unwrap(res), loading: false, error: null } }))
    } catch (err) {
      setQueues((q) => ({
        ...q,
        [key]: { items: [], loading: false, error: errorText(err, 'Could not load this queue') },
      }))
    }
  }, [])

  useEffect(() => {
    Object.keys(LOADERS).forEach((key) => load(key, { silent: true }))
  }, [load])

  const act = useCallback(async (key, item, action, reason) => {
    const id = queueItemId(key, item)
    setBusyId(`${key}:${id}`)
    try {
      const res = await ACTIONS[key][action](id, reason)
      toast.success(res.data?.message || (action === 'approve' ? 'Approved' : 'Rejected'))
      setQueues((q) => ({
        ...q,
        [key]: { ...q[key], items: q[key].items.filter((i) => queueItemId(key, i) !== id) },
      }))
      return true
    } catch (err) {
      toast.error(errorText(err, 'Action failed'))
      return false
    } finally {
      setBusyId(null)
    }
  }, [])

  const counts = {
    sellers: queues.sellers.items.length,
    products: queues.products.items.length,
    payments: queues.payments.items.length,
  }

  return { queues, counts, busyId, load, act }
}
