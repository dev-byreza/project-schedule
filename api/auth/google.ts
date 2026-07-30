import type { VercelRequest, VercelResponse } from '@vercel/node';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ('813658703373' + '-' + 'j7gcu4v0ijpr930d8j3hhpcjdt9qnrhr.apps.googleusercontent.com');

export default function handler(req: VercelRequest, res: VercelResponse) {
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'https://project.devbyreza.cloud/api/auth/callback/google';
  const scope = 'https://www.googleapis.com/auth/calendar.events';

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(CLIENT_ID)}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scope)}&` +
    `access_type=offline&` +
    `prompt=consent`;

  return res.redirect(302, authUrl);
}
