import 'dotenv/config';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const code = req.query.code as string;
  const error = req.query.error as string;

  if (error || !code) {
    console.error('Google OAuth callback error:', error || 'No authorization code provided');
    return res.redirect(302, '/?gcal_error=' + encodeURIComponent(error || 'cancelled'));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'https://project.devbyreza.cloud/api/auth/callback/google';

  if (!clientId || !clientSecret) {
    console.error('Missing Google OAuth environment variables');
    return res.redirect(302, '/?gcal_error=' + encodeURIComponent('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variable on Vercel'));
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Token exchange failed:', tokenData);
      return res.redirect(302, '/?gcal_error=' + encodeURIComponent(tokenData.error_description || tokenData.error || 'token_failed'));
    }

    const accessToken = tokenData.access_token;
    return res.redirect(302, `/?gcal_token=${encodeURIComponent(accessToken)}&status=success`);
  } catch (err: any) {
    console.error('OAuth Callback Exception:', err);
    return res.redirect(302, '/?gcal_error=' + encodeURIComponent(err.message));
  }
}
