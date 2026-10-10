import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ChevronLeft, BadgeCheck, MapPin, Star, Package, MessageCircle, ShieldCheck,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import { SkeletonCard } from '../components/common/Skeleton'
import ProductCard from '../components/marketplace/ProductCard'
import ProductChatModal from '../components/marketplace/ProductChatModal'
import useStore from '../store/useStore'
import { marketplaceAPI } from '../services/api'
import { productFromResponse, sellerFromResponse, unwrapList, unwrapOne } from '../utils/marketplaceMapper'
import { EmptyState, ErrorState } from './Marketplace'

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || error.response?.data?.error || error.message || fallback

export default function SellerStore() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart, toggleWishlist, isWishlisted } = useStore()

  const [seller, setSeller] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [chatOpen, setChatOpen] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [sellerRes, productsRes] = await Promise.all([
        marketplaceAPI.getSellerProfile(id),
        marketplaceAPI.getProducts(),
      ])
      setSeller(sellerFromResponse(unwrapOne(sellerRes)))
      const all = unwrapList(productsRes).map(productFromResponse)
      setProducts(all.filter((p) => String(p.sellerId) === String(id)))
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load this seller'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading) {
    return (
      <div className="space-y-5">
        <SkeletonCard />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    )
  }
  if (error || !seller) {
    return <ErrorState message={error || 'Seller not found'} onRetry={load} />
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <ChevronLeft size={16} /> Back
      </button>

      {/* Store hero */}
      <Card>
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 text-3xl ring-1 ring-slate-100 dark:from-green-500/10 dark:to-emerald-500/10 dark:ring-white/10">
            {seller.logoUrl ? (
              <img src={seller.logoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              '🏪'
            )}
          </div>

          <div className="min-w-[200px] flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                {seller.shopName}
              </h1>
              {seller.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 ring-1 ring-inset ring-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
                  <BadgeCheck size={11} /> Verified Seller
                </span>
              )}
            </div>

            {seller.location && (
              <p className="mt-1 flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                <MapPin size={13} /> {seller.location}
              </p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1">
                <Star size={13} className="fill-amber-400 text-amber-400" />{' '}
                {(seller.rating ?? 0).toFixed(1)}
              </span>
              <span className="flex items-center gap-1">
                <Package size={13} /> {products.length} products
              </span>
              {seller.totalSales > 0 && (
                <span className="flex items-center gap-1">
                  <ShieldCheck size={13} className="text-green-600 dark:text-green-400" />{' '}
                  {seller.totalSales} sales
                </span>
              )}
            </div>

            {seller.description && (
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {seller.description}
              </p>
            )}
          </div>

          <button
            onClick={() => setChatOpen(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 transition-all hover:border-green-500 hover:text-green-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-green-500/50 dark:hover:text-green-400"
          >
            <MessageCircle size={14} className="text-green-600" /> Chat with Seller
          </button>
        </div>
      </Card>

      {/* Products */}
      <div>
        <h2 className="mb-4 text-base font-semibold tracking-tight text-slate-900 dark:text-white">
          Products from {seller.shopName}
        </h2>

        {products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No products listed yet"
            subtitle="This seller hasn't published any listings."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onView={(prod) => navigate(`/marketplace/product/${prod.id}`)}
                onAddToCart={() => {
                  addToCart({
                    productId: p.id,
                    title: p.title,
                    price: p.price,
                    unit: p.unit,
                    qty: 1,
                    sellerId: p.sellerId,
                    sellerName: p.sellerName,
                    image: p.image,
                    imageUrl: p.imageUrl,
                    stock: p.stock,
                  })
                  toast.success(`${p.title} added to cart`)
                }}
                isWishlisted={isWishlisted(p.id)}
                onToggleWishlist={toggleWishlist}
              />
            ))}
          </div>
        )}
      </div>

      <ProductChatModal
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        seller={seller}
      />
    </div>
  )
}