/**
 * OAuth Callback Route
 * 处理 OAuth 回调
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || 'your-github-client-id';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || 'your-github-client-secret';
const FIGMA_CLIENT_ID = process.env.FIGMA_CLIENT_ID || 'your-figma-client-id';
const FIGMA_CLIENT_SECRET = process.env.FIGMA_CLIENT_SECRET || 'your-figma-client-secret';

const OAUTH_CONFIGS = {
  github: {
    clientId: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userUrl: 'https://api.github.com/user',
  },
  figma: {
    clientId: FIGMA_CLIENT_ID,
    clientSecret: FIGMA_CLIENT_SECRET,
    tokenUrl: 'https://www.figma.com/api/oauth/token',
    userUrl: 'https://api.figma.com/v1/me',
  },
};

async function getAccessToken(provider: string, code: string, codeVerifier?: string) {
  const config = OAUTH_CONFIGS[provider as keyof typeof OAUTH_CONFIGS];
  
  const params = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    ...(codeVerifier && provider === 'figma' ? { code_verifier: codeVerifier } : {}),
  });

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json();
  return data;
}

async function getUserInfo(provider: string, accessToken: string) {
  const config = OAUTH_CONFIGS[provider as keyof typeof OAUTH_CONFIGS];
  
  const response = await fetch(config.userUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get user info');
  }

  return response.json();
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    
    if (!OAUTH_CONFIGS[provider as keyof typeof OAUTH_CONFIGS]) {
      return NextResponse.json(
        { error: 'Unsupported OAuth provider' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { code, state, codeVerifier } = body;

    if (!code || !state) {
      return NextResponse.json(
        { error: 'Missing code or state' },
        { status: 400 }
      );
    }

    // 验证 state
    // 在生产环境中应该验证 state 与存储的值匹配
    
    // 换取 access token
    const tokenData = await getAccessToken(provider, code, codeVerifier);
    
    // 获取用户信息
    const userInfo = await getUserInfo(provider, tokenData.access_token);

    // 设置 cookie
    const cookieStore = await cookies();
    cookieStore.set(`oauth_${provider}_token`, tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokenData.expires_in || 3600 * 24 * 30, // 默认30天
      path: '/',
    });

    if (tokenData.refresh_token) {
      cookieStore.set(`oauth_${provider}_refresh`, tokenData.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600 * 24 * 365, // 1年
        path: '/',
      });
    }

    return NextResponse.json({
      success: true,
      user: userInfo,
      expiresIn: tokenData.expires_in,
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.json(
      { error: 'OAuth callback failed' },
      { status: 500 }
    );
  }
}
