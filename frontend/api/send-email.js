import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Enable CORS for incoming requests from Render and other origins
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = {};
    }
  }

  const { to, subject, html, secret } = body || {};

  if (secret !== 'smartkisan_internal_relay_secret_8829') {
    return res.status(403).json({ success: false, error: 'Unauthorized relay access' });
  }

  if (!to || !subject || !html) {
    return res.status(400).json({ success: false, error: 'Missing required parameters' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAIL_USERNAME || 'm01012002809234@gmail.com',
        pass: process.env.MAIL_PASSWORD || 'vvqtqfglovgljecn',
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 15000,
    });

    const info = await transporter.sendMail({
      from: `"SmartKisan" <${process.env.MAIL_USERNAME || 'm01012002809234@gmail.com'}>`,
      to,
      subject,
      html,
    });

    console.log(`[Vercel Relay] Successfully sent email to ${to}:`, info.messageId);
    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('[Vercel Relay Error]:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}
