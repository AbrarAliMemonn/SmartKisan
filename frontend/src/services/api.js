import axios from 'axios'
import { API_BASE_URL } from '../utils/constants'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach the JWT (if we have one) to every outgoing request.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // File uploads: let the browser set
    // `multipart/form-data; boundary=...` itself. Keeping the instance-level
    // JSON Content-Type here makes Spring reject the upload with 415.
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      delete config.headers['Content-Type']
      delete config.headers['content-type']
    }

    return config
  },
  (error) => Promise.reject(error)
)


const PUBLIC_AUTH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/verify-otp',
  '/auth/resend-otp',
  '/auth/forgot-password',
  '/auth/reset-password',
]

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || ''
    const isPublicAuthRequest = PUBLIC_AUTH_PATHS.some((path) =>
      requestUrl.includes(path)
    )

    if (error.response?.status === 401 && !isPublicAuthRequest) {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

// =========================================================
// AUTH  ->  AuthController  (/auth)
// =========================================================
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),

  // OTP flow (email verification after register + forgot password)
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  resendOtp: (data) => api.post('/auth/resend-otp', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),

  googleLogin: () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const returnTo = encodeURIComponent(`${origin}/oauth2/redirect`)
    const isCloud = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
    const authEndpoint = isCloud
      ? `${origin}/api/oauth2/authorization/google`
      : `${API_BASE_URL}/oauth2/authorization/google`
    window.location.href = `${authEndpoint}?returnTo=${returnTo}`
  },
}

// =========================================================
// CURRENT USER  ->  UserController  (/users)
// =========================================================
export const userAPI = {
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/password', data),
  updateSettings: (data) => api.put('/users/settings', data),
  uploadAvatar: (formData) =>
    api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteAccount: () => api.delete('/users/account'),
}

// =========================================================
// ADMIN: USER MANAGEMENT  ->  AdminController  (/admin/users)
// =========================================================
export const adminAPI = {
  getAllUsers: () => api.get('/admin/users'),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  suspendUser: (id, data) => api.post(`/admin/users/${id}/suspend`, data),
  unsuspendUser: (id) => api.post(`/admin/users/${id}/unsuspend`),
  syncUsers: (users) => api.post('/admin/users/sync', { users }),
  approveService: (id, service) => api.post(`/admin/users/${id}/approve-service`, { service }),
}

// =========================================================
// WEATHER  ->  WeatherController  (/weather)
// =========================================================
export const weatherAPI = {
  getCurrentWeather: (location) => api.get('/weather/current', { params: { location } }),
  getForecast: (location) => api.get('/weather/forecast', { params: { location } }),
}

// =========================================================
// CHATBOT  ->  ChatbotController  (/chatbot)
// =========================================================
export const chatbotAPI = {
  sendMessage: (message, history = [], language = 'en') =>
    api.post('/chatbot/message', { message, history, language }),
  diagnoseCrop: (formData) =>
    api.post('/chatbot/diagnose', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getSuggestions: (language = 'en') =>
    api.get('/chatbot/suggestions', { params: { language } }),
}

// =========================================================
// MARKETPLACE  ->  ProductController, OrderController, SellerController
// =========================================================
export const marketplaceAPI = {
  // Products  (/marketplace/products)
  // NOTE: the backend returns a Spring Page here -> response.data.data.content
  getProducts: (params) => api.get('/marketplace/products', { params }),
  getProductById: (id) => api.get(`/marketplace/products/${id}`),
  getMyListings: () => api.get('/marketplace/products/my-listings'),
  createProduct: (data) => api.post('/marketplace/products', data),
  updateProduct: (id, data) => api.put(`/marketplace/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/marketplace/products/${id}`),
  getProductReviews: (productId) => api.get(`/marketplace/products/${productId}/reviews`),
  addProductReview: (productId, data) => api.post(`/marketplace/products/${productId}/reviews`, data),

  // Categories  (/marketplace/categories)
  getCategories: () => api.get('/marketplace/categories'),

  // Seller onboarding  (/marketplace/sellers)
  becomeSeller: (data) => api.post('/marketplace/sellers/register', data),
  getMySellerProfile: () => api.get('/marketplace/sellers/me'),
  getMySellerAnalytics: () => api.get('/marketplace/sellers/me/analytics'),
  getSellerProfile: (id) => api.get(`/marketplace/sellers/${id}`),

  // Orders  (/marketplace/orders)
  createOrder: (data) => api.post('/marketplace/orders', data),
  getMyOrders: () => api.get('/marketplace/orders/my-orders'),
  getSellerOrders: () => api.get('/marketplace/orders/seller-orders'),
  getOrderById: (id) => api.get(`/marketplace/orders/${id}`),
  updateOrderStatus: (id, status) => api.patch(`/marketplace/orders/${id}/status`, { status }),

  // Cart  (/marketplace/cart) - server-side cart, kept for future use.
  getCart: () => api.get('/marketplace/cart'),
  addCartItem: (data) => api.post('/marketplace/cart/items', data),
  updateCartItem: (itemId, data) => api.put(`/marketplace/cart/items/${itemId}`, data),
  removeCartItem: (itemId) => api.delete(`/marketplace/cart/items/${itemId}`),

  // Coupons  (/marketplace/coupons)
  getCoupons: () => api.get('/marketplace/coupons'),
}

// =========================================================
// MARKETPLACE MEDIA  ->  MediaController  (/marketplace/media)
// =========================================================
// Image upload so sellers don't have to paste an external image URL.
// The request interceptor above strips the JSON Content-Type for FormData
// bodies so the browser can attach the multipart boundary itself.
export const mediaAPI = {
  // folder: 'products' | 'stores' | 'payments' | 'misc'
  upload: (file, folder = 'products', onUploadProgress) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)

    return api.post('/marketplace/media/upload', formData, { onUploadProgress })
  },

  uploadMultiple: (files, folder = 'products', onUploadProgress) => {
    const formData = new FormData()
    Array.from(files).forEach((f) => formData.append('files', f))
    formData.append('folder', folder)

    return api.post('/marketplace/media/upload-multiple', formData, { onUploadProgress })
  },
}

// =========================================================
// MARKETPLACE PAYMENTS  ->  PaymentController  (/marketplace/payments)
// =========================================================
// Manual transfers only. Nothing here talks to a card/payment gateway.
export const paymentAPI = {
  getByOrder: (orderId) => api.get(`/marketplace/payments/order/${orderId}`),
  getMyPayments: () => api.get('/marketplace/payments/my-payments'),

  // Buyer submits (or resubmits) transfer proof for a non-COD order.
  submitProof: (orderId, data) => api.post(`/marketplace/payments/order/${orderId}/submit`, data),

  // Seller/admin verification of a manual transfer.
  getSellerPending: () => api.get('/marketplace/payments/seller-pending'),
  approve: (orderId) => api.post(`/marketplace/payments/order/${orderId}/approve`),
  reject: (orderId, reason) =>
    api.post(`/marketplace/payments/order/${orderId}/reject`, reason ? { reason } : {}),
}

// =========================================================
// SELLER RECEIVING ACCOUNTS  ->  PaymentAccountController
// (/marketplace/payment-accounts)
// =========================================================
export const paymentAccountAPI = {
  getMine: () => api.get('/marketplace/payment-accounts/me'),
  create: (data) => api.post('/marketplace/payment-accounts', data),
  update: (id, data) => api.put(`/marketplace/payment-accounts/${id}`, data),
  deactivate: (id) => api.delete(`/marketplace/payment-accounts/${id}`),

  // Active accounts a buyer may pay into. NOTE: this takes the seller's
  // USER id (SellerProfileResponse.userId), not the seller profile id.
  getForSeller: (sellerUserId) => api.get(`/marketplace/payment-accounts/seller/${sellerUserId}`),
}

// =========================================================
// MARKETPLACE ADMIN  ->  AdminController  (/marketplace/admin) - ROLE_ADMIN only
// =========================================================
export const marketplaceAdminAPI = {
  // Sellers
  getAllSellers: () => api.get('/marketplace/admin/sellers'),
  getPendingSellers: () => api.get('/marketplace/admin/sellers/pending'),
  approveSeller: (id) => api.post(`/marketplace/admin/sellers/${id}/approve`),
  rejectSeller: (id, reason) => api.post(`/marketplace/admin/sellers/${id}/reject`, reason ? { reason } : {}),
  suspendSeller: (id, reason) => api.post(`/marketplace/admin/sellers/${id}/suspend`, reason ? { reason } : {}),
  unsuspendSeller: (id) => api.post(`/marketplace/admin/sellers/${id}/unsuspend`),
  verifySeller: (id) => api.post(`/marketplace/admin/sellers/${id}/verify`),

  // Products
  getPendingProducts: () => api.get('/marketplace/admin/products/pending'),
  approveProduct: (id) => api.post(`/marketplace/admin/products/${id}/approve`),
  rejectProduct: (id, reason) => api.post(`/marketplace/admin/products/${id}/reject`, reason ? { reason } : {}),
  suspendProduct: (id, reason) => api.post(`/marketplace/admin/products/${id}/suspend`, reason ? { reason } : {}),

  // Payments (manual-transfer proof review)
  getPendingPayments: () => api.get('/marketplace/admin/payments/pending'),
  approvePayment: (orderId) => api.post(`/marketplace/admin/payments/order/${orderId}/approve`),
  rejectPayment: (orderId, reason) => api.post(`/marketplace/admin/payments/order/${orderId}/reject`, reason ? { reason } : {}),
}

// =========================================================
// INSTANT BUYER-SELLER CHAT  ->  ChatController (/marketplace/chat)
// =========================================================
export const chatAPI = {
  sendMessage: (data) => api.post('/marketplace/chat/send', data),
  getHistory: (recipientId, productId) =>
    api.get('/marketplace/chat/history', { params: { recipientId, productId } }),
  getConversations: () => api.get('/marketplace/chat/conversations'),
  markAsRead: (id) => api.patch(`/marketplace/chat/read/${id}`),
}

// =========================================================
// IOT SENSORS & TELEMETRY  ->  IotSensorController (/iot, /crops)
// =========================================================
export const iotAPI = {
  getSensors: () => api.get('/iot/sensors'),
  getSensorDetails: (id) => api.get(`/iot/sensors/${id}`),
  getHistory: (sensorId) => api.get('/iot/history', { params: { sensorId } }),
  getAlerts: () => api.get('/iot/alerts'),
  sendTelemetry: (data) => api.post('/iot/telemetry', data),
  toggleIrrigation: (zone, status) => api.post('/iot/irrigation/toggle', { zone, status }),
  getIrrigationStatus: () => api.get('/iot/irrigation/status'),
  getCropGuides: () => api.get('/crops/guides'),
  getCropStatus: () => api.get('/crops/status'),
}

export default api
