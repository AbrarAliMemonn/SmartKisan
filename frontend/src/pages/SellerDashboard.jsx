import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Package, ClipboardList, TrendingUp, Plus, Pencil, Trash2, Star, Store, Users,
  Clock, XCircle, ShieldAlert, ShieldCheck, RefreshCw, LayoutDashboard, CreditCard,
  Settings2, CheckCircle2, Truck, MapPin, Phone, Mail, Check, X, MessageCircle, Tag,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import { SkeletonCard } from '../components/common/Skeleton'
import ProductFormModal from '../components/marketplace/ProductFormModal'
import BecomeSellerModal from '../components/marketplace/BecomeSellerModal'
import OrderTimeline from '../components/marketplace/OrderTimeline'
import ProductChatModal from '../components/marketplace/ProductChatModal'
import { useAuthContext } from '../context/AuthContext'
import { marketplaceAPI, paymentAPI, paymentAccountAPI, chatAPI } from '../services/api'
import {
  productFromResponse, productToRequest, orderFromResponse,
  paymentAccountFromResponse, unwrapList, unwrapOne,
} from '../utils/marketplaceMapper'
import {
  sellerAssignableStatuses, orderStatusColor, orderStatusLabel,
  productStatusLabel, productStatusColor,
  paymentMethodLabel, paymentStatusColor, paymentStatusLabel, paymentAccountTypes,
} from '../utils/constants'
import { formatPKR, formatDate } from '../utils/format'
import { getApiErrorMessage } from '../utils/apiError'
import { EmptyState, ErrorState } from './Marketplace'

export default function SellerDashboard() {
  const navigate = useNavigate()
  const { user, isSeller, becomeSeller, fetchMySellerProfile } = useAuthContext()

  const [tab, setTab] = useState('dashboard')
  const [listings, setListings] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusChecked, setStatusChecked] = useState(false)

  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [showSellerModal, setShowSellerModal] = useState(false)
  const [expandedOrder, setExpandedOrder] = useState(null)

  const [accounts, setAccounts] = useState([])
  const [pendingPayments, setPendingPayments] = useState([])
  const [accountsLoading, setAccountsLoading] = useState(false)
  const [editingAccount, setEditingAccount] = useState(null)
  const [accountForm, setAccountForm] = useState(null)

  useEffect(() => {
    ;(async () => {
      await fetchMySellerProfile()
      setStatusChecked(true)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const load = async () => {
    setLoading(true)
    setError(null)

    try {
      const [listingsRes, ordersRes] = await Promise.all([
        marketplaceAPI.getMyListings(),
        marketplaceAPI.getSellerOrders(),
      ])

      setListings(unwrapList(listingsRes).map(productFromResponse))
      setOrders(unwrapList(ordersRes).map(orderFromResponse))
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const loadPayments = async () => {
    setAccountsLoading(true)

    try {
      const [accRes, pendRes] = await Promise.all([
        paymentAccountAPI.getMine(),
        paymentAPI.getSellerPending(),
      ])

      setAccounts(unwrapList(accRes).map(paymentAccountFromResponse))
      setPendingPayments(unwrapList(pendRes))
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setAccountsLoading(false)
    }
  }

  useEffect(() => {
    if (isSeller) load()
  }, [isSeller])

  const [conversations, setConversations] = useState([])
  const [conversationsLoading, setConversationsLoading] = useState(false)
  const [activeChatTarget, setActiveChatTarget] = useState(null)

  const loadConversations = async () => {
    setConversationsLoading(true)
    try {
      const res = await chatAPI.getConversations()
      const convs = res?.data?.data || res?.data || []
      setConversations(Array.isArray(convs) ? convs : [])
    } catch (err) {
      console.error('Failed to load conversations', err)
    } finally {
      setConversationsLoading(false)
    }
  }

  useEffect(() => {
    if (isSeller && tab === 'payments') loadPayments()
    if (isSeller && tab === 'messages') loadConversations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSeller, tab])

  const totalSales = useMemo(
    () => orders.filter((o) => o.status === 'DELIVERED').reduce((s, o) => s + o.totalAmount, 0),
    [orders]
  )
  const totalRevenue = useMemo(
    () => orders.filter((o) => o.status !== 'CANCELLED').reduce((s, o) => s + o.totalAmount, 0),
    [orders]
  )
  const pendingOrders = useMemo(() => orders.filter((o) => o.status === 'PENDING').length, [orders])
  const deliveredOrders = useMemo(
    () => orders.filter((o) => o.status === 'DELIVERED').length,
    [orders]
  )
  const uniqueCustomers = useMemo(() => new Set(orders.map((o) => o.buyerId)).size, [orders])
  const activeListings = useMemo(
    () => listings.filter((p) => p.status === 'APPROVED' && p.stock > 0).length,
    [listings]
  )
  const avgRating = useMemo(() => {
    const rated = listings.filter((p) => p.reviewsCount > 0)
    if (!rated.length) return null
    return rated.reduce((s, p) => s + p.rating, 0) / rated.length
  }, [listings])

  const handleBecomeSeller = async (data) => {
    const res = await becomeSeller(data)
    if (res.success) setShowSellerModal(false)
  }

  const handleSaveProduct = async (data) => {
    try {
      if (editingProduct) {
        const res = await marketplaceAPI.updateProduct(editingProduct.id, productToRequest(data))
        const updated = productFromResponse(unwrapOne(res))
        setListings((prev) => prev.map((p) => (p.id === editingProduct.id ? updated : p)))
        toast.success(res.data?.message || 'Listing updated')
      } else {
        const res = await marketplaceAPI.createProduct(productToRequest(data))
        const created = productFromResponse(unwrapOne(res))
        setListings((prev) => [created, ...prev])
        toast.success(res.data?.message || 'Product submitted for approval')
      }
      setShowProductModal(false)
      setEditingProduct(null)
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Remove this listing? This cannot be undone.')) return
    try {
      await marketplaceAPI.deleteProduct(id)
      setListings((prev) => prev.filter((p) => p.id !== id))
      toast.success('Listing removed')
    } catch (err) {
      toast.error(getApiErrorMessage(err, { 404: 'Product not found.' }))
    }
  }

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await marketplaceAPI.updateOrderStatus(orderId, status)
      toast.success(`Order marked as ${orderStatusLabel[status] || status}`)
      await load()
    } catch (err) {
      toast.error(getApiErrorMessage(err, { 404: 'Order not found.' }))
    }
  }

  const handleSaveAccount = async () => {
    if (!accountForm?.accountTitle?.trim() || !accountForm?.accountNumber?.trim()) {
      toast.error('Account title and number are required')
      return
    }

    try {
      const payload = {
        type: accountForm.type,
        accountTitle: accountForm.accountTitle.trim(),
        accountNumber: accountForm.accountNumber.trim(),
        bankName: accountForm.bankName?.trim() || undefined,
        iban: accountForm.iban?.trim() || undefined,
      }

      if (editingAccount) {
        await paymentAccountAPI.update(editingAccount.id, payload)
        toast.success('Payment account updated')
      } else {
        await paymentAccountAPI.create(payload)
        toast.success('Payment account added')
      }

      setAccountForm(null)
      setEditingAccount(null)
      await loadPayments()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  const handleDeactivateAccount = async (id) => {
    if (!window.confirm('Deactivate this account? Buyers will no longer see it at checkout.')) return
    try {
      await paymentAccountAPI.deactivate(id)
      toast.success('Payment account deactivated')
      await loadPayments()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  const handlePaymentDecision = async (orderId, approve) => {
    try {
      if (approve) {
        await paymentAPI.approve(orderId)
        toast.success('Payment approved')
      } else {
        const reason = window.prompt('Why are you rejecting this payment? (optional)') || ''
        await paymentAPI.reject(orderId, reason)
        toast.success('Payment rejected')
      }
      await Promise.all([loadPayments(), load()])
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  if (!statusChecked) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5">
          <RefreshCw size={24} className="animate-spin text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Checking your seller status…
        </p>
      </div>
    )
  }

  const sellerStatus = (user?.sellerProfile?.status || '').toUpperCase()

  if (!isSeller) {
    if (sellerStatus === 'PENDING') {
      return (
        <div className="mx-auto max-w-md py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-500/10">
            <Clock size={32} className="text-amber-500" />
          </div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Your seller application is pending review
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {user.sellerProfile.shopName
              ? `"${user.sellerProfile.shopName}" is`
              : 'Your application is'}{' '}
            waiting for an admin to approve it. You&apos;ll be able to list
            products as soon as it&apos;s approved.
          </p>
          <Button
            variant="secondary"
            className="mt-5"
            onClick={async () => {
              setStatusChecked(false)
              await fetchMySellerProfile()
              setStatusChecked(true)
            }}
          >
            <RefreshCw size={15} /> Check again
          </Button>
        </div>
      )
    }

    if (sellerStatus === 'REJECTED') {
      return (
        <div className="mx-auto max-w-md py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-500/10">
            <XCircle size={32} className="text-red-500" />
          </div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Your seller application wasn&apos;t approved
          </h2>
          {user.sellerProfile.moderationReason && (
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Reason: {user.sellerProfile.moderationReason}
            </p>
          )}
          <Button variant="primary" className="mt-5" onClick={() => setShowSellerModal(true)}>
            Apply again
          </Button>
          {showSellerModal && (
            <BecomeSellerModal onClose={() => setShowSellerModal(false)} onSubmit={handleBecomeSeller} />
          )}
        </div>
      )
    }

    if (sellerStatus === 'SUSPENDED') {
      return (
        <div className="mx-auto max-w-md py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-500/10">
            <ShieldAlert size={32} className="text-red-500" />
          </div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Your seller account is suspended
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {user.sellerProfile.moderationReason ||
              'Contact support to find out more about this suspension.'}
          </p>
        </div>
      )
    }

    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5">
          <Store size={32} className="text-slate-400" />
        </div>
        <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          You&apos;re not registered as a seller yet
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Set up a seller profile to start listing products on the marketplace.
        </p>
        <Button variant="primary" className="mt-5" onClick={() => setShowSellerModal(true)}>
          Become a Seller
        </Button>
        {showSellerModal && (
          <BecomeSellerModal onClose={() => setShowSellerModal(false)} onSubmit={handleBecomeSeller} />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            Seller Dashboard
            {user?.sellerProfile?.verified && (
              <span title="Verified seller">
                <ShieldCheck size={16} className="text-green-600 dark:text-green-400" />
              </span>
            )}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {user?.sellerProfile?.shopName || 'Your store'}
          </p>
        </div>

        {user?.sellerProfile?.id && (
          <button
            onClick={() => navigate(`/marketplace/seller/${user.sellerProfile.id}`)}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
          >
            View public storefront
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard icon={Package} tone="green" label="Total Products" value={listings.length} />
            <StatCard icon={CheckCircle2} tone="emerald" label="Active Products" value={activeListings} />
            <StatCard icon={ClipboardList} tone="blue" label="Total Orders" value={orders.length} />
            <StatCard icon={Clock} tone="amber" label="Pending Orders" value={pendingOrders} />
            <StatCard icon={Truck} tone="cyan" label="Delivered Orders" value={deliveredOrders} />
            <StatCard icon={TrendingUp} tone="emerald" label="Total Sales" value={formatPKR(totalSales)} />
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-white/10">
            <div className="-mb-px flex items-center gap-1 overflow-x-auto">
              <TabButton active={tab === 'dashboard'} onClick={() => setTab('dashboard')} icon={LayoutDashboard} label="Dashboard" />
              <TabButton active={tab === 'listings'} onClick={() => setTab('listings')} icon={Package} label="Products" />
              <TabButton active={tab === 'orders'} onClick={() => setTab('orders')} icon={ClipboardList} label="Orders" />
              <TabButton active={tab === 'messages'} onClick={() => setTab('messages')} icon={MessageCircle} label="Buyer Inquiries" />
              <TabButton active={tab === 'payments'} onClick={() => setTab('payments')} icon={CreditCard} label="Payment Details" />
              <TabButton active={tab === 'settings'} onClick={() => setTab('settings')} icon={Settings2} label="Store Settings" />
            </div>
            <Button
              size="sm"
              variant="primary"
              className="mb-2 shrink-0"
              onClick={() => {
                setEditingProduct(null)
                setShowProductModal(true)
              }}
            >
              <Plus size={16} /> Add Product
            </Button>
          </div>

          {/* Dashboard */}
          {tab === 'dashboard' && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
                  Recent Orders
                </h3>
                {orders.length === 0 ? (
                  <p className="text-sm text-slate-400">No orders yet.</p>
                ) : (
                  <div className="space-y-3">
                    {orders.slice(0, 5).map((o) => (
                      <div
                        key={o.id}
                        className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0 dark:border-white/5"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 dark:text-white">
                            {o.displayId}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {formatDate(o.orderDateTime || o.orderDate)}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-bold text-green-600 dark:text-green-400">
                            {formatPKR(o.totalAmount)}
                          </p>
                          <span
                            className={`mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${orderStatusColor[o.status] || 'bg-blue-50 text-blue-700 ring-blue-500/20'}`}
                          >
                            {orderStatusLabel[o.status] || o.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Button size="sm" variant="outline" className="mt-4" onClick={() => setTab('orders')}>
                  View all orders
                </Button>
              </Card>

              <Card>
                <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
                  Store Health
                </h3>
                <div className="space-y-2 text-sm">
                  <Row
                    label="Average rating"
                    value={avgRating != null ? `${avgRating.toFixed(1)} / 5` : '—'}
                  />
                  <Row
                    label={
                      <span className="flex items-center gap-1">
                        <Users size={12} /> Unique customers
                      </span>
                    }
                    value={uniqueCustomers}
                  />
                  <Row label="Revenue (excl. cancelled)" value={formatPKR(totalRevenue)} />
                  <Row
                    label="Out-of-stock listings"
                    value={listings.filter((p) => p.stock <= 0).length}
                  />
                  <Row
                    label="Awaiting approval"
                    value={listings.filter((p) => p.status === 'PENDING_APPROVAL').length}
                  />
                </div>
              </Card>
            </div>
          )}

          {/* Products */}
          {tab === 'listings' &&
            (listings.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No listings yet"
                subtitle="Publish your first product to start selling."
                action={
                  <Button variant="primary" className="mt-4" onClick={() => setShowProductModal(true)}>
                    Add Product
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {listings.map((p) => (
                  <Card key={p.id} className="!p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 text-2xl ring-1 ring-slate-100 dark:from-white/5 dark:to-white/5 dark:ring-white/10">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          p.image
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">
                            {p.title}
                          </p>
                          {p.status && (
                            <span
                              className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${productStatusColor[p.status] || 'bg-blue-50 text-blue-700 ring-blue-500/20'}`}
                            >
                              {productStatusLabel[p.status] || p.status}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                          <Star size={11} className="fill-amber-400 text-amber-400" />{' '}
                          {(p.rating ?? 0).toFixed(1)} ({p.reviewsCount})
                        </p>
                        <p className="mt-1 text-sm font-bold text-green-600 dark:text-green-400">
                          {formatPKR(p.price)} / {p.unit}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {p.stock} {p.unit} in stock
                          {p.stock <= 5 && p.stock > 0 ? ' — low stock' : ''}
                        </p>
                        {(p.status === 'REJECTED' || p.status === 'SUSPENDED') &&
                          p.moderationReason && (
                            <p className="mt-1 text-xs font-medium text-red-500">
                              {p.moderationReason}
                            </p>
                          )}
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => {
                          setEditingProduct(p)
                          setShowProductModal(true)
                        }}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                      >
                        <Pencil size={13} /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-red-200 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 dark:border-red-500/20 dark:hover:bg-red-500/10"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            ))}

          {/* Orders */}
          {tab === 'orders' &&
            (orders.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="No orders yet"
                subtitle="Orders from buyers will show up here."
              />
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <Card key={order.id}>
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <button
                        className="min-w-0 flex-1 text-left"
                        onClick={() =>
                          setExpandedOrder(
                            expandedOrder === order.id ? null : order.id
                          )
                        }
                      >
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
                          {order.buyerName || `Buyer #${order.buyerId}`}
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
                      </button>

                      <div className="shrink-0 text-left sm:text-right">
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                          {formatPKR(order.totalAmount)}
                        </p>
                        {order.status !== 'DELIVERED' &&
                          order.status !== 'CANCELLED' && (
                            <select
                              className="mt-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/10 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                              value={order.status}
                              onChange={(e) =>
                                handleUpdateOrderStatus(order.id, e.target.value)
                              }
                            >
                              {sellerAssignableStatuses.map((s) => (
                                <option key={s} value={s}>
                                  {orderStatusLabel[s] || s}
                                </option>
                              ))}
                            </select>
                          )}
                      </div>
                    </div>

                    {expandedOrder === order.id && (
                      <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 dark:border-white/10">
                        <OrderTimeline status={order.status} />
                        {order.deliveryAddress && (
                          <p className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <MapPin size={12} className="mt-0.5 shrink-0" />
                            <span>
                              <span className="font-semibold text-slate-700 dark:text-slate-200">
                                Deliver to:{' '}
                              </span>
                              {order.deliveryAddress}
                              {order.phone ? ` · ${order.phone}` : ''}
                            </span>
                          </p>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            ))}

          {/* Messages / Buyer Inquiries */}
          {tab === 'messages' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    Buyer Inquiries & Price Negotiations
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Direct conversations from buyers inquiring about your listings
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={loadConversations}
                  loading={conversationsLoading}
                >
                  <RefreshCw size={14} /> Refresh
                </Button>
              </div>

              {conversationsLoading ? (
                <div className="flex justify-center py-12">
                  <span className="text-xs text-slate-400">Loading inquiries...</span>
                </div>
              ) : conversations.length === 0 ? (
                <Card>
                  <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
                    <MessageCircle size={40} className="mb-2 stroke-1 opacity-50" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      No customer inquiries yet
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      When prospective buyers message you about your products, they will appear here.
                    </p>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {conversations.map((conv, idx) => (
                    <Card key={idx} className="hover:border-green-500/40 transition-colors">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {conv.productImage ? (
                            <img
                              src={conv.productImage}
                              alt=""
                              className="h-12 w-12 shrink-0 rounded-xl object-cover border border-slate-200 dark:border-white/10"
                            />
                          ) : (
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700 dark:bg-green-900/30">
                              <Package size={20} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-slate-800 dark:text-white">
                                {conv.otherUserName}
                              </span>
                              {conv.unreadCount > 0 && (
                                <span className="rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                  {conv.unreadCount} new
                                </span>
                              )}
                            </div>
                            {conv.productTitle && (
                              <p className="text-xs font-medium text-green-600 dark:text-green-400">
                                Product: {conv.productTitle}
                              </p>
                            )}
                            <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400 max-w-md">
                              "{conv.lastMessage}"
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              setActiveChatTarget({
                                userId: conv.otherUserId,
                                businessName: conv.otherUserName,
                                product: conv.productId ? { id: conv.productId, title: conv.productTitle, image: conv.productImage } : null,
                              })
                            }}
                          >
                            <MessageCircle size={14} /> Open Chat
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Payments */}
          {tab === 'payments' && (
            <div className="space-y-4">
              <Card>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/5">
                      <CreditCard size={15} />
                    </div>
                    Your Receiving Accounts
                  </h3>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      setEditingAccount(null)
                      setAccountForm({
                        type: 'EASYPAISA',
                        accountTitle: '',
                        accountNumber: '',
                        bankName: '',
                        iban: '',
                      })
                    }}
                  >
                    <Plus size={14} /> Add Account
                  </Button>
                </div>

                <p className="mb-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  These are shown to buyers who pick EasyPaisa, JazzCash or Bank
                  Transfer at checkout. SmartKisan never processes the payment —
                  buyers transfer directly to you and you verify it below.
                </p>

                {accountsLoading ? (
                  <p className="text-sm text-slate-400">Loading…</p>
                ) : accounts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-center dark:border-white/10 dark:bg-white/5">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      No accounts yet. Buyers can still order with Cash on Delivery.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {accounts.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 p-3.5 transition-all hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20"
                      >
                        <div className="min-w-0 text-sm">
                          <p className="flex flex-wrap items-center gap-2 font-semibold text-slate-800 dark:text-white">
                            {paymentMethodLabel[a.type] || a.type}
                            {!a.active && (
                              <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700 ring-1 ring-inset ring-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                                Inactive
                              </span>
                            )}
                          </p>
                          <p className="mt-0.5 text-slate-600 dark:text-slate-300">
                            {a.accountTitle}
                          </p>
                          <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                            {a.accountNumber}
                          </p>
                          {a.bankName && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {a.bankName}
                            </p>
                          )}
                          {a.iban && (
                            <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                              IBAN: {a.iban}
                            </p>
                          )}
                        </div>

                        <div className="flex shrink-0 gap-1">
                          <button
                            onClick={() => {
                              setEditingAccount(a)
                              setAccountForm({
                                type: a.type,
                                accountTitle: a.accountTitle || '',
                                accountNumber: a.accountNumber || '',
                                bankName: a.bankName || '',
                                iban: a.iban || '',
                              })
                            }}
                            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </button>
                          {a.active && (
                            <button
                              onClick={() => handleDeactivateAccount(a.id)}
                              className="rounded-lg border border-red-200 p-2 text-red-600 transition-colors hover:bg-red-50 dark:border-red-500/20 dark:hover:bg-red-500/10"
                              title="Deactivate"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {accountForm && (
                  <div className="mt-4 space-y-4 border-t border-slate-100 pt-4 dark:border-white/10">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">
                      {editingAccount ? 'Edit account' : 'New account'}
                    </p>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-[13px] font-semibold text-slate-700 dark:text-slate-200">
                          Type
                        </label>
                        <select
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
                          value={accountForm.type}
                          onChange={(e) =>
                            setAccountForm({ ...accountForm, type: e.target.value })
                          }
                        >
                          {paymentAccountTypes.map((t) => (
                            <option key={t} value={t}>
                              {paymentMethodLabel[t] || t}
                            </option>
                          ))}
                        </select>
                      </div>

                      <AccountField
                        label="Account Title"
                        required
                        value={accountForm.accountTitle}
                        onChange={(v) =>
                          setAccountForm({ ...accountForm, accountTitle: v })
                        }
                      />
                      <AccountField
                        label="Account / Mobile Number"
                        required
                        value={accountForm.accountNumber}
                        onChange={(v) =>
                          setAccountForm({ ...accountForm, accountNumber: v })
                        }
                      />

                      {accountForm.type === 'BANK_TRANSFER' && (
                        <>
                          <AccountField
                            label="Bank Name"
                            value={accountForm.bankName}
                            onChange={(v) =>
                              setAccountForm({ ...accountForm, bankName: v })
                            }
                          />
                          <AccountField
                            label="IBAN"
                            value={accountForm.iban}
                            onChange={(v) =>
                              setAccountForm({ ...accountForm, iban: v })
                            }
                          />
                        </>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setAccountForm(null)
                          setEditingAccount(null)
                        }}
                      >
                        Cancel
                      </Button>
                      <Button size="sm" variant="primary" onClick={handleSaveAccount}>
                        {editingAccount ? 'Save Changes' : 'Add Account'}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>

              <Card>
                <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
                  Transfers Awaiting Your Verification
                </h3>

                {accountsLoading ? (
                  <p className="text-sm text-slate-400">Loading…</p>
                ) : pendingPayments.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center dark:border-white/10 dark:bg-white/5">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Nothing waiting for review.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pendingPayments.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/40 p-3.5 dark:border-amber-500/20 dark:bg-amber-500/5"
                      >
                        <div className="min-w-0 text-sm">
                          <p className="font-semibold text-slate-800 dark:text-white">
                            ORD-{p.orderId}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                            {paymentMethodLabel[p.method] || p.method} ·{' '}
                            {formatPKR(p.paidAmount ?? p.amount)}
                          </p>
                          {p.transactionReference && (
                            <p className="mt-0.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                              TID: {p.transactionReference}
                            </p>
                          )}
                          {p.paymentProofUrl && (
                            <a
                              href={p.paymentProofUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 inline-block text-xs font-semibold text-green-600 hover:underline dark:text-green-400"
                            >
                              View receipt
                            </a>
                          )}
                        </div>

                        <div className="flex shrink-0 gap-1">
                          <button
                            onClick={() => handlePaymentDecision(p.orderId, true)}
                            className="rounded-lg border border-green-200 bg-white p-2 text-green-600 transition-colors hover:bg-green-50 dark:border-green-500/20 dark:bg-white/5 dark:hover:bg-green-500/10"
                            title="Approve"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => handlePaymentDecision(p.orderId, false)}
                            className="rounded-lg border border-red-200 bg-white p-2 text-red-600 transition-colors hover:bg-red-50 dark:border-red-500/20 dark:bg-white/5 dark:hover:bg-red-500/10"
                            title="Reject"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Settings */}
          {tab === 'settings' && (
            <Card className="max-w-2xl">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/5">
                  <Settings2 size={15} />
                </div>
                Store Settings
              </h3>

              <div className="space-y-2 text-sm">
                <Row label="Store name" value={user?.sellerProfile?.shopName || '—'} />
                <Row label="Seller type" value={user?.sellerProfile?.sellerType || '—'} />
                <Row label="Status" value={user?.sellerProfile?.status || '—'} />
                <Row
                  label="Verified"
                  value={user?.sellerProfile?.verified ? 'Yes' : 'Not yet verified'}
                />
                <Row label="Description" value={user?.sellerProfile?.description || '—'} />
                <Row
                  label={
                    <span className="flex items-center gap-1">
                      <MapPin size={12} /> Location
                    </span>
                  }
                  value={user?.sellerProfile?.location || user?.location || '—'}
                />
                <Row
                  label={
                    <span className="flex items-center gap-1">
                      <Phone size={12} /> Phone
                    </span>
                  }
                  value={user?.sellerProfile?.phone || user?.phone || '—'}
                />
                <Row
                  label={
                    <span className="flex items-center gap-1">
                      <Mail size={12} /> Email
                    </span>
                  }
                  value={user?.sellerProfile?.email || user?.email || '—'}
                />
              </div>

              <p className="mt-4 text-xs text-slate-400">
                Store details are managed by the marketplace service and cannot
                be edited here yet — the backend has no seller-profile update
                endpoint.
              </p>

              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await fetchMySellerProfile()
                    toast.success('Store details refreshed')
                  }}
                >
                  <RefreshCw size={14} /> Refresh
                </Button>
                {user?.sellerProfile?.id && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => navigate(`/marketplace/seller/${user.sellerProfile.id}`)}
                  >
                    View storefront
                  </Button>
                )}
              </div>
            </Card>
          )}
        </>
      )}

      {showProductModal && (
        <ProductFormModal
          initialData={editingProduct}
          onClose={() => {
            setShowProductModal(false)
            setEditingProduct(null)
          }}
          onSave={handleSaveProduct}
        />
      )}

      {activeChatTarget && (
        <ProductChatModal
          isOpen={!!activeChatTarget}
          onClose={() => {
            setActiveChatTarget(null)
            loadConversations()
          }}
          product={activeChatTarget.product}
          seller={{
            userId: activeChatTarget.userId,
            businessName: activeChatTarget.businessName,
          }}
        />
      )}
    </div>
  )
}

/* ---------------- helpers ---------------- */

const statColorClasses = {
  green: 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  cyan: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400',
}

function StatCard({ icon: Icon, tone = 'green', label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md dark:border-white/10 dark:bg-night-raised dark:hover:border-white/20">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-slate-900/5 ${statColorClasses[tone]}`}
      >
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[10px] font-bold text-slate-400">
          {label}
        </p>
        <p className="mt-0.5 truncate text-base font-bold text-slate-900 dark:text-white">
          {value}
        </p>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2 last:border-0 dark:border-white/5">
      <span className="shrink-0 text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <span className="text-right font-semibold text-slate-800 dark:text-white">
        {value}
      </span>
    </div>
  )
}

function AccountField({ label, value, onChange, required = false }) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-semibold text-slate-700 dark:text-slate-200">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
        active
          ? 'border-green-600 text-green-700 dark:border-green-500 dark:text-green-400'
          : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
      }`}
    >
      <span className="flex items-center gap-2">
        <Icon size={15} /> {label}
      </span>
    </button>
  )
}