import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ClipboardList, Store, ChevronRight } from 'lucide-react'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import { SkeletonCard } from '../components/common/Skeleton'
import { marketplaceAPI } from '../services/api'
import { orderFromResponse, unwrapList } from '../utils/marketplaceMapper'
import {
  orderStatusColor,
  orderStatusLabel,
  paymentMethodLabel,
  paymentStatusColor,
  paymentStatusLabel,
} from '../utils/constants'
import { formatPKR, formatDate } from '../utils/format'
import { getApiErrorMessage } from '../utils/apiError'
import { EmptyState, ErrorState } from './Marketplace'

const TABS = [
  { id: 'ALL', label: 'All', matches: null },
  { id: 'PENDING', label: 'Pending', matches: ['PENDING'] },
  { id: 'ACTIVE', label: 'In Progress', matches: ['CONFIRMED', 'PROCESSING', 'READY_TO_SHIP'] },
  { id: 'SHIPPED', label: 'Shipped', matches: ['SHIPPED', 'OUT_FOR_DELIVERY'] },
  { id: 'DELIVERED', label: 'Delivered', matches: ['DELIVERED'] },
  {
    id: 'CLOSED',
    label: 'Cancelled / Returned',
    matches: ['CANCELLED', 'RETURN_REQUESTED', 'RETURNED', 'REFUNDED'],
  },
]

export default function MyOrders() {
  const navigate = useNavigate()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('ALL')

  const load = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await marketplaceAPI.getMyOrders()
      const list = unwrapList(res).map(orderFromResponse)

      setOrders(
        list.sort(
          (a, b) =>
            new Date(b.orderDateTime || b.orderDate) -
            new Date(a.orderDateTime || a.orderDate)
        )
      )
    } catch (err) {
      setError(getApiErrorMessage(err, { 404: 'No orders found.' }))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const active = TABS.find((t) => t.id === tab)
    if (!active?.matches) return orders
    return orders.filter((o) => active.matches.includes(o.status))
  }, [orders, tab])

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate('/marketplace')}
        className="flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <ChevronLeft size={16} /> Back to Marketplace
      </button>

      <h1 className="page-title">
        My Orders
      </h1>

      <div className="-mb-px flex items-center gap-1 overflow-x-auto border-b border-slate-200 dark:border-white/10">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === t.id
                ? 'border-green-600 text-green-700 dark:border-green-500 dark:text-green-400'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="You haven't placed any orders yet."
          subtitle="Your purchases will show up here once you place an order."
          action={
            <Button
              variant="primary"
              className="mt-4"
              onClick={() => navigate('/marketplace')}
            >
              Browse Products
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No orders here"
          subtitle="There are no orders in this category right now."
          action={
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setTab('ALL')}
            >
              Show all orders
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <Card key={order.id}>
              <button
                className="flex w-full flex-col justify-between gap-3 text-left transition-opacity hover:opacity-90 sm:flex-row sm:items-center"
                onClick={() => navigate(`/marketplace/orders/${order.id}`)}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {order.displayId}
                    </p>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${orderStatusColor[order.status] || 'bg-blue-50 text-blue-700 ring-blue-500/20'}`}
                    >
                      {orderStatusLabel[order.status] || order.status}
                    </span>
                    {order.paymentStatus && (
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${paymentStatusColor[order.paymentStatus] || 'bg-blue-50 text-blue-700 ring-blue-500/20'}`}
                      >
                        {paymentStatusLabel[order.paymentStatus] ||
                          order.paymentStatus}
                      </span>
                    )}
                  </div>

                  <p className="mt-1.5 flex flex-wrap items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <Store size={11} />
                    <span className="font-medium">
                      {order.sellerName || 'Seller'}
                    </span>
                    <span className="text-slate-300">•</span>
                    {formatDate(order.orderDateTime || order.orderDate)}
                    {order.paymentMethod && (
                      <>
                        <span className="text-slate-300">•</span>
                        {paymentMethodLabel[order.paymentMethod] ||
                          order.paymentMethod}
                      </>
                    )}
                  </p>

                  <ul className="mt-2 space-y-0.5 text-sm text-slate-600 dark:text-slate-300">
                    {order.items.map((it) => (
                      <li key={it.productId} className="truncate">
                        {it.qty} {it.unit} × {it.title}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {formatPKR(order.totalAmount)}
                  </p>
                  <ChevronRight size={18} className="text-slate-300" />
                </div>
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}