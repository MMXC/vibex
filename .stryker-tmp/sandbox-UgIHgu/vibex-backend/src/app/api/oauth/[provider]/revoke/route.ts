/**
 * OAuth Revoke Route
 * 撤销 OAuth Token
 */
// @ts-nocheck


import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get(`oauth_${provider}_token`)?.value;

    // 尝试撤销 GitHub token
    if (provider === 'github' && token) {
      try {
        await fetch('https://api.github.com/applications/' + process.env.GITHUB_CLIENT_ID + '/token', {
          method: 'DELETE',
          headers: {
            Authorization: 'Bearer ' + token,
            Accept: 'application/vnd.github.v3+json',
          },
          body: JSON.stringify({ access_token: token }),
        });
      } catch {
        // 忽略错误
      }
    }

    // 清除 cookie
    cookieStore.delete(`oauth_${provider}_token`);
    cookieStore.delete(`oauth_${provider}_refresh`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('OAuth revoke error:', error);
    return NextResponse.json(
      { error: 'Failed to revoke token' },
      { status: 500 }
    );
  }
}
