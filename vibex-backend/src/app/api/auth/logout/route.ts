import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getEnv } from '@/lib/env';

export async function POST(request: NextRequest) {
  try {
    const env = getEnv();
    const user = getAuthUser(request, env.JWT_SECRET);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // In a production environment, you would invalidate the JWT token
    // by storing it in a blacklist (e.g., Cloudflare KV)
    // For now, we just return success and the client should delete the token

    return NextResponse.json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
