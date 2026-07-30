import 'dotenv/config';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'https://project.devbyreza.cloud/api/auth/callback/google';
  const scope = 'https://www.googleapis.com/auth/calendar.events';

  if (!clientId) {
    return res.status(500).json({ error: 'GOOGLE_CLIENT_ID is missing in Vercel environment variables.' });
  }

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(clientId)}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scope)}&` +
    `access_type=offline&` +
    `prompt=consent`;

  return res.redirect(302, authUrl);
}
