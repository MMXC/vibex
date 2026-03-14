/**
 * Figma Import Component
 * Figma 设计稿一键导入组件
 */

'use client';

import { useState, useCallback } from 'react';
import {
  parseFigmaUrl,
  importFigmaFile,
  generateRequirementFromFigma,
  type FigmaFileData,
} from '@/services/figma/figma-import';
import styles from './FigmaImport.module.css';

interface FigmaImportProps {
  onImport: (requirementText: string) => void;
  className?: string;
}

export function FigmaImport({ onImport, className }: FigmaImportProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileData, setFileData] = useState<FigmaFileData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleImport = useCallback(async () => {
    if (!url.trim()) return;

    setIsLoading(true);
    setError(null);
    setFileData(null);

    try {
      const parsed = parseFigmaUrl(url);
      if (!parsed) {
        throw new Error('请输入有效的 Figma 文件地址');
      }

      const result = await importFigmaFile(url);
      setFileData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败，请检查文件地址');
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  const handleApply = useCallback(() => {
    if (!fileData) return;

    const requirementText = generateRequirementFromFigma(fileData);
    onImport(requirementText);
    
    // 重置状态
    setUrl('');
    setFileData(null);
  }, [fileData, onImport]);

  const handleReset = useCallback(() => {
    setUrl('');
    setError(null);
    setFileData(null);
  }, []);

  const handleAuth = useCallback(async () => {
    try {
      const { authUrl } = await import('@/services/figma/figma-import').then(m => m.getFigmaAuthUrl());
      // 打开 OAuth 窗口
      window.open(authUrl, 'figma-auth', 'width=600,height=700');
    } catch (err) {
      setError('启动 Figma 授权失败');
    }
  }, []);

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.header}>
        <span className={styles.icon}>🎨</span>
        <span className={styles.title}>从 Figma 导入</span>
      </div>

      {!fileData ? (
        <div className={styles.inputSection}>
          <input
            type="text"
            className={styles.input}
            placeholder="https://www.figma.com/file/xxx/Project-Name"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleImport()}
            disabled={isLoading}
          />
          <button
            className={styles.button}
            onClick={handleImport}
            disabled={isLoading || !url.trim()}
          >
            {isLoading ? '🔄 获取中...' : '🔍 获取'}
          </button>
        </div>
      ) : (
        <div className={styles.preview}>
          <div className={styles.fileHeader}>
            <img 
              src={fileData.file.thumbnailUrl} 
              alt={fileData.file.name} 
              className={styles.thumbnail}
            />
            <div className={styles.fileInfo}>
              <div className={styles.fileName}>{fileData.file.name}</div>
              <div className={styles.fileMeta}>
                最后修改: {new Date(fileData.file.lastModified).toLocaleDateString()}
              </div>
            </div>
          </div>

          {fileData.pages.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>📑 页面 ({fileData.pages.length})</div>
              <div className={styles.list}>
                {fileData.pages.slice(0, 5).map((page) => (
                  <div key={page.id} className={styles.listItem}>
                    📄 {page.name}
                  </div>
                ))}
                {fileData.pages.length > 5 && (
                  <div className={styles.listMore}>
                    ... 还有 {fileData.pages.length - 5} 个页面
                  </div>
                )}
              </div>
            </div>
          )}

          {fileData.components.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>🧩 组件 ({fileData.components.length})</div>
              <div className={styles.list}>
                {fileData.components.slice(0, 10).map((comp) => (
                  <div key={comp.id} className={styles.listItem}>
                    🧩 {comp.name}
                  </div>
                ))}
                {fileData.components.length > 10 && (
                  <div className={styles.listMore}>
                    ... 还有 {fileData.components.length - 10} 个组件
                  </div>
                )}
              </div>
            </div>
          )}

          {fileData.styles.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>🎨 设计风格 ({fileData.styles.length})</div>
              <div className={styles.tags}>
                {fileData.styles.slice(0, 5).map((style) => (
                  <span key={style.key} className={styles.tag}>
                    {style.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className={styles.actions}>
            <button className={styles.buttonSecondary} onClick={handleReset}>
              返回
            </button>
            <button className={styles.button} onClick={handleApply}>
              ✅ 应用导入
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className={styles.error}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}

export default FigmaImport;
