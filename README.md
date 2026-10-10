# 🌾 SmartKisan - Intelligent IoT Smart Agriculture & Marketplace Platform

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.4-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Kafka](https://img.shields.io/badge/Apache%20Kafka-4.2.1%20KRaft-black.svg)](https://kafka.apache.org/)
[![Vite](https://img.shields.io/badge/Vite-8.0-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8.svg)](https://tailwindcss.com/)

**SmartKisan** is a modern, enterprise-grade, event-driven Smart Agriculture microservices ecosystem. It bridges physical IoT telemetry, smart irrigation automation, an agricultural e-commerce marketplace with real-time buyer-seller negotiation, and a multilingual multimodal AI crop advisor (English, Urdu, Sindhi).

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    Client["Frontend (React 19 + Vite 8)"] --> Gateway["Spring Cloud API Gateway (:8080)"]
    Gateway --> Eureka["Eureka Service Discovery (:8761)"]
    
    Gateway --> Auth["Auth & User Service (:8081)"]
    Gateway --> Market["Marketplace & Chat Service (:8082 + Socket.IO :9099)"]
    Gateway --> Weather["Weather Advisory Service (:8084)"]
    Gateway --> IoT["IoT Crop Telemetry Service (:8085)"]
    Gateway --> Bot["Multilingual AI AgricultureBot (:8086)"]
    
    Auth --> MySQL[("MySQL 8.0 (:3306)")]
    Market --> MySQL
    Market --> Kafka["Apache Kafka 4.2.1 KRaft (:9092)"]
    IoT --> Kafka
```

---

## ✨ Key Features

### 📡 1. Real-Time IoT Telemetry & Smart Irrigation
- **Simulated & Live Telemetry**: Streams real-time soil moisture, temperature, humidity, water level, light intensity, and barometric pressure.
- **Hardware Integration**: Ingests physical ESP32/Arduino data via `POST /api/iot/telemetry` and automatically switches between `SIMULATED` and `HARDWARE (LIVE)` modes.
- **Automated Irrigation**: Smart thresholds with manual/auto solenoid valve controls.

### 🛒 2. Agricultural Marketplace & Instant Buyer-Seller Chat
- **Farmer & Buyer Storefront**: Seeds, fertilizers, equipment, livestock, and crop produce.
- **Product Reviews & Ratings**: 5-star rating breakdown, verified buyer badges, and buyer feedback.
- **Instant Live Chat**: Direct messaging between buyers and sellers via Netty-SocketIO.
- **Price Bargaining**: Built-in counter-offer and price negotiation cards.

### 🤖 3. Multilingual & Multimodal AI AgricultureBot
- **Trilingual NLP**: Diagnostic advice in **English**, **Urdu (`اردو`)**, and **Sindhi (`سنڌي`)**.
- **Crop Disease Diagnosis**: Upload plant/leaf photos to receive instant symptoms, organic remedies, and chemical spray treatments.

### 🛡️ 4. Role-Based Access Control & Admin Panel
- **User Roles**: Farmer, Buyer, Seller, and SuperAdmin.
- **Admin Control Center**: User moderation, seller approvals, product listings verification, and system telemetry monitoring.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Java 21 LTS**
- **Node.js 20+**
- **MySQL 8.0** (Port 3306)
- **Apache Kafka** (Included in project)

### 1. Start Kafka (KRaft Mode)
```cmd
start-kafka.bat
```

### 2. Start Microservices Stack
```cmd
start-all-spring-services.bat
```
*Or use the fast developer runner for instant zero-wait startup:*
```cmd
node backend/services-runner.js
```

### 3. Start Frontend
```cmd
cd frontend
npm install
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 🐳 Docker Deployment
To launch the entire platform in production containers:
```bash
docker compose up -d
```

---

## 📄 License
This project is licensed under the MIT License.
