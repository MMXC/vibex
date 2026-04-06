/**
 * OAuth User Info Route
 * 获取 OAuth 用户信息
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { safeError } from '@/lib/log-sanitizer';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get(`oauth_${provider}_token`)?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // GitHub user info
    if (provider === 'github') {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return NextResponse.json(
          { error: 'Failed to get user info' },
          { status: 500 }
        );
      }

      const user = await response.json();
      return NextResponse.json({
        id: user.id.toString(),
        name: user.login,
        email: user.email,
        avatar: user.avatar_url,
        provider: 'github',
      });
    }

    // Figma user info
    if (provider === 'figma') {
      const response = await fetch('https://api.figma.com/v1/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return NextResponse.json(
          { error: 'Failed to get user info' },
          { status: 500 }
        );
      }

      const user = await response.json();
      return NextResponse.json({
        id: user.id,
        name: user.handle,
        email: user.email,
        avatar: user.img_url,
        provider: 'figma',
      });
    }

    return NextResponse.json(
      { error: 'Unsupported provider' },
      { status: 400 }
    );
  } catch (error) {
    safeError('OAuth user info error:', error);
    return NextResponse.json(
      { error: 'Failed to get user info' },
      { status: 500 }
    );
  }
}
