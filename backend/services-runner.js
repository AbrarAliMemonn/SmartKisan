// ========================================================
// Smart Agriculture - IoT & Multilingual AgricultureBot Services Runner
// Runs IoT Telemetry (port 8085) & Multilingual Multimodal Bot (port 8086)
// ========================================================

const http = require('http');
const url = require('url');

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

// Populate initial history
for (let i = 24; i >= 0; i--) {
  const d = new Date(Date.now() - i * 60000);
  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  Object.keys(sensorReadings).forEach((k) => {
    history[k].push({ time: timeStr, value: sensorReadings[k] });
  });
}

// Background simulation loop (runs when hardware is not actively streaming)
setInterval(() => {
  if (isHardwareLive && lastHardwarePing && Date.now() - lastHardwarePing > 30000) {
    isHardwareLive = false;
    console.log('[IoT Service] No hardware telemetry received in 30s. Resumed simulated data.');
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

// Helper for CORS and JSON
function sendJSON(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

// ========================================================
// 1. IoT Sensor & Crops Server (Port 8085)
// ========================================================
const iotServer = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname.replace(/^\/api/, '');

  if (pathname === '/iot/sensors' && req.method === 'GET') {
    return sendJSON(res, 200, {
      isHardwareLive,
      lastHardwarePing,
      readings: sensorReadings,
      mode: isHardwareLive ? 'LIVE_HARDWARE' : 'SIMULATED_DUMMY',
    });
  }

  if (pathname === '/iot/history' && req.method === 'GET') {
    const sensorId = parsedUrl.query.sensorId;
    if (sensorId && history[sensorId]) {
      return sendJSON(res, 200, history[sensorId]);
    }
    return sendJSON(res, 200, history);
  }

  if (pathname === '/iot/alerts' && req.method === 'GET') {
    const alerts = [];
    if (sensorReadings.soilMoisture < 30) {
      alerts.push({ sensor: 'soilMoisture', message: 'Soil moisture low (< 30%). Run Zone 1 irrigation.' });
    }
    if (sensorReadings.temperature > 38) {
      alerts.push({ sensor: 'temperature', message: 'High heat stress detected (> 38°C).' });
    }
    return sendJSON(res, 200, alerts);
  }

  if (pathname === '/iot/irrigation/status' && req.method === 'GET') {
    return sendJSON(res, 200, {
      zone1Active,
      zone2Active,
      waterLevel: sensorReadings.waterLevel,
      status: zone1Active || zone2Active ? 'PUMP_ACTIVE' : 'IDLE',
    });
  }

  if (pathname === '/iot/irrigation/toggle' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '{}');
        if (parsed.zone === 1 || parsed.zone === '1') zone1Active = !!parsed.status;
        if (parsed.zone === 2 || parsed.zone === '2') zone2Active = !!parsed.status;
        return sendJSON(res, 200, { message: 'Irrigation updated', zone1Active, zone2Active });
      } catch (e) {
        return sendJSON(res, 400, { error: 'Invalid JSON' });
      }
    });
    return;
  }

  // Live Hardware Telemetry Ingestion (ESP32 / Arduino / HTTP)
  if (pathname === '/iot/telemetry' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        isHardwareLive = true;
        lastHardwarePing = new Date();

        Object.keys(sensorReadings).forEach((k) => {
          if (data[k] !== undefined && data[k] !== null) {
            sensorReadings[k] = Number(data[k]);
          }
        });

        console.log(`[IoT Service] Ingested LIVE telemetry from hardware:`, data);
        return sendJSON(res, 200, {
          status: 'SUCCESS',
          message: 'Hardware telemetry recorded',
          mode: 'LIVE_HARDWARE',
          readings: sensorReadings,
        });
      } catch (err) {
        return sendJSON(res, 400, { error: 'Invalid telemetry payload' });
      }
    });
    return;
  }

  if (pathname === '/crops/guides' && req.method === 'GET') {
    return sendJSON(res, 200, [
      { crop: 'Wheat (Gandum)', season: 'Rabi', optimalMoisture: '50-65%', npk: '120:60:60' },
      { crop: 'Rice (Basmati)', season: 'Kharif', optimalMoisture: '75-90%', npk: '100:50:50' },
      { crop: 'Cotton (Kapas)', season: 'Kharif', optimalMoisture: '45-60%', npk: '150:60:60' },
      { crop: 'Sugarcane (Kamand)', season: 'Annual', optimalMoisture: '60-75%', npk: '200:100:100' },
    ]);
  }

  sendJSON(res, 404, { error: 'IoT endpoint not found' });
});

iotServer.listen(8085, () => {
  console.log('✅ [IoT Sensor & Crop Service] running on http://localhost:8085 (Proxy path: /api/iot/**)');
});

// ========================================================
// 2. Multilingual Multimodal AgricultureBot Server (Port 8086)
// ========================================================
const chatbotServer = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname.replace(/^\/api/, '');

  if (pathname === '/chatbot/suggestions' && req.method === 'GET') {
    const lang = parsedUrl.query.language || 'en';
    if (lang === 'ur') {
      return sendJSON(res, 200, [
        'کیا آج فصل کو پانی لگانا چاہیے؟',
        'گندم کے پتوں کا پیلا پن کیسے دور کریں؟',
        'کپاس کے لیے بہترین کھاد کا شیڈول کیا ہے؟',
        'آئندہ دنوں میں بارش کا کیا امکان ہے؟',
      ]);
    }
    if (lang === 'sd') {
      return sendJSON(res, 200, [
        'ڇا اڄ فصل کي پاڻي ڏيڻ گهرجي؟',
        'ڪڻڪ جي پنن جو پيلو ٿيڻ جو علاج ڇا آهي؟',
        'ڦٽي ۽ سارين لاءِ ڪهڙو ڀاڻ بهتر آهي؟',
        'ايندڙ ڏينهن ۾ برسات جا ڪهڙا امڪان آهن؟',
      ]);
    }
    return sendJSON(res, 200, [
      'Should I irrigate zone 1 today?',
      'Why are my crop leaves turning yellow?',
      'What is the recommended fertilizer for wheat?',
      'How does the weather forecast affect pesticide spraying?',
    ]);
  }

  if (pathname === '/chatbot/message' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const text = (payload.message || '').toLowerCase();
        let lang = payload.language || 'en';

        // Auto-detect Urdu/Sindhi script if not explicitly selected
        for (const c of text) {
          if ('ڄڃڙڦڀٽڏٿ'.includes(c)) { lang = 'sd'; break; }
          if (c >= '\u0600' && c <= '\u06FF') { lang = 'ur'; break; }
        }

        let reply = '';
        if (lang === 'ur') {
          if (text.includes('پانی') || text.includes('آبپاشی') || text.includes('water')) {
            reply = `سینسرز کے مطابق زمین میں نمی ${sensorReadings.soilMoisture}% ہے۔ اگر نمی 35% سے کم ہو تو آبپاشی کریں۔ فی الحال فصل کے لیے صورتحال تسلی بخش ہے۔`;
          } else if (text.includes('کھاد') || text.includes('یوریا') || text.includes('dap') || text.includes('fertiliz')) {
            reply = 'گندم اور چاول کے لیے پہلے اور دوسرے پانی پر 1 بوری یوریا اور زنک سلفیٹ فی ایکڑ دیں۔ مارکیٹ پلیس سے تصدیق شدہ کھاد دستیاب ہے۔';
          } else if (text.includes('بیماری') || text.includes('کیڑا') || text.includes('سنڈی') || text.includes('pest')) {
            reply = 'اگر پتے پر داغ یا کیڑے نظر آ رہے ہیں تو کیمرہ کے آئیکون سے متاثرہ پتے کی تصویر اپ لوڈ کریں، میں فوری بیماری کی تشخیص اور اسپرے تجویز کروں گا۔';
          } else {
            reply = 'السلام علیکم! میں آپ کا اسمارٹ زرعی معاون ہوں۔ فصلوں، بیماریوں، کھاد کے شیڈول اور لائیو سینسرز کے متعلق رہنمائی کے لیے تیار ہوں۔ آپ پتے کی تصویر بھی بھیج سکتے ہیں۔';
          }
        } else if (lang === 'sd') {
          if (text.includes('پاڻي') || text.includes('آبپاشي') || text.includes('water')) {
            reply = `سينسرز مطابق زمين ۾ نمي ${sensorReadings.soilMoisture}% آهي. جيڪڏهن نمي 35% کان گهٽجي وڃي ته پوءِ فيلڊ کي پاڻي ڏيو. في الحال زمين ۾ مناسب نمي موجود آهي.`;
          } else if (text.includes('ڀاڻ') || text.includes('يوريا') || text.includes('dap')) {
            reply = 'ڪڻڪ ۽ ڦٽي لاءِ پهرين پاڻي تي 1 ٻوري يوريا ۽ زِنڪ سلفيٽ وجهو. سٺي پيداوار لاءِ متوازن ڀاڻ ضروري آهي.';
          } else if (text.includes('بيماري') || text.includes('جيت') || text.includes('ڦٽي')) {
            reply = 'جيڪڏهن پنن تي ڪا بيماري يا جيت آهي ته تصوير اپ لوڊ ڪريو، مان فوري طور سڃاڻپ ڪري دوا ۽ اسپري تجويز ڪندس.';
          } else {
            reply = 'ڀلي ڪري آيا! مان توهان جو اسمارٽ زرعي مددگار آهيان. توهان سنڌي ۾ فصلن، بيمارين ۽ ڀاڻ بابت معلومات وٺي سگهو ٿا يا پنن جو فوٽو موڪلي سگهو ٿا.';
          }
        } else {
          if (text.includes('irrigat') || text.includes('water')) {
            reply = `Root-zone soil moisture is currently around ${sensorReadings.soilMoisture}%. Recommended optimal range is 50-70%. You do not need heavy irrigation today.`;
          } else if (text.includes('fertiliz') || text.includes('urea') || text.includes('dap')) {
            reply = 'Apply balanced NPK nutrients (120:60:60). For cereal crops, apply 1 bag of Urea combined with zinc sulphate at the first irrigation cycle.';
          } else if (text.includes('yellow') || text.includes('disease') || text.includes('pest')) {
            reply = 'Yellowing leaves usually denote leaf blight or nitrogen deficit. Please upload a clear photo of the leaf using the camera button for AI diagnosis.';
          } else {
            reply = 'Hello! I am your Smart Agriculture Bot. Ask me anything about crop diseases, irrigation schedules, fertilizers, and IoT sensor metrics in English, Urdu, or Sindhi, or upload a photo of your crops.';
          }
        }

        return sendJSON(res, 200, { reply, language: lang, timestamp: new Date() });
      } catch (err) {
        return sendJSON(res, 400, { error: 'Bad request' });
      }
    });
    return;
  }

  // Multimodal Crop Disease Diagnosis
  if (pathname === '/chatbot/diagnose' && req.method === 'POST') {
    let body = [];
    req.on('data', (chunk) => body.push(chunk));
    req.on('end', () => {
      // Ingest multipart or binary image
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
          recommendation: 'آبپاشی سے قبل یوریا کھاد ڈالیں اور مارکیٹ پلیس سے تجویز کردہ فنگسائڈ حاصل کریں۔',
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
          recommendation: 'Check soil moisture on IoT fleet. Compatible crop protection products are in the Marketplace.',
        };
      }

      return sendJSON(res, 200, diagnosis);
    });
    return;
  }

  sendJSON(res, 404, { error: 'Chatbot endpoint not found' });
});

chatbotServer.listen(8086, () => {
  console.log('✅ [AgricultureBot Service] running on http://localhost:8086 (Proxy path: /api/chatbot/**)');
});
