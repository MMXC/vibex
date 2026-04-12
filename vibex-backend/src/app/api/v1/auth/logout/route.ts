import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { getEnv } from '@/lib/env';

import { safeError } from '@/lib/log-sanitizer';

export async function POST(request: NextRequest) {
  try {
    const env = getEnv();
    const user = getAuthUserFromRequest(request, env.JWT_SECRET);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      data: { message: 'Logged out successfully' },
    });

    // Clear auth_token cookie (with Secure for HTTPS environments)
    response.cookies.set('auth_token', '', {
      maxAge: 0,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      ...(process.env.COOKIE_DOMAIN && { domain: process.env.COOKIE_DOMAIN }),
    });

    // Clear auth_session cookie (middleware also reads this cookie)
    response.cookies.set('auth_session', '', {
      maxAge: 0,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      ...(process.env.COOKIE_DOMAIN && { domain: process.env.COOKIE_DOMAIN }),
    });

    return response;
  } catch (error) {
    safeError('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
