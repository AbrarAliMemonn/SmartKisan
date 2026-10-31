export const API_BASE_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') ? 'https://smartkisan-api-c7adbxfpggg9c9ft.westus3-01.azurewebsites.net/api' : 'http://localhost:5000/api')
export const WS_URL = import.meta.env.VITE_WS_URL || (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') ? 'https://smartkisan-api-c7adbxfpggg9c9ft.westus3-01.azurewebsites.net' : 'http://localhost:5000')

// Root of the backend (without the /api prefix) — Spring Security's OAuth2
// endpoints (/oauth2/authorization/**) live outside the /api namespace.
export const API_ROOT_URL = API_BASE_URL.replace(/\/api\/?$/, '')

export const soilTypes = [
  { id: 1, name: 'Clay Soil', phRange: '5.5-7.0' },
  { id: 2, name: 'Sandy Soil', phRange: '6.0-7.5' },
  { id: 3, name: 'Loamy Soil', phRange: '6.0-7.0' },
  { id: 4, name: 'Peaty Soil', phRange: '4.0-5.5' },
]

// ---------------- IoT Sensor Fleet ----------------
// Central definition for the six physical sensors monitored across
// the Dashboard, Live Monitoring and Sensor Details pages.
export const sensorDefinitions = [
  {
    id: 'soilMoisture',
    name: 'Soil Moisture',
    module: 'Capacitive Soil Probe',
    pin: 'GPIO 34 (ADC1_CH6)',
    unit: '%',
    icon: 'Droplets',
    color: '#16a34a',
    min: 0,
    max: 100,
    thresholds: { low: 30, high: 80 },
    description: 'Volumetric soil moisture content calibrated from analog ADC.',
  },
  {
    id: 'temperature',
    name: 'Field Temperature',
    module: 'DHT11 Temperature Sensor',
    pin: 'GPIO 4 (Single-Bus)',
    unit: '°C',
    icon: 'Thermometer',
    color: '#ea580c',
    min: -10,
    max: 50,
    thresholds: { low: 15, high: 35 },
    description: 'Ambient field temperature captured via DHT11 digital interface.',
  },
  {
    id: 'humidity',
    name: 'Relative Humidity',
    module: 'DHT11 Humidity Sensor',
    pin: 'GPIO 4 (Single-Bus)',
    unit: '%',
    icon: 'CloudDrizzle',
    color: '#0284c7',
    min: 0,
    max: 100,
    thresholds: { low: 40, high: 85 },
    description: 'Relative atmospheric humidity in crop micro-climate.',
  },
  {
    id: 'rainfall',
    name: 'Rain Detection',
    module: 'Rain Sensor Plate',
    pin: 'GPIO 35 (ADC1_CH7)',
    unit: '%',
    icon: 'CloudRain',
    color: '#2563eb',
    min: 0,
    max: 100,
    thresholds: { low: 0, high: 60 },
    description: 'Surface rain droplet detection via analog comparator plate.',
  },
  {
    id: 'waterLevel',
    name: 'Reservoir Level',
    module: 'Submersible Depth Probe',
    pin: 'GPIO 32 (ADC1_CH4)',
    unit: '%',
    icon: 'Waves',
    color: '#0891b2',
    min: 0,
    max: 100,
    thresholds: { low: 20, high: 95 },
    description: 'Storage tank water level for irrigation solenoid valves.',
  },
  {
    id: 'lightIntensity',
    name: 'Solar Radiation',
    module: 'LDR Photoresistor Module',
    pin: 'ADC1 Channel',
    unit: 'lux',
    icon: 'Sun',
    color: '#ca8a04',
    min: 0,
    max: 100000,
    thresholds: { low: 5000, high: 80000 },
    description: 'Ambient sunlight illumination intensity over crop canopy.',
  },
  {
    id: 'pressure',
    name: 'Atmospheric Pressure',
    module: 'Barometric Sensor',
    pin: 'I2C (SDA/SCL)',
    unit: 'hPa',
    icon: 'Gauge',
    color: '#7c3aed',
    min: 900,
    max: 1100,
    thresholds: { low: 980, high: 1030 },
    description: 'Local barometric air pressure.',
  },
]
// =========================================================
// MARKETPLACE
// =========================================================
// Everything below mirrors the marketplace-service enums exactly.
// Ids are the backend enum names — never invent your own values,
// or the API will reject the request with 400.

// ProductCategory (com.smartagri.entity.ProductCategory)
// Also served live by GET /marketplace/categories — this list is the
// offline fallback used until that call resolves.
export const productCategories = [
  { id: 'SEEDS', name: 'Seeds', icon: '🌱' },
  { id: 'FERTILIZERS', name: 'Fertilizers', icon: '🧪' },
  { id: 'CROP_PROTECTION', name: 'Crop Protection', icon: '🛡️' },
  { id: 'EQUIPMENT', name: 'Agricultural Equipment', icon: '🚜' },
  { id: 'IRRIGATION', name: 'Irrigation', icon: '💧' },
  { id: 'SMART_FARMING', name: 'Smart Farming / IoT', icon: '📡' },
  { id: 'LIVESTOCK', name: 'Livestock', icon: '🐄' },
  { id: 'FARMER_PRODUCE', name: 'Farmer Produce', icon: '🌾' },
  { id: 'TOOLS', name: 'Farm Tools', icon: '🛠️' },
]

export const categoryLabel = productCategories.reduce(
  (acc, c) => ({ ...acc, [c.id]: c.name }),
  {}
)

export const categoryIcon = productCategories.reduce(
  (acc, c) => ({ ...acc, [c.id]: c.icon }),
  {}
)

export const productUnits = ['kg', 'quintal', 'ton', 'liter', 'piece', 'acre', 'dozen', 'bag']

// ProductCondition
export const productConditions = ['NEW', 'USED', 'REFURBISHED']

// OrderStatus (com.smartagri.entity.OrderStatus) — all 11 states
export const orderStatuses = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'READY_TO_SHIP',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'RETURN_REQUESTED',
  'RETURNED',
  'REFUNDED',
]

// Statuses a seller is realistically allowed to move an order through.
export const sellerAssignableStatuses = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'READY_TO_SHIP',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
]

export const orderStatusLabel = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  READY_TO_SHIP: 'Ready to Ship',
  SHIPPED: 'Shipped',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  RETURN_REQUESTED: 'Return Requested',
  RETURNED: 'Returned',
  REFUNDED: 'Refunded',
}

export const orderStatusColor = {
  PENDING: 'badge-warning',
  CONFIRMED: 'badge-info',
  PROCESSING: 'badge-info',
  READY_TO_SHIP: 'badge-info',
  SHIPPED: 'badge-info',
  OUT_FOR_DELIVERY: 'badge-info',
  DELIVERED: 'badge-success',
  CANCELLED: 'badge-danger',
  RETURN_REQUESTED: 'badge-warning',
  RETURNED: 'badge-danger',
  REFUNDED: 'badge-info',
}

// ProductStatus (moderation lifecycle)
export const productStatusLabel = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Live',
  REJECTED: 'Rejected',
  OUT_OF_STOCK: 'Out of Stock',
  SUSPENDED: 'Suspended',
}

export const productStatusColor = {
  DRAFT: 'badge-info',
  PENDING_APPROVAL: 'badge-warning',
  APPROVED: 'badge-success',
  REJECTED: 'badge-danger',
  OUT_OF_STOCK: 'badge-warning',
  SUSPENDED: 'badge-danger',
}

// ---------------- Payments ----------------
// PaymentMethod (com.smartagri.entity.PaymentMethod).
// MANUAL ONLY — no Stripe / PayPal / gateway integration anywhere.
// `id` MUST match the enum name; sending "COD" used to fail validation.
export const paymentMethods = [
  {
    id: 'CASH_ON_DELIVERY',
    name: 'Cash on Delivery',
    hint: 'Pay in cash when your order is delivered.',
    icon: '💵',
    manual: false,
  },
  {
    id: 'EASYPAISA',
    name: 'EasyPaisa',
    hint: 'Transfer to the seller\u2019s EasyPaisa account, then submit the TID.',
    icon: '📱',
    manual: true,
    accountType: 'EASYPAISA',
  },
  {
    id: 'JAZZCASH',
    name: 'JazzCash',
    hint: 'Transfer to the seller\u2019s JazzCash account, then submit the TID.',
    icon: '📲',
    manual: true,
    accountType: 'JAZZCASH',
  },
  {
    id: 'BANK_TRANSFER',
    name: 'Bank Transfer',
    hint: 'Transfer to the seller\u2019s bank account and upload the receipt.',
    icon: '🏦',
    manual: true,
    accountType: 'BANK_TRANSFER',
  },
]

export const paymentMethodLabel = paymentMethods.reduce(
  (acc, m) => ({ ...acc, [m.id]: m.name }),
  {}
)

// PaymentAccountType — the manual methods a seller can register an account for.
export const paymentAccountTypes = ['EASYPAISA', 'JAZZCASH', 'BANK_TRANSFER']

// PaymentStatus (com.smartagri.entity.PaymentStatus)
export const paymentStatusLabel = {
  PAYMENT_PENDING: 'Payment Pending',
  PAYMENT_PENDING_VERIFICATION: 'Awaiting Verification',
  PAYMENT_VERIFIED: 'Payment Verified',
  PAYMENT_REJECTED: 'Payment Rejected',
  PAYMENT_PAID: 'Paid',
}

export const paymentStatusColor = {
  PAYMENT_PENDING: 'badge-warning',
  PAYMENT_PENDING_VERIFICATION: 'badge-warning',
  PAYMENT_VERIFIED: 'badge-success',
  PAYMENT_REJECTED: 'badge-danger',
  PAYMENT_PAID: 'badge-success',
}

// SellerStatus — seller application lifecycle
export const sellerStatusLabel = {
  PENDING: 'Application Pending',
  APPROVED: 'Seller Dashboard',
  REJECTED: 'Application Rejected',
  SUSPENDED: 'Seller Suspended',
}

// ---------------- Uploads ----------------
export const UPLOAD_MAX_BYTES = 5 * 1024 * 1024 // matches spring.servlet.multipart.max-file-size
export const UPLOAD_ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
