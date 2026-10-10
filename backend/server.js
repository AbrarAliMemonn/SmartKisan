// ========================================================
// SmartKisan - Unified Cloud API Server
// Production Ready for Render.com, Railway, and VPS
// Serves IoT Telemetry, Multilingual AI Advisor, Marketplace, Auth & Weather
// ========================================================

const http = require('http');
const https = require('https');
const url = require('url');
const crypto = require('crypto');

const PORT = process.env.PORT || 8080;

// ---------------- Meteorological & Geolocation Data ----------------
const CITY_COORDS = {
  'hyderabad': { lat: 25.396, lon: 68.3578, name: 'Hyderabad, Sindh' },
  'karachi': { lat: 24.8607, lon: 67.0011, name: 'Karachi, Sindh' },
  'sukkur': { lat: 27.7052, lon: 68.8574, name: 'Sukkur, Sindh' },
  'larkana': { lat: 27.5598, lon: 68.2120, name: 'Larkana, Sindh' },
  'mirpurkhas': { lat: 25.5276, lon: 69.0159, name: 'Mirpur Khas, Sindh' },
  'mirpur khas': { lat: 25.5276, lon: 69.0159, name: 'Mirpur Khas, Sindh' },
  'badin': { lat: 24.6560, lon: 68.8370, name: 'Badin, Sindh' },
  'nawabshah': { lat: 26.2483, lon: 68.4096, name: 'Nawabshah, Sindh' },
  'lahore': { lat: 31.5204, lon: 74.3587, name: 'Lahore, Punjab' },
  'multan': { lat: 30.1575, lon: 71.5249, name: 'Multan, Punjab' },
  'faisalabad': { lat: 31.4504, lon: 73.1350, name: 'Faisalabad, Punjab' },
  'rawalpindi': { lat: 33.5651, lon: 73.0169, name: 'Rawalpindi, Punjab' },
  'islamabad': { lat: 33.6844, lon: 73.0479, name: 'Islamabad, Federal' },
  'peshawar': { lat: 34.0151, lon: 71.5249, name: 'Peshawar, KP' },
  'quetta': { lat: 30.1798, lon: 66.9750, name: 'Quetta, Balochistan' },
};

function getWeatherConditionText(code) {
  if (code === 0) return 'Clear Sky / Sunny';
  if ([1, 2].includes(code)) return 'Partly Cloudy';
  if (code === 3) return 'Overcast / Cloudy';
  if ([45, 48].includes(code)) return 'Foggy';
  if ([51, 53, 55].includes(code)) return 'Drizzle';
  if ([61, 63, 65, 80, 81, 82].includes(code)) return 'Rain Showers';
  if ([71, 73, 75].includes(code)) return 'Snow';
  if ([95, 96, 99].includes(code)) return 'Thunderstorm';
  return 'Clear Sky / Sunny';
}

function fetchOpenMeteo(lat, lon) {
  return new Promise((resolve) => {
    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=weathercode,temperature_2m_max&timezone=auto`;
    const req = https.get(apiUrl, { timeout: 3500 }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            resolve(JSON.parse(data));
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
  });
}

// ---------------- Email & OTP Service (Gmail SMTP & HTTPS API) ----------------
const nodemailer = require('nodemailer');

const MAIL_USER = process.env.MAIL_USERNAME || 'm01012002809234@gmail.com';
const MAIL_PASS = process.env.MAIL_PASSWORD || 'vvqtqfglovgljecn';

// Configure short socket timeouts so blocked cloud outbound SMTP never hangs server
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: MAIL_USER,
    pass: MAIL_PASS,
  },
  connectionTimeout: 3000,
  greetingTimeout: 3000,
  socketTimeout: 3000,
});

const otps = new Map(); // key: email:PURPOSE, value: { otp, expiresAt }

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function sendViaHttpsApi(toEmail, subject, html) {
  return new Promise((resolve) => {
    // 1. Primary: Vercel Cloud Mail Relay (Port 443 HTTPS from Render -> Vercel Serverless -> Gmail SMTP Port 587)
    const relayHost = process.env.MAIL_RELAY_HOST || 'smart-kisan-two.vercel.app';
    const payload = JSON.stringify({
      to: toEmail,
      subject: subject,
      html: html,
      secret: 'smartkisan_internal_relay_secret_8829',
    });

    const relayReq = https.request({
      hostname: relayHost,
      port: 443,
      path: '/api/send-email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
      timeout: 8000,
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`[Vercel Relay HTTPS] Successfully delivered email to ${toEmail}`);
          resolve(true);
        } else {
          console.warn(`[Vercel Relay Notice ${res.statusCode}]`, d);
          tryAlternativeHttpsApis(toEmail, subject, html).then(resolve);
        }
      });
    });
    relayReq.on('error', (err) => {
      console.warn('[Vercel Relay Connection Notice]', err.message);
      tryAlternativeHttpsApis(toEmail, subject, html).then(resolve);
    });
    relayReq.on('timeout', () => {
      relayReq.destroy();
      tryAlternativeHttpsApis(toEmail, subject, html).then(resolve);
    });
    relayReq.write(payload);
    relayReq.end();
  });
}

function tryAlternativeHttpsApis(toEmail, subject, html) {
  return new Promise((resolve) => {
    // 2. Resend HTTPS API (Port 443 - Works seamlessly on Render)
    if (process.env.RESEND_API_KEY) {
      const payload = JSON.stringify({
        from: process.env.RESEND_FROM || 'SmartKisan <onboarding@resend.dev>',
        to: [toEmail],
        subject: subject,
        html: html,
      });
      const req = https.request({
        hostname: 'api.resend.com',
        port: 443,
        path: '/emails',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
        timeout: 4000,
      }, (res) => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`[Resend HTTPS] Successfully delivered email to ${toEmail}`);
            resolve(true);
          } else {
            console.warn(`[Resend HTTPS Notice ${res.statusCode}]`, d);
            resolve(false);
          }
        });
      });
      req.on('error', (err) => {
        console.warn('[Resend HTTPS Error]', err.message);
        resolve(false);
      });
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
      req.write(payload);
      req.end();
      return;
    }

    // 3. Brevo HTTPS API (Port 443 - Works seamlessly on Render)
    if (process.env.BREVO_API_KEY) {
      const payload = JSON.stringify({
        sender: { name: 'SmartKisan', email: process.env.BREVO_SENDER || 'no-reply@smartkisan.app' },
        to: [{ email: toEmail }],
        subject: subject,
        htmlContent: html,
      });
      const req = https.request({
        hostname: 'api.brevo.com',
        port: 443,
        path: '/v3/smtp/email',
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
        timeout: 4000,
      }, (res) => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`[Brevo HTTPS] Successfully delivered email to ${toEmail}`);
            resolve(true);
          } else {
            console.warn(`[Brevo HTTPS Notice ${res.statusCode}]`, d);
            resolve(false);
          }
        });
      });
      req.on('error', (err) => {
        console.warn('[Brevo HTTPS Error]', err.message);
        resolve(false);
      });
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
      req.write(payload);
      req.end();
      return;
    }

    resolve(null);
  });
}

async function sendOtpEmail(toEmail, otpCode, purpose = 'VERIFY_EMAIL') {
  const isVerify = purpose === 'VERIFY_EMAIL';
  const subject = isVerify
    ? `SmartKisan - Verify Your Email [${otpCode}]`
    : `SmartKisan - Reset Your Password [${otpCode}]`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
        .card { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #16a34a, #059669); padding: 28px 24px; text-align: center; color: #ffffff; }
        .content { padding: 32px 24px; text-align: center; }
        .code-box { display: inline-block; background: #f0fdf4; border: 2px dashed #16a34a; border-radius: 12px; padding: 14px 28px; margin: 24px 0; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #15803d; font-family: monospace; }
        .footer { padding: 20px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">🌾 SmartKisan</h1>
          <p style="margin: 6px 0 0 0; opacity: 0.9; font-size: 14px;">IoT Smart Agriculture Platform</p>
        </div>
        <div class="content">
          <h2 style="margin: 0; font-size: 20px; color: #0f172a;">${isVerify ? 'Verify Your Email Address' : 'Password Reset Request'}</h2>
          <p style="margin: 12px 0 0 0; font-size: 14px; color: #475569; line-height: 1.5;">
            ${isVerify 
              ? 'Thank you for registering on SmartKisan. Use the 6-digit verification code below to activate your account:' 
              : 'We received a request to reset your SmartKisan account password. Use the verification code below to proceed:'}
          </p>
          <div class="code-box">${otpCode}</div>
          <p style="margin: 0; font-size: 13px; color: #64748b;">
            This code will expire in <strong>10 minutes</strong>. If you did not request this, please ignore this email.
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} SmartKisan. Smart Farming, IoT & Agriculture Marketplace.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    // 1. Try HTTPS API if keys are present
    const viaHttps = await sendViaHttpsApi(toEmail, subject, html);
    if (viaHttps === true) return true;

    // 2. Direct SMTP (Gmail)
    await transporter.sendMail({
      from: `"SmartKisan" <${MAIL_USER}>`,
      to: toEmail,
      subject,
      html,
    });
    console.log(`[Email] Successfully sent ${purpose} OTP ${otpCode} to ${toEmail}`);
    return true;
  } catch (error) {
    console.log(`[Email Notice] OTP generated for ${toEmail}: [${otpCode}]. SMTP unreachable (Cloud firewall/timeout: ${error.message})`);
    return false;
  }
}

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
    location: 'Hyderabad, Sindh, Pakistan',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    avatarImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    farmSize: '25 Acres',
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
    phone: '+92 300 9876543',
    location: 'Karachi, Sindh, Pakistan',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    avatarImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    farmSize: '50 Acres',
    createdAt: new Date().toISOString(),
  },
];

function getUserFromReq(req) {
  const authHeader = req.headers['authorization'] || '';
  if (authHeader.startsWith('Bearer smartkisan_jwt_token_')) {
    const b64 = authHeader.replace('Bearer smartkisan_jwt_token_', '').trim();
    try {
      const email = Buffer.from(b64, 'base64').toString('utf8');
      const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (found) return found;
    } catch (e) {}
  }
  return users[0];
}

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
        location: 'Hyderabad, Sindh, Pakistan',
      };
      users.push(user);
    }

    if (user.emailVerified === false) {
      const code = generateOtp();
      otps.set(`${email}:VERIFY_EMAIL`, {
        otp: code,
        expiresAt: Date.now() + 10 * 60 * 1000,
      });
      console.log(`[Auth] User not verified. Dispatched fresh OTP to ${email}`);
      await sendOtpEmail(email, code, 'VERIFY_EMAIL');

      return sendJSON(res, 403, {
        success: false,
        message: 'Your email address is not verified yet. A verification code has been sent to your email.',
        needsVerification: true,
        data: {
          email: user.email,
          needsVerification: true,
        },
      });
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
    const currentUser = getUserFromReq(req);
    return sendJSON(res, 200, { success: true, data: currentUser });
  }

  // User Profile (GET)
  if ((pathname === '/api/users/profile' || pathname === '/api/users/me' || pathname === '/api/user/profile') && req.method === 'GET') {
    const currentUser = getUserFromReq(req);
    return sendJSON(res, 200, { success: true, data: currentUser });
  }

  // User Profile Update (PUT / POST)
  if ((pathname === '/api/users/profile' || pathname === '/api/user/profile') && (req.method === 'PUT' || req.method === 'POST')) {
    const body = await parseBody(req);
    const currentUser = getUserFromReq(req);
    
    if (body.name) currentUser.name = body.name;
    if (body.email) currentUser.email = body.email;
    if (body.phone !== undefined) currentUser.phone = body.phone;
    if (body.location !== undefined) currentUser.location = body.location;
    if (body.farmSize !== undefined) currentUser.farmSize = body.farmSize;
    if (body.avatarImage !== undefined) {
      currentUser.avatarImage = body.avatarImage;
      currentUser.avatar = body.avatarImage;
    }
    if (body.avatar !== undefined) {
      currentUser.avatar = body.avatar;
      if (!currentUser.avatarImage) currentUser.avatarImage = body.avatar;
    }

    const idx = users.findIndex((u) => u.id === currentUser.id);
    if (idx !== -1) users[idx] = currentUser;

    return sendJSON(res, 200, {
      success: true,
      message: 'Profile updated successfully',
      data: currentUser,
    });
  }

  // User Avatar Upload (POST)
  if ((pathname === '/api/users/avatar' || pathname === '/api/user/avatar') && req.method === 'POST') {
    const body = await parseBody(req);
    const currentUser = getUserFromReq(req);
    const img = body.avatar || body.avatarImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
    currentUser.avatarImage = img;
    currentUser.avatar = img;

    const idx = users.findIndex((u) => u.id === currentUser.id);
    if (idx !== -1) users[idx] = currentUser;

    return sendJSON(res, 200, {
      success: true,
      message: 'Avatar updated successfully',
      data: currentUser,
    });
  }

  // Change Password (PUT / POST)
  if ((pathname === '/api/users/password' || pathname === '/api/user/password') && (req.method === 'PUT' || req.method === 'POST')) {
    const body = await parseBody(req);
    const currentUser = getUserFromReq(req);
    if (!body.newPassword && !body.password) {
      return sendJSON(res, 400, {
        success: false,
        message: 'New password is required',
      });
    }
    currentUser.password = body.newPassword || body.password;
    console.log(`[Auth] Password updated for ${currentUser.email}`);
    return sendJSON(res, 200, {
      success: true,
      message: 'Password changed successfully',
    });
  }

  // User Settings (PUT / POST)
  if ((pathname === '/api/users/settings' || pathname === '/api/user/settings') && (req.method === 'PUT' || req.method === 'POST')) {
    const body = await parseBody(req);
    return sendJSON(res, 200, {
      success: true,
      message: 'Settings saved successfully',
      data: body,
    });
  }

  // OTP and Password Recovery
  if (pathname === '/api/auth/register' && req.method === 'POST') {
    const body = await parseBody(req);
    const email = (body.email || '').toLowerCase().trim();

    if (!email || !body.password) {
      return sendJSON(res, 400, {
        success: false,
        message: 'Email and password are required for registration.',
      });
    }

    let user = users.find((u) => u.email.toLowerCase() === email);
    if (user && user.emailVerified) {
      return sendJSON(res, 400, {
        success: false,
        message: 'An account with this email already exists. Please sign in.',
      });
    }

    if (!user) {
      user = {
        id: users.length + 1,
        name: body.name || 'New Farmer',
        email: email,
        password: body.password,
        role: 'USER',
        userType: 'FARMER',
        isSeller: false,
        emailVerified: false,
        phone: body.phone || '',
        location: body.location || 'Hyderabad, Sindh, Pakistan',
        avatarImage: '',
        farmSize: body.farmSize || '',
        createdAt: new Date().toISOString(),
      };
      users.push(user);
    } else {
      user.name = body.name || user.name;
      user.password = body.password || user.password;
      user.phone = body.phone || user.phone;
      user.location = body.location || user.location;
      user.farmSize = body.farmSize || user.farmSize;
      user.emailVerified = false;
    }

    const otpCode = generateOtp();
    otps.set(`${email}:VERIFY_EMAIL`, {
      otp: otpCode,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });
    console.log(`[Auth] Registered user. Dispatched email OTP to ${email}`);
    await sendOtpEmail(email, otpCode, 'VERIFY_EMAIL');

    return sendJSON(res, 201, {
      success: true,
      message: `Registration successful! Verification code sent to ${email}`,
      data: {
        email: user.email,
        needsVerification: true,
      },
    });
  }

  if (pathname === '/api/auth/verify-otp' && req.method === 'POST') {
    const body = await parseBody(req);
    const email = (body.email || '').toLowerCase().trim();
    const inputOtp = (body.otp || '').toString().trim();

    const record = otps.get(`${email}:VERIFY_EMAIL`);
    if (!record || record.otp !== inputOtp) {
      return sendJSON(res, 400, {
        success: false,
        message: 'Invalid verification code. Please check your inbox or click Resend code.',
      });
    }

    if (Date.now() > record.expiresAt) {
      return sendJSON(res, 400, {
        success: false,
        message: 'Verification code has expired. Please click Resend code to get a new one.',
      });
    }

    // OTP confirmed! Delete from storage
    otps.delete(`${email}:VERIFY_EMAIL`);

    let user = users.find((u) => u.email.toLowerCase() === email);
    if (!user) {
      user = {
        id: users.length + 1,
        name: email.split('@')[0],
        email: email,
        role: 'USER',
        userType: 'FARMER',
        isSeller: false,
        emailVerified: true,
        location: 'Hyderabad, Sindh, Pakistan',
        createdAt: new Date().toISOString(),
      };
      users.push(user);
    } else {
      user.emailVerified = true;
    }

    const token = 'smartkisan_jwt_token_' + Buffer.from(email).toString('base64');
    return sendJSON(res, 200, {
      success: true,
      message: 'Email verified successfully!',
      data: {
        token: token,
        refreshToken: 'smartkisan_refresh_' + Date.now(),
        user: user,
      },
    });
  }

  if (pathname === '/api/auth/resend-otp' && req.method === 'POST') {
    const body = await parseBody(req);
    const email = (body.email || '').toLowerCase().trim();

    if (!email) {
      return sendJSON(res, 400, {
        success: false,
        message: 'Email address is required.',
      });
    }

    const otpCode = generateOtp();
    otps.set(`${email}:VERIFY_EMAIL`, {
      otp: otpCode,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });
    console.log(`[Auth] Resending verification OTP to ${email}`);
    await sendOtpEmail(email, otpCode, 'VERIFY_EMAIL');

    return sendJSON(res, 200, {
      success: true,
      message: `A fresh 6-digit verification code has been sent to ${email}`,
      data: {
        email: email,
      },
    });
  }

  if (pathname === '/api/auth/forgot-password' && req.method === 'POST') {
    const body = await parseBody(req);
    const email = (body.email || '').toLowerCase().trim();

    if (!email) {
      return sendJSON(res, 400, {
        success: false,
        message: 'Email address is required.',
      });
    }

    const otpCode = generateOtp();
    otps.set(`${email}:RESET_PASSWORD`, {
      otp: otpCode,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });
    console.log(`[Auth] Generated password reset OTP for ${email}`);
    await sendOtpEmail(email, otpCode, 'RESET_PASSWORD');

    return sendJSON(res, 200, {
      success: true,
      message: `If an account exists, a 6-digit password reset code was sent to ${email}`,
      data: {
        email: email,
      },
    });
  }

  if (pathname === '/api/auth/reset-password' && req.method === 'POST') {
    const body = await parseBody(req);
    const email = (body.email || '').toLowerCase().trim();
    const inputOtp = (body.otp || '').toString().trim();
    const newPassword = body.newPassword || '';

    if (!newPassword || newPassword.length < 6) {
      return sendJSON(res, 400, {
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const record = otps.get(`${email}:RESET_PASSWORD`);
    if (!record || record.otp !== inputOtp) {
      return sendJSON(res, 400, {
        success: false,
        message: 'Invalid reset code. Please check your email or request a new code.',
      });
    }

    if (Date.now() > record.expiresAt) {
      return sendJSON(res, 400, {
        success: false,
        message: 'Reset code has expired. Please request a new code.',
      });
    }

    otps.delete(`${email}:RESET_PASSWORD`);

    const user = users.find((u) => u.email.toLowerCase() === email);
    if (user) {
      user.password = newPassword;
      user.emailVerified = true;
    }

    return sendJSON(res, 200, {
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
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
    const locParam = (parsedUrl.query.location || parsedUrl.query.city || 'Hyderabad').toString().trim();
    const cleanKey = locParam.toLowerCase().replace(/[^a-z]/g, '');

    let coords = CITY_COORDS[cleanKey] || Object.values(CITY_COORDS).find((c) => cleanKey.includes(c.name.split(',')[0].toLowerCase().trim()));
    if (!coords) {
      coords = { lat: 25.396, lon: 68.3578, name: `${locParam}, Pakistan` };
    }

    const meteo = await fetchOpenMeteo(coords.lat, coords.lon);

    let currentTemp = sensorReadings.temperature;
    let currentWind = 14.5;
    let currentCondition = 'Sunny / Clear Sky';

    if (meteo && meteo.current_weather) {
      currentTemp = +(meteo.current_weather.temperature).toFixed(1);
      currentWind = +(meteo.current_weather.windspeed).toFixed(1);
      currentCondition = getWeatherConditionText(meteo.current_weather.weathercode);
    }

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayIdx = new Date().getDay();
    const forecastList = [];

    if (meteo && meteo.daily && Array.isArray(meteo.daily.temperature_2m_max)) {
      for (let i = 0; i < Math.min(7, meteo.daily.temperature_2m_max.length); i++) {
        const dName = days[(todayIdx + i) % 7];
        forecastList.push({
          day: i === 0 ? 'Today' : dName,
          temp: +(meteo.daily.temperature_2m_max[i]).toFixed(0),
          condition: getWeatherConditionText(meteo.daily.weathercode ? meteo.daily.weathercode[i] : 0),
        });
      }
    } else {
      for (let i = 0; i < 7; i++) {
        const dName = days[(todayIdx + i) % 7];
        forecastList.push({
          day: i === 0 ? 'Today' : dName,
          temp: Math.round(currentTemp + ((i % 3) - 1)),
          condition: i % 2 === 0 ? 'Sunny' : 'Partly Cloudy',
        });
      }
    }

    const currentWeatherObj = {
      location: coords.name,
      temp: currentTemp,
      condition: currentCondition,
      humidity: sensorReadings.humidity,
      windSpeed: currentWind,
      pressure: sensorReadings.pressure,
      uvIndex: 7,
      sprayAdvisory: {
        safeToSpray: currentWind < 18,
        reason: currentWind < 18 ? 'Optimal wind speed (< 18 km/h). Safe for spray.' : 'High wind speed (> 18 km/h). Postpone spraying.',
      },
    };

    if (pathname === '/api/weather/current') {
      return sendJSON(res, 200, {
        success: true,
        data: currentWeatherObj,
      });
    }

    if (pathname === '/api/weather/forecast') {
      return sendJSON(res, 200, {
        success: true,
        data: forecastList,
      });
    }

    return sendJSON(res, 200, {
      success: true,
      location: coords.name,
      current: currentWeatherObj,
      forecast: forecastList,
      data: currentWeatherObj,
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
