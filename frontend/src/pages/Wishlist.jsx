import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Heart, ShoppingCart, Trash2, AlertTriangle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import { SkeletonCard } from '../components/common/Skeleton'
import useStore from '../store/useStore'
import { marketplaceAPI } from '../services/api'
import { productFromResponse, unwrapOne } from '../utils/marketplaceMapper'
import { EmptyState } from './Marketplace'

export default function Wishlist() {
  const navigate = useNavigate()
  const { wishlist, removeFromWishlist, addToCart } = useStore()
  const [live, setLive] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const sync = async () => {
      setLoading(true)
      const entries = await Promise.all(
        wishlist.map(async (w) => {
          try {
            const res = await marketplaceAPI.getProductById(w.productId)
            return [w.productId, productFromResponse(unwrapOne(res))]
          } catch {
            return [w.productId, null]
          }
        })
      )
      if (!cancelled) {
        setLive(Object.fromEntries(entries))
        setLoading(false)
      }
    }
    if (wishlist.length) sync()
    else setLoading(false)
    return () => {
      cancelled = true
    }
  }, [wishlist.length])

  if (!loading && wishlist.length === 0) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/marketplace')}
          className="flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ChevronLeft size={16} /> Back to Marketplace
        </button>
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          subtitle="Tap the heart icon on any product to save it here."
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
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate('/marketplace')}
        className="flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <ChevronLeft size={16} /> Back to Marketplace
      </button>

      <div className="flex items-baseline gap-2">
        <h1 className="page-title">
          Wishlist
        </h1>
        <span className="text-sm text-slate-400">
          {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {wishlist.map((w) => {
            const current = live[w.productId]
            const removed = current === null
            const priceChanged = current && current.price !== w.price

            return (
              <Card
                key={w.productId}
                className="flex flex-wrap items-center gap-4"
              >
                <button
                  onClick={() =>
                    !removed &&
                    navigate(`/marketplace/product/${w.productId}`)
                  }
                  className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 text-2xl ring-1 ring-slate-100 transition-transform hover:scale-105 dark:from-white/5 dark:to-white/5 dark:ring-white/10"
                >
                  {current?.imageUrl ? (
                    <img
                      src={current.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    current?.image || w.image || '📦'
                  )}
                </button>

                <div className="min-w-[160px] flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">
                    {current?.title || w.title}
                  </p>

                  {removed ? (
                    <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700 ring-1 ring-inset ring-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                      <AlertTriangle size={11} /> No longer available
                    </p>
                  ) : (
                    <>
                      <p className="mt-1 text-sm font-bold text-green-600 dark:text-green-400">
                        Rs. {current.price.toLocaleString()}{' '}
                        <span className="text-xs font-normal text-slate-500">
                          / {current.unit}
                        </span>
                      </p>
                      {priceChanged && (
                        <p className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 ring-1 ring-inset ring-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
                          Price changed from Rs.{' '}
                          {w.price?.toLocaleString()}
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-slate-400">
                        {current.stock > 0
                          ? `${current.stock} ${current.unit} available`
                          : 'Out of stock'}
                      </p>
                    </>
                  )}
                </div>

                {!removed && (
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={current.stock <= 0}
                    onClick={() => {
                      addToCart({
                        productId: current.id,
                        title: current.title,
                        price: current.price,
                        unit: current.unit,
                        qty: 1,
                        sellerId: current.sellerId,
                        sellerName: current.sellerName,
                        image: current.image,
                        imageUrl: current.imageUrl,
                        stock: current.stock,
                      })
                      removeFromWishlist(current.id)
                      toast.success('Moved to cart')
                    }}
                  >
                    <ShoppingCart size={14} /> Move to Cart
                  </Button>
                )}

                <button
                  onClick={() => removeFromWishlist(w.productId)}
                  className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                  title="Remove from wishlist"
                >
                  <Trash2 size={16} />
                </button>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}