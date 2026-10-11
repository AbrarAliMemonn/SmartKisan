import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Sprout,
  Radio,
  Cpu,
  MessageCircle,
  Store,
  ShoppingCart,
  Search,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Droplets,
  Thermometer,
  Wind,
  CloudSun,
  Layers,
  Wrench,
  Shield,
  Star,
  Check,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  LogIn,
  UserPlus,
  LayoutDashboard,
  Menu,
  X,
  Sparkles,
  ChevronRight,
  AlertCircle,
  Info,
  Send,
  Heart,
  TrendingUp,
  Package,
} from 'lucide-react'
import toast from 'react-hot-toast'
import useStore from '../store/useStore'
import { useAuthContext } from '../context/AuthContext'
import { marketplaceAPI } from '../services/api'
import { productFromResponse, unwrapList } from '../utils/marketplaceMapper'
import { formatPKR } from '../utils/format'

// Fallback seed catalog for offline or initial render
const FALLBACK_PRODUCTS = [
  {
    id: 1,
    title: 'Certified Wheat Seed - Akbar 2019',
    description: 'High-yield certified wheat seed approved by Agricultural Research Institute. High rust resistance and excellent tillering capacity.',
    price: 4500,
    unit: '50kg bag',
    category: 'SEEDS',
    sellerId: 1,
    sellerName: 'Sindh Agri Corp',
    sellerLocation: 'Hyderabad, Sindh',
    sellerVerified: true,
    rating: 4.8,
    reviewsCount: 14,
    stock: 45,
    condition: 'NEW',
    images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600'],
  },
  {
    id: 2,
    title: 'Urea Fertilizer 46% Nitrogen',
    description: 'High purity prilled urea fertilizer for top dressing cereal crops, vegetables, and fruit orchards.',
    price: 3600,
    unit: '50kg bag',
    category: 'FERTILIZERS',
    sellerId: 1,
    sellerName: 'Engro Agri Services',
    sellerLocation: 'Sukkur, Sindh',
    sellerVerified: true,
    rating: 4.9,
    reviewsCount: 28,
    stock: 120,
    condition: 'NEW',
    images: ['https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=600'],
  },
  {
    id: 3,
    title: 'Automated Drip Irrigation Kit 1-Acre',
    description: 'Complete water-saving micro-irrigation system with inline drippers, screen filter, pressure regulator, and lateral pipes.',
    price: 48000,
    unit: 'kit',
    category: 'IRRIGATION',
    sellerId: 1,
    sellerName: 'Modern Farm Tech',
    sellerLocation: 'Karachi, Sindh',
    sellerVerified: true,
    rating: 4.7,
    reviewsCount: 9,
    stock: 8,
    condition: 'NEW',
    images: ['https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=600'],
  },
  {
    id: 4,
    title: 'Rotary Tiller / Cultivator Blades Set',
    description: 'Heavy-duty Boron steel rotary tiller blades for high performance tillage and seedbed preparation.',
    price: 18500,
    unit: 'set of 36',
    category: 'MACHINERY',
    sellerId: 2,
    sellerName: 'Al-Ghazi Farm Tools',
    sellerLocation: 'Multan, Punjab',
    sellerVerified: true,
    rating: 4.6,
    reviewsCount: 11,
    stock: 15,
    condition: 'NEW',
    images: ['https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=600'],
  },
  {
    id: 5,
    title: 'Smart Soil NPK & Moisture IoT Probe',
    description: 'RS485 Modbus digital soil sensor measuring nitrogen, phosphorus, potassium, moisture, and temperature simultaneously.',
    price: 12500,
    unit: 'sensor unit',
    category: 'IOT_DEVICES',
    sellerId: 2,
    sellerName: 'Official SmartKisan Direct',
    sellerLocation: 'Karachi, Sindh',
    sellerVerified: true,
    rating: 5.0,
    reviewsCount: 19,
    stock: 24,
    condition: 'NEW',
    images: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600'],
  },
  {
    id: 6,
    title: 'Emamectin Benzoate 5% SG Bio-Pesticide',
    description: 'Broad spectrum translaminar insecticide for effective management of bollworms, fruit borers, and leaf folders.',
    price: 1800,
    unit: '250g pack',
    category: 'PESTICIDES',
    sellerId: 1,
    sellerName: 'Sindh Agri Corp',
    sellerLocation: 'Hyderabad, Sindh',
    sellerVerified: true,
    rating: 4.7,
    reviewsCount: 7,
    stock: 60,
    condition: 'NEW',
    images: ['https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=600'],
  },
]

const CATEGORIES = [
  { id: 'ALL', name: 'All Products', icon: Layers },
  { id: 'SEEDS', name: 'Seeds & Saplings', icon: Sprout },
  { id: 'FERTILIZERS', name: 'Fertilizers', icon: Layers },
  { id: 'IRRIGATION', name: 'Irrigation & Pumps', icon: Droplets },
  { id: 'MACHINERY', name: 'Machinery & Tools', icon: Wrench },
  { id: 'PESTICIDES', name: 'Crop Protection', icon: Shield },
  { id: 'IOT_DEVICES', name: 'IoT Sensors', icon: Cpu },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuthContext()
  const { cartItems, addToCart } = useStore()

  const [products, setProducts] = useState(FALLBACK_PRODUCTS)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Close mobile drawer on desktop resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileMenuOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Auth gate modal state
  const [gateModal, setGateModal] = useState({
    isOpen: false,
    title: '',
    subtitle: '',
    targetRoute: '',
  })

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  })
  const [contactSubmitting, setContactSubmitting] = useState(false)

  // Fetch real products from marketplace API
  useEffect(() => {
    let isMounted = true
    const fetchCatalog = async () => {
      try {
        setLoadingProducts(true)
        const res = await marketplaceAPI.getProducts({ size: 100 })
        const unwrap = unwrapList(res).map(productFromResponse)
        if (isMounted && unwrap.length > 0) {
          setProducts(unwrap)
        }
      } catch (err) {
        console.warn('Using default marketplace catalog:', err.message)
      } finally {
        if (isMounted) setLoadingProducts(false)
      }
    }
    fetchCatalog()
    return () => {
      isMounted = false
    }
  }, [])

  // Filtered products list
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return products.filter((p) => {
      const matchCat =
        selectedCategory === 'ALL' ||
        (p.category && p.category.toUpperCase() === selectedCategory.toUpperCase())
      if (!matchCat) return false
      if (!q) return true
      return (
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.sellerName && p.sellerName.toLowerCase().includes(q))
      )
    })
  }, [products, selectedCategory, searchQuery])

  // Handle Auth Gate for restricted features
  const handleFeatureAccess = (targetRoute, featureName, featureDesc) => {
    if (isAuthenticated) {
      navigate(targetRoute)
    } else {
      setGateModal({
        isOpen: true,
        title: `Sign In to Access ${featureName}`,
        subtitle: featureDesc,
        targetRoute,
      })
    }
  }

  const handleAddToCart = (product, e) => {
    if (e) e.stopPropagation()
    addToCart({
      productId: product.id,
      title: product.title,
      price: product.price,
      unit: product.unit,
      qty: 1,
      sellerId: product.sellerId,
      sellerName: product.sellerName,
      image: product.image || product.images?.[0],
      imageUrl: product.imageUrl || product.images?.[0],
      stock: product.stock,
    })
    toast.success(`${product.title} added to cart! 🛒`)
  }

  const handleBuyNow = (product, e) => {
    if (e) e.stopPropagation()
    addToCart({
      productId: product.id,
      title: product.title,
      price: product.price,
      unit: product.unit,
      qty: 1,
      sellerId: product.sellerId,
      sellerName: product.sellerName,
      image: product.image || product.images?.[0],
      imageUrl: product.imageUrl || product.images?.[0],
      stock: product.stock,
    })
    if (isAuthenticated) {
      navigate('/marketplace/checkout')
    } else {
      setGateModal({
        isOpen: true,
        title: 'Checkout & Place Order',
        subtitle: 'Please sign in to enter delivery details and confirm your order.',
        targetRoute: '/marketplace/checkout',
      })
    }
  }

  const handleContactSubmit = (e) => {
    e.preventDefault()
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast.error('Please enter your full name, email address, and message.')
      return
    }
    setContactSubmitting(true)
    setTimeout(() => {
      setContactSubmitting(false)
      toast.success('Thank you! Your message has been sent to the SmartKisan team. We will get back to you shortly.')
      setContactForm({ name: '', email: '', phone: '', message: '' })
    }, 900)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-green-500 selection:text-white">
      {/* =========================================================
          TOP NAVBAR
      ========================================================= */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-600 to-emerald-700 text-white shadow-md shadow-green-600/20 group-hover:scale-105 transition-transform">
              <Sprout className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1.5 leading-none">
                SmartKisan
                <span className="hidden xs:inline-block rounded-full bg-lime-100 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-green-800 uppercase tracking-wider">
                  IoT &amp; Market
                </span>
              </span>
              <p className="hidden sm:block text-[11px] font-medium text-slate-500 leading-none mt-1">
                Smart Agriculture Platform Pakistan
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-5 lg:gap-6 text-[14px] font-semibold text-slate-600">
            <a href="#marketplace" className="hover:text-green-700 transition-colors">
              Marketplace
            </a>
            <button
              onClick={() =>
                handleFeatureAccess(
                  '/dashboard',
                  'IoT Farm Dashboard',
                  'Sign in to access real-time root-zone sensor telemetry and automated irrigation controls.'
                )
              }
              className="hover:text-green-700 transition-colors flex items-center gap-1"
            >
              <Radio className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
              IoT Farm
            </button>
            <button
              onClick={() =>
                handleFeatureAccess(
                  '/chatbot',
                  'Multilingual AI Crop Doctor',
                  'Sign in to consult our AI Crop Doctor for diagnostics in English, Urdu, or Sindhi.'
                )
              }
              className="hover:text-green-700 transition-colors flex items-center gap-1"
            >
              <MessageCircle className="h-3.5 w-3.5 text-indigo-600" />
              AI Doctor
            </button>
            <button
              onClick={() =>
                handleFeatureAccess(
                  '/marketplace/seller',
                  'Seller Center',
                  'Sign in to set up your store profile, manage payment payout accounts, and sell products.'
                )
              }
              className="hover:text-green-700 transition-colors flex items-center gap-1"
            >
              <Store className="h-3.5 w-3.5 text-amber-600" />
              Become a Seller
            </button>
            <a href="#about" className="hover:text-green-700 transition-colors">
              About
            </a>
            <a href="#contact" className="hover:text-green-700 transition-colors">
              Contact
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Cart Button */}
            <button
              onClick={() => {
                navigate('/marketplace/cart')
              }}
              className="relative rounded-xl border border-slate-200 bg-white p-2 sm:p-2.5 text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors shadow-sm"
              title="Shopping Cart"
            >
              <ShoppingCart className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-slate-700" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4.5 min-w-4.5 sm:h-5 sm:min-w-5 px-1 items-center justify-center rounded-full bg-green-600 text-[10px] sm:text-[11px] font-bold text-white shadow">
                  {cartItems.length}
                </span>
              )}
            </button>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-green-600/20 hover:bg-green-700 transition-all hover:scale-[1.02]"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                  <button
                    onClick={logout}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-700 hover:text-green-700 hover:bg-slate-100 transition-all"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/login?mode=signup"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-green-600/20 hover:bg-green-700 transition-all hover:scale-[1.02]"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Register</span>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden rounded-xl border border-slate-200 bg-white p-2 text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer / Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200/80 bg-white/95 backdrop-blur-xl shadow-xl animate-in slide-in-from-top-2 duration-200">
            <div className="mx-auto max-w-7xl px-4 py-4 space-y-3">
              {/* Nav links */}
              <div className="grid grid-cols-1 gap-1">
                <a
                  href="#marketplace"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-green-700 transition-colors"
                >
                  <Store className="h-4 w-4 text-green-600" />
                  <span>Marketplace</span>
                </a>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleFeatureAccess(
                      '/dashboard',
                      'IoT Farm Dashboard',
                      'Sign in to access real-time root-zone sensor telemetry and automated irrigation controls.'
                    )
                  }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-green-700 transition-colors text-left"
                >
                  <Radio className="h-4 w-4 text-emerald-600 animate-pulse" />
                  <span>IoT Farm Dashboard</span>
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleFeatureAccess(
                      '/chatbot',
                      'Multilingual AI Crop Doctor',
                      'Sign in to consult our AI Crop Doctor for diagnostics in English, Urdu, or Sindhi.'
                    )
                  }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-green-700 transition-colors text-left"
                >
                  <MessageCircle className="h-4 w-4 text-indigo-600" />
                  <span>AI Crop Doctor</span>
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleFeatureAccess(
                      '/marketplace/seller',
                      'Seller Center',
                      'Sign in to set up your store profile, manage payment payout accounts, and sell products.'
                    )
                  }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-green-700 transition-colors text-left"
                >
                  <Store className="h-4 w-4 text-amber-600" />
                  <span>Become a Seller</span>
                </button>

                <a
                  href="#about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-green-700 transition-colors"
                >
                  <Info className="h-4 w-4 text-slate-500" />
                  <span>About Us</span>
                </a>

                <a
                  href="#contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-green-700 transition-colors"
                >
                  <Phone className="h-4 w-4 text-slate-500" />
                  <span>Contact &amp; Support</span>
                </a>
              </div>

              {/* Mobile Auth actions */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-bold text-white shadow-md shadow-green-600/20 hover:bg-green-700 transition-all"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Go to Dashboard</span>
                    </Link>

                    <button
                      onClick={() => {
                        setMobileMenuOpen(false)
                        logout()
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/login?mode=signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-green-600/20 hover:bg-green-700 transition-colors"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>Register</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* =========================================================
          HERO SECTION
      ========================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-b from-green-900 via-emerald-800 to-green-900 text-white py-16 sm:py-24">
        {/* Background Decorative Pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 25px 25px, white 2%, transparent 0%), radial-gradient(circle at 75px 75px, white 2%, transparent 0%)',
            backgroundSize: '100px 100px',
          }}
        />
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-lime-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-teal-400/20 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-lime-300 ring-1 ring-white/15 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Pakistan&apos;s #1 Smart IoT Agriculture &amp; Marketplace</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15]">
                Smart Farming.{' '}
                <span className="bg-gradient-to-r from-lime-200 via-emerald-200 to-teal-200 bg-clip-text text-transparent">
                  Direct Trade.
                </span>{' '}
                Higher Yields.
              </h1>

              <p className="mx-auto lg:mx-0 max-w-2xl text-base sm:text-lg text-green-100/90 leading-relaxed">
                Monitor soil moisture and irrigation with real-time IoT sensors, consult our intelligent AI Crop Doctor in your local language, and buy or sell certified agricultural supplies directly with zero middleman commission.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                <a
                  href="#marketplace"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-lime-400 px-6 py-3.5 text-[15px] font-bold text-green-950 shadow-lg shadow-lime-400/25 hover:bg-lime-300 transition-all hover:scale-105"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span>Browse Marketplace</span>
                </a>

                <button
                  onClick={() =>
                    handleFeatureAccess(
                      '/dashboard',
                      'IoT Precision Farm Dashboard',
                      'Sign in to access live IoT sensors, root-zone telemetry, and automated drip irrigation controls.'
                    )
                  }
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white/15 px-5 py-3.5 text-[15px] font-semibold text-white ring-1 ring-white/20 backdrop-blur hover:bg-white/25 transition-all"
                >
                  <Radio className="h-5 w-5 text-lime-300 animate-pulse" />
                  <span>IoT Farm Monitoring</span>
                </button>

                <button
                  onClick={() =>
                    handleFeatureAccess(
                      '/chatbot',
                      'AI Agriculture Advisor',
                      'Sign in to diagnose crop diseases and get agricultural recommendations in English, Urdu, or Sindhi.'
                    )
                  }
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white/15 px-5 py-3.5 text-[15px] font-semibold text-white ring-1 ring-white/20 backdrop-blur hover:bg-white/25 transition-all"
                >
                  <MessageCircle className="h-5 w-5 text-indigo-300" />
                  <span>AI Crop Doctor</span>
                </button>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-left">
                <div className="rounded-xl bg-white/10 p-2.5 sm:p-3 ring-1 ring-white/15 backdrop-blur">
                  <p className="text-lg sm:text-xl font-bold text-lime-300">100%</p>
                  <p className="text-[11px] sm:text-xs text-green-100/80 leading-tight">Certified Seeds &amp; Fertilizer</p>
                </div>
                <div className="rounded-xl bg-white/10 p-2.5 sm:p-3 ring-1 ring-white/15 backdrop-blur">
                  <p className="text-lg sm:text-xl font-bold text-lime-300">24/7</p>
                  <p className="text-[11px] sm:text-xs text-green-100/80 leading-tight">Live IoT Telemetry</p>
                </div>
                <div className="rounded-xl bg-white/10 p-2.5 sm:p-3 ring-1 ring-white/15 backdrop-blur">
                  <p className="text-base sm:text-xl font-bold text-lime-300 truncate">Multilingual</p>
                  <p className="text-[11px] sm:text-xs text-green-100/80 leading-tight">Urdu, Sindhi &amp; English AI</p>
                </div>
                <div className="rounded-xl bg-white/10 p-2.5 sm:p-3 ring-1 ring-white/15 backdrop-blur">
                  <p className="text-lg sm:text-xl font-bold text-lime-300">0% Fee</p>
                  <p className="text-[11px] sm:text-xs text-green-100/80 leading-tight">Direct Seller Store</p>
                </div>
              </div>
            </div>

            {/* Right Interactive Telemetry Preview */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl sm:rounded-3xl bg-white/10 p-4 sm:p-6 ring-1 ring-white/20 backdrop-blur-xl shadow-2xl space-y-3.5 sm:space-y-4">
                <div className="flex items-center justify-between border-b border-white/15 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs sm:text-sm font-bold tracking-wide">Live Sensor Telemetry</span>
                  </div>
                  <span className="rounded-full bg-white/15 px-2 sm:px-2.5 py-0.5 text-[10px] sm:text-[11px] font-semibold text-lime-300">
                    Active Node: Sindh Field 01
                  </span>
                </div>

                {/* 4 Sensor Cards */}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  <div className="rounded-xl bg-black/20 p-2.5 sm:p-3.5 ring-1 ring-white/10">
                    <div className="flex items-center justify-between text-[11px] sm:text-xs text-green-200">
                      <span>Soil Moisture</span>
                      <Droplets className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400 shrink-0" />
                    </div>
                    <p className="mt-1 text-xl sm:text-2xl font-black text-white">58.5%</p>
                    <p className="text-[10px] sm:text-[11px] text-emerald-300 font-medium truncate">Optimal root-zone</p>
                  </div>

                  <div className="rounded-xl bg-black/20 p-2.5 sm:p-3.5 ring-1 ring-white/10">
                    <div className="flex items-center justify-between text-[11px] sm:text-xs text-green-200">
                      <span>Temperature</span>
                      <Thermometer className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400 shrink-0" />
                    </div>
                    <p className="mt-1 text-xl sm:text-2xl font-black text-white">26.4°C</p>
                    <p className="text-[10px] sm:text-[11px] text-amber-300 font-medium truncate">Warm &amp; Sunny</p>
                  </div>

                  <div className="rounded-xl bg-black/20 p-2.5 sm:p-3.5 ring-1 ring-white/10">
                    <div className="flex items-center justify-between text-[11px] sm:text-xs text-green-200">
                      <span>Air Humidity</span>
                      <Wind className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-sky-400 shrink-0" />
                    </div>
                    <p className="mt-1 text-xl sm:text-2xl font-black text-white">62.0%</p>
                    <p className="text-[10px] sm:text-[11px] text-sky-300 font-medium truncate">Normal transpiration</p>
                  </div>

                  <div className="rounded-xl bg-black/20 p-2.5 sm:p-3.5 ring-1 ring-white/10">
                    <div className="flex items-center justify-between text-[11px] sm:text-xs text-green-200">
                      <span>Water Tank</span>
                      <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-400 shrink-0" />
                    </div>
                    <p className="mt-1 text-xl sm:text-2xl font-black text-white">85.0%</p>
                    <p className="text-[10px] sm:text-[11px] text-indigo-300 font-medium truncate">Pumps Ready</p>
                  </div>
                </div>

                {/* Drip Irrigation Status */}
                <div className="rounded-xl bg-emerald-950/40 p-3.5 ring-1 ring-emerald-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-300">
                      <Droplets className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Zone 1 Auto-Irrigation</p>
                      <p className="text-[11px] text-emerald-300">Automated AI scheduling enabled</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/30 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
                    RUNNING
                  </span>
                </div>

                <button
                  onClick={() =>
                    handleFeatureAccess(
                      '/dashboard',
                      'Full IoT Dashboard',
                      'Sign in to monitor live sensors and control automated irrigation switches.'
                    )
                  }
                  className="w-full rounded-xl bg-white/20 py-2.5 text-center text-xs font-bold text-white hover:bg-white/30 transition-colors flex items-center justify-center gap-2"
                >
                  <span>Open Complete IoT Farm Console</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          PUBLIC MARKETPLACE SECTION
      ========================================================= */}
      <section id="marketplace" className="py-16 sm:py-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3.5 py-1 text-xs font-bold text-green-800">
              <Store className="h-3.5 w-3.5" />
              <span>Direct Agricultural Marketplace</span>
            </div>
            <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Certified Seeds, Fertilizers &amp; Agricultural Equipment
            </h2>
            <p className="mt-1 text-sm text-slate-500 max-w-2xl">
              Buy verified seeds, bio-fertilizers, solar irrigation kits, and farm machinery directly from certified Pakistani sellers.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search seeds, urea, sensors..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-green-500 focus:outline-none focus:ring-4 focus:ring-green-500/10 shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 pt-1 no-scrollbar touch-pan-x">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            const active = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                  active
                    ? 'bg-green-700 text-white shadow-md shadow-green-700/20'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${active ? 'text-lime-300' : 'text-slate-400'}`} />
                <span>{cat.name}</span>
              </button>
            )
          })}
        </div>

        {/* Product Grid */}
        {loadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl bg-white border border-slate-200 p-4 space-y-3">
                <div className="h-44 rounded-xl bg-slate-200" />
                <div className="h-4 w-3/4 rounded bg-slate-200" />
                <div className="h-4 w-1/2 rounded bg-slate-200" />
                <div className="h-8 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center my-8">
            <Package className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-3 text-base font-bold text-slate-800">No products found</h3>
            <p className="mt-1 text-xs text-slate-500">
              Try adjusting your search query or select another category.
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('ALL')
              }}
              className="mt-4 rounded-xl bg-green-600 px-4 py-2 text-xs font-bold text-white hover:bg-green-700"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-6">
            {filteredProducts.map((p) => {
              const imgUrl = p.images?.[0] || p.imageUrl || p.image || 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600'
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProduct(p)}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm hover:shadow-xl hover:border-green-500/50 transition-all duration-300 cursor-pointer"
                >
                  <div>
                    {/* Image with Category Badge */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-100">
                      <img
                        src={imgUrl}
                        alt={p.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <span className="absolute top-2.5 left-2.5 rounded-lg bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur uppercase tracking-wider">
                        {p.category || 'Agri Product'}
                      </span>
                      {p.sellerVerified && (
                        <span className="absolute top-2.5 right-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow" title="Verified Seller">
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        </span>
                      )}
                    </div>

                    {/* Title & Seller */}
                    <div className="mt-3.5">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="truncate">{p.sellerName || 'Verified Agri Seller'}</span>
                        {p.rating && (
                          <span className="flex items-center gap-1 font-semibold text-amber-500">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            {p.rating}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-1 text-[15px] font-bold text-slate-900 group-hover:text-green-700 transition-colors line-clamp-2">
                        {p.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    </div>
                  </div>

                  {/* Price & Buy Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-baseline justify-between mb-3">
                      <div>
                        <span className="text-lg font-black text-green-700">
                          {formatPKR(p.price)}
                        </span>
                        {p.unit && (
                          <span className="text-xs text-slate-400 ml-1">/ {p.unit}</span>
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        In Stock ({p.stock ?? 10})
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={(e) => handleAddToCart(p, e)}
                        className="rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <ShoppingCart className="h-3.5 w-3.5 text-slate-600" />
                        <span>Add Cart</span>
                      </button>
                      <button
                        onClick={(e) => handleBuyNow(p, e)}
                        className="rounded-xl bg-green-600 py-2.5 text-xs font-bold text-white shadow-md shadow-green-600/20 hover:bg-green-700 transition-all flex items-center justify-center gap-1.5"
                      >
                        <span>Buy Now</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* =========================================================
          PROJECT FEATURES & CAPABILITIES SHOWCASE
      ========================================================= */}
      <section className="bg-slate-100/70 border-y border-slate-200 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="rounded-full bg-green-100 px-3.5 py-1 text-xs font-bold text-green-800">
              Smart Ecosystem
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Key Features &amp; Platform Capabilities
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Empowering farmers with modern agricultural technology. Every module is purpose-built to maximize crop yield, conserve resources, and boost profitability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1: IoT Smart Farming */}
            <div className="rounded-3xl bg-white p-7 border border-slate-200 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
                  <Radio className="h-7 w-7" />
                </div>
                <div className="inline-block rounded-full bg-emerald-100/60 px-3 py-1 text-[11px] font-bold text-emerald-800">
                  Hardware &amp; Telemetry
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  1. IoT Precision Farm Monitoring
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Real-time monitoring of root-zone soil moisture, temperature, humidity, and automated drip irrigation. Save up to 40% water while maintaining peak crop health.
                </p>
                <ul className="text-xs text-slate-600 space-y-2 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Real-time ESP32 / Arduino sensor feeds</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Automated irrigation pump controls &amp; alerts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Historical trend analytics &amp; moisture telemetry</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() =>
                  handleFeatureAccess(
                    '/dashboard',
                    'IoT Smart Farm Console',
                    'Sign in to access field sensor telemetry and automated irrigation controls.'
                  )
                }
                className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
              >
                <span>Launch IoT Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {/* Feature 2: Multilingual AI Crop Doctor */}
            <div className="rounded-3xl bg-white p-7 border border-slate-200 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200">
                  <MessageCircle className="h-7 w-7" />
                </div>
                <div className="inline-block rounded-full bg-indigo-100/60 px-3 py-1 text-[11px] font-bold text-indigo-800">
                  Generative AI Advisor
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  2. Multilingual AI Crop Doctor
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Get instant expert advisory on crop diseases, pest management, and fertilizer schedules in English, Urdu, and Sindhi.
                </p>
                <div className="rounded-xl bg-indigo-50/50 p-3 border border-indigo-100 space-y-2">
                  <p className="text-[11px] font-bold text-indigo-900">Sample AI Inquiries (English, Urdu &amp; Sindhi):</p>
                  <p className="text-xs text-indigo-800 italic">&ldquo;How much irrigation does wheat need this week?&rdquo;</p>
                  <p className="text-xs text-indigo-800 italic">&ldquo;گندم کے لیے اس ہفتے کتنا پانی درکار ہے؟&rdquo;</p>
                  <p className="text-xs text-indigo-800 italic">&ldquo;ڪڻڪ ۽ ڦٽي لاءِ پهرين پاڻي تي ڪهڙو ڀاڻ وجهجي؟&rdquo;</p>
                </div>
                <ul className="text-xs text-slate-600 space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                    <span>Multilingual voice &amp; text understanding</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                    <span>Grounded in real-time IoT sensor telemetry</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() =>
                  handleFeatureAccess(
                    '/chatbot',
                    'AI Agriculture Doctor',
                    'Sign in to consult the AI Crop Doctor.'
                  )
                }
                className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
              >
                <span>Consult AI Crop Doctor</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {/* Feature 3: Become a Seller & Store */}
            <div className="rounded-3xl bg-white p-7 border border-slate-200 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-200">
                  <Store className="h-7 w-7" />
                </div>
                <div className="inline-block rounded-full bg-amber-100/60 px-3 py-1 text-[11px] font-bold text-amber-800">
                  Farmer Storefront
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  3. Become a Seller &amp; Run Store
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Launch your official farm storefront. Configure store branding, payment payout accounts (Bank, EasyPaisa, JazzCash), and sell products directly nationwide.
                </p>
                <ul className="text-xs text-slate-600 space-y-2 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-600" />
                    <span>Add, update, delete products &amp; inventory control</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-600" />
                    <span>Custom store logo &amp; shop branding</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-600" />
                    <span>Direct payouts to JazzCash, EasyPaisa &amp; Bank</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() =>
                  handleFeatureAccess(
                    '/marketplace/seller',
                    'Seller Dashboard & Store Management',
                    'Sign in to create and manage your seller storefront.'
                  )
                }
                className="w-full rounded-xl bg-amber-600 py-3 text-sm font-bold text-white shadow-md shadow-amber-600/20 hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
              >
                <span>Open Seller Center</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          ABOUT US SECTION
      ========================================================= */}
      <section id="about" className="py-16 sm:py-24 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="rounded-full bg-green-100 px-3.5 py-1 text-xs font-bold text-green-800">
              About SmartKisan
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Modern Agricultural Revolution: A Complete Platform for Farmers
            </h2>
            <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
              SmartKisan is an end-to-end platform engineered for farmers and agricultural producers across Pakistan. We transform traditional agriculture into a data-driven, high-yield enterprise through IoT edge telemetry, intelligent advisory, and a commission-free direct marketplace.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <ShieldCheck className="h-8 w-8 text-green-600 mb-2" />
                <h4 className="font-bold text-slate-900 text-sm">Direct Marketplace</h4>
                <p className="text-xs text-slate-500 mt-1">Eliminating middleman exploitation and hidden commissions.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <Cpu className="h-8 w-8 text-emerald-600 mb-2" />
                <h4 className="font-bold text-slate-900 text-sm">IoT Telemetry</h4>
                <p className="text-xs text-slate-500 mt-1">Applying water and nutrients precisely when your crops need them.</p>
              </div>
            </div>
          </div>

          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
            <img
              src="https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=900"
              alt="Pakistani Agriculture"
              className="w-full h-[240px] sm:h-[380px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-5 sm:p-8">
              <div className="text-white">
                <p className="text-xs font-bold uppercase tracking-wider text-lime-300">Sindh Agri Corridor</p>
                <h3 className="text-xl font-bold mt-1">Hyderabad &amp; Tando Jam Agri Hub</h3>
                <p className="text-xs text-slate-200 mt-1">Empowering 50,000+ acres with sustainable smart irrigation.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          CONTACT US SECTION
      ========================================================= */}
      <section id="contact" className="bg-slate-900 text-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-5 space-y-6">
              <span className="rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-lime-300">
                Contact &amp; Support
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Get In Touch With Us
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Have questions about our platform, IoT sensor installations, or becoming a certified seller? Get in touch with our team today.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-lime-300">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Headquarters</p>
                    <p className="text-sm font-medium text-white">Agriculture Research Corridor, Tando Jam Road, Hyderabad, Sindh</p>
                  </div>
                </div>

                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-lime-300">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Helpline</p>
                    <p className="text-sm font-medium text-white">+92 300 1234567</p>
                  </div>
                </div>

                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-lime-300">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Email Support</p>
                    <p className="text-sm font-medium text-white">support@smartkisan.app</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-7">
              <form onSubmit={handleContactSubmit} className="rounded-3xl bg-white/5 p-6 sm:p-8 ring-1 ring-white/10 backdrop-blur-md space-y-4">
                <h3 className="text-lg font-bold text-white mb-2">Send Us a Message</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="e.g. Ali Ahmed"
                      className="w-full rounded-xl bg-white/10 border border-white/15 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="you@example.com"
                      className="w-full rounded-xl bg-white/10 border border-white/15 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    placeholder="+92 300 1234567"
                    className="w-full rounded-xl bg-white/10 border border-white/15 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Your Message *</label>
                  <textarea
                    rows={4}
                    required
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Write your inquiry or question here..."
                    className="w-full rounded-xl bg-white/10 border border-white/15 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={contactSubmitting}
                  className="w-full rounded-xl bg-lime-400 py-3.5 text-sm font-bold text-green-950 shadow-lg shadow-lime-400/20 hover:bg-lime-300 transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  <span>{contactSubmitting ? 'Sending...' : 'Send Message'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FOOTER
      ========================================================= */}
      <footer className="bg-slate-950 text-slate-400 py-10 border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Sprout className="h-4 w-4 text-lime-400" />
            <span className="font-semibold text-white">SmartKisan</span>
            <span>&copy; {new Date().getFullYear()} All Rights Reserved.</span>
          </div>
          <div className="flex flex-wrap justify-center sm:justify-end items-center gap-x-5 gap-y-2 text-center">
            <a href="#marketplace" className="hover:text-white transition-colors">Marketplace</a>
            <a href="#about" className="hover:text-white transition-colors">About Us</a>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
            <Link to="/login" className="hover:text-white transition-colors">Admin &amp; Farmer Login</Link>
          </div>
        </div>
      </footer>

      {/* =========================================================
          AUTH GATE MODAL (Prompt Login/Register for Protected Modules)
      ========================================================= */}
      {gateModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-200">
            <button
              onClick={() => setGateModal({ ...gateModal, isOpen: false })}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-700 ring-1 ring-green-200 mb-4">
              <LogIn className="h-6 w-6" />
            </div>

            <h3 className="text-xl font-bold text-slate-900">
              {gateModal.title}
            </h3>

            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              {gateModal.subtitle}
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setGateModal({ ...gateModal, isOpen: false })
                  navigate(`/login?redirect=${encodeURIComponent(gateModal.targetRoute)}`)
                }}
                className="w-full rounded-xl bg-green-600 py-3 text-sm font-semibold text-white shadow-md shadow-green-600/20 hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </button>

              <button
                onClick={() => {
                  setGateModal({ ...gateModal, isOpen: false })
                  navigate(`/login?mode=signup&redirect=${encodeURIComponent(gateModal.targetRoute)}`)
                }}
                className="w-full rounded-xl border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                <span>Create New Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          PRODUCT DETAIL MODAL
      ========================================================= */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-2xl border border-slate-200">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute right-3.5 top-3.5 z-10 rounded-full bg-white/90 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors shadow ring-1 ring-black/5"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 items-start">
              <div className="aspect-square w-full rounded-2xl overflow-hidden bg-slate-100">
                <img
                  src={selectedProduct.images?.[0] || selectedProduct.imageUrl || selectedProduct.image}
                  alt={selectedProduct.title}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <span className="rounded-md bg-green-100 px-2.5 py-1 text-[11px] font-bold text-green-800 uppercase">
                    {selectedProduct.category || 'Agri Product'}
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 mt-2">
                    {selectedProduct.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sold by {selectedProduct.sellerName || 'Verified Seller'}
                  </p>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-green-700">
                    {formatPKR(selectedProduct.price)}
                  </span>
                  {selectedProduct.unit && (
                    <span className="text-xs text-slate-500">/ {selectedProduct.unit}</span>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {selectedProduct.description}
                </p>

                <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                  <button
                    onClick={() => {
                      handleAddToCart(selectedProduct)
                      setSelectedProduct(null)
                    }}
                    className="flex-1 rounded-xl border border-slate-300 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span>Add to Cart</span>
                  </button>
                  <button
                    onClick={() => {
                      const p = selectedProduct
                      setSelectedProduct(null)
                      handleBuyNow(p)
                    }}
                    className="flex-1 rounded-xl bg-green-600 py-3 text-xs font-bold text-white shadow-md shadow-green-600/20 hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Buy Now</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
