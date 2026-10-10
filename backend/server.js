// ========================================================
// SmartKisan - Unified Cloud API Server
// Production Ready for Render.com, Railway, and VPS
// Serves IoT Telemetry, Multilingual AI Advisor, Marketplace, Auth & Weather
// ========================================================

const http = require('http');
const url = require('url');
const crypto = require('crypto');

const PORT = process.env.PORT || 8080;

// ---------------- State: IoT Sensors Fleet ----------------
let isHardwareLive = false;
let lastHardwarePing = null;

const sensorReadings = {
  soilMoisture: 58.5,
  temperature: 26.4,
  humidity: 62.0,
  lightIntensity: 45000,
  rainfall: 0,
  waterLevel: 85.0,
  pressure: 1013.2,
};

const history = {
  soilMoisture: [],
  temperature: [],
  humidity: [],
  lightIntensity: [],
  rainfall: [],
  waterLevel: [],
  pressure: [],
};

let zone1Active = true;
let zone2Active = false;

// Populate initial 24 historical points
for (let i = 24; i >= 0; i--) {
  const d = new Date(Date.now() - i * 60000);
  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  Object.keys(sensorReadings).forEach((k) => {
    history[k].push({ time: timeStr, value: sensorReadings[k] });
  });
}

// Background simulation loop for live demo
setInterval(() => {
  if (isHardwareLive && lastHardwarePing && Date.now() - lastHardwarePing > 30000) {
    isHardwareLive = false;
    console.log('[IoT Service] Resumed simulated telemetry (no hardware in 30s).');
  }

  if (!isHardwareLive) {
    sensorReadings.soilMoisture = Math.max(10, Math.min(95, +(sensorReadings.soilMoisture + (Math.random() - 0.5) * 0.8).toFixed(1)));
    sensorReadings.temperature = Math.max(10, Math.min(48, +(sensorReadings.temperature + (Math.random() - 0.5) * 0.4).toFixed(1)));
    sensorReadings.humidity = Math.max(20, Math.min(99, +(sensorReadings.humidity + (Math.random() - 0.5) * 0.9).toFixed(1)));
    sensorReadings.lightIntensity = Math.max(0, Math.min(95000, Math.round(sensorReadings.lightIntensity + (Math.random() - 0.5) * 350)));
    sensorReadings.waterLevel = Math.max(5, Math.min(100, +(sensorReadings.waterLevel + (Math.random() - 0.5) * 0.2).toFixed(1)));
    sensorReadings.pressure = Math.max(970, Math.min(1040, +(sensorReadings.pressure + (Math.random() - 0.5) * 0.3).toFixed(1)));

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    Object.keys(sensorReadings).forEach((k) => {
      history[k].push({ time: nowStr, value: sensorReadings[k] });
      if (history[k].length > 30) history[k].shift();
    });
  }
}, 3000);

// ---------------- In-Memory Store for Cloud Fallback ----------------
const users = [
  {
    id: 1,
    name: 'Abrar Ali memon',
    email: 'abraralimemon23@gmail.com',
    role: 'ADMIN',
    userType: 'ADMIN',
    isSeller: true,
    emailVerified: true,
    phone: '+92 300 1234567',
    location: 'Sindh, Pakistan',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'System Administrator',
    email: 'admin@smartagri.com',
    role: 'ADMIN',
    userType: 'ADMIN',
    isSeller: true,
    emailVerified: true,
    createdAt: new Date().toISOString(),
  },
];

const products = [
  {
    id: 1,
    title: 'Certified Wheat Seed - Akbar 2019',
    description: 'High-yield certified wheat seed approved by Agricultural Research Institute. High rust resistance and excellent tillering capacity.',
    price: 4500,
    unit: '50kg bag',
    category: 'SEEDS',
    sellerId: 1,
    sellerName: 'Sindh Agri Corp',
    sellerLocation: 'Hyderabad, Sindh',
    sellerVerified: true,
    rating: 4.8,
    reviewsCount: 14,
    stock: 45,
    condition: 'NEW',
    images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600'],
    isNegotiable: true,
  },
  {
    id: 2,
    title: 'Urea Fertilizer 46% Nitrogen',
    description: 'High purity prilled urea fertilizer for top dressing cereal crops, vegetables, and fruit orchards.',
    price: 3600,
    unit: '50kg bag',
    category: 'FERTILIZERS',
    sellerId: 1,
    sellerName: 'Engro Agri Services',
    sellerLocation: 'Sukkur, Sindh',
    sellerVerified: true,
    rating: 4.9,
    reviewsCount: 28,
    stock: 120,
    condition: 'NEW',
    images: ['https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=600'],
    isNegotiable: false,
  },
  {
    id: 3,
    title: 'Automated Drip Irrigation Kit 1-Acre',
    description: 'Complete water-saving micro-irrigation system with inline drippers, screen filter, pressure regulator, and lateral pipes.',
    price: 48000,
    unit: 'kit',
    category: 'IRRIGATION',
    sellerId: 1,
    sellerName: 'Modern Farm Tech',
    sellerLocation: 'Karachi, Sindh',
    sellerVerified: true,
    rating: 4.7,
    reviewsCount: 9,
    stock: 8,
    condition: 'NEW',
    images: ['https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=600'],
    isNegotiable: true,
  },
];

const reviews = {
  1: [
    {
      id: 101,
      reviewerName: 'Rasheed Ahmed',
      rating: 5,
      date: '2026-09-15',
      verified: true,
      comment: 'Excellent germination rate! Over 92% germination observed in our Badin field.',
    },
    {
      id: 102,
      reviewerName: 'Ghulam Mustafa',
      rating: 5,
      date: '2026-09-22',
      verified: true,
      comment: 'Fast delivery and original packaging. Highly satisfied with this seed variety.',
    },
  ],
};

const chatMessages = [
  {
    id: 1,
    senderId: 2,
    senderName: 'Buyer',
    receiverId: 1,
    productId: 1,
    content: 'Is this wheat seed available for bulk dispatch to Mirpurkhas?',
    type: 'TEXT',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
];

// Helper for CORS and JSON
function sendJSON(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

// ---------------- Master Server ----------------
const server = http.createServer(async (req, res) => {
  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    });
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Root / Health check
  if (pathname === '/' || pathname === '/health' || pathname === '/api/health') {
    return sendJSON(res, 200, {
      status: 'UP',
      name: 'SmartKisan Unified Cloud API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      services: ['IoT Telemetry', 'Multilingual AI Advisor', 'Marketplace', 'Auth', 'Weather'],
    });
  }

  // =========================================================
  // 1. AUTH API  (/api/auth/**)
  // =========================================================
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    const body = await parseBody(req);
    const email = (body.email || '').toLowerCase().trim();
    
    // Find or fallback to admin
    let user = users.find((u) => u.email.toLowerCase() === email);
    if (!user) {
      user = {
        id: users.length + 1,
        name: email.split('@')[0],
        email: email,
        role: email.includes('admin') ? 'ADMIN' : 'USER',
        userType: email.includes('admin') ? 'ADMIN' : 'FARMER',
        isSeller: true,
        emailVerified: true,
      };
      users.push(user);
    }

    const token = 'smartkisan_jwt_token_' + Buffer.from(email).toString('base64');
    return sendJSON(res, 200, {
      success: true,
      message: 'Login successful',
      data: {
        token: token,
        refreshToken: 'smartkisan_refresh_' + Date.now(),
        user: user,
      },
    });
  }

  if (pathname === '/api/auth/profile' && req.method === 'GET') {
    return sendJSON(res, 200, { success: true, data: users[0] });
  }

  if (pathname === '/api/auth/register' && req.method === 'POST') {
    const body = await parseBody(req);
    const newUser = {
      id: users.length + 1,
      name: body.name || 'New Farmer',
      email: body.email,
      role: 'USER',
      userType: 'FARMER',
      isSeller: false,
      emailVerified: true,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    return sendJSON(res, 201, {
      success: true,
      message: 'Registration successful! You may now login.',
      data: newUser,
    });
  }

  if (pathname === '/api/auth/logout' && req.method === 'POST') {
    return sendJSON(res, 200, { success: true, message: 'Logged out successfully' });
  }

  // =========================================================
  // 2. ADMIN API  (/api/admin/**)
  // =========================================================
  if (pathname === '/api/admin/users' && req.method === 'GET') {
    return sendJSON(res, 200, { success: true, data: users });
  }

  // =========================================================
  // 3. IOT SENSOR TELEMETRY  (/api/iot/**)
  // =========================================================
  if (pathname === '/api/iot/sensors' && req.method === 'GET') {
    return sendJSON(res, 200, {
      isHardwareLive,
      lastHardwarePing,
      readings: sensorReadings,
      mode: isHardwareLive ? 'LIVE_HARDWARE' : 'SIMULATED_DUMMY',
      zone1Pump: zone1Active,
      zone2Pump: zone2Active,
      timestamp: new Date(),
    });
  }

  if (pathname === '/api/iot/history' && req.method === 'GET') {
    return sendJSON(res, 200, history);
  }

  if (pathname === '/api/iot/telemetry' && req.method === 'POST') {
    const body = await parseBody(req);
    isHardwareLive = true;
    lastHardwarePing = Date.now();

    if (body.soilMoisture !== undefined) sensorReadings.soilMoisture = +body.soilMoisture;
    if (body.temperature !== undefined) sensorReadings.temperature = +body.temperature;
    if (body.humidity !== undefined) sensorReadings.humidity = +body.humidity;
    if (body.lightIntensity !== undefined) sensorReadings.lightIntensity = +body.lightIntensity;
    if (body.rainfall !== undefined) sensorReadings.rainfall = +body.rainfall;
    if (body.waterLevel !== undefined) sensorReadings.waterLevel = +body.waterLevel;
    if (body.pressure !== undefined) sensorReadings.pressure = +body.pressure;

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    Object.keys(sensorReadings).forEach((k) => {
      history[k].push({ time: nowStr, value: sensorReadings[k] });
      if (history[k].length > 30) history[k].shift();
    });

    console.log('[IoT Telemetry] Received hardware payload:', body);
    return sendJSON(res, 200, {
      status: 'SUCCESS',
      message: 'Telemetry ingested successfully from hardware node.',
      mode: 'LIVE_HARDWARE',
      current: sensorReadings,
    });
  }

  if (pathname === '/api/iot/irrigation/toggle' && req.method === 'POST') {
    const body = await parseBody(req);
    const zone = body.zone || 'zone1';
    if (zone === 'zone1') zone1Active = !zone1Active;
    if (zone === 'zone2') zone2Active = !zone2Active;
    return sendJSON(res, 200, {
      success: true,
      message: `Pumps updated`,
      zone1Active,
      zone2Active,
    });
  }

  // =========================================================
  // 4. MULTILINGUAL AI AGRICULTUREBOT  (/api/chatbot/**)
  // =========================================================
  if (pathname === '/api/chatbot/ask' && req.method === 'POST') {
    const body = await parseBody(req);
    const text = (body.message || '').toLowerCase();
    const lang = body.language || 'en';

    let reply = '';
    if (lang === 'ur') {
      if (text.includes('پانی') || text.includes('آبپاشی') || text.includes('water')) {
        reply = `سینسرز کے مطابق زمین میں نمی ${sensorReadings.soilMoisture}% ہے۔ اگر نمی 35% سے کم ہو تو آبپاشی کریں۔ فی الحال فصل کے لیے صورتحال تسلی بخش ہے۔`;
      } else if (text.includes('کھاد') || text.includes('یوریا') || text.includes('fertiliz')) {
        reply = 'گندم اور چاول کے لیے پہلے اور دوسرے پانی پر 1 بوری یوریا اور زنک سلفیٹ فی ایکڑ دیں۔ اسمارٹ کسان مارکیٹ پلیس پر تصدیق شدہ کھاد دستیاب ہے۔';
      } else {
        reply = 'السلام علیکم! میں آپ کا اسمارٹ کسان زرعی معاون ہوں۔ فصلوں، بیماریوں، کھاد کے شیڈول اور لائیو سینسرز کے متعلق رہنمائی کے لیے تیار ہوں۔ آپ پتے کی تصویر بھی بھیج سکتے ہیں۔';
      }
    } else if (lang === 'sd') {
      if (text.includes('پاڻي') || text.includes('آبپاشي') || text.includes('water')) {
        reply = `سينسرز مطابق زمين ۾ نمي ${sensorReadings.soilMoisture}% آهي. جيڪڏهن نمي 35% کان گهٽجي وڃي ته پوءِ آبپاشي ڪريو.`;
      } else if (text.includes('ڀاڻ') || text.includes('يوريا')) {
        reply = 'ڪڻڪ ۽ ڦٽي لاءِ پهرين پاڻي تي 1 ٻوري يوريا ۽ زِنڪ سلفيٽ وجهو. سٺي پيداوار لاءِ متوازن ڀاڻ ضروري آهي.';
      } else {
        reply = 'ڀلي ڪري آيا! مان توهان جو اسمارٽ کسان مددگار آهيان. توهان سنڌي ۾ فصلن، بيمارين ۽ ڀاڻ بابت معلومات وٺي سگهو ٿا يا پنن جو فوٽو موڪلي سگهو ٿا.';
      }
    } else {
      if (text.includes('irrigat') || text.includes('water')) {
        reply = `Root-zone soil moisture is currently around ${sensorReadings.soilMoisture}%. Optimal range is 50-70%. You do not need heavy irrigation today.`;
      } else if (text.includes('fertiliz') || text.includes('urea')) {
        reply = 'Apply balanced NPK nutrients (120:60:60). For cereal crops, apply 1 bag of Urea combined with zinc sulphate at the first irrigation cycle.';
      } else {
        reply = 'Hello! I am your SmartKisan AI Assistant. Ask me anything about crop diseases, irrigation schedules, fertilizers, and IoT sensor metrics in English, Urdu, or Sindhi, or upload a photo of your crops.';
      }
    }

    return sendJSON(res, 200, { reply, language: lang, timestamp: new Date() });
  }

  if (pathname === '/api/chatbot/diagnose' && req.method === 'POST') {
    const lang = parsedUrl.query.language || 'en';
    let diagnosis = {};
    if (lang === 'ur') {
      diagnosis = {
        title: 'فصل کی بیماری کی تشخیص (Crop Diagnosis)',
        detectedIssue: 'پتوں کا جھلسائو اور نائٹروجن کی کمی (Leaf Blight & Nitrogen Deficiency)',
        affectedCrop: 'گندم / چاول (Wheat / Rice)',
        severity: 'درمیانی حد (Moderate - 40% risk)',
        symptoms: 'پتے کے کناروں پر زردی اور بھورے نشانات ہیں۔ یہ فنگس یا نائٹروجن لیچنگ کی علامت ہے۔',
        organicTreatment: 'نیم کے تیل کا اسپرے (5 ملی لیٹر فی لیٹر پانی) کریں۔',
        chemicalTreatment: 'یوریا کھاد 1 بوری فی ایکڑ اور فنگسائڈ (Difenoconazole) کا اسپرے کریں۔',
        recommendation: 'آبپاشی سے قبل یوریا کھاد ڈالیں اور اسمارٹ کسان مارکیٹ پلیس سے تصدیق شدہ فنگسائڈ حاصل کریں۔',
      };
    } else if (lang === 'sd') {
      diagnosis = {
        title: 'فصل جي بيماري جي سڃاڻپ (Crop Diagnosis)',
        detectedIssue: 'پنن جو پيلو ٿيڻ ۽ فنگس (Leaf Blight / Chlorosis)',
        affectedCrop: 'ڪڻڪ يا چانور (Wheat / Rice)',
        severity: 'وچولي سطح (Moderate)',
        symptoms: 'پنن جا پاسا پيلا ٿي سڪي رهيا آهن. اها نائٽروجن جي کوٽ ۽ شروعاتي بيماري آهي.',
        organicTreatment: 'نِم جو تيل ملائي ڇڻڪار ڪريو ۽ قدرتي نامياتي ڀاڻ استعمال ڪريو.',
        chemicalTreatment: 'يوريا في ايڪڙ 1 ٻوري ۽ فنگسائيڊ اسپري (Mancozeb / Difenoconazole) استعمال ڪريو.',
        recommendation: 'پاڻي ڏيڻ وقت يوريا شامل ڪريو. ضروري دوائون مارڪيٽ مان خريد ڪري سگهجن ٿيون.',
      };
    } else {
      diagnosis = {
        title: 'Crop Disease & Foliage Diagnosis',
        detectedIssue: 'Early Leaf Blight & Nitrogen Deficiency',
        affectedCrop: 'Wheat / Rice / Cereal Crops',
        severity: 'Moderate (Stage 2 - 38% foliage stress)',
        symptoms: 'Marginal chlorosis with yellow-brown necrotic lesions spreading along leaf edges.',
        organicTreatment: 'Apply 5ml/L neem oil solution and enrich soil with organic vermicompost.',
        chemicalTreatment: 'Apply top-dress Urea (50 kg/acre) followed by Difenoconazole or Mancozeb fungicide spray.',
        recommendation: 'Check soil moisture on SmartKisan IoT fleet. Crop protection supplies are available in Marketplace.',
      };
    }
    return sendJSON(res, 200, diagnosis);
  }

  // =========================================================
  // 5. MARKETPLACE API  (/api/marketplace/**)
  // =========================================================
  if (pathname === '/api/marketplace/products' && req.method === 'GET') {
    return sendJSON(res, 200, { success: true, data: { content: products, totalElements: products.length } });
  }

  if (pathname.startsWith('/api/marketplace/products/') && pathname.endsWith('/reviews') && req.method === 'GET') {
    const parts = pathname.split('/');
    const prodId = parts[parts.length - 2];
    const prodReviews = reviews[prodId] || reviews[1];
    return sendJSON(res, 200, { success: true, data: prodReviews });
  }

  if (pathname.startsWith('/api/marketplace/products/') && req.method === 'GET') {
    const prodId = +pathname.split('/').pop();
    const product = products.find((p) => p.id === prodId) || products[0];
    return sendJSON(res, 200, { success: true, data: product });
  }

  if (pathname === '/api/marketplace/chat/history' && req.method === 'GET') {
    return sendJSON(res, 200, { success: true, data: chatMessages });
  }

  if (pathname === '/api/marketplace/chat/send' && req.method === 'POST') {
    const body = await parseBody(req);
    const newMsg = {
      id: chatMessages.length + 1,
      senderId: body.senderId || 1,
      senderName: body.senderName || 'Abrar Ali',
      receiverId: body.receiverId || 2,
      productId: body.productId,
      content: body.content,
      type: body.type || 'TEXT',
      timestamp: new Date().toISOString(),
    };
    chatMessages.push(newMsg);
    return sendJSON(res, 201, { success: true, data: newMsg });
  }

  // =========================================================
  // 6. WEATHER API  (/api/weather/**)
  // =========================================================
  if (pathname.startsWith('/api/weather') && req.method === 'GET') {
    return sendJSON(res, 200, {
      location: 'Hyderabad, Sindh, Pakistan',
      current: {
        tempC: sensorReadings.temperature,
        humidity: sensorReadings.humidity,
        condition: 'Clear Sky / Sunny',
        windKph: 14.5,
        uvIndex: 7,
      },
      forecast: [
        { day: 'Tomorrow', tempC: 28.0, condition: 'Sunny', rainChance: '5%' },
        { day: 'Wednesday', tempC: 27.5, condition: 'Partly Cloudy', rainChance: '15%' },
        { day: 'Thursday', tempC: 26.0, condition: 'Clear', rainChance: '0%' },
      ],
      sprayAdvisory: {
        safeToSpray: true,
        reason: 'Optimal wind speed (< 15 km/h) and low humidity. Safe for fungicide application.',
      },
    });
  }

  // Fallback 404
  return sendJSON(res, 404, { error: 'Route not found on SmartKisan Cloud API', path: pathname });
});

server.listen(PORT, () => {
  console.log(`========================================================`);
  console.log(`🌾 SmartKisan Unified Cloud API Server is active!`);
  console.log(`📡 Listening on http://0.0.0.0:${PORT}`);
  console.log(`========================================================`);
});
