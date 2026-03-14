/**
 * OAuth Connect Button
 * OAuth 连接按钮组件
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { getAuthUrl, handleCallback, isConnected as checkOAuthConnected, getUserInfo, logout, type OAuthProvider } from '@/services/oauth/oauth';
import styles from './OAuthConnect.module.css';

interface OAuthConnectButtonProps {
  provider: OAuthProvider;
  onConnect?: (userInfo: { name: string; email?: string }) => void;
  onDisconnect?: () => void;
  className?: string;
}

/**
 * OAuth 连接按钮
 */
export function OAuthConnectButton({
  provider,
  onConnect,
  onDisconnect,
  className,
}: OAuthConnectButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 检查连接状态
  const checkConnection = useCallback(async () => {
    const connected = checkOAuthConnected(provider);
    setIsConnected(connected);
    
    if (connected) {
      try {
        const userInfo = await getUserInfo(provider);
        setUserName(userInfo.name);
      } catch {
        setIsConnected(false);
      }
    }
  }, [provider]);

  // 初始化检查
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const handleConnect = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { url } = await getAuthUrl(provider);
      
      // 打开授权窗口
      const width = 600;
      const height = 700;
      const left = (window.innerWidth - width) / 2;
      const top = (window.innerHeight - height) / 2;
      
      const authWindow = window.open(
        url,
        `${provider}-oauth`,
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // 监听授权结果
      const checkAuth = setInterval(() => {
        try {
          if (authWindow?.closed) {
            clearInterval(checkAuth);
            setIsLoading(false);
            checkConnection();
          }
        } catch {
          // 跨域访问可能失败
        }
      }, 500);

      // 设置超时
      setTimeout(() => {
        clearInterval(checkAuth);
        if (!authWindow?.closed) {
          authWindow?.close();
        }
        setIsLoading(false);
      }, 300000); // 5 分钟超时

    } catch (err) {
      setError(err instanceof Error ? err.message : '连接失败');
      setIsLoading(false);
    }
  }, [provider, checkConnection]);

  const handleDisconnect = useCallback(async () => {
    setIsLoading(true);
    
    try {
      await logout(provider);
      setIsConnected(false);
      setUserName(null);
      onDisconnect?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : '断开连接失败');
    } finally {
      setIsLoading(false);
    }
  }, [provider, onDisconnect]);

  const providerLabels = {
    github: { name: 'GitHub', icon: '🐙' },
    figma: { name: 'Figma', icon: '🎨' },
  };

  const label = providerLabels[provider];

  return (
    <div className={`${styles.container} ${className || ''}`}>
      {isConnected ? (
        <div className={styles.connected}>
          <span className={styles.icon}>{label.icon}</span>
          <span className={styles.name}>{userName || label.name}</span>
          <button
            className={styles.disconnectButton}
            onClick={handleDisconnect}
            disabled={isLoading}
          >
            断开
          </button>
        </div>
      ) : (
        <button
          className={styles.connectButton}
          onClick={handleConnect}
          disabled={isLoading}
        >
          {isLoading ? (
            <>🔄 连接中...</>
          ) : (
            <>
              {label.icon} 连接 {label.name}
            </>
          )}
        </button>
      )}
      
      {error && (
        <div className={styles.error}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}

export default OAuthConnectButton;
