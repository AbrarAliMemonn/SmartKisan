import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft, MapPin, CreditCard, ClipboardCheck, ShoppingCart, Store, Loader2, Info,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import ImageUploader from '../components/common/ImageUploader'
import useStore from '../store/useStore'
import { useAuthContext } from '../context/AuthContext'
import { marketplaceAPI, paymentAccountAPI } from '../services/api'
import {
  cartGroupToOrderRequest,
  paymentAccountFromResponse,
  sellerFromResponse,
  unwrapList,
  unwrapOne,
} from '../utils/marketplaceMapper'
import { paymentMethods } from '../utils/constants'
import { formatPKR } from '../utils/format'
import { getApiErrorMessage } from '../utils/apiError'
import { EmptyState } from './Marketplace'

const STEPS = ['Delivery', 'Payment', 'Review']

export default function Checkout() {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const { cartItems, removeFromCart } = useStore()

  const [step, setStep] = useState(0)
  const [placing, setPlacing] = useState(false)
  const [placeError, setPlaceError] = useState(null)

  const [paymentMethod, setPaymentMethod] = useState('CASH_ON_DELIVERY')

  const [sellerAccounts, setSellerAccounts] = useState({})
  const [selectedAccountId, setSelectedAccountId] = useState('')

  const [proof, setProof] = useState({
    transactionReference: '',
    paidAmount: '',
    paymentProofUrl: '',
  })

  const [buyer, setBuyer] = useState({
    name: user?.name || user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || user?.location || '',
    province: user?.province || '',
  })

  useEffect(() => {
    setBuyer((prev) => ({
      name: prev.name || user?.name || user?.fullName || '',
      email: prev.email || user?.email || '',
      phone: prev.phone || user?.phone || '',
      address: prev.address || user?.address || '',
      city: prev.city || user?.city || user?.location || '',
      province: prev.province || user?.province || '',
    }))
  }, [user])

  const subtotal = cartItems.reduce((sum, c) => sum + c.price * c.qty, 0)
  const itemCount = cartItems.reduce((s, i) => s + i.qty, 0)

  const groupedBySeller = useMemo(
    () =>
      Object.entries(
        cartItems.reduce((acc, item) => {
          const key = item.sellerId ?? 'unknown'
          acc[key] = acc[key] || { sellerName: item.sellerName, items: [] }
          acc[key].items.push(item)
          return acc
        }, {})
      ),
    [cartItems]
  )

  const selectedMethod = paymentMethods.find((m) => m.id === paymentMethod)
  const isManual = !!selectedMethod?.manual

  useEffect(() => {
    if (!isManual) return

    const missing = groupedBySeller
      .map(([id]) => id)
      .filter((id) => id !== 'unknown' && sellerAccounts[id] === undefined)

    if (!missing.length) return

    let cancelled = false
    setSellerAccounts((prev) => ({
      ...prev,
      ...Object.fromEntries(
        missing.map((id) => [id, { loading: true, accounts: [] }])
      ),
    }))

    Promise.all(
      missing.map(async (sellerProfileId) => {
        try {
          const profileRes = await marketplaceAPI.getSellerProfile(sellerProfileId)
          const profile = sellerFromResponse(unwrapOne(profileRes))

          if (!profile?.userId)
            return [sellerProfileId, { loading: false, accounts: [] }]

          const accRes = await paymentAccountAPI.getForSeller(profile.userId)
          const accounts = unwrapList(accRes)
            .map(paymentAccountFromResponse)
            .filter((a) => a.active)

          return [sellerProfileId, { loading: false, accounts }]
        } catch {
          return [sellerProfileId, { loading: false, accounts: [] }]
        }
      })
    ).then((entries) => {
      if (cancelled) return
      setSellerAccounts((prev) => ({
        ...prev,
        ...Object.fromEntries(entries),
      }))
    })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMethod, groupedBySeller])

  useEffect(() => {
    setSelectedAccountId('')
  }, [paymentMethod])

  if (!user) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Please login to continue."
        subtitle="You need to be signed in before placing an order."
        action={
          <Button variant="primary" className="mt-4" onClick={() => navigate('/login')}>
            Login
          </Button>
        }
      />
    )
  }

  if (cartItems.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Nothing to check out"
        subtitle="Your cart is empty."
        action={
          <Button variant="primary" className="mt-4" onClick={() => navigate('/marketplace')}>
            Browse Products
          </Button>
        }
      />
    )
  }

  const deliveryAddress = [buyer.address, buyer.city, buyer.province]
    .filter(Boolean)
    .join(', ')

  const matchingAccounts = groupedBySeller.flatMap(([sellerId, group]) => {
    const entry = sellerAccounts[sellerId]
    if (!entry || entry.loading) return []
    return entry.accounts
      .filter((a) => a.type === selectedMethod?.accountType)
      .map((a) => ({ ...a, sellerName: group.sellerName, sellerId }))
  })

  const accountsLoading = groupedBySeller.some(
    ([id]) => sellerAccounts[id]?.loading
  )

  const validateBuyer = () => {
    const missing =
      (!buyer.name.trim() && 'your full name') ||
      (!buyer.phone.trim() && 'a contact phone number') ||
      (!buyer.address.trim() && 'a delivery address') ||
      (!buyer.city.trim() && 'your city')

    if (missing) {
      toast.error(`Please enter ${missing}`)
      return false
    }
    return true
  }

  const handlePlaceOrder = async () => {
    const unknownSeller = groupedBySeller.some(([id]) => id === 'unknown')
    if (unknownSeller) {
      toast.error(
        'One of your cart items is missing its seller. Please remove and re-add it.'
      )
      return
    }

    setPlacing(true)
    setPlaceError(null)

    try {
      const created = []

      for (const [sellerIdRaw, group] of groupedBySeller) {
        const accountForSeller = matchingAccounts.find(
          (a) =>
            String(a.id) === String(selectedAccountId) &&
            a.sellerId === sellerIdRaw
        )

        const payload = cartGroupToOrderRequest(sellerIdRaw, group.items, {
          deliveryAddress,
          buyerName: buyer.name,
          phone: buyer.phone,
          city: buyer.city,
          province: buyer.province,
          paymentMethod,
          ...(isManual && accountForSeller
            ? { paymentAccountId: accountForSeller.id }
            : {}),
          ...(isManual && proof.transactionReference
            ? {
                transactionReference: proof.transactionReference,
                paidAmount:
                  proof.paidAmount === '' ? undefined : proof.paidAmount,
                paymentProofUrl: proof.paymentProofUrl || undefined,
              }
            : {}),
        })

        const res = await marketplaceAPI.createOrder(payload)
        created.push(unwrapOne(res))

        group.items.forEach((it) => removeFromCart(it.productId))
      }

      const first = created[0]

      toast.success(
        created.length > 1
          ? `${created.length} orders placed successfully!`
          : 'Order placed successfully!'
      )

      navigate(
        first?.id
          ? `/marketplace/orders/${first.id}`
          : '/marketplace/orders'
      )
    } catch (err) {
      const message = getApiErrorMessage(err, {
        401: 'Please login to continue.',
        403: "You don't have permission to perform this action.",
        404: 'Product or seller not found.',
        409: 'One of these products is no longer available in the requested quantity.',
      })

      setPlaceError(message)
      toast.error(message)
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <button
        onClick={() => navigate('/marketplace/cart')}
        className="flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <ChevronLeft size={16} /> Back to Cart
      </button>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 items-center last:flex-none">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                i < step
                  ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-md shadow-green-600/25'
                  : i === step
                    ? 'bg-green-600 text-white shadow-md shadow-green-600/25 ring-4 ring-green-500/20'
                    : 'bg-slate-100 text-slate-400 dark:bg-white/5'
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`ml-2 text-xs font-semibold ${
                i <= step
                  ? 'text-slate-800 dark:text-white'
                  : 'text-slate-400'
              }`}
            >
              {s}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-3 h-1 flex-1 rounded-full ${
                  i < step
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                    : 'bg-slate-200 dark:bg-white/10'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* Step 0: Delivery */}
          {step === 0 && (
            <Card>
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400">
                  <MapPin size={16} />
                </div>
                Delivery Information
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Full Name" required value={buyer.name} onChange={(v) => setBuyer({ ...buyer, name: v })} />
                <Field label="Email" type="email" value={buyer.email} onChange={(v) => setBuyer({ ...buyer, email: v })} />
                <Field label="Phone" type="tel" required value={buyer.phone} onChange={(v) => setBuyer({ ...buyer, phone: v })} />
                <Field label="City" required value={buyer.city} onChange={(v) => setBuyer({ ...buyer, city: v })} />
                <Field label="Province" value={buyer.province} onChange={(v) => setBuyer({ ...buyer, province: v })} />
                <Field label="Delivery Address" required className="sm:col-span-2" value={buyer.address} onChange={(v) => setBuyer({ ...buyer, address: v })} />
              </div>

              <Button
                variant="primary"
                className="mt-5"
                onClick={() => validateBuyer() && setStep(1)}
              >
                Continue to Payment
              </Button>
            </Card>
          )}

          {/* Step 1: Payment */}
          {step === 1 && (
            <Card>
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400">
                  <CreditCard size={16} />
                </div>
                Payment Method
              </h2>

              <div className="space-y-2.5">
                {paymentMethods.map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all ${
                      paymentMethod === opt.id
                        ? 'border-green-500 bg-green-50/50 ring-4 ring-green-500/10 dark:bg-green-500/5'
                        : 'border-slate-200 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500/30"
                      checked={paymentMethod === opt.id}
                      onChange={() => setPaymentMethod(opt.id)}
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">
                        <span className="mr-1.5">{opt.icon}</span>
                        {opt.name}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {opt.hint}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              {isManual && (
                <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Where to send the money
                  </p>

                  {accountsLoading ? (
                    <p className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Loader2 size={13} className="animate-spin" /> Loading
                      seller accounts…
                    </p>
                  ) : matchingAccounts.length === 0 ? (
                    <p className="flex items-start gap-1.5 text-xs text-slate-500">
                      <Info size={13} className="mt-0.5 shrink-0" />
                      This seller hasn&apos;t registered a {selectedMethod.name}{' '}
                      account yet. You can still place the order — they&apos;ll
                      share payment details after confirming it, and you can
                      submit the transaction ID from the order page.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {matchingAccounts.map((acc) => (
                        <label
                          key={acc.id}
                          className={`flex cursor-pointer items-start gap-3 rounded-lg border bg-white p-3 transition-all dark:bg-white/5 ${
                            String(selectedAccountId) === String(acc.id)
                              ? 'border-green-500 ring-4 ring-green-500/10'
                              : 'border-slate-200 dark:border-white/10'
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentAccount"
                            className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500/30"
                            checked={String(selectedAccountId) === String(acc.id)}
                            onChange={() => setSelectedAccountId(acc.id)}
                          />
                          <div className="text-xs text-slate-600 dark:text-slate-300">
                            <p className="flex items-center gap-1 font-semibold text-slate-800 dark:text-white">
                              <Store size={11} /> {acc.sellerName || 'Seller'}
                            </p>
                            <p className="mt-0.5">{acc.accountTitle}</p>
                            <p className="font-mono">{acc.accountNumber}</p>
                            {acc.bankName && <p>{acc.bankName}</p>}
                            {acc.iban && (
                              <p className="font-mono">IBAN: {acc.iban}</p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-3 dark:border-white/10">
                    <p className="mb-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                      Already transferred? Add proof (optional)
                    </p>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Field
                        label="Transaction / TID"
                        value={proof.transactionReference}
                        onChange={(v) =>
                          setProof({ ...proof, transactionReference: v })
                        }
                      />
                      <Field
                        label="Amount Paid"
                        type="number"
                        value={proof.paidAmount}
                        onChange={(v) =>
                          setProof({ ...proof, paidAmount: v })
                        }
                      />
                    </div>

                    <div className="mt-3">
                      <ImageUploader
                        label="Receipt / Screenshot"
                        folder="payments"
                        value={proof.paymentProofUrl}
                        onChange={(url) =>
                          setProof({ ...proof, paymentProofUrl: url })
                        }
                      />
                    </div>

                    <p className="mt-2 text-[11px] text-slate-400">
                      You can also do this later from the order page. SmartKisan
                      never collects card details and does not process payments.
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-5 flex gap-3">
                <Button variant="secondary" onClick={() => setStep(0)}>
                  Back
                </Button>
                <Button variant="primary" onClick={() => setStep(2)}>
                  Continue to Review
                </Button>
              </div>
            </Card>
          )}

          {/* Step 2: Review */}
          {step === 2 && (
            <Card>
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400">
                  <ClipboardCheck size={16} />
                </div>
                Review Your Order
              </h2>

              <div className="mb-4 rounded-xl bg-slate-50 p-4 text-sm dark:bg-white/5">
                <p className="mb-1 text-[10px] font-bold text-slate-500">
                  Deliver to
                </p>
                <p className="font-semibold text-slate-800 dark:text-white">
                  {buyer.name} · {buyer.phone}
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  {deliveryAddress}
                </p>
                <p className="mt-3 mb-1 text-[10px] font-bold text-slate-500">
                  Payment
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  {selectedMethod?.name}
                </p>
              </div>

              <div className="overflow-x-auto">
                {groupedBySeller.map(([sellerId, group]) => (
                  <div key={sellerId} className="mb-3 last:mb-0">
                    <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <Store size={11} /> {group.sellerName || 'Seller'}
                    </p>
                    <table className="w-full text-sm">
                      <tbody>
                        {group.items.map((it) => (
                          <tr
                            key={it.productId}
                            className="border-b border-slate-100 last:border-0 dark:border-white/10"
                          >
                            <td className="py-2 text-slate-700 dark:text-slate-200">
                              {it.title}
                            </td>
                            <td className="w-16 py-2 text-center text-slate-600 dark:text-slate-300">
                              {it.qty}
                            </td>
                            <td className="w-28 py-2 text-right text-slate-600 dark:text-slate-300">
                              {formatPKR(it.price)}
                            </td>
                            <td className="w-28 py-2 text-right font-semibold text-slate-800 dark:text-white">
                              {formatPKR(it.price * it.qty)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>

              {placeError && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">
                  {placeError}
                </p>
              )}

              <div className="mt-5 flex gap-3">
                <Button variant="secondary" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  loading={placing}
                  onClick={handlePlaceOrder}
                >
                  Place Order
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Summary */}
        <Card className="h-fit lg:sticky lg:top-24">
          <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">
            Order Summary
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Items ({itemCount})</span>
              <span className="font-semibold text-slate-800 dark:text-white">
                {formatPKR(subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Delivery</span>
              <span className="text-xs font-medium">Calculated at checkout</span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-3 text-base font-bold text-slate-900 dark:border-white/10 dark:text-white">
              <span>Estimated Total</span>
              <span className="text-green-600 dark:text-green-400">
                {formatPKR(subtotal)}
              </span>
            </div>
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
            The server recalculates every price, applies delivery charges and
            any coupon, then returns the final total on the order page.
          </p>
        </Card>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  className = '',
  type = 'text',
  required = false,
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-[13px] font-semibold text-slate-700 dark:text-slate-200">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  )
}