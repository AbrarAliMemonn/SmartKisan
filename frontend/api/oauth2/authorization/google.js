export default function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || '').trim();

  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'frontend-eosin-xi-45.vercel.app';
  const origin = `${proto}://${host}`;

  // Target return URL on frontend
  let returnTo = req.query.returnTo || req.query.redirect_uri;
  if (!returnTo) {
    const referer = req.headers['referer'] || '';
    if (referer) {
      try {
        const refUrl = new URL(referer);
        returnTo = `${refUrl.origin}/oauth2/redirect`;
      } catch (e) {}
    }
  }
  if (!returnTo) {
    returnTo = `${origin}/oauth2/redirect`;
  }

  // If Client ID is completely missing, redirect back to login with a friendly message instead of broken Google page
  if (!CLIENT_ID) {
    console.error('[Google OAuth] Google Client ID is not configured.');
    res.writeHead(302, { Location: `${origin}/login?error=Google+Sign-In+is+not+configured.+Please+log+in+with+your+email+and+password.` });
    return res.end();
  }

  // Google OAuth2 callback URL
  const callbackUrl = `${origin}/api/login/oauth2/code/google`;

  const statePayload = {
    returnTo,
    callbackUrl,
    time: Date.now(),
  };
  const state = Buffer.from(JSON.stringify(statePayload)).toString('base64url');

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', CLIENT_ID);
  googleAuthUrl.searchParams.set('redirect_uri', callbackUrl);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', 'openid email profile');
  googleAuthUrl.searchParams.set('access_type', 'offline');
  googleAuthUrl.searchParams.set('prompt', 'select_account');
  googleAuthUrl.searchParams.set('state', state);

  res.writeHead(302, { Location: googleAuthUrl.toString() });
  return res.end();
}
