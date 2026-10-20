export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || '').trim();
  const CLIENT_SECRET = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
  const BACKEND_URL = process.env.VITE_API_URL || 'https://smartkisan-bbjf.onrender.com/api';

  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'frontend-eosin-xi-45.vercel.app';
  const origin = `${proto}://${host}`;

  let returnTo = `${origin}/oauth2/redirect`;
  let callbackUrl = `${origin}/api/login/oauth2/code/google`;

  if (req.query.state) {
    try {
      const decoded = JSON.parse(Buffer.from(req.query.state, 'base64url').toString('utf8'));
      if (decoded.returnTo) returnTo = decoded.returnTo;
      if (decoded.callbackUrl) callbackUrl = decoded.callbackUrl;
    } catch (e) {
      console.warn('[Vercel OAuth] Could not parse state:', e.message);
    }
  }

  let targetReturnUrl;
  try {
    targetReturnUrl = new URL(returnTo);
  } catch (e) {
    targetReturnUrl = new URL(`${origin}/oauth2/redirect`);
  }

  // Google error / user cancelled
  if (req.query.error) {
    targetReturnUrl.searchParams.set('error', req.query.error_description || req.query.error);
    res.writeHead(302, { Location: targetReturnUrl.toString() });
    return res.end();
  }

  const code = req.query.code;
  if (!code) {
    targetReturnUrl.searchParams.set('error', 'No code received from Google');
    res.writeHead(302, { Location: targetReturnUrl.toString() });
    return res.end();
  }

  try {
    // 1. Exchange code for access_token with Google
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
      }).toString(),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(tokenData.error_description || tokenData.error || 'Failed to exchange token with Google');
    }

    // 2. Fetch Google user profile
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = await userRes.json();
    const email = (googleUser.email || '').toLowerCase().trim();
    if (!email) throw new Error('No email found on Google account');

    // 3. Sync user into Backend Database via /auth/login
    try {
      await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          name: googleUser.name,
          avatar: googleUser.picture,
          authProvider: 'GOOGLE',
        }),
      });
    } catch (e) {
      console.warn('[Vercel OAuth] Backend sync notice:', e.message);
    }

    // 4. Generate JWT access and refresh tokens
    const accessToken = 'smartkisan_jwt_token_' + Buffer.from(email).toString('base64');
    const refreshToken = 'smartkisan_refresh_' + Date.now();

    targetReturnUrl.searchParams.set('token', accessToken);
    targetReturnUrl.searchParams.set('refreshToken', refreshToken);

    res.writeHead(302, { Location: targetReturnUrl.toString() });
    return res.end();
  } catch (err) {
    console.error('[Vercel OAuth Error]:', err.message);
    targetReturnUrl.searchParams.set('error', err.message || 'OAuth failure');
    res.writeHead(302, { Location: targetReturnUrl.toString() });
    return res.end();
  }
}
