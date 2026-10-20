import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'

const LanguageContext = createContext()

export const translations = {
  en: {
    // Navigation
    nav_home: 'Home',
    nav_features: 'Features',
    nav_iot_fleet: 'IoT Fleet',
    nav_crop_doctor: 'Crop Doctor',
    nav_crop_guide: 'Crop Guide',
    nav_marketplace: 'Marketplace',
    nav_weather: 'Live Weather',
    nav_contact: 'Contact Us',
    nav_dashboard: 'IoT Dashboard',
    nav_live_monitoring: 'Live Monitoring',
    nav_sensor_details: 'Sensor Details',
    nav_cart: 'Cart',
    nav_orders: 'My Orders',
    nav_wishlist: 'Wishlist',
    nav_seller_center: 'Seller Center',
    nav_admin: 'Admin Panel',
    nav_profile: 'My Profile',
    nav_settings: 'Settings',
    nav_signin: 'Sign In',
    nav_register: 'Register',
    nav_logout: 'Log Out',
    nav_search_placeholder: 'Search products, sensors, crops...',

    // Landing Page Hero
    hero_badge: "Pakistan's #1 Smart IoT Agriculture Platform",
    hero_title_1: 'Precision Agriculture',
    hero_title_2: 'Powered by IoT & AI',
    hero_subtitle: 'Empowering Pakistani farmers with real-time soil telemetry, localized AI crop diagnostics, and a zero-commission digital agri-marketplace.',
    hero_btn_dashboard: 'Explore Live Farm',
    hero_btn_marketplace: 'Browse Marketplace',
    hero_stat_farmers: '12,500+ Active Farmers',
    hero_stat_sensors: '45,000+ IoT Telemetry Pings/Day',
    hero_stat_coverage: 'Sindh, Punjab & KPK',

    // IoT Sensor Fleet
    iot_fleet_title: 'Real-Time Hardware Fleet',
    iot_fleet_subtitle: 'Live readings streamed from agricultural IoT nodes installed across Pakistani farms.',
    sensor_soil_moisture: 'Soil Moisture',
    sensor_temperature: 'Air Temperature',
    sensor_humidity: 'Air Humidity',
    sensor_light: 'Light Intensity',
    sensor_water_level: 'Water Level',
    sensor_pressure: 'Barometric Pressure',
    sensor_status_online: 'Live & Streaming',
    sensor_status_offline: 'Offline',
    sensor_optimal: 'Optimal Condition',
    sensor_irrigation_needed: 'Irrigation Needed',

    // Weather
    weather_title: 'Agricultural Weather & Forecast',
    weather_spray_safe: 'Safe for Spraying',
    weather_spray_warning: 'High Winds - Postpone Spraying',
    weather_wind: 'Wind Speed',
    weather_humidity: 'Humidity',

    // Marketplace
    market_title: 'Agri Marketplace',
    market_subtitle: 'Direct farmer-to-buyer marketplace with verified agricultural inputs and harvests.',
    market_search_placeholder: 'Search seeds, fertilizers, pesticides, machinery...',
    market_all_categories: 'All Categories',
    market_add_to_cart: 'Add to Cart',
    market_buy_now: 'Buy Now',
    market_out_of_stock: 'Out of Stock',
    market_in_stock: 'In Stock',
    market_verified_seller: 'Verified Seller',
    market_price: 'Price',
    market_category: 'Category',

    // Contact
    contact_title: 'Get in Touch with SmartKisan',
    contact_subtitle: 'Have a question about deploying IoT sensors on your land or joining the marketplace? Reach out directly.',
    contact_name: 'Your Full Name',
    contact_email: 'Email Address',
    contact_phone: 'Phone Number',
    contact_message: 'Your Message',
    contact_submit: 'Send Message',
    contact_sending: 'Sending Inquiry...',

    // Common
    common_loading: 'Loading...',
    common_back: 'Back',
    common_save: 'Save',
    common_cancel: 'Cancel',
    common_view_all: 'View All',
  },

  ur: {
    // Navigation
    nav_home: 'ہوم',
    nav_features: 'خصوصیات',
    nav_iot_fleet: 'آئی او ٹی سینسرز',
    nav_crop_doctor: 'فصل ڈاکٹر',
    nav_crop_guide: 'فصل گائیڈ',
    nav_marketplace: 'زرعی مارکیٹ',
    nav_weather: 'موسمی صورتحال',
    nav_contact: 'رابطہ کریں',
    nav_dashboard: 'ڈیش بورڈ',
    nav_live_monitoring: 'لائیو مانیٹرنگ',
    nav_sensor_details: 'سینسر تفصیلات',
    nav_cart: 'ٹوکری',
    nav_orders: 'میرے آرڈرز',
    nav_wishlist: 'پسندیدہ فہرست',
    nav_seller_center: 'سیلر سینٹر',
    nav_admin: 'ایڈمن پینل',
    nav_profile: 'میری پروفائل',
    nav_settings: 'ترتیبات',
    nav_signin: 'لاگ ان کریں',
    nav_register: 'رجسٹر کریں',
    nav_logout: 'لاگ آؤٹ',
    nav_search_placeholder: 'پروڈکٹس، سینسرز یا فصلیں تلاش کریں...',

    // Landing Page Hero
    hero_badge: 'پاکستان کا نمبر 1 سمارٹ آئی او ٹی زرعی پلیٹ فارم',
    hero_title_1: 'جدید اور سمارٹ کاشتکاری',
    hero_title_2: 'آئی او ٹی اور مصنوعی ذہانت سے لیس',
    hero_subtitle: 'پاکستانی کسانوں کے لیے لائیو مٹی کی نمی کی پیمائش، مقامی زبان میں فصلوں کے امراض کی تشخیص اور بلا معاوضہ زرعی منڈی۔',
    hero_btn_dashboard: 'لائیو فارم دیکھیں',
    hero_btn_marketplace: 'مارکیٹ کا دورہ کریں',
    hero_stat_farmers: '12,500+ فعال کسان',
    hero_stat_sensors: '45,000+ یومیہ سینسر ریکارڈز',
    hero_stat_coverage: 'سندھ، پنجاب اور خیبر پختونخوا',

    // IoT Sensor Fleet
    iot_fleet_title: 'لائیو زرعی سینسرز',
    iot_fleet_subtitle: 'پاکستانی کھیتوں میں نصب سمارٹ سینسرز سے موصول ہونے والا اصل وقت کا ڈیٹا۔',
    sensor_soil_moisture: 'مٹی کی نمی',
    sensor_temperature: 'درجہ حرارت',
    sensor_humidity: 'ہوا میں نمی',
    sensor_light: 'روشنی کی شدت',
    sensor_water_level: 'پانی کی سطح',
    sensor_pressure: 'ہوائی دباؤ',
    sensor_status_online: 'لائیو فعال',
    sensor_status_offline: 'آف لائن',
    sensor_optimal: 'بہترین حالت',
    sensor_irrigation_needed: 'پانی لگانے کی ضرورت',

    // Weather
    weather_title: 'موسم اور زراعت کی پیشگوئی',
    weather_spray_safe: 'اسپرے کے لیے محفوظ وقت',
    weather_spray_warning: 'تیز ہوا - اسپرے مؤخر کریں',
    weather_wind: 'ہوا کی رفتار',
    weather_humidity: 'نمی کا تناسب',

    // Marketplace
    market_title: 'سمارٹ کسان مارکیٹ',
    market_subtitle: 'کسانوں اور خریداروں کے درمیان بغیر کسی کمیشن کے براہ راست تصدیق شدہ بیج، کھاد اور پیداوار کی خرید و فروخت۔',
    market_search_placeholder: 'بیج، کھاد، زرعی ادویات یا آلات تلاش کریں...',
    market_all_categories: 'تمام اقسام',
    market_add_to_cart: 'ٹوکری میں ڈالیں',
    market_buy_now: 'ابھی خریدیں',
    market_out_of_stock: 'اسٹاک ختم',
    market_in_stock: 'دستیاب ہے',
    market_verified_seller: 'تصدیق شدہ وینڈر',
    market_price: 'قیمت',
    market_category: 'قسم',

    // Contact
    contact_title: 'سمارٹ کسان ٹیم سے رابطہ کریں',
    contact_subtitle: 'اپنی زمین پر آئی او ٹی سینسرز لگانے یا منڈی میں شامل ہونے کے لیے ہم سے بلا جھجھک رابطہ کریں۔',
    contact_name: 'آپ کا پورا نام',
    contact_email: 'ای میل ایڈریس',
    contact_phone: 'فون نمبر',
    contact_message: 'آپ کا پیغام',
    contact_submit: 'پیغام بھیجیں',
    contact_sending: 'پیغام ارسال ہو رہا ہے...',

    // Common
    common_loading: 'براہ کرم انتظار کریں...',
    common_back: 'واپس',
    common_save: 'محفوظ کریں',
    common_cancel: 'منسوخ کریں',
    common_view_all: 'سب دیکھیں',
  },
}

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem('smartkisan_language') || 'en'
    } catch {
      return 'en'
    }
  })

  const setLanguage = (lang) => {
    const validLang = lang === 'ur' ? 'ur' : 'en'
    setLanguageState(validLang)
    try {
      localStorage.setItem('smartkisan_language', validLang)
    } catch {}
  }

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ur' : 'en')
  }

  const isRTL = language === 'ur'

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
      document.documentElement.lang = language
      if (isRTL) {
        document.body.classList.add('font-urdu')
      } else {
        document.body.classList.remove('font-urdu')
      }
    }
  }, [language, isRTL])

  const t = (key, fallback = '') => {
    const dict = translations[language] || translations.en
    if (dict && dict[key]) {
      return dict[key]
    }
    return translations.en[key] || fallback || key
  }

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      isRTL,
      t,
    }),
    [language, isRTL]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export default LanguageContext
