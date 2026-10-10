// const emojiByCategory = {
//   produce: '🌾',
//   seeds: '🌱',
//   fertilizers: '🧪',
//   pesticides: '🧴',
//   equipment: '🚜',
//   tools: '🛠️',
//   livestock: '🐄',
// }

// export const categoryEmoji = (category) => emojiByCategory[(category || '').toLowerCase()] || '📦'

// // "PENDING" -> "Pending" (order status enum names -> the Capitalized labels
// // the UI already uses for orderStatusColor / the status <select>)
// export const titleCase = (value) =>
//   value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : value

// // ProductResponse -> the shape ProductCard / ProductDetail / Marketplace render.
// export const productFromResponse = (p) => ({
//   id: p.id,
//   sellerId: p.sellerId, // SellerProfile id, matches OrderRequest.sellerId
//   sellerName: p.sellerShopName,
//   // Optional seller/location metadata — only shown if the backend sends it.
//   sellerVerified: p.sellerVerified ?? undefined,
//   sellerLocation: p.sellerLocation || p.location || undefined,
//   sellerRating: p.sellerRating ?? undefined,
//   title: p.title,
//   description: p.description || '',
//   category: (p.category || '').toLowerCase(),
//   price: p.price != null ? Number(p.price) : 0,
//   originalPrice: p.originalPrice != null ? Number(p.originalPrice) : undefined,
//   unit: p.unit,
//   stock: p.stock ?? 0,
//   rating: p.rating ?? 0,
//   reviewsCount: p.reviewsCount ?? 0,
//   organic: !!p.organic,
//   negotiable: !!p.negotiable,
//   imageUrl: p.imageUrl || null,
//   images: Array.isArray(p.images) && p.images.length ? p.images : (p.imageUrl ? [p.imageUrl] : []),
//   videoUrl: p.videoUrl || undefined,
//   image: categoryEmoji(p.category),
//   status: p.status,
//   moderationReason: p.moderationReason || null,
//   createdAt: p.createdAt,
//   // Free-form agricultural specification bag (crop, variety, NPK, activeIngredient, ...).
//   // Only rendered where present — see AgriSpecs in ProductDetail.jsx.
//   specifications: p.specifications || null,
// })

// // UI product form -> ProductRequest body for POST/PUT /marketplace/products.
// export const productToRequest = (form) => ({
//   title: form.title,
//   description: form.description,
//   category: form.category,
//   price: Number(form.price),
//   unit: form.unit,
//   stock: Number(form.stock),
//   organic: !!form.organic,
//   negotiable: !!form.negotiable,
//   imageUrl: form.imageUrl || undefined,
//   ...(form.originalPrice ? { originalPrice: Number(form.originalPrice) } : {}),
//   ...(form.specifications && Object.keys(form.specifications).length
//     ? { specifications: form.specifications }
//     : {}),
// })

// // OrderResponse -> the shape OrdersList / OrderTimeline / Marketplace render.
// export const orderFromResponse = (o) => {
//   const items = (o.items || []).map((i) => ({
//     productId: i.productId,
//     title: i.title,
//     qty: i.quantity,
//     unit: i.unit,
//     price: i.price != null ? Number(i.price) : 0,
//     imageUrl: i.imageUrl || null,
//     subtotal:
//       i.subtotal != null
//         ? Number(i.subtotal)
//         : Number(i.price || 0) * Number(i.quantity || 0),
//   }))

//   const itemsSubtotal = items.reduce((s, i) => s + i.subtotal, 0)

//   return {
//     id: o.id,
//     displayId: `ORD-${o.id}`,
//     buyerId: o.buyerId,
//     buyerName: o.buyerName || o.buyerFullName || undefined,
//     sellerId: o.sellerId,
//     sellerName: o.sellerShopName,
//     status: titleCase(o.status),
//     rawStatus: (o.status || '').toUpperCase(),
//     totalAmount: o.totalAmount != null ? Number(o.totalAmount) : itemsSubtotal,
//     subtotal: o.subtotal != null ? Number(o.subtotal) : itemsSubtotal,
//     // Backend is the source of truth for delivery charges. When it doesn't
//     // send one, delivery is Rs. 0 and grand total === subtotal.
//     deliveryCharges:
//       o.deliveryCharges != null
//         ? Number(o.deliveryCharges)
//         : o.deliveryFee != null
//           ? Number(o.deliveryFee)
//           : 0,
//     deliveryAddress: o.deliveryAddress,
//     city: o.city || undefined,
//     province: o.province || undefined,
//     phone: o.phone || o.contactPhone || undefined,
//     paymentMethod: o.paymentMethod || undefined,
//     paymentStatus: (o.paymentStatus || '').toUpperCase() || undefined,
//     items,
//     orderDate: o.orderDate ? new Date(o.orderDate).toISOString().split('T')[0] : '',
//     orderDateTime: o.orderDate || null,
//   }
// }

// // Cart items grouped by seller -> one OrderRequest body per seller.
// // (Multiple sellers in the cart => multiple POST /marketplace/orders calls.)
// // `deliveryMethod` is sent as an extra field for forward-compatibility with
// // the backend; if the current OrderRequest DTO doesn't have it yet, Jackson
// // will simply ignore the unknown property rather than fail the request.
// export const cartGroupToOrderRequest = (sellerId, items, delivery = {}) => ({
//   ...(sellerId != null ? { sellerId } : {}),
//   items: items.map((i) => ({ productId: i.productId, quantity: i.qty })),
//   deliveryAddress: delivery.deliveryAddress,
//   ...(delivery.city ? { city: delivery.city } : {}),
//   ...(delivery.province ? { province: delivery.province } : {}),
//   ...(delivery.phone ? { phone: delivery.phone } : {}),
//   ...(delivery.paymentMethod ? { paymentMethod: delivery.paymentMethod } : {}),
//   ...(delivery.deliveryMethod ? { deliveryMethod: delivery.deliveryMethod } : {}),
//   ...(delivery.notes ? { notes: delivery.notes } : {}),
// })

// // Seller payment details, wherever the backend chose to expose them on the
// // seller profile / product response. Purely read-only — shown to the buyer
// // when they pick EasyPaisa / JazzCash / Bank Transfer.
// export const sellerPaymentDetails = (seller) => {
//   if (!seller) return null

//   const src = seller.paymentDetails || seller.paymentInfo || seller

//   const details = {
//     easypaisa: src.easypaisaNumber || src.easypaisa || null,
//     jazzcash: src.jazzcashNumber || src.jazzcash || null,
//     bankName: src.bankName || null,
//     accountTitle: src.accountTitle || src.accountName || null,
//     accountNumber: src.accountNumber || src.iban || null,
//   }

//   return Object.values(details).some(Boolean) ? details : null
// }

// // SellerProfileResponse -> the shape SellerStore.jsx renders.
// export const sellerFromResponse = (s) => ({
//   id: s.id,
//   shopName: s.shopName,
//   description: s.description || '',
//   location: s.location || '',
//   verified: !!s.verified,
//   rating: s.rating ?? 0,
//   reviewsCount: s.reviewsCount ?? 0,
//   followerCount: s.followerCount ?? undefined,
//   logoUrl: s.logoUrl || null,
//   sellerType: s.sellerType || undefined,
// })

import { categoryIcon, orderStatusLabel } from './constants'

// =========================================================
// RESPONSE UNWRAPPING
// =========================================================
//
// marketplace-service wraps everything in ApiResponse<T> -> { success, message, data }.
// For GET /marketplace/products the payload is additionally a Spring Page:
//
//   { success, data: { content: [...], totalElements, number, size, ... } }
//
// The old code checked `res.data?.data ?? res.data?.content` which returned the
// Page OBJECT (not an array), so `Array.isArray(...)` was false and the
// marketplace rendered zero products even though the DB had rows.
// Always route list responses through unwrapList().

export const unwrapList = (res) => {
  const payload = res?.data?.data ?? res?.data ?? []

  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.content)) return payload.content // Spring Page
  if (Array.isArray(payload?.items)) return payload.items

  return []
}

export const unwrapOne = (res) => res?.data?.data ?? res?.data ?? null

// Paging metadata from a Spring Page response, when present.
export const unwrapPageInfo = (res) => {
  const payload = res?.data?.data ?? res?.data
  if (!payload || Array.isArray(payload) || !('totalElements' in payload)) return null

  return {
    page: payload.number ?? 0,
    size: payload.size ?? 0,
    totalElements: payload.totalElements ?? 0,
    totalPages: payload.totalPages ?? 0,
    last: payload.last ?? true,
  }
}

// =========================================================
// DISPLAY HELPERS
// =========================================================

export const categoryEmoji = (category) => categoryIcon[String(category || '').toUpperCase()] || '📦'

export const titleCase = (value) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : value

// =========================================================
// PRODUCTS
// =========================================================
// ProductResponse -> the shape ProductCard / ProductDetail / Marketplace render.
//
// Backend field names that differ from the old frontend assumptions:
//   discountPrice  (not originalPrice)  -> the SELLING price when set
//   attributes     (not specifications)
//   images         gallery, separate from the cover imageUrl
// The backend does NOT send sellerVerified / sellerRating / sellerLocation on a
// product, so those stay undefined and the UI simply hides them.

export const productFromResponse = (p = {}) => {
  const listPrice = p.price != null ? Number(p.price) : 0
  const discounted = p.discountPrice != null ? Number(p.discountPrice) : null

  // When a discountPrice exists it is what the buyer actually pays; the
  // original price is then shown struck through.
  const effectivePrice = discounted != null && discounted > 0 ? discounted : listPrice
  const originalPrice = discounted != null && discounted > 0 && listPrice > discounted
    ? listPrice
    : undefined

  const gallery = Array.isArray(p.images) ? p.images.filter(Boolean) : []

  return {
    id: p.id,
    sellerId: p.sellerId,                 // SellerProfile id — used as OrderRequest.sellerId
    sellerName: p.sellerShopName,
    title: p.title,
    description: p.description || '',
    category: String(p.category || '').toUpperCase(),
    subCategory: p.subCategory || undefined,
    brand: p.brand || undefined,
    sku: p.sku || undefined,
    price: effectivePrice,
    originalPrice,
    unit: p.unit,
    stock: p.stock ?? 0,
    condition: p.condition || undefined,
    rating: p.rating ?? 0,
    reviewsCount: p.reviewsCount ?? 0,
    organic: !!p.organic,
    negotiable: !!p.negotiable,
    imageUrl: p.imageUrl || gallery[0] || null,
    images: gallery.length ? gallery : (p.imageUrl ? [p.imageUrl] : []),
    videoUrl: p.videoUrl || undefined,
    image: categoryEmoji(p.category),     // emoji placeholder when no photo exists
    city: p.city || undefined,
    province: p.province || undefined,
    country: p.country || undefined,
    sellerLocation: [p.city, p.province].filter(Boolean).join(', ') || undefined,
    expiryDate: p.expiryDate || undefined,
    status: p.status,
    moderationReason: p.moderationReason || null,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    // Free-form category attributes (cropType, npkRatio, activeIngredient, ...)
    specifications: p.attributes && Object.keys(p.attributes).length ? p.attributes : null,
  }
}

// UI product form -> ProductRequest body for POST/PUT /marketplace/products.
export const productToRequest = (form) => {
  const price = Number(form.price)
  const original = form.originalPrice === '' || form.originalPrice == null
    ? null
    : Number(form.originalPrice)

  // The backend treats `price` as the list price and `discountPrice` as the
  // reduced one. The form collects "price" (what the buyer pays) plus an
  // optional higher "original price", so they are swapped on the way out.
  const hasDiscount = original != null && original > price

  return {
    title: form.title,
    description: form.description || undefined,
    category: form.category,
    subCategory: form.subCategory || undefined,
    brand: form.brand || undefined,
    price: hasDiscount ? original : price,
    ...(hasDiscount ? { discountPrice: price } : {}),
    unit: form.unit,
    stock: Number(form.stock),
    condition: form.condition || undefined,
    organic: !!form.organic,
    negotiable: !!form.negotiable,
    imageUrl: form.imageUrl || undefined,
    ...(Array.isArray(form.images) && form.images.length ? { images: form.images } : {}),
    videoUrl: form.videoUrl || undefined,
    city: form.city || undefined,
    province: form.province || undefined,
    ...(form.specifications && Object.keys(form.specifications).length
      ? { attributes: form.specifications }
      : {}),
  }
}

// =========================================================
// PAYMENTS
// =========================================================
// PaymentResponse (nested inside OrderResponse.payment)
export const paymentFromResponse = (p) => {
  if (!p) return null

  return {
    id: p.id,
    orderId: p.orderId,
    method: p.method,                                   // CASH_ON_DELIVERY | EASYPAISA | ...
    status: (p.status || '').toUpperCase(),             // PAYMENT_PENDING | ...
    amount: p.amount != null ? Number(p.amount) : 0,
    transactionReference: p.transactionReference || null,
    paidAmount: p.paidAmount != null ? Number(p.paidAmount) : null,
    paymentProofUrl: p.paymentProofUrl || null,
    account: p.paymentAccount || null,
    verifiedBy: p.verifiedBy ?? null,
    verificationTimestamp: p.verificationTimestamp || null,
    rejectionReason: p.rejectionReason || null,
    createdAt: p.createdAt || null,
  }
}

// =========================================================
// ORDERS
// =========================================================
// OrderResponse -> the shape MyOrders / OrderDetails / SellerDashboard render.
// Status stays as the RAW backend enum (PENDING, OUT_FOR_DELIVERY, ...);
// use orderStatusLabel/orderStatusColor from constants.js for display.

export const orderFromResponse = (o = {}) => {
  const items = (o.items || []).map((i) => ({
    productId: i.productId,
    title: i.title,
    qty: i.quantity,
    unit: i.unit,
    price: i.price != null ? Number(i.price) : 0,
    subtotal: Number(i.price || 0) * Number(i.quantity || 0),
  }))

  const status = String(o.status || 'PENDING').toUpperCase()
  const payment = paymentFromResponse(o.payment)

  return {
    id: o.id,
    displayId: `ORD-${o.id}`,
    buyerId: o.buyerId,
    buyerName: o.buyerName || undefined,
    sellerId: o.sellerId,
    sellerName: o.sellerShopName,
    status,
    statusLabel: orderStatusLabel[status] || titleCase(status),
    subtotal: o.subtotal != null ? Number(o.subtotal) : items.reduce((s, i) => s + i.subtotal, 0),
    discountAmount: o.discountAmount != null ? Number(o.discountAmount) : 0,
    // Backend field is singular: deliveryCharge.
    deliveryCharge: o.deliveryCharge != null ? Number(o.deliveryCharge) : 0,
    totalAmount: o.totalAmount != null ? Number(o.totalAmount) : 0,
    couponCode: o.couponCode || undefined,
    deliveryAddress: o.deliveryAddress,
    city: o.city || undefined,
    province: o.province || undefined,
    phone: o.phone || undefined,
    items,
    payment,
    paymentMethod: payment?.method || undefined,
    paymentStatus: payment?.status || undefined,
    orderDate: o.orderDate ? new Date(o.orderDate).toISOString().split('T')[0] : '',
    orderDateTime: o.orderDate || null,
  }
}

// Cart items belonging to ONE seller -> an OrderRequest body.
//
// sellerId and paymentMethod are @NotNull/@NotBlank on the backend, so both are
// always sent. Prices are deliberately NOT sent — the server re-prices every
// line from the DB and recalculates subtotal/discount/delivery/total.
export const cartGroupToOrderRequest = (sellerId, items, delivery = {}) => ({
  sellerId: Number(sellerId),
  items: items.map((i) => ({ productId: i.productId, quantity: i.qty })),
  deliveryAddress: delivery.deliveryAddress,
  paymentMethod: delivery.paymentMethod,
  ...(delivery.buyerName ? { buyerName: delivery.buyerName } : {}),
  ...(delivery.phone ? { phone: delivery.phone } : {}),
  ...(delivery.city ? { city: delivery.city } : {}),
  ...(delivery.province ? { province: delivery.province } : {}),
  ...(delivery.couponCode ? { couponCode: delivery.couponCode } : {}),
  ...(delivery.paymentAccountId ? { paymentAccountId: Number(delivery.paymentAccountId) } : {}),
  ...(delivery.transactionReference ? { transactionReference: delivery.transactionReference } : {}),
  ...(delivery.paidAmount != null ? { paidAmount: Number(delivery.paidAmount) } : {}),
  ...(delivery.paymentProofUrl ? { paymentProofUrl: delivery.paymentProofUrl } : {}),
})

// =========================================================
// SELLER
// =========================================================
// SellerProfileResponse -> the shape SellerStore.jsx / SellerDashboard render.
export const sellerFromResponse = (s = {}) => ({
  id: s.id,
  userId: s.userId,            // needed by GET /marketplace/payment-accounts/seller/{sellerUserId}
  sellerName: s.sellerName || undefined,
  shopName: s.shopName,
  description: s.description || '',
  logoUrl: s.storeLogoUrl || null,
  phone: s.phone || undefined,
  email: s.email || undefined,
  address: s.address || undefined,
  city: s.city || undefined,
  province: s.province || undefined,
  location: s.location || [s.city, s.province].filter(Boolean).join(', ') || '',
  sellerType: s.sellerType || undefined,
  status: (s.status || '').toUpperCase() || undefined,
  verified: !!s.verified,
  moderationReason: s.moderationReason || null,
  rating: s.rating ?? 0,
  totalSales: s.totalSales ?? 0,
  joinedAsSellerOn: s.joinedAsSellerOn || undefined,
})

// PaymentAccountResponse -> what the checkout shows a buyer for manual transfers.
export const paymentAccountFromResponse = (a = {}) => ({
  id: a.id,
  ownerUserId: a.ownerUserId,
  type: (a.type || '').toUpperCase(),   // EASYPAISA | JAZZCASH | BANK_TRANSFER
  accountTitle: a.accountTitle,
  accountNumber: a.accountNumber,
  bankName: a.bankName || undefined,
  iban: a.iban || undefined,
  active: !!a.active,
})
