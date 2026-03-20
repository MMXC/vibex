/**
 * LoginDrawer - 登录抽屉组件
 *
 * 从侧边滑入的登录/注册表单
 *
 * Usage:
 * <LoginDrawer isOpen={show} onClose={() => setShow(false)} />
 */

'use client';

import { useState, useEffect } from 'react';
import styles from './LoginDrawer.module.css';
import { useAuthStore } from '@/stores/authStore';
import { AuthResponse } from '@/services/api/types/auth';

interface LoginDrawerProps {
  /** 是否显示 */
  isOpen: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 登录成功回调 */
  onSuccess?: () => void;
}

export function LoginDrawer({ isOpen, onClose, onSuccess }: LoginDrawerProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const login = useAuthStore((state) => state.login);

  // ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { apiService } = await import('@/services/api');

      let token: string;
      if (isLogin) {
        const result: AuthResponse = await apiService.login({ email, password });
        token = result.token;
      } else {
        const result: AuthResponse = await apiService.register({ name, email, password });
        token = result.token;
      }

      // 保存 token 到 sessionStorage（安全：不在持久化存储中明文保存）
      if (token) {
        sessionStorage.setItem('auth_token', token);
        sessionStorage.setItem('user_id', email);
        
        // 更新全局认证状态
        login(token, { id: email, email });
      }

      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '操作失败');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={onClose} />

      {/* Drawer */}
      <div className={styles.drawer}>
        <div className={styles.header}>
          <h2>{isLogin ? '登录' : '注册'}</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {!isLogin && (
            <div className={styles.field}>
              <label>用户名</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入用户名"
                required={!isLogin}
              />
            </div>
          )}

          <div className={styles.field}>
            <label>邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />
          </div>

          <div className={styles.field}>
            <label>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? '处理中...' : isLogin ? '登录' : '注册'}
          </button>
        </form>

        <div className={styles.footer}>
          {isLogin ? (
            <>
              还没有账号？
              <button
                onClick={() => {
                  setIsLogin(false);
                  setError('');
                }}
              >
                立即注册
              </button>
            </>
          ) : (
            <>
              已有账号？
              <button
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
      </div>
    </>
  );
}

export default LoginDrawer;
