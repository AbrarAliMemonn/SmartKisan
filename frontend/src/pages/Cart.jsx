import { useNavigate } from 'react-router-dom'
import { ShoppingCart, Trash2, Plus, Minus, ChevronLeft, Store } from 'lucide-react'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import useStore from '../store/useStore'
import { formatPKR } from '../utils/format'
import { EmptyState } from './Marketplace'

export default function Cart() {
  const navigate = useNavigate()
  const { cartItems, updateCartQty, removeFromCart } = useStore()

  const subtotal = cartItems.reduce((sum, c) => sum + c.price * c.qty, 0)
  const itemCount = cartItems.reduce((s, i) => s + i.qty, 0)

  const groupedBySeller = cartItems.reduce((acc, item) => {
    const key = item.sellerId ?? 'unknown'
    acc[key] = acc[key] || { sellerName: item.sellerName, items: [] }
    acc[key].items.push(item)
    return acc
  }, {})

  if (cartItems.length === 0) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/marketplace')}
          className="flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ChevronLeft size={16} /> Back to Marketplace
        </button>
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          subtitle="Browse the marketplace and add products to get started."
          action={
            <Button variant="primary" className="mt-4" onClick={() => navigate('/marketplace')}>
              Continue Shopping
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate('/marketplace')}
        className="flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <ChevronLeft size={16} /> Continue Shopping
      </button>

      <div className="flex items-baseline gap-2">
        <h1 className="page-title">
          Your Cart
        </h1>
        <span className="text-sm text-slate-400">
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {Object.entries(groupedBySeller).map(([sellerId, group]) => (
            <div key={sellerId}>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <Store size={13} /> Sold by {group.sellerName || 'Seller'}
              </p>

              <div className="space-y-3">
                {group.items.map((item) => {
                  const overStock = item.stock != null && item.qty > item.stock
                  const lineSubtotal = item.price * item.qty

                  return (
                    <Card
                      key={item.productId}
                      className="flex flex-wrap items-center gap-4"
                    >
                      <button
                        onClick={() =>
                          navigate(`/marketplace/product/${item.productId}`)
                        }
                        className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 text-2xl ring-1 ring-slate-100 transition-transform hover:scale-105 dark:from-white/5 dark:to-white/5 dark:ring-white/10"
                      >
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          item.image
                        )}
                      </button>

                      <div className="min-w-[140px] flex-1">
                        <button
                          onClick={() =>
                            navigate(`/marketplace/product/${item.productId}`)
                          }
                          className="block w-full truncate text-left text-sm font-semibold text-slate-800 transition-colors hover:text-green-600 dark:text-slate-100"
                        >
                          {item.title}
                        </button>
                        <p className="mt-0.5 text-sm text-slate-500">
                          {formatPKR(item.price)} / {item.unit}
                        </p>
                        {overStock && (
                          <p className="mt-1 text-xs font-medium text-red-500">
                            Only {item.stock} {item.unit} left in stock — reduce
                            quantity.
                          </p>
                        )}
                      </div>

                      <div className="flex items-center overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
                        <button
                          onClick={() =>
                            updateCartQty(item.productId, item.qty - 1)
                          }
                          disabled={item.qty <= 1}
                          className="p-2.5 text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/10"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-10 text-center text-sm font-semibold text-slate-800 dark:text-white">
                          {item.qty}
                        </span>
                        <button
                          onClick={() =>
                            updateCartQty(item.productId, item.qty + 1)
                          }
                          disabled={item.stock != null && item.qty >= item.stock}
                          className="p-2.5 text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/10"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <div className="min-w-[92px] text-right">
                        <p className="text-[11px] font-semibold text-slate-400">
                          Subtotal
                        </p>
                        <p className="mt-0.5 font-bold text-green-600 dark:text-green-400">
                          {formatPKR(lineSubtotal)}
                        </p>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                        title="Remove from cart"
                      >
                        <Trash2 size={16} />
                      </button>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <Card className="h-fit lg:sticky lg:top-24">
          <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">
            Order Summary
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Subtotal ({itemCount})</span>
              <span className="font-semibold text-slate-800 dark:text-white">
                {formatPKR(subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Delivery</span>
              <span className="text-xs font-medium text-slate-500">
                Calculated at checkout
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-3 text-base font-bold text-slate-900 dark:border-white/10 dark:text-white">
              <span>Estimated Total</span>
              <span className="text-green-600 dark:text-green-400">
                {formatPKR(subtotal)}
              </span>
            </div>
          </div>

          <Button
            variant="primary"
            fullWidth
            className="mt-5"
            onClick={() => navigate('/marketplace/checkout')}
          >
            Proceed to Checkout
          </Button>

          <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-400">
            Delivery charges and any coupon are applied by the server when your
            order is created.
          </p>
        </Card>
      </div>
    </div>
  )
}