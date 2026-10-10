import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const getInitialDarkMode = () => {
  if (typeof window === 'undefined') return false
  const saved = localStorage.getItem('darkMode')
  if (saved !== null) return saved === 'true'
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

const useStore = create(
  persist(
    (set, get) => ({
      // Auth state
      user: null,
      isAuthenticated: false,

      // Sensor data
      sensorData: {
        moisture: 0,
        temperature: 0,
        humidity: 0,
        ph: 0,
        timestamp: null,
      },

      // UI state
      sidebarOpen: true,
      mobileSidebarOpen: false,
      darkMode: getInitialDarkMode(),

      // Notifications
      notifications: [],

      // Marketplace cart state
      // Each item: { productId, title, price, unit, qty, sellerId, sellerName, image, imageUrl, stock }
      cartItems: [],

      // Marketplace wishlist — array of product ids saved for later.
      // We keep a small snapshot of each product alongside the id so the
      // Wishlist page can render instantly, then it re-syncs with the
      // backend (marketplaceAPI.getProductById) for live price/stock.
      wishlist: [],

      // Actions
      setUser: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false, cartItems: [] }),

      updateSensorData: (data) => set({ sensorData: data }),

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      toggleMobileSidebar: () => set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),
      closeMobileSidebar: () => set({ mobileSidebarOpen: false }),
      toggleDarkMode: () => set((state) => {
        const next = !state.darkMode
        if (typeof window !== 'undefined') {
          localStorage.setItem('darkMode', String(next))
          document.documentElement.classList.toggle('dark', next)
        }
        return { darkMode: next }
      }),

      addNotification: (notification) =>
        set((state) => ({
          notifications: [notification, ...state.notifications].slice(0, 50)
        })),

      clearNotifications: () => set({ notifications: [] }),

      // ---------------------------------------------------------------
      // Marketplace cart actions
      // ---------------------------------------------------------------
      addToCart: (item) =>
        set((state) => {
          const existing = state.cartItems.find((c) => c.productId === item.productId)
          if (existing) {
            const nextQty = Math.min(
              existing.qty + (item.qty || 1),
              item.stock ?? existing.stock ?? Infinity
            )
            return {
              cartItems: state.cartItems.map((c) =>
                c.productId === item.productId ? { ...c, ...item, qty: nextQty } : c
              ),
            }
          }
          return { cartItems: [...state.cartItems, { qty: 1, ...item }] }
        }),

      updateCartQty: (productId, qty) =>
        set((state) => ({
          cartItems: state.cartItems.map((c) =>
            c.productId === productId
              ? { ...c, qty: Math.max(1, Math.min(qty, c.stock ?? Infinity)) }
              : c
          ),
        })),

      removeFromCart: (productId) =>
        set((state) => ({
          cartItems: state.cartItems.filter((c) => c.productId !== productId),
        })),

      clearCart: () => set({ cartItems: [] }),

      isInCart: (productId) => !!get().cartItems.find((c) => c.productId === productId),

      // ---------------------------------------------------------------
      // Marketplace wishlist actions
      // ---------------------------------------------------------------
      toggleWishlist: (product) =>
        set((state) => {
          const productId = typeof product === 'object' ? product.id ?? product.productId : product
          const exists = state.wishlist.some((w) => w.productId === productId)
          if (exists) {
            return { wishlist: state.wishlist.filter((w) => w.productId !== productId) }
          }
          const snapshot = typeof product === 'object'
            ? {
                productId,
                title: product.title,
                price: product.price,
                unit: product.unit,
                image: product.image,
                imageUrl: product.imageUrl,
                stock: product.stock,
              }
            : { productId }
          return { wishlist: [...state.wishlist, snapshot] }
        }),

      isWishlisted: (productId) => get().wishlist.some((w) => w.productId === productId),

      removeFromWishlist: (productId) =>
        set((state) => ({ wishlist: state.wishlist.filter((w) => w.productId !== productId) })),
    }),
    {
      name: 'smart-agri-marketplace-storage',
      partialize: (state) => ({ cartItems: state.cartItems, wishlist: state.wishlist }),
    }
  )
)

export default useStore