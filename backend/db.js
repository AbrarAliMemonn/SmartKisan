// ========================================================
// SmartKisan Database Module (MySQL with Resilient Fallback)
// All sensitive database keys and credentials live safely here on backend
// ========================================================

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'root',
  database: process.env.DB_NAME || 'smartkisan_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

let pool = null;
let isConnected = false;

// Initialize Database & Tables
async function initDatabase(initialSeedData = null) {
  try {
    // 1. First connect without database selected to ensure database exists
    const serverConn = await mysql.createConnection({
      host: DB_CONFIG.host,
      port: DB_CONFIG.port,
      user: DB_CONFIG.user,
      password: DB_CONFIG.password,
    });

    await serverConn.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await serverConn.end();

    // 2. Create the main application pool
    pool = mysql.createPool(DB_CONFIG);

    // Test connection
    const testConn = await pool.getConnection();
    testConn.release();

    isConnected = true;
    console.log(`[MySQL Database] Successfully connected to '${DB_CONFIG.database}' at ${DB_CONFIG.host}:${DB_CONFIG.port}`);

    // 3. Create tables if they do not exist
    await createTables();

    // 4. Seed initial data if tables are empty
    if (initialSeedData) {
      await seedIfEmpty(initialSeedData);
    }

    return true;
  } catch (err) {
    console.warn(`[MySQL Database Notice] MySQL not available (${err.message}). Using persistent JSON storage fallback.`);
    isConnected = false;
    return false;
  }
}

async function createTables() {
  if (!pool) return;

  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'USER',
      user_type VARCHAR(50) DEFAULT 'FARMER',
      is_seller BOOLEAN DEFAULT FALSE,
      email_verified BOOLEAN DEFAULT TRUE,
      phone VARCHAR(50) DEFAULT NULL,
      location VARCHAR(255) DEFAULT 'Hyderabad, Sindh, Pakistan',
      avatar LONGTEXT DEFAULT NULL,
      avatar_image LONGTEXT DEFAULT NULL,
      farm_size VARCHAR(100) DEFAULT NULL,
      allowed_services JSON DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_users_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT DEFAULT NULL,
      price DECIMAL(10,2) NOT NULL,
      unit VARCHAR(50) DEFAULT 'unit',
      category VARCHAR(100) DEFAULT 'SEEDS',
      seller_id INT DEFAULT 1,
      seller_name VARCHAR(255) DEFAULT 'SmartKisan Agro Hub',
      seller_location VARCHAR(255) DEFAULT 'Hyderabad, Sindh',
      seller_verified BOOLEAN DEFAULT TRUE,
      rating DECIMAL(3,2) DEFAULT 5.00,
      reviews_count INT DEFAULT 0,
      stock INT DEFAULT 10,
      condition_state VARCHAR(50) DEFAULT 'NEW',
      image_url LONGTEXT DEFAULT NULL,
      images_json JSON DEFAULT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_products_category (category)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      buyer_id INT DEFAULT 1,
      seller_id INT DEFAULT 1,
      seller_shop_name VARCHAR(255) DEFAULT 'SmartKisan Agro Hub',
      status VARCHAR(50) DEFAULT 'PENDING',
      subtotal DECIMAL(10,2) NOT NULL,
      discount_amount DECIMAL(10,2) DEFAULT 0.00,
      delivery_charge DECIMAL(10,2) DEFAULT 0.00,
      total_amount DECIMAL(10,2) NOT NULL,
      coupon_code VARCHAR(50) DEFAULT NULL,
      delivery_address TEXT NOT NULL,
      city VARCHAR(100) DEFAULT 'Hyderabad',
      province VARCHAR(100) DEFAULT 'Sindh',
      phone VARCHAR(50) NOT NULL,
      buyer_name VARCHAR(255) NOT NULL,
      items_json JSON DEFAULT NULL,
      payment_method VARCHAR(50) DEFAULT 'CASH_ON_DELIVERY',
      payment_status VARCHAR(50) DEFAULT 'PENDING',
      payment_proof_url LONGTEXT DEFAULT NULL,
      transaction_reference VARCHAR(255) DEFAULT NULL,
      payment_json JSON DEFAULT NULL,
      order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_orders_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS seller_profiles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL UNIQUE,
      seller_name VARCHAR(255) NOT NULL,
      shop_name VARCHAR(255) NOT NULL,
      description TEXT DEFAULT NULL,
      store_logo_url LONGTEXT DEFAULT NULL,
      phone VARCHAR(50) DEFAULT NULL,
      email VARCHAR(255) DEFAULT NULL,
      address TEXT DEFAULT NULL,
      city VARCHAR(100) DEFAULT 'Hyderabad',
      province VARCHAR(100) DEFAULT 'Sindh',
      location VARCHAR(255) DEFAULT NULL,
      seller_type VARCHAR(50) DEFAULT 'FARMER_SELLER',
      status VARCHAR(50) DEFAULT 'APPROVED',
      verified BOOLEAN DEFAULT TRUE,
      moderation_reason TEXT DEFAULT NULL,
      rating DECIMAL(3,2) DEFAULT 5.00,
      total_sales INT DEFAULT 0,
      joined_as_seller_on VARCHAR(50) DEFAULT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS pending_sellers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      seller_name VARCHAR(255) NOT NULL,
      shop_name VARCHAR(255) NOT NULL,
      description TEXT DEFAULT NULL,
      store_logo_url LONGTEXT DEFAULT NULL,
      phone VARCHAR(50) DEFAULT NULL,
      email VARCHAR(255) DEFAULT NULL,
      address TEXT DEFAULT NULL,
      city VARCHAR(100) DEFAULT 'Hyderabad',
      province VARCHAR(100) DEFAULT 'Sindh',
      location VARCHAR(255) DEFAULT NULL,
      seller_type VARCHAR(50) DEFAULT 'FARMER_SELLER',
      status VARCHAR(50) DEFAULT 'PENDING',
      verified BOOLEAN DEFAULT FALSE,
      moderation_reason TEXT DEFAULT NULL,
      rating DECIMAL(3,2) DEFAULT 5.00,
      total_sales INT DEFAULT 0,
      joined_as_seller_on VARCHAR(50) DEFAULT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS pending_payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      order_number VARCHAR(100) DEFAULT NULL,
      buyer_id INT DEFAULT NULL,
      buyer_name VARCHAR(255) DEFAULT NULL,
      seller_id INT DEFAULT NULL,
      seller_shop_name VARCHAR(255) DEFAULT NULL,
      amount DECIMAL(10,2) NOT NULL,
      paid_amount DECIMAL(10,2) DEFAULT NULL,
      expected_amount DECIMAL(10,2) DEFAULT NULL,
      total_amount DECIMAL(10,2) DEFAULT NULL,
      order_total DECIMAL(10,2) DEFAULT NULL,
      payment_method VARCHAR(50) DEFAULT 'BANK_TRANSFER',
      status VARCHAR(50) DEFAULT 'PENDING_VERIFICATION',
      payment_status VARCHAR(50) DEFAULT 'PENDING_VERIFICATION',
      bank_name VARCHAR(100) DEFAULT NULL,
      account_number VARCHAR(100) DEFAULT NULL,
      transaction_ref VARCHAR(255) DEFAULT NULL,
      transaction_reference VARCHAR(255) DEFAULT NULL,
      proof_url LONGTEXT DEFAULT NULL,
      payment_proof_url LONGTEXT DEFAULT NULL,
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS payment_accounts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      bank_name VARCHAR(100) NOT NULL,
      account_title VARCHAR(255) NOT NULL,
      account_number VARCHAR(100) NOT NULL,
      iban VARCHAR(100) DEFAULT NULL,
      account_type VARCHAR(50) DEFAULT 'BANK_TRANSFER',
      branch_code VARCHAR(50) DEFAULT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      instructions TEXT DEFAULT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      user_id INT NOT NULL,
      user_name VARCHAR(255) NOT NULL,
      user_avatar LONGTEXT DEFAULT NULL,
      rating DECIMAL(2,1) NOT NULL,
      comment TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS chat_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sender_id INT NOT NULL,
      recipient_id INT NOT NULL,
      product_id INT DEFAULT NULL,
      text TEXT NOT NULL,
      timestamp VARCHAR(100) NOT NULL,
      is_read BOOLEAN DEFAULT FALSE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS email_otps (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      purpose VARCHAR(50) NOT NULL,
      otp VARCHAR(10) NOT NULL,
      expires_at BIGINT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_otps_email_purpose (email, purpose)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS iot_devices (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      device_id VARCHAR(100) NOT NULL UNIQUE,
      device_key VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      location VARCHAR(255) DEFAULT 'Field Zone A',
      crop VARCHAR(100) DEFAULT 'Wheat',
      status VARCHAR(50) DEFAULT 'OFFLINE',
      is_hardware_live BOOLEAN DEFAULT FALSE,
      last_ping TIMESTAMP NULL DEFAULT NULL,
      current_readings JSON DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_iot_devices_user (user_id),
      INDEX idx_iot_devices_key (device_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS iot_telemetry (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      device_id VARCHAR(100) NOT NULL,
      user_id INT NOT NULL,
      soil_moisture DECIMAL(5,2) DEFAULT NULL,
      temperature DECIMAL(5,2) DEFAULT NULL,
      humidity DECIMAL(5,2) DEFAULT NULL,
      light_intensity DECIMAL(8,2) DEFAULT NULL,
      rainfall DECIMAL(5,2) DEFAULT NULL,
      water_level DECIMAL(5,2) DEFAULT NULL,
      pressure DECIMAL(6,2) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_iot_telemetry_device (device_id),
      INDEX idx_iot_telemetry_user (user_id),
      INDEX idx_iot_telemetry_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
  ];

  for (const q of queries) {
    await pool.query(q);
  }
}

// Initial seed migration from JSON to MySQL if tables are empty
async function seedIfEmpty(seedData) {
  if (!pool || !isConnected) return;

  try {
    const [userRows] = await pool.query('SELECT COUNT(*) as count FROM users');
    if (userRows[0].count === 0 && Array.isArray(seedData.users) && seedData.users.length) {
      console.log(`[MySQL Database] Migrating ${seedData.users.length} initial users into MySQL...`);
      for (const u of seedData.users) {
        await pool.query(
          `INSERT INTO users (id, name, email, password, role, user_type, is_seller, email_verified, phone, location, avatar, avatar_image, farm_size, allowed_services, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE name=VALUES(name)`,
          [
            u.id,
            u.name,
            u.email.toLowerCase().trim(),
            u.password,
            u.role || 'USER',
            u.userType || 'FARMER',
            Boolean(u.isSeller),
            u.emailVerified !== undefined ? Boolean(u.emailVerified) : true,
            u.phone || '',
            u.location || 'Hyderabad, Sindh, Pakistan',
            u.avatar || u.avatarImage || '',
            u.avatarImage || u.avatar || '',
            u.farmSize || '',
            JSON.stringify(u.allowedServices || ['iot', 'marketplace', 'chatbot', 'weather']),
            u.createdAt ? new Date(u.createdAt) : new Date(),
          ]
        );
      }
    }

    const [prodRows] = await pool.query('SELECT COUNT(*) as count FROM products');
    if (prodRows[0].count === 0 && Array.isArray(seedData.products) && seedData.products.length) {
      console.log(`[MySQL Database] Migrating ${seedData.products.length} products into MySQL...`);
      for (const p of seedData.products) {
        await pool.query(
          `INSERT INTO products (id, title, description, price, unit, category, seller_id, seller_name, seller_location, seller_verified, rating, reviews_count, stock, condition_state, image_url, images_json)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE title=VALUES(title)`,
          [
            p.id,
            p.title,
            p.description || '',
            p.price || 0,
            p.unit || 'unit',
            p.category || 'SEEDS',
            p.sellerId || 1,
            p.sellerName || 'SmartKisan Agro Hub',
            p.sellerLocation || 'Hyderabad, Sindh',
            Boolean(p.sellerVerified),
            p.rating || 5.0,
            p.reviewsCount || 0,
            p.stock ?? 10,
            p.condition || 'NEW',
            p.images?.[0] || p.imageUrl || p.image || '',
            JSON.stringify(p.images || [p.imageUrl || p.image || '']),
          ]
        );
      }
    }

    const [ordRows] = await pool.query('SELECT COUNT(*) as count FROM orders');
    if (ordRows[0].count === 0 && Array.isArray(seedData.orders) && seedData.orders.length) {
      for (const o of seedData.orders) {
        await pool.query(
          `INSERT INTO orders (id, buyer_id, seller_id, seller_shop_name, status, subtotal, discount_amount, delivery_charge, total_amount, coupon_code, delivery_address, city, province, phone, buyer_name, items_json, payment_method, payment_status, payment_proof_url, transaction_reference, payment_json, order_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE status=VALUES(status)`,
          [
            o.id,
            o.buyerId || 1,
            o.sellerId || 1,
            o.sellerShopName || 'SmartKisan Agro Hub',
            o.status || 'PENDING',
            o.subtotal || o.totalAmount || 0,
            o.discountAmount || 0,
            o.deliveryCharge || 0,
            o.totalAmount || 0,
            o.couponCode || '',
            o.deliveryAddress || '',
            o.city || 'Hyderabad',
            o.province || 'Sindh',
            o.phone || '',
            o.buyerName || '',
            JSON.stringify(o.items || []),
            o.payment?.paymentMethod || 'CASH_ON_DELIVERY',
            o.payment?.paymentStatus || 'PENDING',
            o.payment?.paymentProofUrl || '',
            o.payment?.transactionReference || '',
            JSON.stringify(o.payment || {}),
            o.orderDate ? new Date(o.orderDate) : new Date(),
          ]
        );
      }
    }

    const [sellerRows] = await pool.query('SELECT COUNT(*) as count FROM seller_profiles');
    if (sellerRows[0].count === 0 && Array.isArray(seedData.sellerProfiles) && seedData.sellerProfiles.length) {
      for (const s of seedData.sellerProfiles) {
        await pool.query(
          `INSERT INTO seller_profiles (id, user_id, seller_name, shop_name, description, store_logo_url, phone, email, address, city, province, location, seller_type, status, verified, rating, total_sales, joined_as_seller_on)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE shop_name=VALUES(shop_name)`,
          [
            s.id,
            s.userId,
            s.sellerName || '',
            s.shopName || '',
            s.description || '',
            s.storeLogoUrl || '',
            s.phone || '',
            s.email || '',
            s.address || '',
            s.city || 'Hyderabad',
            s.province || 'Sindh',
            s.location || '',
            s.sellerType || 'FARMER_SELLER',
            s.status || 'APPROVED',
            Boolean(s.verified),
            s.rating || 5.0,
            s.totalSales || 0,
            s.joinedAsSellerOn || '',
          ]
        );
      }
    }
  } catch (err) {
    console.error('[MySQL Seeding Notice]', err.message);
  }
}

// Helper to execute query
async function query(sql, params = []) {
  if (!pool || !isConnected) {
    throw new Error('MySQL is not connected');
  }
  const [rows] = await pool.query(sql, params);
  return rows;
}

// Fetch all data from MySQL into application memory models
async function loadAllFromMySql() {
  if (!pool || !isConnected) return null;

  try {
    const [uRows] = await pool.query('SELECT * FROM users ORDER BY id ASC');
    const users = uRows.map((r) => ({
      id: r.id,
      name: r.name,
      password: r.password,
      email: r.email,
      role: r.role,
      userType: r.user_type,
      isSeller: Boolean(r.is_seller),
      emailVerified: Boolean(r.email_verified),
      phone: r.phone || '',
      location: r.location || '',
      avatar: r.avatar || r.avatar_image || '',
      avatarImage: r.avatar_image || r.avatar || '',
      farmSize: r.farm_size || '',
      allowedServices: typeof r.allowed_services === 'string' ? JSON.parse(r.allowed_services) : (r.allowed_services || ['iot', 'marketplace', 'chatbot', 'weather']),
      createdAt: r.created_at,
    }));

    const [pRows] = await pool.query('SELECT * FROM products ORDER BY id ASC');
    const products = pRows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      price: parseFloat(r.price),
      unit: r.unit,
      category: r.category,
      sellerId: r.seller_id,
      sellerName: r.seller_name,
      sellerLocation: r.seller_location,
      sellerVerified: Boolean(r.seller_verified),
      rating: parseFloat(r.rating || 5.0),
      reviewsCount: r.reviews_count || 0,
      stock: r.stock,
      condition: r.condition_state,
      image: r.image_url,
      imageUrl: r.image_url,
      images: typeof r.images_json === 'string' ? JSON.parse(r.images_json) : (r.images_json || [r.image_url]),
    }));

    const [oRows] = await pool.query('SELECT * FROM orders ORDER BY id DESC');
    const orders = oRows.map((r) => ({
      id: r.id,
      buyerId: r.buyer_id,
      sellerId: r.seller_id,
      sellerShopName: r.seller_shop_name,
      status: r.status,
      subtotal: parseFloat(r.subtotal),
      discountAmount: parseFloat(r.discount_amount || 0),
      deliveryCharge: parseFloat(r.delivery_charge || 0),
      totalAmount: parseFloat(r.total_amount),
      couponCode: r.coupon_code || '',
      deliveryAddress: r.delivery_address,
      city: r.city,
      province: r.province,
      phone: r.phone,
      buyerName: r.buyer_name,
      items: typeof r.items_json === 'string' ? JSON.parse(r.items_json) : (r.items_json || []),
      orderDate: r.order_date,
      payment: typeof r.payment_json === 'string' && r.payment_json ? JSON.parse(r.payment_json) : {
        paymentMethod: r.payment_method,
        paymentStatus: r.payment_status,
        amount: parseFloat(r.total_amount),
        transactionReference: r.transaction_reference || '',
        paymentProofUrl: r.payment_proof_url || '',
      },
    }));

    const [sRows] = await pool.query('SELECT * FROM seller_profiles ORDER BY id ASC');
    const sellerProfiles = sRows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      sellerName: r.seller_name,
      shopName: r.shop_name,
      description: r.description,
      storeLogoUrl: r.store_logo_url,
      phone: r.phone,
      email: r.email,
      address: r.address,
      city: r.city,
      province: r.province,
      location: r.location,
      sellerType: r.seller_type,
      status: r.status,
      verified: Boolean(r.verified),
      rating: parseFloat(r.rating || 5.0),
      totalSales: r.total_sales || 0,
      joinedAsSellerOn: r.joined_as_seller_on,
    }));

    const [pendSRows] = await pool.query('SELECT * FROM pending_sellers ORDER BY id ASC');
    const pendingSellers = pendSRows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      sellerName: r.seller_name,
      shopName: r.shop_name,
      description: r.description,
      storeLogoUrl: r.store_logo_url,
      phone: r.phone,
      email: r.email,
      address: r.address,
      city: r.city,
      province: r.province,
      location: r.location,
      sellerType: r.seller_type,
      status: r.status,
      verified: Boolean(r.verified),
      moderationReason: r.moderation_reason || '',
      rating: parseFloat(r.rating || 5.0),
      totalSales: r.total_sales || 0,
      joinedAsSellerOn: r.joined_as_seller_on,
    }));

    const [pendPRows] = await pool.query('SELECT * FROM pending_payments ORDER BY id DESC');
    const pendingPayments = pendPRows.map((r) => ({
      id: r.id,
      orderId: r.order_id,
      orderNumber: r.order_number,
      buyerId: r.buyer_id,
      buyerName: r.buyer_name,
      sellerId: r.seller_id,
      sellerShopName: r.seller_shop_name,
      amount: parseFloat(r.amount),
      paidAmount: parseFloat(r.paid_amount || r.amount),
      expectedAmount: parseFloat(r.expected_amount || r.amount),
      totalAmount: parseFloat(r.total_amount || r.amount),
      paymentMethod: r.payment_method,
      status: r.status,
      paymentStatus: r.payment_status,
      bankName: r.bank_name,
      accountNumber: r.account_number,
      transactionRef: r.transaction_ref,
      transactionReference: r.transaction_reference,
      proofUrl: r.proof_url || r.payment_proof_url,
      paymentProofUrl: r.payment_proof_url || r.proof_url,
      submittedAt: r.submitted_at,
    }));

    return {
      users,
      products,
      orders,
      sellerProfiles,
      pendingSellers,
      pendingPayments,
    };
  } catch (err) {
    console.error('[MySQL Read Error]', err.message);
    return null;
  }
}

// Persist a single user to MySQL
async function upsertUserInMySql(user) {
  if (!pool || !isConnected) return;
  try {
    await pool.query(
      `INSERT INTO users (id, name, email, password, role, user_type, is_seller, email_verified, phone, location, avatar, avatar_image, farm_size, allowed_services)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name=VALUES(name),
         password=VALUES(password),
         role=VALUES(role),
         user_type=VALUES(user_type),
         is_seller=VALUES(is_seller),
         email_verified=VALUES(email_verified),
         phone=VALUES(phone),
         location=VALUES(location),
         avatar=VALUES(avatar),
         avatar_image=VALUES(avatar_image),
         farm_size=VALUES(farm_size),
         allowed_services=VALUES(allowed_services)`,
      [
        user.id || null,
        user.name,
        user.email.toLowerCase().trim(),
        user.password,
        user.role || 'USER',
        user.userType || 'FARMER',
        Boolean(user.isSeller),
        user.emailVerified !== undefined ? Boolean(user.emailVerified) : true,
        user.phone || '',
        user.location || 'Hyderabad, Sindh, Pakistan',
        user.avatar || user.avatarImage || '',
        user.avatarImage || user.avatar || '',
        user.farmSize || '',
        JSON.stringify(user.allowedServices || ['iot', 'marketplace', 'chatbot', 'weather']),
      ]
    );
  } catch (err) {
    console.error('[MySQL User Upsert Error]', err.message);
  }
}

// Persist a product to MySQL
async function upsertProductInMySql(p) {
  if (!pool || !isConnected) return;
  try {
    await pool.query(
      `INSERT INTO products (id, title, description, price, unit, category, seller_id, seller_name, seller_location, seller_verified, rating, reviews_count, stock, condition_state, image_url, images_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         title=VALUES(title),
         description=VALUES(description),
         price=VALUES(price),
         unit=VALUES(unit),
         category=VALUES(category),
         stock=VALUES(stock),
         image_url=VALUES(image_url),
         images_json=VALUES(images_json)`,
      [
        p.id || null,
        p.title,
        p.description || '',
        p.price || 0,
        p.unit || 'unit',
        p.category || 'SEEDS',
        p.sellerId || 1,
        p.sellerName || 'SmartKisan Agro Hub',
        p.sellerLocation || 'Hyderabad, Sindh',
        Boolean(p.sellerVerified),
        p.rating || 5.0,
        p.reviewsCount || 0,
        p.stock ?? 10,
        p.condition || 'NEW',
        p.images?.[0] || p.imageUrl || p.image || '',
        JSON.stringify(p.images || [p.imageUrl || p.image || '']),
      ]
    );
  } catch (err) {
    console.error('[MySQL Product Upsert Error]', err.message);
  }
}

// Persist an order to MySQL
async function insertOrderInMySql(o) {
  if (!pool || !isConnected) return;
  try {
    await pool.query(
      `INSERT INTO orders (id, buyer_id, seller_id, seller_shop_name, status, subtotal, discount_amount, delivery_charge, total_amount, coupon_code, delivery_address, city, province, phone, buyer_name, items_json, payment_method, payment_status, payment_proof_url, transaction_reference, payment_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE status=VALUES(status), payment_status=VALUES(payment_status)`,
      [
        o.id,
        o.buyerId || 1,
        o.sellerId || 1,
        o.sellerShopName || 'SmartKisan Agro Hub',
        o.status || 'PENDING',
        o.subtotal || o.totalAmount || 0,
        o.discountAmount || 0,
        o.deliveryCharge || 0,
        o.totalAmount || 0,
        o.couponCode || '',
        o.deliveryAddress || '',
        o.city || 'Hyderabad',
        o.province || 'Sindh',
        o.phone || '',
        o.buyerName || '',
        JSON.stringify(o.items || []),
        o.payment?.paymentMethod || 'CASH_ON_DELIVERY',
        o.payment?.paymentStatus || 'PENDING',
        o.payment?.paymentProofUrl || '',
        o.payment?.transactionReference || '',
        JSON.stringify(o.payment || {}),
      ]
    );
  } catch (err) {
    console.error('[MySQL Order Insert Error]', err.message);
  }
}

// Permanently delete a user and their linked data from MySQL
async function deleteUserFromMySql(userId, email) {
  if (!pool || !isConnected) return;
  try {
    const cleanEmail = (email || '').toLowerCase().trim();
    if (userId) {
      try { await pool.query('DELETE FROM iot_telemetry WHERE user_id = ?', [userId]); } catch (e) {}
      try { await pool.query('DELETE FROM iot_devices WHERE user_id = ?', [userId]); } catch (e) {}
      try { await pool.query('DELETE FROM user_settings WHERE user_id = ?', [userId]); } catch (e) {}
      try { await pool.query('DELETE FROM payment_accounts WHERE user_id = ?', [userId]); } catch (e) {}
      try { await pool.query('DELETE FROM pending_sellers WHERE user_id = ? OR email = ?', [userId, cleanEmail]); } catch (e) {}
      try { await pool.query('DELETE FROM seller_profiles WHERE user_id = ? OR email = ?', [userId, cleanEmail]); } catch (e) {}
      try { await pool.query('DELETE FROM users WHERE id = ? OR email = ?', [userId, cleanEmail]); } catch (e) {}
    } else if (cleanEmail) {
      try { await pool.query('DELETE FROM pending_sellers WHERE email = ?', [cleanEmail]); } catch (e) {}
      try { await pool.query('DELETE FROM seller_profiles WHERE email = ?', [cleanEmail]); } catch (e) {}
      try { await pool.query('DELETE FROM users WHERE email = ?', [cleanEmail]); } catch (e) {}
    }
    console.log(`[MySQL Database] Permanently deleted user (${userId || cleanEmail}) and linked IoT devices from database.`);
  } catch (err) {
    console.error('[MySQL User Delete Error]', err.message);
  }
}

// Persist IoT device to MySQL
async function upsertIotDeviceInMySql(d) {
  if (!pool || !isConnected || !d) return;
  try {
    await pool.query(
      `INSERT INTO iot_devices (id, user_id, device_id, device_key, name, location, crop, status, is_hardware_live, last_ping, current_readings)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name=VALUES(name),
         device_key=VALUES(device_key),
         location=VALUES(location),
         crop=VALUES(crop),
         status=VALUES(status),
         is_hardware_live=VALUES(is_hardware_live),
         last_ping=VALUES(last_ping),
         current_readings=VALUES(current_readings)`,
      [
        d.id || null,
        d.userId || 1,
        d.deviceId,
        d.deviceKey,
        d.name || 'Field Sensor Node',
        d.location || 'Field Zone A',
        d.crop || 'Wheat',
        d.status || 'OFFLINE',
        Boolean(d.isHardwareLive),
        d.lastPing ? new Date(d.lastPing) : null,
        JSON.stringify(d.currentReadings || {}),
      ]
    );
  } catch (err) {
    console.error('[MySQL IoT Device Upsert Error]', err.message);
  }
}

// Persist IoT telemetry entry to MySQL
async function insertIotTelemetryInMySql(t) {
  if (!pool || !isConnected || !t) return;
  try {
    await pool.query(
      `INSERT INTO iot_telemetry (device_id, user_id, soil_moisture, temperature, humidity, light_intensity, rainfall, water_level, pressure)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        t.deviceId,
        t.userId || 1,
        t.soilMoisture !== undefined ? t.soilMoisture : null,
        t.temperature !== undefined ? t.temperature : null,
        t.humidity !== undefined ? t.humidity : null,
        t.lightIntensity !== undefined ? t.lightIntensity : null,
        t.rainfall !== undefined ? t.rainfall : null,
        t.waterLevel !== undefined ? t.waterLevel : null,
        t.pressure !== undefined ? t.pressure : null,
      ]
    );
  } catch (err) {
    console.error('[MySQL Telemetry Insert Error]', err.message);
  }
}

module.exports = {
  DB_CONFIG,
  initDatabase,
  query,
  loadAllFromMySql,
  upsertUserInMySql,
  deleteUserFromMySql,
  upsertProductInMySql,
  insertOrderInMySql,
  upsertIotDeviceInMySql,
  insertIotTelemetryInMySql,
  isMySqlConnected: () => isConnected,
};
