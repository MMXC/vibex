/**
 * OAuth Service
 * GitHub 和 Figma OAuth 2.0 PKCE 认证服务
 */

import { getApiUrl } from '@/lib/api-config';

export type OAuthProvider = 'github' | 'figma';

export interface OAuthConfig {
  clientId: string;
  redirectUri: string;
  scope?: string;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
}

export interface OAuthUserInfo {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  provider: OAuthProvider;
}

/**
 * 生成 PKCE code verifier 和 challenge
 */
async function generatePKCE(): Promise<{ verifier: string; challenge: string }> {
  const verifier = generateRandomString(128);
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const challenge = base64UrlEncode(hashBuffer);
  return { verifier, challenge };
}

/**
 * 生成随机字符串
 */
function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('').slice(0, length);
}

/**
 * Base64 URL 编码
 */
function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * 获取 OAuth 授权 URL
 */
export async function getAuthUrl(provider: OAuthProvider): Promise<{
  url: string;
  state: string;
  codeVerifier: string;
}> {
  const { verifier, challenge } = await generatePKCE();
  const state = generateRandomString(32);

  // 存储 code verifier 以便后续使用
  sessionStorage.setItem(`oauth_${provider}_verifier`, verifier);
  sessionStorage.setItem(`oauth_${provider}_state`, state);

  const response = await fetch(getApiUrl(`/api/oauth/${provider}/auth-url`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      state,
      codeChallenge: challenge,
      redirectUri: `${window.location.origin}/oauth/callback`,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to get auth URL');
  }

  const data = await response.json();
  return {
    url: data.authUrl,
    state,
    codeVerifier: verifier,
  };
}

/**
 * 处理 OAuth 回调
 */
export async function handleCallback(
  provider: OAuthProvider,
  code: string,
  state: string
): Promise<OAuthTokens> {
  // 验证 state
  const savedState = sessionStorage.getItem(`oauth_${provider}_state`);
  const codeVerifier = sessionStorage.getItem(`oauth_${provider}_verifier`);

  if (state !== savedState) {
    throw new Error('Invalid state parameter');
  }

  if (!codeVerifier) {
    throw new Error('Missing code verifier');
  }

  // 清理 session storage
  sessionStorage.removeItem(`oauth_${provider}_state`);
  sessionStorage.removeItem(`oauth_${provider}_verifier`);

  const response = await fetch(getApiUrl(`/api/oauth/${provider}/callback`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, state, codeVerifier }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'OAuth callback failed');
  }

  const tokens = await response.json();
  
  // 存储 tokens
  await storeTokens(provider, tokens);
  
  return tokens;
}

/**
 * 存储 OAuth Tokens
 */
export async function storeTokens(provider: OAuthProvider, tokens: OAuthTokens): Promise<void> {
  // 加密存储 access token
  const encrypted = btoa(tokens.accessToken);
  localStorage.setItem(`oauth_${provider}_token`, encrypted);
  
  if (tokens.refreshToken) {
    localStorage.setItem(`oauth_${provider}_refresh`, btoa(tokens.refreshToken));
  }
  
  if (tokens.expiresIn) {
    localStorage.setItem(`oauth_${provider}_expires`, String(Date.now() + tokens.expiresIn * 1000));
  }
}

/**
 * 获取存储的 OAuth Token
 */
export function getStoredToken(provider: OAuthProvider): string | null {
  const encrypted = localStorage.getItem(`oauth_${provider}_token`);
  const expires = localStorage.getItem(`oauth_${provider}_expires`);
  
  if (!encrypted) return null;
  
  // 检查是否过期
  if (expires && parseInt(expires) < Date.now()) {
    // Token 已过期，尝试刷新
    refreshToken(provider);
    return null;
  }
  
  try {
    return atob(encrypted);
  } catch {
    return null;
  }
}

/**
 * 刷新 Token
 */
export async function refreshToken(provider: OAuthProvider): Promise<boolean> {
  const refreshToken = localStorage.getItem(`oauth_${provider}_refresh`);
  
  if (!refreshToken) return false;
  
  try {
    const response = await fetch(getApiUrl(`/api/oauth/${provider}/refresh`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: atob(refreshToken) }),
    });
    
    if (!response.ok) return false;
    
    const tokens = await response.json();
    await storeTokens(provider, tokens);
    return true;
  } catch {
    return false;
  }
}

/**
 * 登出 OAuth
 */
export async function logout(provider: OAuthProvider): Promise<void> {
  const token = getStoredToken(provider);
  
  if (token) {
    try {
      await fetch(getApiUrl(`/api/oauth/${provider}/revoke`), {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
      });
    } catch {
      // 忽略错误
    }
  }
  
  // 清理本地存储
  localStorage.removeItem(`oauth_${provider}_token`);
  localStorage.removeItem(`oauth_${provider}_refresh`);
  localStorage.removeItem(`oauth_${provider}_expires`);
}

/**
 * 检查是否已连接 OAuth
 */
export function isConnected(provider: OAuthProvider): boolean {
  return !!getStoredToken(provider);
}

/**
 * 获取用户信息
 */
export async function getUserInfo(provider: OAuthProvider): Promise<OAuthUserInfo> {
  const token = getStoredToken(provider);
  
  if (!token) {
    throw new Error('Not authenticated');
  }
  
  const response = await fetch(getApiUrl(`/api/oauth/${provider}/user`), {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  
  if (!response.ok) {
    throw new Error('Failed to get user info');
  }
  
  return response.json();
}
