import { NextResponse } from 'next/server';
import { getVercelAuthUrl } from '@/lib/vercel-oauth';
import crypto from 'crypto';

export async function GET() {
  const state = crypto.randomBytes(16).toString('hex');
  const url = getVercelAuthUrl(state);
  
  return NextResponse.redirect(url);
}
