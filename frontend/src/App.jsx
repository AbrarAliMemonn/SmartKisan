import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthContext } from './context/AuthContext'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import OAuthCallback from './pages/OAuthCallback'
import IoTDashboard from './pages/IoTDashboard'
import AdminPanel from './pages/AdminPanel'
import AdminUserDetail from './pages/AdminUserDetail'
import CropGuide from './pages/CropGuide'
import LiveWeather from './pages/LiveWeather'
import Marketplace from './pages/Marketplace'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import MyOrders from './pages/MyOrders'
import OrderDetails from './pages/OrderDetails'
import Wishlist from './pages/Wishlist'
import SellerDashboard from './pages/SellerDashboard'
import SellerStore from './pages/SellerStore'
import LiveMonitoring from './pages/LiveMonitoring'
import SensorDetails from './pages/SensorDetails'
import AIChatbot from './pages/AIChatbot'
import UserProfile from './pages/UserProfile'
import Settings from './pages/Settings'
import Loader from './components/common/Loader'

function App() {
  const { isAuthenticated, loading } = useAuthContext()

  if (loading) {
    return <Loader fullScreen />
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/oauth2/redirect" element={<OAuthCallback />} />

      {/* Protected Routes - Only accessible when authenticated */}
      <Route
        path="/*"
        element={
          isAuthenticated ? (
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<IoTDashboard />} />
                <Route path="/live-monitoring" element={<LiveMonitoring />} />
                <Route path="/sensor-details" element={<SensorDetails />} />
                <Route path="/chatbot" element={<AIChatbot />} />
                <Route path="/profile" element={<UserProfile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/crop-guide" element={<CropGuide />} />
                <Route path="/weather" element={<LiveWeather />} />

                {/* Marketplace */}
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/marketplace/product/:id" element={<ProductDetail />} />
                <Route path="/marketplace/cart" element={<Cart />} />
                <Route path="/marketplace/checkout" element={<Checkout />} />
                <Route path="/marketplace/orders" element={<MyOrders />} />
                <Route path="/marketplace/orders/:id" element={<OrderDetails />} />
                <Route path="/marketplace/wishlist" element={<Wishlist />} />
                <Route path="/marketplace/seller" element={<SellerDashboard />} />
                <Route path="/marketplace/seller/:id" element={<SellerStore />} />

                {/* Admin Only Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminPanel />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users/:userId"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminUserDetail />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  )
}

export default App
