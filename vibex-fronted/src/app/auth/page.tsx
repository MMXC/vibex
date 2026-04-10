'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/services/api/modules/auth';

/**
 * validateReturnTo — sanitize returnTo URL to prevent open redirect.
 * E1-S2.1
 */
function validateReturnTo(returnTo: string | null): string {
  if (!returnTo) return '/dashboard';
  if (!returnTo.startsWith('/')) return '/dashboard';
  if (/^(https?|javascript:|data:)/i.test(returnTo)) return '/dashboard';
  if (/^\/\//.test(returnTo)) return '/dashboard'; // protocol-relative
  if (returnTo.includes('/../') || returnTo.endsWith('/..')) return '/dashboard';
  return returnTo;
}

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // E1-S2.1+S2.2: Handle URL params — mode switch + returnTo persistence
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'register') {
      setIsLogin(false);
    } else if (mode === 'login') {
      setIsLogin(true);
    }
    // S2.2: Read returnTo from URL and persist to sessionStorage
    const returnToParam = searchParams.get('returnTo');
    if (returnToParam) {
      const safe = validateReturnTo(returnToParam);
      sessionStorage.setItem('auth_return_to', safe);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await authApi.login({ email, password });
      } else {
        await authApi.register({ name, email, password });
      }
      // E1-S2.1: Read returnTo from sessionStorage and validate
      const returnTo = sessionStorage.getItem('auth_return_to');
      const safeReturnTo = validateReturnTo(returnTo);
      // Clean up after use
      sessionStorage.removeItem('auth_return_to');
      router.push(safeReturnTo);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '操作失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    fontSize: '15px',
    color: 'var(--color-text-primary)',
    outline: 'none',
    transition: 'all 0.2s ease',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--color-text-secondary)',
  };

  const glassCardStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '420px',
    padding: '40px',
    background: 'var(--color-bg-glass)',
    backdropFilter: 'blur(20px)',
    border: '1px solid var(--color-border)',
    borderRadius: '16px',
    boxShadow:
      '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 60px rgba(0, 255, 255, 0.05)',
  };

  return (
    <div style={glassCardStyle}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 700,
            marginBottom: '8px',
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {isLogin ? '欢迎回来' : '创建账号'}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>
          {isLogin ? '登录你的 VibeX 账号' : '开始你的 AI 构建之旅'}
        </p>
      </div>

      {error && (
        <div
          style={{
            padding: '14px',
            marginBottom: '20px',
            background: 'rgba(255, 68, 102, 0.1)',
            border: '1px solid rgba(255, 68, 102, 0.3)',
            borderRadius: '8px',
            color: 'var(--color-error)',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>用户名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入用户名"
              required={!isLogin}
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-primary)';
                e.target.style.boxShadow = '0 0 0 3px rgba(0, 255, 255, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--color-border)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>邮箱</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
            style={inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--color-primary)';
              e.target.style.boxShadow = '0 0 0 3px rgba(0, 255, 255, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--color-border)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        <div style={{ marginBottom: '28px' }}>
          <label style={labelStyle}>密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            style={inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--color-primary)';
              e.target.style.boxShadow = '0 0 0 3px rgba(0, 255, 255, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--color-border)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            background: loading
              ? 'rgba(0, 255, 255, 0.3)'
              : 'linear-gradient(135deg, var(--color-primary) 0%, rgba(0, 255, 255, 0.8) 100%)',
            color: 'var(--color-bg-primary)',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: loading ? 'none' : '0 0 20px rgba(0, 255, 255, 0.3)',
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow =
                '0 0 30px rgba(0, 255, 255, 0.5)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.3)';
          }}
        >
          {loading ? '处理中...' : isLogin ? '登录' : '注册'}
        </button>
      </form>

      <div
        style={{
          marginTop: '24px',
          textAlign: 'center',
          color: 'var(--color-text-secondary)',
          fontSize: '14px',
        }}
      >
        {isLogin ? (
          <>
            还没有账号？{' '}
            <button
              onClick={() => {
                setIsLogin(false);
                setError('');
              }}
              style={{
                background: 'var(--color-primary)',
                border: '1px solid var(--color-primary)',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '16px',
                textDecoration: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                minHeight: '44px',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-primary-hover, #0055cc)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--color-primary)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <line x1="20" y1="8" x2="20" y2="14"/>
                <line x1="23" y1="11" x2="17" y2="11"/>
              </svg>
              立即注册
            </button>
          </>
        ) : (
          <>
            已有账号？{' '}
            <button
              onClick={() => {
                setIsLogin(true);
                setError('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                cursor: 'pointer',
                fontWeight: 600,
                textDecoration: 'none',
                padding: '4px 12px',
                borderRadius: '6px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 255, 255, 0.1)';
                e.currentTarget.style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.textDecoration = 'none';
              }}
            >
              立即登录
            </button>
          </>
        )}
      </div>

      <div style={{ marginTop: '32px', textAlign: 'center' }}>
        <Link
          href="/landing"
          style={{
            color: 'var(--color-text-muted)',
            textDecoration: 'none',
            fontSize: '14px',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--color-text-muted)';
          }}
        >
          ← 返回首页
        </Link>
      </div>
    </div>
  );
}

export default function Auth() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg-primary)',
        backgroundImage: `
        radial-gradient(ellipse at top, rgba(0, 255, 255, 0.08) 0%, transparent 50%),
        radial-gradient(ellipse at bottom right, rgba(139, 92, 246, 0.08) 0%, transparent 50%)
      `,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Grid overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
          linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px)
        `,
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }}
      />

      {/* Glow effect */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          right: '10%',
          width: '400px',
          height: '400px',
          background:
            'radial-gradient(circle, rgba(0, 255, 255, 0.12) 0%, transparent 70%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />

      <Suspense
        fallback={
          <div
            style={{
              width: '100%',
              maxWidth: '420px',
              padding: '40px',
              background: 'var(--color-bg-glass)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--color-border)',
              borderRadius: '16px',
              textAlign: 'center',
              color: 'var(--color-text-secondary)',
            }}
          >
            加载中...
          </div>
        }
      >
        <AuthForm />
      </Suspense>
    </div>
  );
}
