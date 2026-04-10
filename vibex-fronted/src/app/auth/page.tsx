'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/services/api/modules/auth';
import styles from './auth.module.css';

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

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          {isLogin ? '欢迎回来' : '创建账号'}
        </h1>
        <p className={styles.subtitle}>
          {isLogin ? '登录你的 VibeX 账号' : '开始你的 AI 构建之旅'}
        </p>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <div className={styles.field}>
            <label className={styles.label}>用户名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入用户名"
              required={!isLogin}
              className={styles.input}
            />
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label}>邮箱</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
            className={styles.input}
          />
        </div>

        <div className={`${styles.field} ${styles.fieldLast}`}>
          <label className={styles.label}>密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className={styles.input}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={styles.submitBtn}
        >
          {loading ? '处理中...' : isLogin ? '登录' : '注册'}
        </button>
      </form>

      <div className={styles.switchRow}>
        {isLogin ? (
          <>
            还没有账号？{' '}
            <button
              className={styles.switchBtn}
              onClick={() => {
                setIsLogin(false);
                setError('');
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
              className={styles.switchBtnText}
              onClick={() => {
                setIsLogin(true);
                setError('');
              }}
            >
              立即登录
            </button>
          </>
        )}
      </div>

      <div className={styles.backLink}>
        <Link href="/landing">← 返回首页</Link>
      </div>
    </div>
  );
}

export default function Auth() {
  return (
    <div className={styles.page}>
      <div className={styles.gridOverlay} />
      <div className={styles.glowEffect} />
      <Suspense
        fallback={
          <div className={styles.card}>
            加载中...
          </div>
        }
      >
        <AuthForm />
      </Suspense>
    </div>
  );
}
