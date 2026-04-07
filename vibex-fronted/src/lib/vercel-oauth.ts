/**
 * Vercel OAuth flow
 * Docs: https://vercel.com/docs/rest-api#oauth-2-0
 */

const VERCEL_OAUTH_URL = 'https://vercel.com/oauth';
const CLIENT_ID = process.env.NEXT_PUBLIC_VERCEL_CLIENT_ID;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/vercel/callback`;

export function getVercelAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID || '',
    redirect_uri: REDIRECT_URI,
    state,
    scope: 'deployment:read deployment:write',
  });
  return `${VERCEL_OAUTH_URL}?${params.toString()}`;
}

export interface VercelTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token?: string;
}

export async function exchangeCodeForToken(code: string): Promise<VercelTokenResponse> {
  const response = await fetch('https://api.vercel.com/v2/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: process.env.VERCEL_CLIENT_SECRET,
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Vercel token exchange failed: ${response.status}`);
  }
  
  return response.json() as Promise<VercelTokenResponse>;
}

export function isVercelConnected(): boolean {
  return Boolean(process.env.VERCEL_ACCESS_TOKEN);
}
