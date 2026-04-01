import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken } from '@/lib/vercel-oauth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  
  if (error || !code) {
    return NextResponse.redirect('/?vercel_error=oauth_denied');
  }
  
  try {
    const tokens = await exchangeCodeForToken(code);
    // In production: store token in KV (e.g., Upstash Redis)
    // For now: redirect with success
    const response = NextResponse.redirect('/canvas/export?vercel_connected=true');
    response.cookies.set('vercel_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    return response;
  } catch (err) {
    console.error('Vercel OAuth error:', err);
    return NextResponse.redirect('/?vercel_error=token_exchange_failed');
  }
}
