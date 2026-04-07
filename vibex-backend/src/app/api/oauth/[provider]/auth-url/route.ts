/**
 * OAuth Auth URL Route
 * 获取 OAuth 授权 URL
 */

import { NextRequest, NextResponse } from 'next/server';

import { safeError } from '@/lib/log-sanitizer';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || 'your-github-client-id';
const FIGMA_CLIENT_ID = process.env.FIGMA_CLIENT_ID || 'your-figma-client-id';

const OAUTH_CONFIGS = {
  github: {
    clientId: GITHUB_CLIENT_ID,
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    scope: 'repo user',
  },
  figma: {
    clientId: FIGMA_CLIENT_ID,
    authUrl: 'https://www.figma.com/oauth',
    tokenUrl: 'https://www.figma.com/api/oauth/token',
    scope: 'file_read',
  },
};

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

    const config = OAUTH_CONFIGS[provider as keyof typeof OAUTH_CONFIGS];
    const body = await request.json();
    const { state, codeChallenge, redirectUri } = body;

    // 生成 auth URL
    const authParams = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri || `http://localhost:3000/oauth/callback`,
      scope: config.scope,
      state,
      ...(codeChallenge && provider === 'figma' ? { code_challenge: codeChallenge, code_challenge_method: 'S256' } : {}),
    });

    const authUrl = `${config.authUrl}?${authParams.toString()}`;

    return NextResponse.json({ authUrl, state });
  } catch (error) {
    safeError('OAuth auth URL error:', error);
    return NextResponse.json(
      { error: 'Failed to generate auth URL' },
      { status: 500 }
    );
  }
}
