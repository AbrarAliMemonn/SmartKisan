import { useState } from 'react'
import { CheckCircle2, Clock, ExternalLink, Package, RefreshCw, Store, Wallet, XCircle } from 'lucide-react'
import Button from '../common/Button'
import Card from '../common/Card'
import { queueItemId } from '../../hooks/useAdminQueues'
import { Badge, ConfirmModal, EmptyState, ErrorState, ReasonModal, RowsSkeleton, SectionHeader } from './AdminUi'

const META = {
  sellers: {
    title: 'Seller requests',
    subtitle: 'Applications from people who want to sell on the marketplace.',
    icon: Store,
    empty: ['No pending seller requests', 'New applications will appear here.'],
    noun: 'seller',
    rejectText: 'The applicant will see this reason and can fix the issue and reapply.',
  },
  products: {
    title: 'Product approvals',
    subtitle: 'New or edited listings that must be approved before they go live.',
    icon: Package,
    empty: ['No products waiting for approval', 'New listings will appear here.'],
    noun: 'product',
    rejectText: 'The seller will see this reason and can edit the listing.',
  },
  payments: {
    title: 'Payment verification',
    subtitle: 'Bank transfer proofs submitted by buyers. Check the amount and reference before approving.',
    icon: Wallet,
    empty: ['No payments to verify', 'Submitted transfer proofs will appear here.'],
    noun: 'payment',
    rejectText: 'The buyer will see this reason and can submit a new proof.',
  },
}

const money = (n) => (n == null || n === '' ? '—' : `Rs. ${Number(n).toLocaleString('en-PK')}`)
const safeUrl = (u) => (typeof u === 'string' && /^(https?:\/\/|\/)/.test(u) ? u : null)

function Meta({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-0.5 truncate text-sm font-medium text-slate-800 dark:text-slate-100">{children}</dd>
    </div>
  )
}

function SellerBody({ s }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold text-slate-900 dark:text-white">{s.shopName}</h3>
        <Badge tone="amber" icon={Clock}>Pending</Badge>
      </div>
      <dl className="mt-3 grid gap-x-6 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
        <Meta label="Seller">{s.sellerName || '—'}</Meta>
        <Meta label="Type">{s.sellerType?.replaceAll('_', ' ') || '—'}</Meta>
        <Meta label="Location">{s.location || '—'}</Meta>
        <Meta label="Email">{s.email || '—'}</Meta>
        <Meta label="Phone">{s.phone || '—'}</Meta>
      </dl>
      {s.description && <p className="mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300">{s.description}</p>}
    </>
  )
}

function ProductBody({ p }) {
  const img = safeUrl(p.imageUrl || p.images?.[0])
  return (
    <div className="flex gap-4">
      <div className="hidden h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 sm:flex dark:bg-white/5">
        {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : <Package className="h-7 w-7 text-slate-400" aria-hidden="true" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-slate-900 dark:text-white">{p.title}</h3>
          <Badge tone="amber" icon={Clock}>Pending</Badge>
        </div>
        <dl className="mt-3 grid gap-x-6 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <Meta label="Seller">{p.sellerShopName || '—'}</Meta>
          <Meta label="Category">{p.category || '—'}</Meta>
          <Meta label="Price">{money(p.price)}{p.unit ? ` / ${p.unit}` : ''}</Meta>
          <Meta label="Stock">{p.stock ?? '—'}</Meta>
        </dl>
        {p.description && <p className="mt-3 line-clamp-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">{p.description}</p>}
      </div>
    </div>
  )
}

function PaymentBody({ p }) {
  const proof = safeUrl(p.paymentProofUrl || p.proofUrl)
  const expected = p.totalAmount ?? p.orderTotal ?? p.expectedAmount ?? p.order?.totalAmount
  const paid = p.paidAmount ?? p.amount
  const mismatch = expected != null && paid != null && Number(expected) !== Number(paid)
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold text-slate-900 dark:text-white">Order {p.orderNumber || p.order?.orderNumber || `#${queueItemId('payments', p)}`}</h3>
        <Badge tone="amber" icon={Clock}>Awaiting verification</Badge>
        {mismatch && <Badge tone="red">Amount differs</Badge>}
      </div>
      <dl className="mt-3 grid gap-x-6 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <Meta label="Buyer">{p.buyerName || p.order?.buyerName || '—'}</Meta>
        <Meta label="Order total">{money(expected)}</Meta>
        <Meta label="Amount paid">{money(paid)}</Meta>
        <Meta label="Reference">{p.transactionReference || '—'}</Meta>
      </dl>
      {proof ? (
        <a href={proof} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-green-700 hover:underline dark:text-green-400">
          View payment proof <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      ) : (
        <p className="mt-3 text-sm text-slate-400">No proof image attached.</p>
      )}
    </>
  )
}

export default function AdminModeration({ kind, queue, busyId, onRefresh, onAct }) {
  const meta = META[kind]
  const [rejecting, setRejecting] = useState(null)
  const [approving, setApproving] = useState(null)

  const busy = (item) => busyId === `${kind}:${queueItemId(kind, item)}`
  const anyBusy = Boolean(busyId)

  const approve = (item) => (kind === 'payments' ? setApproving(item) : onAct(kind, item, 'approve'))

  return (
    <div className="space-y-5">
      <SectionHeader
        title={meta.title}
        subtitle={meta.subtitle}
        actions={
          <Button variant="secondary" size="sm" onClick={onRefresh} disabled={queue.loading} leftIcon={<RefreshCw className={`h-4 w-4 ${queue.loading ? 'animate-spin' : ''}`} />}>
            Refresh
          </Button>
        }
      />

      {queue.loading ? (
        <Card noPadding><RowsSkeleton rows={3} height="h-28" /></Card>
      ) : queue.error ? (
        <Card noPadding><ErrorState message={queue.error} onRetry={onRefresh} /></Card>
      ) : queue.items.length === 0 ? (
        <Card noPadding><EmptyState icon={meta.icon} title={meta.empty[0]} text={meta.empty[1]} /></Card>
      ) : (
        <ul className="space-y-4">
          {queue.items.map((item) => (
            <li key={queueItemId(kind, item)}>
              <Card>
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    {kind === 'sellers' && <SellerBody s={item} />}
                    {kind === 'products' && <ProductBody p={item} />}
                    {kind === 'payments' && <PaymentBody p={item} />}
                  </div>
                  <div className="flex shrink-0 gap-2 lg:flex-col">
                    <Button size="sm" className="flex-1" loading={busy(item)} disabled={anyBusy && !busy(item)} onClick={() => approve(item)} leftIcon={<CheckCircle2 className="h-4 w-4" />}>
                      Approve
                    </Button>
                    <Button variant="secondary" size="sm" className="flex-1" disabled={anyBusy} onClick={() => setRejecting(item)} leftIcon={<XCircle className="h-4 w-4" />}>
                      Reject
                    </Button>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <ReasonModal
        open={Boolean(rejecting)}
        title={`Reject ${meta.noun}`}
        message={meta.rejectText}
        loading={Boolean(rejecting) && busy(rejecting)}
        onClose={() => setRejecting(null)}
        onSubmit={async (reason) => {
          const ok = await onAct(kind, rejecting, 'reject', reason)
          if (ok) setRejecting(null)
          return ok
        }}
      />

      <ConfirmModal
        open={Boolean(approving)}
        tone="primary"
        title="Approve payment"
        message="Confirm that the money has reached your account and the amount and reference match. The order will move to processing."
        confirmLabel="Approve payment"
        loading={Boolean(approving) && busy(approving)}
        onClose={() => setApproving(null)}
        onConfirm={async () => {
          const ok = await onAct(kind, approving, 'approve')
          if (ok) setApproving(null)
        }}
      />
    </div>
  )
}
