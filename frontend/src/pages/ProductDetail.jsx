import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  Star, ShoppingCart, Heart, Share2, BadgeCheck, MapPin, Minus, Plus,
  Leaf, Zap, ChevronLeft, MessageCircle, ShieldCheck, Truck, RotateCcw,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Loader from '../components/common/Loader'
import ProductCard from '../components/marketplace/ProductCard'
import ProductChatModal from '../components/marketplace/ProductChatModal'
import useStore from '../store/useStore'
import { useAuthContext } from '../context/AuthContext'
import { marketplaceAPI } from '../services/api'
import { productFromResponse, unwrapList, unwrapOne } from '../utils/marketplaceMapper'
import { formatPKR } from '../utils/format'
import { getApiErrorMessage } from '../utils/apiError'
import { ErrorState } from './Marketplace'

const specLabels = {
  crop: 'Crop', variety: 'Variety', germinationRate: 'Germination Rate',
  packSize: 'Pack Size', harvestDuration: 'Harvest Duration', soil: 'Soil',
  season: 'Season', region: 'Region', expiry: 'Expiry', certification: 'Certification',
  npk: 'NPK Ratio', fertilizerType: 'Type', weight: 'Weight',
  activeIngredient: 'Active Ingredient', targetPest: 'Target Pest',
  application: 'Application', suitableCrops: 'Suitable Crops', safetyInfo: 'Safety Info',
  brand: 'Brand', model: 'Model', condition: 'Condition', year: 'Year',
  enginePower: 'Engine Power', warranty: 'Warranty', harvestDate: 'Harvest Date', grade: 'Grade',
}

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart, toggleWishlist, isWishlisted } = useStore()
  const { isAuthenticated } = useAuthContext()

  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [qty, setQty] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewsList, setReviewsList] = useState([])
  const [chatOpen, setChatOpen] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await marketplaceAPI.getProductById(id)
      const p = productFromResponse(unwrapOne(res))
      setProduct(p)
      setQty(1)
      setActiveImage(0)

      try {
        const revRes = await marketplaceAPI.getProductReviews(id)
        const revs = revRes?.data?.data || revRes?.data || []
        setReviewsList(Array.isArray(revs) ? revs : [])
      } catch {
        setReviewsList([])
      }

      try {
        const allRes = await marketplaceAPI.getProducts({ category: p.category, size: 12 })
        const all = unwrapList(allRes).map(productFromResponse)
        setRelated(all.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 8))
      } catch {
        setRelated([])
      }
    } catch (err) {
      setError(getApiErrorMessage(err, { 404: 'Product not found.' }))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const specEntries = useMemo(() => {
    if (!product?.specifications) return []
    return Object.entries(product.specifications).filter(([, v]) => v !== null && v !== undefined && v !== '')
  }, [product])

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader label="Loading product..." />
      </div>
    )
  }
  if (error || !product) {
    return <ErrorState message={error || 'Product not found'} onRetry={load} />
  }

  const outOfStock = (product.stock ?? 0) <= 0
  const hasDiscount = product.originalPrice && product.originalPrice > product.price
  const images = product.images?.length ? product.images : null
  const discountPct = hasDiscount
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  const handleAddToCart = (goToCart = false) => {
    if (!isAuthenticated) {
      toast.error(goToCart ? 'Please sign in to proceed to checkout.' : 'Please sign in to add products to your cart.')
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)
      return
    }
    addToCart({
      productId: product.id,
      title: product.title,
      price: product.price,
      unit: product.unit,
      qty,
      sellerId: product.sellerId,
      sellerName: product.sellerName,
      image: product.image,
      imageUrl: product.imageUrl,
      stock: product.stock,
    })
    toast.success(`${product.title} added to cart`)
    if (goToCart) navigate('/marketplace/checkout')
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try { await navigator.share({ title: product.title, url }) } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard')
    }
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!reviewText.trim()) {
      toast.error('Please write a short review')
      return
    }
    setSubmittingReview(true)
    try {
      await marketplaceAPI.addProductReview(product.id, { rating: reviewRating, comment: reviewText })
      toast.success('Review submitted')
      setReviewText('')
      load()
    } catch (err) {
      toast.error(getApiErrorMessage(err, { 404: 'Product not found.' }))
    } finally {
      setSubmittingReview(false)
    }
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <ChevronLeft size={16} /> Back
      </button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Gallery */}
        <div className="space-y-3">
          <div className="relative flex h-80 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 text-8xl ring-1 ring-slate-100 sm:h-96 dark:from-white/5 dark:to-white/5 dark:ring-white/10">
            {images ? (
              <img
                src={images[activeImage]}
                alt={product.title}
                className="h-full w-full object-cover"
              />
            ) : (
              product.image
            )}

            {hasDiscount && (
              <span className="absolute left-3 top-3 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-md">
                -{discountPct}%
              </span>
            )}

            {product.organic && (
              <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-green-500 px-3 py-1 text-xs font-bold text-white shadow-md">
                <Leaf size={11} /> Organic
              </span>
            )}
          </div>

          {images && images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={img + i}
                  onClick={() => setActiveImage(i)}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-2 transition-all ${
                    activeImage === i
                      ? 'ring-green-500'
                      : 'ring-transparent hover:ring-slate-200 dark:hover:ring-white/10'
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {product.videoUrl && (
            <video src={product.videoUrl} controls className="mt-1 w-full rounded-xl" />
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
                {product.title}
              </h1>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    size={14}
                    className={
                      i <= Math.round(product.rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-slate-200 text-slate-200 dark:fill-white/10 dark:text-white/10'
                    }
                  />
                ))}
              </div>
              <span className="font-medium text-slate-600 dark:text-slate-300">
                {(product.rating ?? 0).toFixed(1)}
              </span>
              <span className="text-slate-400">
                ({product.reviewsCount} reviews)
              </span>
              {product.negotiable && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 ring-1 ring-inset ring-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
                  <Zap size={11} /> Negotiable
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-green-600 dark:text-green-400">
              {formatPKR(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-lg text-slate-400 line-through">
                {formatPKR(product.originalPrice)}
              </span>
            )}
            <span className="text-sm font-medium text-slate-500">
              / {product.unit}
            </span>
          </div>

          <p
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
              outOfStock
                ? 'bg-red-50 text-red-700 ring-red-500/20 dark:bg-red-500/10 dark:text-red-400'
                : 'bg-green-50 text-green-700 ring-green-500/20 dark:bg-green-500/10 dark:text-green-400'
            }`}
          >
            {outOfStock
              ? 'Out of stock'
              : `${product.stock} ${product.unit} available`}
          </p>

          {!outOfStock && (
            <div className="flex w-fit items-center overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="p-3 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-white/10"
              >
                <Minus size={14} />
              </button>
              <span className="w-12 text-center text-sm font-semibold text-slate-800 dark:text-white">
                {qty}
              </span>
              <button
                onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                className="p-3 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-white/10"
              >
                <Plus size={14} />
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="flex-1"
              disabled={outOfStock}
              onClick={() => handleAddToCart(false)}
            >
              <ShoppingCart size={16} /> Add to Cart
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              disabled={outOfStock}
              onClick={() => handleAddToCart(true)}
            >
              <Zap size={16} /> Buy Now
            </Button>
            <button
              onClick={() => {
              if (!isAuthenticated) {
                toast.error('Please sign in to save items to your wishlist.')
                navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)
                return
              }
              toggleWishlist(product)
            }}
              className="rounded-xl border border-slate-200 p-3 transition-colors hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"
              title="Save to wishlist"
            >
              <Heart
                size={18}
                className={
                  isWishlisted(product.id)
                    ? 'fill-red-500 text-red-500'
                    : 'text-slate-400'
                }
              />
            </button>
            <button
              onClick={handleShare}
              className="rounded-xl border border-slate-200 p-3 transition-colors hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"
              title="Share"
            >
              <Share2 size={18} className="text-slate-500" />
            </button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-[11px] dark:border-white/5 dark:bg-white/5">
            <div className="flex flex-col items-center gap-1 text-center">
              <Truck size={16} className="text-green-600 dark:text-green-400" />
              <span className="font-medium text-slate-600 dark:text-slate-300">
                Farm-to-buyer
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 border-x border-slate-200 text-center dark:border-white/10">
              <ShieldCheck size={16} className="text-green-600 dark:text-green-400" />
              <span className="font-medium text-slate-600 dark:text-slate-300">
                Buyer protection
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <RotateCcw size={16} className="text-green-600 dark:text-green-400" />
              <span className="font-medium text-slate-600 dark:text-slate-300">
                Easy returns
              </span>
            </div>
          </div>

          {/* Seller card */}
          <Card className="!p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400">
                  Sold by
                </p>
                <Link
                  to={
                    product.sellerId
                      ? `/marketplace/seller/${product.sellerId}`
                      : '#'
                  }
                  className="mt-0.5 flex items-center gap-1 truncate text-sm font-semibold text-slate-800 transition-colors hover:text-green-600 dark:text-white"
                >
                  {product.sellerName}
                  {product.sellerVerified && (
                    <BadgeCheck size={14} className="shrink-0 text-blue-500" />
                  )}
                </Link>
                {product.sellerLocation && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <MapPin size={11} /> {product.sellerLocation}
                  </p>
                )}
                {product.sellerRating != null && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <Star size={11} className="fill-amber-400 text-amber-400" />
                    {Number(product.sellerRating).toFixed(1)} seller rating
                  </p>
                )}
              </div>

              <div className="flex shrink-0 gap-2">
                {product.sellerId && (
                  <Link
                    to={`/marketplace/seller/${product.sellerId}`}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-green-500 hover:text-green-600 dark:border-white/10 dark:text-slate-300 dark:hover:border-green-500/50"
                  >
                    View Store
                  </Link>
                )}
                <button
                  onClick={() => setChatOpen(true)}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:border-green-500 hover:text-green-600 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-green-500/50"
                >
                  <MessageCircle size={13} className="text-green-600" /> Chat with Seller
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Description */}
      <Card>
        <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-white">
          Description
        </h2>
        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {product.description || 'No description provided.'}
        </p>
      </Card>

      {/* Specifications */}
      {specEntries.length > 0 && (
        <Card>
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">
            Specifications
          </h2>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            {specEntries.map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0 dark:border-white/5"
              >
                <dt className="text-slate-500 dark:text-slate-400">
                  {specLabels[key] ||
                    key
                      .replace(/([A-Z])/g, ' $1')
                      .replace(/^./, (c) => c.toUpperCase())}
                </dt>
                <dd className="font-semibold text-slate-800 dark:text-white">
                  {String(value)}
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      )}

      {/* Reviews */}
      <Card>
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Reviews
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {product.reviewsCount} review
            {product.reviewsCount === 1 ? '' : 's'} · average{' '}
            {(product.rating ?? 0).toFixed(1)} / 5
          </p>
        </div>

        {/* Existing Reviews List */}
        <div className="mb-6 space-y-3">
          {reviewsList.length === 0 ? (
            <p className="text-xs italic text-slate-400">
              No reviews yet for this product. Be the first to share your feedback!
            </p>
          ) : (
            reviewsList.map((rev) => (
              <div
                key={rev.id}
                className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 dark:border-white/5 dark:bg-white/5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-800 dark:text-white">
                      {rev.reviewerName || 'Customer'}
                    </span>
                    {rev.verifiedPurchase && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300">
                        <BadgeCheck size={11} /> Verified Buyer
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {rev.createdAt
                      ? new Date(rev.createdAt).toLocaleDateString()
                      : ''}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={12}
                      className={
                        s <= (rev.rating || 5)
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-slate-200 text-slate-200 dark:fill-white/10 dark:text-white/10'
                      }
                    />
                  ))}
                </div>
                {rev.comment && (
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {rev.comment}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        <form
          onSubmit={handleSubmitReview}
          className="space-y-3 border-t border-slate-100 pt-4 dark:border-white/10"
        >
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Write a review
          </p>

          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                type="button"
                key={i}
                onClick={() => setReviewRating(i)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  size={20}
                  className={
                    i <= reviewRating
                      ? 'fill-amber-400 text-amber-400'
                      : 'fill-slate-200 text-slate-200 dark:fill-white/10 dark:text-white/10'
                  }
                />
              </button>
            ))}
          </div>

          <textarea
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
            rows={3}
            placeholder="Share your experience with this product..."
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
          />

          <p className="text-[11px] text-slate-400">
            Reviews are only accepted from buyers with a verified purchase of
            this product.
          </p>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={submittingReview}
          >
            Submit Review
          </Button>
        </form>
      </Card>

      {/* Related */}
      {related.length > 0 && (
        <div>
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">
            Related Products
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
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
        </div>
      )}

      {/* Instant Buyer-Seller Chat Modal */}
      <ProductChatModal
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        product={product}
        seller={{
          id: product.sellerId,
          userId: product.sellerId,
          businessName: product.sellerName,
        }}
      />
    </div>
  )
}