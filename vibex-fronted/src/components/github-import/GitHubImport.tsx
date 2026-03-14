/**
 * GitHub Import Component
 * GitHub 仓库一键导入组件
 */

'use client';

import { useState, useCallback } from 'react';
import {
  parseGitHubUrl,
  importRepository,
  generateRequirementFromRepo,
  type GitHubRepoInfo,
  type PackageJsonInfo,
  type DirectoryTreeNode,
} from '@/services/github/github-import';
import { OAuthConnectButton } from '@/components/oauth';
import styles from './GitHubImport.module.css';

interface GitHubImportProps {
  onImport: (requirementText: string) => void;
  className?: string;
}

export function GitHubImport({ onImport, className }: GitHubImportProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repoInfo, setRepoInfo] = useState<GitHubRepoInfo | null>(null);
  const [packageJson, setPackageJson] = useState<PackageJsonInfo | null>(null);
  const [directoryTree, setDirectoryTree] = useState<DirectoryTreeNode[]>([]);
  const [readme, setReadme] = useState<string>('');

  const handleImport = useCallback(async () => {
    if (!url.trim()) return;

    setIsLoading(true);
    setError(null);
    setRepoInfo(null);
    setPackageJson(null);
    setDirectoryTree([]);
    setReadme('');

    try {
      const parsed = parseGitHubUrl(url);
      if (!parsed) {
        throw new Error('请输入有效的 GitHub 仓库地址');
      }

      const result = await importRepository(url);
      
      setRepoInfo(result.repoInfo);
      setPackageJson(result.packageJson);
      setDirectoryTree(result.directoryTree);
      setReadme(result.readme);

    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败，请检查仓库地址');
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  const handleApply = useCallback(() => {
    if (!repoInfo) return;

    const requirementText = generateRequirementFromRepo(repoInfo, packageJson, readme);
    onImport(requirementText);
    
    // 重置状态
    setUrl('');
    setRepoInfo(null);
    setPackageJson(null);
    setDirectoryTree([]);
    setReadme('');
  }, [repoInfo, packageJson, readme, onImport]);

  const handleReset = useCallback(() => {
    setUrl('');
    setError(null);
    setRepoInfo(null);
    setPackageJson(null);
    setDirectoryTree([]);
    setReadme('');
  }, []);

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.header}>
        <span className={styles.icon}>🐙</span>
        <span className={styles.title}>从 GitHub 导入</span>
      </div>

      {!repoInfo ? (
        <>
          <div className={styles.inputSection}>
            <input
              type="text"
              className={styles.input}
              placeholder="https://github.com/owner/repo"
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
          
          {/* OAuth 连接 */}
          <div className={styles.oauthSection}>
            <div className={styles.oauthLabel}>连接 GitHub 账户以访问私有仓库</div>
            <OAuthConnectButton provider="github" />
          </div>
        </>
      ) : (
        <div className={styles.preview}>
          <div className={styles.repoHeader}>
            <img 
              src={repoInfo.ownerAvatar} 
              alt={repoInfo.owner} 
              className={styles.avatar}
            />
            <div className={styles.repoInfo}>
              <div className={styles.repoName}>{repoInfo.fullName}</div>
              <div className={styles.repoDesc}>{repoInfo.description || '无描述'}</div>
            </div>
          </div>

          <div className={styles.stats}>
            <span>⭐ {repoInfo.stars}</span>
            <span>🍴 {repoInfo.forks}</span>
            {repoInfo.language && <span>📝 {repoInfo.language}</span>}
            {repoInfo.license && <span>📄 {repoInfo.license}</span>}
          </div>

          {packageJson && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>📦 package.json</div>
              <div className={styles.packageInfo}>
                <div><strong>名称:</strong> {packageJson.name}</div>
                <div><strong>版本:</strong> {packageJson.version}</div>
                {packageJson.dependencies && (
                  <div><strong>依赖:</strong> {Object.keys(packageJson.dependencies).length} 个</div>
                )}
              </div>
            </div>
          )}

          {directoryTree.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>📁 目录结构</div>
              <div className={styles.tree}>
                {directoryTree.slice(0, 10).map((item) => (
                  <div key={item.path} className={styles.treeItem}>
                    {item.type === 'directory' ? '📂' : '📄'} {item.name}
                  </div>
                ))}
                {directoryTree.length > 10 && (
                  <div className={styles.treeMore}>
                    ... 还有 {directoryTree.length - 10} 个文件
                  </div>
                )}
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

export default GitHubImport;
