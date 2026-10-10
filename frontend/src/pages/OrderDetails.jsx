import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ChevronLeft, MapPin, Phone, CreditCard, Store, Package,
  Upload, CheckCircle2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Loader from '../components/common/Loader'
import ImageUploader from '../components/common/ImageUploader'
import OrderTimeline from '../components/marketplace/OrderTimeline'
import { marketplaceAPI, paymentAPI } from '../services/api'
import { orderFromResponse, unwrapOne } from '../utils/marketplaceMapper'
import { useAuthContext } from '../context/AuthContext'
import {
  orderStatusColor,
  orderStatusLabel,
  paymentMethodLabel,
  paymentStatusColor,
  paymentStatusLabel,
} from '../utils/constants'
import { formatPKR, formatDateTime } from '../utils/format'
import { getApiErrorMessage } from '../utils/apiError'
import { ErrorState } from './Marketplace'

export default function OrderDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthContext()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [showProofForm, setShowProofForm] = useState(false)
  const [submittingProof, setSubmittingProof] = useState(false)
  const [proof, setProof] = useState({
    transactionReference: '',
    paidAmount: '',
    paymentProofUrl: '',
  })

  const load = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await marketplaceAPI.getOrderById(id)
      const raw = unwrapOne(res)

      if (!raw) throw new Error('empty')

      setOrder(orderFromResponse(raw))
    } catch (err) {
      setError(
        getApiErrorMessage(err, {
          404: 'Order not found.',
          403: "You don't have permission to view this order.",
          401: 'Please login to continue.',
        })
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleSubmitProof = async () => {
    if (!proof.transactionReference.trim()) {
      toast.error('Please enter the transaction / reference number')
      return
    }
    if (proof.paidAmount === '' || Number(proof.paidAmount) <= 0) {
      toast.error('Please enter the amount you transferred')
      return
    }

    setSubmittingProof(true)

    try {
      await paymentAPI.submitProof(order.id, {
        transactionReference: proof.transactionReference.trim(),
        paidAmount: Number(proof.paidAmount),
        paymentProofUrl: proof.paymentProofUrl || undefined,
        ...(order.payment?.account?.id
          ? { paymentAccountId: order.payment.account.id }
          : {}),
      })

      toast.success(
        'Payment details submitted. The seller will verify it shortly.'
      )
      setShowProofForm(false)
      setProof({
        transactionReference: '',
        paidAmount: '',
        paymentProofUrl: '',
      })
      await load()
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, {
          404: 'Order not found.',
          403: 'Only the buyer of this order can submit payment details.',
        })
      )
    } finally {
      setSubmittingProof(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader label="Loading order..." />
      </div>
    )
  }

  if (error || !order) {
    return <ErrorState message={error || 'Order not found.'} onRetry={load} />
  }

  const payment = order.payment
  const isBuyer =
    user?.id != null && String(user.id) === String(order.buyerId)
  const isManualMethod =
    payment && payment.method && payment.method !== 'CASH_ON_DELIVERY'

  const canSubmitProof =
    isBuyer &&
    isManualMethod &&
    ['PAYMENT_PENDING', 'PAYMENT_REJECTED'].includes(payment.status)

  const inputBase =
    'w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white'

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <button
        onClick={() => navigate('/marketplace/orders')}
        className="flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <ChevronLeft size={16} /> Back to My Orders
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {order.displayId}
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Placed on{' '}
            {formatDateTime(order.orderDateTime || order.orderDate)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${orderStatusColor[order.status] || 'bg-blue-50 text-blue-700 ring-blue-500/20'}`}
          >
            {orderStatusLabel[order.status] || order.status}
          </span>
          {order.paymentStatus && (
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${paymentStatusColor[order.paymentStatus] || 'bg-blue-50 text-blue-700 ring-blue-500/20'}`}
            >
              {paymentStatusLabel[order.paymentStatus] || order.paymentStatus}
            </span>
          )}
        </div>
      </div>

      {/* Progress */}
      <Card>
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
          Order Progress
        </h2>
        <OrderTimeline status={order.status} />
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Items */}
        <Card className="lg:col-span-2">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <Package size={15} /> Items
          </h2>

          {order.sellerName && (
            <p className="mb-3 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <Store size={11} /> Sold by {order.sellerName}
            </p>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] font-bold text-slate-400 dark:border-white/10">
                  <th className="py-2.5">Product</th>
                  <th className="py-2.5 text-center">Qty</th>
                  <th className="py-2.5 text-right">Price</th>
                  <th className="py-2.5 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((it) => (
                  <tr
                    key={it.productId}
                    className="border-b border-slate-100 last:border-0 dark:border-white/10"
                  >
                    <td className="py-3">
                      <button
                        onClick={() =>
                          navigate(`/marketplace/product/${it.productId}`)
                        }
                        className="text-left font-medium text-slate-700 transition-colors hover:text-green-600 dark:text-slate-200"
                      >
                        {it.title}
                      </button>
                    </td>
                    <td className="py-3 text-center text-slate-600 dark:text-slate-300">
                      {it.qty} {it.unit}
                    </td>
                    <td className="py-3 text-right text-slate-600 dark:text-slate-300">
                      {formatPKR(it.price)}
                    </td>
                    <td className="py-3 text-right font-semibold text-slate-900 dark:text-white">
                      {formatPKR(it.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ml-auto mt-4 max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Subtotal</span>
              <span className="text-slate-800 dark:text-white">
                {formatPKR(order.subtotal)}
              </span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>
                  Discount
                  {order.couponCode ? ` (${order.couponCode})` : ''}
                </span>
                <span className="text-green-600">
                  − {formatPKR(order.discountAmount)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Delivery</span>
              <span className="text-slate-800 dark:text-white">
                {formatPKR(order.deliveryCharge)}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold dark:border-white/10">
              <span className="text-slate-900 dark:text-white">Total</span>
              <span className="text-green-600 dark:text-green-400">
                {formatPKR(order.totalAmount)}
              </span>
            </div>
          </div>
        </Card>

        {/* Right column */}
        <div className="space-y-5">
          <Card>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <MapPin size={15} /> Delivery
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {order.deliveryAddress || '—'}
            </p>
            {(order.city || order.province) && (
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {[order.city, order.province].filter(Boolean).join(', ')}
              </p>
            )}
            {order.phone && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                <Phone size={13} /> {order.phone}
              </p>
            )}
          </Card>

          <Card>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <CreditCard size={15} /> Payment
            </h2>

            <p className="text-sm text-slate-600 dark:text-slate-300">
              {paymentMethodLabel[order.paymentMethod] ||
                order.paymentMethod ||
                'Cash on Delivery'}
            </p>

            {order.paymentStatus && (
              <span
                className={`mt-2 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${paymentStatusColor[order.paymentStatus] || 'bg-blue-50 text-blue-700 ring-blue-500/20'}`}
              >
                {paymentStatusLabel[order.paymentStatus] ||
                  order.paymentStatus}
              </span>
            )}

            {payment?.account && (
              <div className="mt-3 space-y-0.5 border-t border-slate-100 pt-3 text-xs text-slate-600 dark:border-white/10 dark:text-slate-300">
                <p className="font-semibold text-slate-700 dark:text-slate-200">
                  Pay into
                </p>
                <p>{payment.account.accountTitle}</p>
                <p className="font-mono">{payment.account.accountNumber}</p>
                {payment.account.bankName && <p>{payment.account.bankName}</p>}
                {payment.account.iban && (
                  <p className="font-mono">IBAN: {payment.account.iban}</p>
                )}
              </div>
            )}

            {payment?.transactionReference && (
              <div className="mt-3 space-y-0.5 border-t border-slate-100 pt-3 text-xs text-slate-600 dark:border-white/10 dark:text-slate-300">
                <p className="font-semibold text-slate-700 dark:text-slate-200">
                  Your transfer
                </p>
                <p>
                  TID:{' '}
                  <span className="font-mono">
                    {payment.transactionReference}
                  </span>
                </p>
                {payment.paidAmount != null && (
                  <p>Amount: {formatPKR(payment.paidAmount)}</p>
                )}
                {payment.paymentProofUrl && (
                  <a
                    href={payment.paymentProofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block font-medium text-green-600 hover:underline dark:text-green-400"
                  >
                    View receipt
                  </a>
                )}
              </div>
            )}

            {payment?.rejectionReason && (
              <p className="mt-2 text-xs font-medium text-red-500">
                Rejected: {payment.rejectionReason}
              </p>
            )}

            {payment?.status === 'PAYMENT_VERIFIED' ||
            payment?.status === 'PAYMENT_PAID' ? (
              <p className="mt-3 flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400">
                <CheckCircle2 size={13} /> Payment confirmed by the seller
              </p>
            ) : null}

            {canSubmitProof && !showProofForm && (
              <Button
                size="sm"
                variant="primary"
                fullWidth
                className="mt-3"
                onClick={() => setShowProofForm(true)}
              >
                <Upload size={14} />
                {payment.status === 'PAYMENT_REJECTED'
                  ? 'Resubmit payment'
                  : 'I have paid'}
              </Button>
            )}

            {canSubmitProof && showProofForm && (
              <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 dark:border-white/10">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Transaction / TID <span className="text-red-500">*</span>
                  </label>
                  <input
                    className={inputBase}
                    value={proof.transactionReference}
                    onChange={(e) =>
                      setProof({
                        ...proof,
                        transactionReference: e.target.value,
                      })
                    }
                    disabled={submittingProof}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Amount Paid <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    className={inputBase}
                    value={proof.paidAmount}
                    onChange={(e) =>
                      setProof({ ...proof, paidAmount: e.target.value })
                    }
                    disabled={submittingProof}
                  />
                </div>

                <ImageUploader
                  label="Receipt / Screenshot"
                  folder="payments"
                  value={proof.paymentProofUrl}
                  onChange={(url) =>
                    setProof({ ...proof, paymentProofUrl: url })
                  }
                  disabled={submittingProof}
                />

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setShowProofForm(false)}
                    disabled={submittingProof}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    loading={submittingProof}
                    onClick={handleSubmitProof}
                  >
                    Submit
                  </Button>
                </div>
              </div>
            )}
          </Card>

          <Button
            variant="outline"
            fullWidth
            onClick={() => navigate('/marketplace')}
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    </div>
  )
}