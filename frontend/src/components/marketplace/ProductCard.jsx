import { Star, ShoppingCart, BadgeCheck, Leaf, Heart, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { formatPKR } from '../../utils/format'
import { categoryLabel } from '../../utils/constants'

function StarRating({ rating = 0 }) {
  const rounded = Math.round(rating)
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={12}
          className={
            i <= rounded
              ? 'fill-amber-400 text-amber-400'
              : 'fill-slate-200 text-slate-200 dark:fill-white/10 dark:text-white/10'
          }
        />
      ))}
    </div>
  )
}

export default function ProductCard({
  product,
  onAddToCart,
  onBuyNow,
  onView,
  isWishlisted,
  onToggleWishlist,
}) {
  const outOfStock = product.stock <= 0
  const hasDiscount =
    product.originalPrice && product.originalPrice > product.price
  const discountPct = hasDiscount
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:border-slate-300 hover:shadow-lg hover:shadow-slate-900/5 dark:border-white/10 dark:bg-night-raised dark:hover:border-white/20"
    >
      {/* Image */}
      <button
        onClick={() => onView?.(product)}
        className="relative flex h-44 w-full items-center justify-center overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 text-6xl dark:from-white/5 dark:to-white/5"
      >
        {/* Badges */}
        <div className="absolute left-2.5 top-2.5 z-10 flex flex-col items-start gap-1.5">
          {hasDiscount && (
            <span className="rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-md">
              -{discountPct}%
            </span>
          )}
          {product.organic && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-md">
              <Leaf size={10} /> Organic
            </span>
          )}
        </div>

        {/* Wishlist */}
        {onToggleWishlist && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation()
              onToggleWishlist(product)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.stopPropagation()
                onToggleWishlist(product)
              }
            }}
            className="absolute right-2.5 top-2.5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-md backdrop-blur transition-all hover:scale-110 hover:bg-white dark:bg-slate-900/90"
            title="Save to wishlist"
          >
            <Heart
              size={15}
              className={
                isWishlisted
                  ? 'fill-red-500 text-red-500'
                  : 'text-slate-400'
              }
            />
          </span>
        )}

        {/* Image */}
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          product.image
        )}

        {/* Out of stock overlay */}
        {outOfStock && (
          <span className="absolute inset-0 flex items-center justify-center bg-slate-900/60 text-sm font-bold text-white backdrop-blur-sm">
            Out of Stock
          </span>
        )}
      </button>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Title */}
        <button
          onClick={() => onView?.(product)}
          className="line-clamp-2 min-h-[2.5em] text-left text-sm font-semibold leading-snug text-slate-800 transition-colors hover:text-green-600 dark:text-slate-100"
        >
          {product.title}
        </button>

        {/* Rating */}
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          <StarRating rating={product.rating} />
          <span className="text-slate-400">
            ({product.reviewsCount ?? 0})
          </span>
          {product.negotiable && (
            <span className="ml-auto inline-flex shrink-0 items-center gap-0.5 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <Zap size={10} /> Negotiable
            </span>
          )}
        </div>

        {/* Seller */}
        <p className="mt-2 flex items-center gap-1 truncate text-[11px] text-slate-500 dark:text-slate-400">
          <span className="truncate">
            {product.sellerName || 'SmartKisan Seller'}
          </span>
          {product.sellerVerified && (
            <BadgeCheck size={11} className="shrink-0 text-blue-500" />
          )}
          {product.sellerLocation && (
            <>
              <span className="text-slate-300">•</span>
              <span className="truncate">{product.sellerLocation}</span>
            </>
          )}
        </p>

        {/* Category */}
        {product.category && (
          <span className="mt-2 self-start rounded-full bg-green-50 px-2.5 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-500/10 dark:text-green-400">
            {categoryLabel[product.category] || product.category}
          </span>
        )}

        {/* Price */}
        <div className="mt-3 flex flex-wrap items-baseline gap-1.5">
          <p className="text-lg font-bold tracking-tight text-green-600 dark:text-green-400">
            {formatPKR(product.price)}
          </p>
          {hasDiscount && (
            <p className="text-xs text-slate-400 line-through">
              {formatPKR(product.originalPrice)}
            </p>
          )}
          <span className="text-[11px] font-normal text-slate-500">
            / {product.unit}
          </span>
        </div>

        <p
          className={`text-[11px] font-medium ${
            outOfStock ? 'text-red-500' : 'text-slate-400'
          }`}
        >
          {outOfStock
            ? 'Out of Stock'
            : `Stock: ${product.stock} ${product.unit || ''} available`}
        </p>

        {/* Actions */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            disabled={outOfStock}
            onClick={() => onAddToCart?.(product)}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-green-500 py-2.5 text-xs font-semibold text-green-600 transition-all hover:bg-green-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:opacity-50 sm:text-sm dark:hover:bg-green-500/10"
          >
            <ShoppingCart size={14} /> Add
          </button>

          <button
            disabled={outOfStock}
            onClick={() =>
              onBuyNow ? onBuyNow(product) : onView?.(product)
            }
            className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-green-500 to-green-600 py-2.5 text-xs font-semibold text-white shadow-md shadow-green-600/25 transition-all hover:from-green-600 hover:to-green-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none sm:text-sm"
          >
            <Zap size={14} /> Buy Now
          </button>
        </div>
      </div>
    </motion.div>
  )
}