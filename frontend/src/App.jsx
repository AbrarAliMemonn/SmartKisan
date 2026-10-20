import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthContext } from './context/AuthContext'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Loader from './components/common/Loader'

// Lazy-loaded page components for optimal bundle splitting
const LandingPage = lazy(() => import('./pages/LandingPage'))
const Login = lazy(() => import('./pages/Login'))
const OAuthCallback = lazy(() => import('./pages/OAuthCallback'))
const IoTDashboard = lazy(() => import('./pages/IoTDashboard'))
const AdminPanel = lazy(() => import('./pages/AdminPanel'))
const AdminUserDetail = lazy(() => import('./pages/AdminUserDetail'))
const CropGuide = lazy(() => import('./pages/CropGuide'))
const LiveWeather = lazy(() => import('./pages/LiveWeather'))
const Marketplace = lazy(() => import('./pages/Marketplace'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const Cart = lazy(() => import('./pages/Cart'))
const Checkout = lazy(() => import('./pages/Checkout'))
const MyOrders = lazy(() => import('./pages/MyOrders'))
const OrderDetails = lazy(() => import('./pages/OrderDetails'))
const Wishlist = lazy(() => import('./pages/Wishlist'))
const SellerDashboard = lazy(() => import('./pages/SellerDashboard'))
const SellerStore = lazy(() => import('./pages/SellerStore'))
const LiveMonitoring = lazy(() => import('./pages/LiveMonitoring'))
const SensorDetails = lazy(() => import('./pages/SensorDetails'))
const AIChatbot = lazy(() => import('./pages/AIChatbot'))
const UserProfile = lazy(() => import('./pages/UserProfile'))
const Settings = lazy(() => import('./pages/Settings'))

function PageFallback() {
  return <Loader fullScreen label="Loading SmartKisan..." />
}

function App() {
  const { loading } = useAuthContext()

  if (loading) {
    return <Loader fullScreen label="Initializing SmartKisan session..." />
  }

  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* =========================================================
            PUBLIC ROUTES - Accessible without authentication
            ========================================================= */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/oauth2/redirect" element={<OAuthCallback />} />

        {/* Public Marketplace & Knowledge Tools */}
        <Route
          path="/marketplace"
          element={
            <Layout>
              <Marketplace />
            </Layout>
          }
        />
        <Route
          path="/marketplace/product/:id"
          element={
            <Layout>
              <ProductDetail />
            </Layout>
          }
        />
        <Route
          path="/weather"
          element={
            <Layout>
              <LiveWeather />
            </Layout>
          }
        />
        <Route
          path="/crop-guide"
          element={
            <Layout>
              <CropGuide />
            </Layout>
          }
        />

        {/* =========================================================
            PROTECTED ROUTES - Require authentication (redirects to /login?redirect=...)
            ========================================================= */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <IoTDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/live-monitoring"
          element={
            <ProtectedRoute>
              <Layout>
                <LiveMonitoring />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/sensor-details"
          element={
            <ProtectedRoute>
              <Layout>
                <SensorDetails />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/chatbot"
          element={
            <ProtectedRoute>
              <Layout>
                <AIChatbot />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/marketplace/cart"
          element={
            <ProtectedRoute>
              <Layout>
                <Cart />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/marketplace/checkout"
          element={
            <ProtectedRoute>
              <Layout>
                <Checkout />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/marketplace/orders"
          element={
            <ProtectedRoute>
              <Layout>
                <MyOrders />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/marketplace/orders/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <OrderDetails />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/marketplace/wishlist"
          element={
            <ProtectedRoute>
              <Layout>
                <Wishlist />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/marketplace/seller"
          element={
            <ProtectedRoute>
              <Layout>
                <SellerDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/marketplace/seller/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <SellerStore />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <UserProfile />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Admin Only Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <AdminPanel />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users/:userId"
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <AdminUserDetail />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App
