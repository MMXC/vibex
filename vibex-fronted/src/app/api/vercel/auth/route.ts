import { NextResponse } from 'next/server';
import { getVercelAuthUrl } from '@/lib/vercel-oauth';
import crypto from 'crypto';

// Required for dynamic routes in static export mode
export const dynamic = 'force-dynamic';

export async function GET() {
  const state = crypto.randomBytes(16).toString('hex');
  const url = getVercelAuthUrl(state);
  
  return NextResponse.redirect(url);
}
