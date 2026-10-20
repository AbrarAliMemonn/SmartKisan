import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, ShoppingCart, Store, Package, ClipboardList, Heart,
  Star, Truck, ShieldCheck, BadgePercent, SlidersHorizontal,
  X, Sparkles,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../components/common/Button'
import { SkeletonCard } from '../components/common/Skeleton'
import ProductCard from '../components/marketplace/ProductCard'
import BecomeSellerModal from '../components/marketplace/BecomeSellerModal'
import useStore from '../store/useStore'
import { useAuthContext } from '../context/AuthContext'
import { marketplaceAPI } from '../services/api'
import { productFromResponse, unwrapList } from '../utils/marketplaceMapper'
import { productCategories } from '../utils/constants'
import { getApiErrorMessage } from '../utils/apiError'

const PAGE_SIZE = 12

// Seller button copy, driven purely by user.sellerProfile.status.
const SELLER_BUTTON = {
  PENDING: 'Application Pending (Under Review)',
  APPROVED: 'Seller Central',
  REJECTED: 'Application Rejected',
  SUSPENDED: 'Seller Suspended',
}

export default function Marketplace() {
  const navigate = useNavigate()

  const { user, becomeSeller, fetchMySellerProfile, isAuthenticated } = useAuthContext()

  const {
    cartItems,
    addToCart,
    wishlist,
    toggleWishlist,
    isWishlisted,
  } = useStore()

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState(productCategories)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [sortBy, setSortBy] = useState('relevance')
  const [priceMax, setPriceMax] = useState('')
  const [organicOnly, setOrganicOnly] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)

  const [showSellerModal, setShowSellerModal] = useState(false)

  /*
   * ============================================================
   * SELLER STATUS
   * ============================================================
   *
   * The ONLY source of truth is user.sellerProfile.
   *
   * A profile existing (any status) means the account has already
   * applied, so the registration modal must never open again and
   * POST /marketplace/sellers/register must never be re-sent.
   */
  const sellerProfile = user?.sellerProfile || null
  const sellerStatus = String(sellerProfile?.status || '').toUpperCase()

  const hasSellerProfile = Boolean(sellerProfile)
  const isApprovedSeller = sellerStatus === 'APPROVED'

  const sellerButtonLabel = hasSellerProfile
    ? SELLER_BUTTON[sellerStatus] || 'Seller Central'
    : 'Become a Seller'

  const handleSellerButton = () => {
    // No profile at all -> the only path that opens registration.
    if (!hasSellerProfile) {
      setShowSellerModal(true)
      return
    }

    if (isApprovedSeller) {
      navigate('/marketplace/seller')
      return
    }

    if (sellerStatus === 'PENDING') {
      toast('Your seller application is waiting for admin approval.', {
        icon: '\u23F3',
      })
      return
    }

    if (sellerStatus === 'REJECTED') {
      toast.error(
        sellerProfile?.moderationReason ||
          'Your seller application was not approved.'
      )
      navigate('/marketplace/seller')
      return
    }

    if (sellerStatus === 'SUSPENDED') {
      toast.error(
        sellerProfile?.moderationReason ||
          'Your seller account is currently suspended.'
      )
      return
    }

    navigate('/marketplace/seller')
  }

  // ------------------------------------------------------------
  // Debounce search input
  // ------------------------------------------------------------
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim().toLowerCase())
    }, 350)

    return () => clearTimeout(t)
  }, [search])

  // ------------------------------------------------------------
  // Reset pagination when filters change
  // ------------------------------------------------------------
  useEffect(() => {
    setPage(1)
  }, [
    debouncedSearch,
    category,
    sortBy,
    priceMax,
    organicOnly,
  ])

  // ------------------------------------------------------------
  // Load products
  // ------------------------------------------------------------
  const loadProducts = async () => {
    setLoading(true)
    setError(null)

    try {
      // The catalog endpoint returns ApiResponse<Page<ProductResponse>>, so the
      // array lives at data.data.content. Reading data.data gave the Page
      // object itself, which is why the marketplace looked empty even with
      // products in the database. unwrapList() handles both shapes.
      const res = await marketplaceAPI.getProducts({ size: 200 })

      setProducts(unwrapList(res).map(productFromResponse))
    } catch (err) {
      setError(
        getApiErrorMessage(err, {
          404: 'No products available right now.',
        })
      )
    } finally {
      setLoading(false)
    }
  }

  // ------------------------------------------------------------
  // Load categories
  // ------------------------------------------------------------
  const loadCategories = async () => {
    try {
      const res = await marketplaceAPI.getCategories()

      const list = res.data?.data ?? res.data

      if (Array.isArray(list) && list.length) {
        setCategories(
          list.map((c) => {
            const id = (
              typeof c === 'string'
                ? c
                : c.id || c.name || ''
            ).toUpperCase()

            const fallback = productCategories.find(
              (pc) => pc.id === id
            )

            return {
              id,
              name:
                fallback?.name ||
                (typeof c === 'string'
                  ? c
                  : c.name) ||
                id,
              icon: fallback?.icon || '📦',
            }
          })
        )
      }
    } catch {
      // Non-fatal:
      // Keep static category list.
    }
  }

  // ------------------------------------------------------------
  // Initial marketplace loading
  // ------------------------------------------------------------
  useEffect(() => {
    loadProducts()
    loadCategories()
  }, [])

  // ------------------------------------------------------------
  // Filter products
  // ------------------------------------------------------------
  const filteredProducts = useMemo(() => {
    const list = products.filter((p) => {
      const matchesSearch =
        !debouncedSearch ||
        p.title?.toLowerCase().includes(debouncedSearch) ||
        p.description?.toLowerCase().includes(debouncedSearch) ||
        p.sellerName?.toLowerCase().includes(debouncedSearch)

      const matchesCategory =
        category === 'all' ||
        p.category === category

      const matchesPrice =
        !priceMax ||
        p.price <= Number(priceMax)

      const matchesOrganic =
        !organicOnly ||
        p.organic

      return (
        matchesSearch &&
        matchesCategory &&
        matchesPrice &&
        matchesOrganic
      )
    })

    const discountPct = (p) =>
      p.originalPrice &&
      p.originalPrice > p.price
        ? (p.originalPrice - p.price) /
          p.originalPrice
        : 0

    switch (sortBy) {
      case 'price-low':
        return [...list].sort(
          (a, b) => a.price - b.price
        )

      case 'price-high':
        return [...list].sort(
          (a, b) => b.price - a.price
        )

      case 'rating':
        return [...list].sort(
          (a, b) =>
            (b.rating ?? 0) -
            (a.rating ?? 0)
        )

      case 'popular':
        return [...list].sort(
          (a, b) =>
            (b.reviewsCount ?? 0) -
            (a.reviewsCount ?? 0)
        )

      case 'newest':
        return [...list].sort(
          (a, b) =>
            new Date(b.createdAt || 0) -
            new Date(a.createdAt || 0)
        )

      case 'discount':
        return [...list].sort(
          (a, b) =>
            discountPct(b) -
            discountPct(a)
        )

      default:
        return list
    }
  }, [
    products,
    debouncedSearch,
    category,
    sortBy,
    priceMax,
    organicOnly,
  ])

  // ------------------------------------------------------------
  // Derived sections
  // ------------------------------------------------------------
  const dealsProducts = useMemo(
    () =>
      products
        .filter(
          (p) =>
            p.originalPrice &&
            p.originalPrice > p.price
        )
        .sort(
          (a, b) =>
            (b.originalPrice - b.price) /
              b.originalPrice -
            (a.originalPrice - a.price) /
              a.originalPrice
        )
        .slice(0, 8),
    [products]
  )

  const topRated = useMemo(
    () =>
      [...products]
        .filter((p) => p.reviewsCount > 0)
        .sort(
          (a, b) =>
            (b.rating ?? 0) -
            (a.rating ?? 0)
        )
        .slice(0, 8),
    [products]
  )

  const recentlyAdded = useMemo(
    () =>
      [...products]
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0) -
            new Date(a.createdAt || 0)
        )
        .slice(0, 8),
    [products]
  )

  // ------------------------------------------------------------
  // Add to cart
  // ------------------------------------------------------------
  const handleAddToCart = (product) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to add products to your cart.')
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)
      return
    }
    addToCart({
      productId: product.id,
      title: product.title,
      price: product.price,
      unit: product.unit,
      qty: 1,
      sellerId: product.sellerId,
      sellerName: product.sellerName,
      image: product.image,
      imageUrl: product.imageUrl,
      stock: product.stock,
    })

    toast.success(
      `${product.title} added to cart`
    )
  }

  // ------------------------------------------------------------
  // Buy Now -> add to cart (no duplicate row) then go to checkout
  // ------------------------------------------------------------
  const handleBuyNow = (product) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to proceed to checkout.')
      navigate(`/login?redirect=${encodeURIComponent('/marketplace/checkout')}`)
      return
    }
    if ((product.stock ?? 0) <= 0) {
      toast.error('This product is out of stock')
      return
    }

    addToCart({
      productId: product.id,
      title: product.title,
      price: product.price,
      unit: product.unit,
      qty: 1,
      sellerId: product.sellerId,
      sellerName: product.sellerName,
      image: product.image,
      imageUrl: product.imageUrl,
      stock: product.stock,
    })

    navigate('/marketplace/checkout')
  }

  const handleToggleWishlist = (product) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to save items to your wishlist.')
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)
      return
    }
    toggleWishlist(product)
  }

  // ------------------------------------------------------------
  // Become Seller
  // ------------------------------------------------------------
  const handleBecomeSeller = async (data) => {
    /*
     * Hard guard: an existing sellerProfile means this account is already
     * registered — never re-POST /marketplace/sellers/register.
     */
    if (hasSellerProfile) {
      setShowSellerModal(false)

      if (isApprovedSeller) navigate('/marketplace/seller')

      return
    }

    try {
      const res = await becomeSeller(data)

      if (res?.success) {
        setShowSellerModal(false)

        // AuthContext already re-fetched the profile on 409 for us.
        if (res.alreadyRegistered) {
          navigate('/marketplace/seller')
          return
        }

        navigate('/marketplace/seller')
        return
      }

      if (res?.status === 409) {
        setShowSellerModal(false)
        await fetchMySellerProfile()
        navigate('/marketplace/seller')
        return
      }

      toast.error(res?.error || 'Seller registration failed')
    } catch (error) {
      if (error?.response?.status === 409) {
        setShowSellerModal(false)
        await fetchMySellerProfile()
        toast.success('You are already registered as a seller.')
        navigate('/marketplace/seller')
        return
      }

      toast.error(
        getApiErrorMessage(error, {
          409: 'You are already registered as a seller.',
        })
      )
    }
  }

  const cartCount = cartItems.reduce(
    (s, i) => s + i.qty,
    0
  )

  const pagedProducts =
    filteredProducts.slice(
      0,
      page * PAGE_SIZE
    )

  const hasMore =
    pagedProducts.length <
    filteredProducts.length

  return (
    <div className="space-y-6">

      {/* ======================================================
          HERO
      ====================================================== */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-secondary to-secondary-dark text-white p-6 sm:p-8">

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">

          <div>
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/15 px-3 py-1 rounded-full mb-3">
              <Truck size={13} />
              Direct from farm to buyer, nationwide
            </p>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              SmartKisan Marketplace
            </h1>

            <p className="text-white/70 text-sm mt-1.5 max-w-md">
              Buy and sell produce, seeds,
              fertilizers, equipment & livestock —
              grown, made and sold by the farming
              community.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">

            {/* Orders */}
            <button
              onClick={() =>
                navigate('/marketplace/orders')
              }
              className="px-4 py-2 rounded-lg text-sm font-medium bg-white/10 hover:bg-white/20 text-white flex items-center gap-2 transition-colors"
            >
              <ClipboardList size={16} />
              My Orders
            </button>

            {/* Wishlist */}
            <button
              onClick={() =>
                navigate('/marketplace/wishlist')
              }
              className="px-4 py-2 rounded-lg text-sm font-medium bg-white/10 hover:bg-white/20 text-white flex items-center gap-2 transition-colors"
            >
              <Heart size={16} />
              Wishlist ({wishlist.length})
            </button>

            {/* Cart */}
            <button
              onClick={() =>
                navigate('/marketplace/cart')
              }
              className="px-4 py-2 rounded-lg text-sm font-medium bg-white/10 hover:bg-white/20 text-white flex items-center gap-2 transition-colors"
            >
              <ShoppingCart size={16} />
              Cart ({cartCount})
            </button>

            {/* ==================================================
                SELLER BUTTON
                ================================================== */}
            <button
              onClick={handleSellerButton}
              title={
                sellerStatus === 'PENDING'
                  ? 'Waiting for admin approval'
                  : undefined
              }
              className={`px-4 py-2 rounded-lg text-sm font-semibold shadow flex items-center gap-2 transition ${
                sellerStatus === 'PENDING'
                  ? 'bg-white/20 text-white cursor-default'
                  : sellerStatus === 'REJECTED' ||
                    sellerStatus === 'SUSPENDED'
                    ? 'bg-white/20 text-white hover:bg-white/30'
                    : 'bg-white text-green-900 hover:bg-green-50'
              }`}
            >
              <Store size={16} />
              {sellerButtonLabel}
            </button>

          </div>
        </div>

        <div className="absolute -right-8 -bottom-10 text-[9rem] opacity-10 select-none pointer-events-none">
          🌾
        </div>
      </div>

      {/* ======================================================
          TRUST STRIP
      ====================================================== */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500 dark:text-slate-400 px-1">

        <span className="flex items-center gap-1.5">
          <ShieldCheck
            size={14}
            className="text-primary"
          />
          Verified sellers
        </span>

        <span className="flex items-center gap-1.5">
          <Truck
            size={14}
            className="text-primary"
          />
          Farm-to-buyer delivery
        </span>

        <span className="flex items-center gap-1.5">
          <BadgePercent
            size={14}
            className="text-primary"
          />
          {dealsProducts.length} active deals today
        </span>

      </div>

      {/* ======================================================
          SEARCH
      ====================================================== */}
      <div className="flex flex-col sm:flex-row gap-3">

        <div className="flex-1 flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 transition-colors focus-within:border-green-600 focus-within:ring-4 focus-within:ring-green-600/10 dark:border-white/10 dark:bg-night-raised">

          <Search
            size={18}
            className="text-slate-400"
          />

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search products, sellers, e.g. rice, seeds, tractor..."
            className="flex-1 outline-none px-2 text-sm bg-transparent text-slate-800 placeholder:text-slate-400 dark:text-slate-100"
          />

        </div>

        <button
          onClick={() =>
            setShowFilters((s) => !s)
          }
          className="sm:hidden flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium bg-white text-slate-700 dark:border-white/10 dark:bg-night-raised dark:text-slate-200"
        >
          <SlidersHorizontal size={16} />
          Filters
        </button>

        <select
          value={sortBy}
          onChange={(e) =>
            setSortBy(e.target.value)
          }
          className="input-field sm:w-52"
        >
          <option value="relevance">
            Sort: Relevance
          </option>

          <option value="price-low">
            Price: Low to High
          </option>

          <option value="price-high">
            Price: High to Low
          </option>

          <option value="rating">
            Highest Rated
          </option>

          <option value="popular">
            Most Reviewed
          </option>

          <option value="newest">
            Newest
          </option>

          <option value="discount">
            Biggest Discount
          </option>
        </select>

      </div>

      {/* ======================================================
          CATEGORY
      ====================================================== */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">

        <button
          onClick={() =>
            setCategory('all')
          }
          className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            category === 'all'
              ? 'bg-green-600 text-white border-green-600'
              : 'bg-white text-slate-600 border-slate-200 hover:border-green-500 hover:text-green-700 dark:bg-night-raised dark:text-slate-300 dark:border-white/10 dark:hover:border-green-400'
          }`}
        >
          All Categories
        </button>

        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() =>
              setCategory(c.id)
            }
            className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              category === c.id
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-green-500 hover:text-green-700 dark:bg-night-raised dark:text-slate-300 dark:border-white/10 dark:hover:border-green-400'
            }`}
          >
            <span>{c.icon}</span>
            {c.name}
          </button>
        ))}

      </div>

      {/* ======================================================
          FILTERS
      ====================================================== */}
      <div
        className={`${
          showFilters
            ? 'block'
            : 'hidden'
        } sm:flex flex-wrap items-center gap-3 bg-white border border-slate-200 rounded-xl p-3 text-sm dark:bg-night-raised dark:border-white/10`}
      >

        <div className="flex items-center gap-2">

          <label className="text-slate-500 dark:text-slate-400">
            Max price
          </label>

          <input
            type="number"
            min="0"
            value={priceMax}
            onChange={(e) =>
              setPriceMax(e.target.value)
            }
            placeholder="Any"
            className="input-field !w-28 !py-1"
          />

        </div>

        <label className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">

          <input
            type="checkbox"
            checked={organicOnly}
            onChange={(e) =>
              setOrganicOnly(e.target.checked)
            }
          />

          Organic only

        </label>

        {(priceMax || organicOnly) && (
          <button
            onClick={() => {
              setPriceMax('')
              setOrganicOnly(false)
            }}
            className="flex items-center gap-1 text-xs font-semibold text-red-600 ml-auto hover:underline dark:text-red-400"
          >
            <X size={13} />
            Clear filters
          </button>
        )}

      </div>

      {/* ======================================================
          PRODUCT RAILS
      ====================================================== */}
      {!loading &&
        !error &&
        !debouncedSearch &&
        category === 'all' && (
          <>

            {dealsProducts.length > 0 && (
              <ProductRail
                title="Deals"
                icon={BadgePercent}
                products={dealsProducts}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                onView={(p) =>
                  navigate(
                    `/marketplace/product/${p.id}`
                  )
                }
                wishlist={wishlist}
                toggleWishlist={handleToggleWishlist}
                isWishlisted={isWishlisted}
              />
            )}

            {topRated.length > 0 && (
              <ProductRail
                title="Best Sellers"
                icon={Star}
                products={topRated}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                onView={(p) =>
                  navigate(
                    `/marketplace/product/${p.id}`
                  )
                }
                wishlist={wishlist}
                toggleWishlist={handleToggleWishlist}
                isWishlisted={isWishlisted}
              />
            )}

            {recentlyAdded.length > 0 && (
              <ProductRail
                title="Recently Added"
                icon={Sparkles}
                products={recentlyAdded}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                onView={(p) =>
                  navigate(
                    `/marketplace/product/${p.id}`
                  )
                }
                wishlist={wishlist}
                toggleWishlist={handleToggleWishlist}
                isWishlisted={isWishlisted}
              />
            )}

          </>
        )}

      {/* ======================================================
          MAIN CATALOG
      ====================================================== */}
      <div>

        <div className="flex items-center justify-between mb-3">

          <h2 className="font-semibold text-slate-900 dark:text-white">

            {debouncedSearch ||
            category !== 'all'
              ? 'Search Results'
              : 'All Products'}

            {!loading && (
              <span className="text-slate-400 font-normal">
                {' '}
                ({filteredProducts.length})
              </span>
            )}

          </h2>

        </div>

        {loading ? (

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

            {Array.from({ length: 8 }).map(
              (_, i) => (
                <SkeletonCard key={i} />
              )
            )}

          </div>

        ) : error ? (

          <ErrorState
            message={error}
            onRetry={loadProducts}
          />

        ) : filteredProducts.length === 0 ? (

          products.length === 0 ? (

            <EmptyState
              icon={Package}
              title="No products available"
              subtitle="No products have been listed on the marketplace yet."
              action={
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={loadProducts}
                >
                  Refresh
                </Button>
              }
            />

          ) : (

            <EmptyState
              icon={Package}
              title="No products found"
              subtitle="Try a different search term, category or filter."
              action={
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearch('')
                    setCategory('all')
                    setPriceMax('')
                    setOrganicOnly(false)
                  }}
                >
                  Clear Search
                </Button>
              }
            />

          )

        ) : (

          <>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

              {pagedProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAddToCart={
                    handleAddToCart
                  }
                  onBuyNow={handleBuyNow}
                  onView={(prod) =>
                    navigate(
                      `/marketplace/product/${prod.id}`
                    )
                  }
                  isWishlisted={isWishlisted(
                    p.id
                  )}
                  onToggleWishlist={handleToggleWishlist}
                />
              ))}

            </div>

            {hasMore && (
              <div className="flex justify-center mt-6">

                <Button
                  variant="outline"
                  onClick={() =>
                    setPage((p) => p + 1)
                  }
                >
                  Load more
                </Button>

              </div>
            )}

          </>

        )}

      </div>

      {/* ======================================================
          BECOME SELLER MODAL
      ====================================================== */}
      {showSellerModal && !hasSellerProfile && (
        <BecomeSellerModal
          onClose={() =>
            setShowSellerModal(false)
          }
          onSubmit={
            handleBecomeSeller
          }
        />
      )}

    </div>
  )
}

// ============================================================
// PRODUCT RAIL
// ============================================================

function ProductRail({
  title,
  icon: Icon,
  products,
  onAddToCart,
  onBuyNow,
  onView,
  toggleWishlist,
  isWishlisted,
}) {
  if (!products.length) return null

  return (
    <div>

      <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-3">

        <Icon
          size={17}
          className="text-primary"
        />

        {title}

      </h2>

      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">

        {products.map((p) => (

          <div
            key={p.id}
            className="w-56 shrink-0"
          >

            <ProductCard
              product={p}
              onAddToCart={
                onAddToCart
              }
              onBuyNow={onBuyNow}
              onView={onView}
              isWishlisted={isWishlisted(
                p.id
              )}
              onToggleWishlist={handleToggleWishlist}
            />

          </div>

        ))}

      </div>

    </div>
  )
}

// ============================================================
// EMPTY STATE
// ============================================================

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">

      <Icon
        size={40}
        className="mb-3 opacity-50"
      />

      <p className="font-medium text-slate-600 dark:text-slate-300">
        {title}
      </p>

      <p className="text-sm mt-1">
        {subtitle}
      </p>

      {action}

    </div>
  )
}

// ============================================================
// ERROR STATE
// ============================================================

export function ErrorState({
  message,
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">

      <p className="font-medium text-danger">
        Something went wrong
      </p>

      <p className="text-sm mt-1 max-w-sm">
        {message}
      </p>

      {onRetry && (
        <Button
          variant="outline"
          className="mt-4"
          onClick={onRetry}
        >
          Try again
        </Button>
      )}

    </div>
  )
}

