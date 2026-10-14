-- ========================================================
-- SmartKisan MySQL Database Schema
-- Database: smartkisan_db
-- ========================================================

CREATE DATABASE IF NOT EXISTS `smartkisan_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `smartkisan_db`;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) DEFAULT 'USER',
  `user_type` VARCHAR(50) DEFAULT 'FARMER',
  `is_seller` BOOLEAN DEFAULT FALSE,
  `email_verified` BOOLEAN DEFAULT TRUE,
  `phone` VARCHAR(50) DEFAULT NULL,
  `location` VARCHAR(255) DEFAULT 'Hyderabad, Sindh, Pakistan',
  `avatar` LONGTEXT DEFAULT NULL,
  `avatar_image` LONGTEXT DEFAULT NULL,
  `farm_size` VARCHAR(100) DEFAULT NULL,
  `allowed_services` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Products Table
CREATE TABLE IF NOT EXISTS `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `unit` VARCHAR(50) DEFAULT 'unit',
  `category` VARCHAR(100) DEFAULT 'SEEDS',
  `seller_id` INT DEFAULT 1,
  `seller_name` VARCHAR(255) DEFAULT 'SmartKisan Agro Hub',
  `seller_location` VARCHAR(255) DEFAULT 'Hyderabad, Sindh',
  `seller_verified` BOOLEAN DEFAULT TRUE,
  `rating` DECIMAL(3,2) DEFAULT 5.00,
  `reviews_count` INT DEFAULT 0,
  `stock` INT DEFAULT 10,
  `condition_state` VARCHAR(50) DEFAULT 'NEW',
  `image_url` LONGTEXT DEFAULT NULL,
  `images_json` JSON DEFAULT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_products_category` (`category`),
  INDEX `idx_products_seller` (`seller_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Orders Table
CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `buyer_id` INT DEFAULT 1,
  `seller_id` INT DEFAULT 1,
  `seller_shop_name` VARCHAR(255) DEFAULT 'SmartKisan Agro Hub',
  `status` VARCHAR(50) DEFAULT 'PENDING',
  `subtotal` DECIMAL(10,2) NOT NULL,
  `discount_amount` DECIMAL(10,2) DEFAULT 0.00,
  `delivery_charge` DECIMAL(10,2) DEFAULT 0.00,
  `total_amount` DECIMAL(10,2) NOT NULL,
  `coupon_code` VARCHAR(50) DEFAULT NULL,
  `delivery_address` TEXT NOT NULL,
  `city` VARCHAR(100) DEFAULT 'Hyderabad',
  `province` VARCHAR(100) DEFAULT 'Sindh',
  `phone` VARCHAR(50) NOT NULL,
  `buyer_name` VARCHAR(255) NOT NULL,
  `items_json` JSON DEFAULT NULL,
  `payment_method` VARCHAR(50) DEFAULT 'CASH_ON_DELIVERY',
  `payment_status` VARCHAR(50) DEFAULT 'PENDING',
  `payment_proof_url` LONGTEXT DEFAULT NULL,
  `transaction_reference` VARCHAR(255) DEFAULT NULL,
  `payment_json` JSON DEFAULT NULL,
  `order_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_orders_buyer` (`buyer_id`),
  INDEX `idx_orders_seller` (`seller_id`),
  INDEX `idx_orders_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Seller Profiles Table
CREATE TABLE IF NOT EXISTS `seller_profiles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  `seller_name` VARCHAR(255) NOT NULL,
  `shop_name` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `store_logo_url` LONGTEXT DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `city` VARCHAR(100) DEFAULT 'Hyderabad',
  `province` VARCHAR(100) DEFAULT 'Sindh',
  `location` VARCHAR(255) DEFAULT NULL,
  `seller_type` VARCHAR(50) DEFAULT 'FARMER_SELLER',
  `status` VARCHAR(50) DEFAULT 'APPROVED',
  `verified` BOOLEAN DEFAULT TRUE,
  `moderation_reason` TEXT DEFAULT NULL,
  `rating` DECIMAL(3,2) DEFAULT 5.00,
  `total_sales` INT DEFAULT 0,
  `joined_as_seller_on` VARCHAR(50) DEFAULT NULL,
  INDEX `idx_seller_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Pending Sellers Queue Table
CREATE TABLE IF NOT EXISTS `pending_sellers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `seller_name` VARCHAR(255) NOT NULL,
  `shop_name` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `store_logo_url` LONGTEXT DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `city` VARCHAR(100) DEFAULT 'Hyderabad',
  `province` VARCHAR(100) DEFAULT 'Sindh',
  `location` VARCHAR(255) DEFAULT NULL,
  `seller_type` VARCHAR(50) DEFAULT 'FARMER_SELLER',
  `status` VARCHAR(50) DEFAULT 'PENDING',
  `verified` BOOLEAN DEFAULT FALSE,
  `moderation_reason` TEXT DEFAULT NULL,
  `rating` DECIMAL(3,2) DEFAULT 5.00,
  `total_sales` INT DEFAULT 0,
  `joined_as_seller_on` VARCHAR(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Pending Payments Queue Table
CREATE TABLE IF NOT EXISTS `pending_payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `order_number` VARCHAR(100) DEFAULT NULL,
  `buyer_id` INT DEFAULT NULL,
  `buyer_name` VARCHAR(255) DEFAULT NULL,
  `seller_id` INT DEFAULT NULL,
  `seller_shop_name` VARCHAR(255) DEFAULT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `paid_amount` DECIMAL(10,2) DEFAULT NULL,
  `expected_amount` DECIMAL(10,2) DEFAULT NULL,
  `total_amount` DECIMAL(10,2) DEFAULT NULL,
  `order_total` DECIMAL(10,2) DEFAULT NULL,
  `payment_method` VARCHAR(50) DEFAULT 'BANK_TRANSFER',
  `status` VARCHAR(50) DEFAULT 'PENDING_VERIFICATION',
  `payment_status` VARCHAR(50) DEFAULT 'PENDING_VERIFICATION',
  `bank_name` VARCHAR(100) DEFAULT NULL,
  `account_number` VARCHAR(100) DEFAULT NULL,
  `transaction_ref` VARCHAR(255) DEFAULT NULL,
  `transaction_reference` VARCHAR(255) DEFAULT NULL,
  `proof_url` LONGTEXT DEFAULT NULL,
  `payment_proof_url` LONGTEXT DEFAULT NULL,
  `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_pending_payments_order` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Payment Accounts Table
CREATE TABLE IF NOT EXISTS `payment_accounts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `bank_name` VARCHAR(100) NOT NULL,
  `account_title` VARCHAR(255) NOT NULL,
  `account_number` VARCHAR(100) NOT NULL,
  `iban` VARCHAR(100) DEFAULT NULL,
  `account_type` VARCHAR(50) DEFAULT 'BANK_TRANSFER',
  `branch_code` VARCHAR(50) DEFAULT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `instructions` TEXT DEFAULT NULL,
  INDEX `idx_payment_accounts_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Reviews Table
CREATE TABLE IF NOT EXISTS `reviews` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `product_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `user_name` VARCHAR(255) NOT NULL,
  `user_avatar` LONGTEXT DEFAULT NULL,
  `rating` DECIMAL(2,1) NOT NULL,
  `comment` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_reviews_product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Chat Messages Table
CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sender_id` INT NOT NULL,
  `recipient_id` INT NOT NULL,
  `product_id` INT DEFAULT NULL,
  `text` TEXT NOT NULL,
  `timestamp` VARCHAR(100) NOT NULL,
  `is_read` BOOLEAN DEFAULT FALSE,
  INDEX `idx_chat_participants` (`sender_id`, `recipient_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. IoT Alerts Table
CREATE TABLE IF NOT EXISTS `iot_alerts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sensor_id` VARCHAR(100) NOT NULL,
  `sensor_name` VARCHAR(255) NOT NULL,
  `alert_type` VARCHAR(50) NOT NULL,
  `severity` VARCHAR(50) NOT NULL,
  `message` TEXT NOT NULL,
  `timestamp` VARCHAR(100) NOT NULL,
  `is_resolved` BOOLEAN DEFAULT FALSE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Email OTPs Table
CREATE TABLE IF NOT EXISTS `email_otps` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL,
  `purpose` VARCHAR(50) NOT NULL,
  `otp` VARCHAR(10) NOT NULL,
  `expires_at` BIGINT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_otps_email_purpose` (`email`, `purpose`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
