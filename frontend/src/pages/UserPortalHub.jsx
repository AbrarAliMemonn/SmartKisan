import { Link, useNavigate } from 'react-router-dom'
import {
  Radio,
  Store,
  MessageCircle,
  ShoppingCart,
  CloudSun,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Droplets,
  Package,
  CreditCard,
  PlusCircle,
  Activity,
  Layers,
  Sprout,
  UserCheck,
  Compass,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { useAuthContext } from '../context/AuthContext'
import Card from '../components/common/Card'

export default function UserPortalHub() {
  const navigate = useNavigate()
  const { user, isSeller, isAdmin } = useAuthContext()

  const displayName = user?.name || user?.email?.split('@')[0] || 'Farmer'

  return (
    <div className="space-y-8 pb-10">
      {/* =========================================================
          WELCOME HERO BANNER
      ========================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-green-800 to-teal-900 p-6 sm:p-10 text-white shadow-xl shadow-green-900/10">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20px 20px, white 2%, transparent 0%), radial-gradient(circle at 60px 60px, white 2%, transparent 0%)',
            backgroundSize: '80px 80px',
          }}
        />
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-lime-400/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1 text-xs font-semibold text-lime-300 ring-1 ring-white/20 backdrop-blur">
            <Compass className="h-3.5 w-3.5" />
            <span>SmartKisan Module Selection Hub</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Assalam-o-Alaikum, {displayName}! 👋
          </h1>

          <p className="text-sm sm:text-base text-green-100/90 leading-relaxed">
            SmartKisan Portal mein khush aamdeed. Aap aaj kya karna chahte hain? Neeche diye gaye options mein se apna matlooba module muntakhib karein:
          </p>
        </div>
      </div>

      {/* =========================================================
          MODULE LAUNCHER GRID ("Aap kya karna chahte hain?")
      ========================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 1. IoT Farm Dashboard */}
        <div className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-6 shadow-card hover:shadow-xl hover:border-emerald-500/50 transition-all duration-300 dark:border-white/10 dark:bg-night-raised">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30">
                <Radio className="h-6 w-6" />
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                Live Telemetry
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors dark:text-white">
                📡 IoT Smart Farm Dashboard
              </h2>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed dark:text-slate-400">
                Live sensor readings (Soil Moisture, Temperature, Humidity, Water Level) aur automated irrigation switch controls.
              </p>
            </div>

            {/* Quick stats snapshot */}
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-white/5 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <Droplets className="h-4 w-4 text-emerald-500" />
                <span>Moisture: 58.5%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-emerald-500" />
                <span>Zone 1: Active</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1 text-xs">
              <Link
                to="/live-monitoring"
                className="flex items-center justify-between py-1 text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-300"
              >
                <span>Live Sensor Monitoring</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
              <Link
                to="/sensor-details"
                className="flex items-center justify-between py-1 text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-300"
              >
                <span>Sensor Health Diagnostics</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/10">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
            >
              <span>Go to IoT Farm Dashboard</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* 2. Seller Center / Store Dashboard */}
        <div className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-6 shadow-card hover:shadow-xl hover:border-amber-500/50 transition-all duration-300 dark:border-white/10 dark:bg-night-raised">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30">
                <Store className="h-6 w-6" />
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                isSeller
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'
              }`}>
                {isSeller ? 'Store Active' : 'Seller Hub'}
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 group-hover:text-amber-600 transition-colors dark:text-white">
                🏪 Seller Center / Manage Store
              </h2>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed dark:text-slate-400">
                Apna agricultural store manage karein: Store logo, bank &amp; JazzCash/EasyPaisa accounts, products add/edit/delete aur orders.
              </p>
            </div>

            {/* Quick Store Capabilities */}
            <div className="space-y-2 rounded-2xl bg-amber-50/60 p-3 text-xs text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <span>Store logo &amp; profile information</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <span>Payment receiving accounts (Bank/JazzCash)</span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <span>Add, edit, delete &amp; price your products</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1 text-xs">
              <Link
                to="/marketplace/seller"
                className="flex items-center justify-between py-1 text-slate-600 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-300"
              >
                <span>View &amp; Manage Listings</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
              <Link
                to="/marketplace/seller"
                className="flex items-center justify-between py-1 text-slate-600 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-300"
              >
                <span>Check Incoming Customer Orders</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/10">
            <button
              onClick={() => navigate('/marketplace/seller')}
              className="w-full rounded-xl bg-amber-600 py-3 text-xs font-bold text-white shadow-md shadow-amber-600/20 hover:bg-amber-700 transition-all flex items-center justify-center gap-2"
            >
              <span>{isSeller ? 'Open Seller Dashboard' : 'Open Seller Center'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* 3. AI Crop Doctor & Advisor */}
        <div className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-6 shadow-card hover:shadow-xl hover:border-indigo-500/50 transition-all duration-300 dark:border-white/10 dark:bg-night-raised">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:ring-indigo-500/30">
                <MessageCircle className="h-6 w-6" />
              </div>
              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                Urdu &amp; Sindhi AI
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors dark:text-white">
                🤖 AI Crop Doctor &amp; Advisor
              </h2>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed dark:text-slate-400">
                Urdu, Sindhi aur English mein faslon ki bimariyon ki tashkhees, khad ka schedule aur zameen ki tayari ke mashware maahir AI se lein.
              </p>
            </div>

            <div className="rounded-2xl bg-indigo-50/50 p-3 text-xs text-indigo-900 dark:bg-indigo-500/10 dark:text-indigo-200 space-y-1">
              <p className="font-semibold text-indigo-950 dark:text-indigo-100">Bilingual Support:</p>
              <p className="italic text-indigo-800 dark:text-indigo-300">&ldquo;گندم کے لیے اس ہفتے کتنا پانی درکار ہے؟&rdquo;</p>
              <p className="italic text-indigo-800 dark:text-indigo-300">&ldquo;ڪڻڪ ۽ ڦٽي لاءِ پهرين پاڻي تي ڀاڻ جو شيڊول&rdquo;</p>
            </div>

            <div className="space-y-1.5 pt-1 text-xs">
              <Link
                to="/crop-guide"
                className="flex items-center justify-between py-1 text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300"
              >
                <span>Read Crop Management Guide</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/10">
            <button
              onClick={() => navigate('/chatbot')}
              className="w-full rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              <span>Consult AI Crop Doctor</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* 4. Agricultural Marketplace Shopping */}
        <div className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-6 shadow-card hover:shadow-xl hover:border-blue-500/50 transition-all duration-300 dark:border-white/10 dark:bg-night-raised">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-500/30">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                Certified Store
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors dark:text-white">
                🛒 Marketplace Shopping (Buy)
              </h2>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed dark:text-slate-400">
                Certified beej, high-yield fertilizers, micro-irrigation kits aur zaraye aalaat direct khareedein.
              </p>
            </div>

            <div className="space-y-1.5 pt-1 text-xs">
              <Link
                to="/marketplace/orders"
                className="flex items-center justify-between py-1 text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-300"
              >
                <span>Track My Orders</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
              <Link
                to="/marketplace/wishlist"
                className="flex items-center justify-between py-1 text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-300"
              >
                <span>Saved Wishlist Items</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/10">
            <button
              onClick={() => navigate('/marketplace')}
              className="w-full rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
            >
              <span>Browse Marketplace</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* 5. Live Weather & Rain Radar */}
        <div className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-6 shadow-card hover:shadow-xl hover:border-sky-500/50 transition-all duration-300 dark:border-white/10 dark:bg-night-raised">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 ring-1 ring-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/30">
                <CloudSun className="h-6 w-6" />
              </div>
              <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
                Agri Forecast
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 group-hover:text-sky-600 transition-colors dark:text-white">
                🌤️ Live Weather &amp; Forecast
              </h2>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed dark:text-slate-400">
                Hyderabad, Sukkur, Multan aur Pakistani agricultural belts ka live mausam, barish aur darja-e-hararat.
              </p>
            </div>

            <div className="rounded-2xl bg-sky-50/50 p-3 text-xs text-sky-900 dark:bg-sky-500/10 dark:text-sky-200 flex items-center justify-between">
              <div>
                <p className="font-bold">Hyderabad, Sindh</p>
                <p className="text-[11px] text-sky-700 dark:text-sky-300">Clear Sky / Sunny</p>
              </div>
              <p className="text-xl font-black text-sky-700 dark:text-sky-300">26.4°C</p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/10">
            <button
              onClick={() => navigate('/weather')}
              className="w-full rounded-xl bg-sky-600 py-3 text-xs font-bold text-white shadow-md shadow-sky-600/20 hover:bg-sky-700 transition-all flex items-center justify-center gap-2"
            >
              <span>View Weather Radar</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* 6. Admin Panel (If user is Admin) */}
        {isAdmin && (
          <div className="group relative flex flex-col justify-between rounded-3xl border border-red-200/90 bg-white p-6 shadow-card hover:shadow-xl hover:border-red-500/50 transition-all duration-300 dark:border-red-500/20 dark:bg-night-raised">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/30">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-bold text-red-800 dark:bg-red-500/20 dark:text-red-300">
                  System Admin
                </span>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900 group-hover:text-red-600 transition-colors dark:text-white">
                  🛡️ Admin Panel &amp; Approvals
                </h2>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed dark:text-slate-400">
                  Registered users, seller requests, product approvals aur payment verification queue manage karein.
                </p>
              </div>

              <div className="space-y-1.5 pt-1 text-xs">
                <Link
                  to="/admin?section=sellers"
                  className="flex items-center justify-between py-1 text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-300"
                >
                  <span>Review Pending Seller Requests</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
                <Link
                  to="/admin?section=users"
                  className="flex items-center justify-between py-1 text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-300"
                >
                  <span>Manage Users &amp; Permissions</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/10">
              <button
                onClick={() => navigate('/admin')}
                className="w-full rounded-xl bg-red-600 py-3 text-xs font-bold text-white shadow-md shadow-red-600/20 hover:bg-red-700 transition-all flex items-center justify-center gap-2"
              >
                <span>Open Admin Panel</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
