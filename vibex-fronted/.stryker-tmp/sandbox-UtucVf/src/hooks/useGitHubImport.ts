/**
 * useGitHubImport Hook
 * GitHub 仓库导入的自定义 Hook
 */
// @ts-nocheck


import { useState, useCallback } from 'react';
import {
  parseGitHubUrl,
  importRepository,
  generateRequirementFromRepo,
  type GitHubRepoInfo,
  type PackageJsonInfo,
  type DirectoryTreeNode,
} from '@/services/import/github';

interface UseGitHubImportReturn {
  // State
  url: string;
  setUrl: (url: string) => void;
  isLoading: boolean;
  error: string | null;
  repoInfo: GitHubRepoInfo | null;
  packageJson: PackageJsonInfo | null;
  directoryTree: DirectoryTreeNode[];
  readme: string;
  
  // Actions
  importRepo: () => Promise<void>;
  applyImport: (onImport: (text: string) => void) => void;
  reset: () => void;
}

/**
 * GitHub 导入 Hook
 */
export function useGitHubImport(): UseGitHubImportReturn {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repoInfo, setRepoInfo] = useState<GitHubRepoInfo | null>(null);
  const [packageJson, setPackageJson] = useState<PackageJsonInfo | null>(null);
  const [directoryTree, setDirectoryTree] = useState<DirectoryTreeNode[]>([]);
  const [readme, setReadme] = useState<string>('');

  const importRepo = useCallback(async () => {
    if (!url.trim()) return;

    setIsLoading(true);
    setError(null);
    setRepoInfo(null);

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
      setError(err instanceof Error ? err.message : '导入失败');
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  const applyImport = useCallback((onImport: (text: string) => void) => {
    if (!repoInfo) return;

    const requirementText = generateRequirementFromRepo(repoInfo, packageJson, readme);
    onImport(requirementText);
    reset();
  }, [repoInfo, packageJson, readme]);

  const reset = useCallback(() => {
    setUrl('');
    setError(null);
    setRepoInfo(null);
    setPackageJson(null);
    setDirectoryTree([]);
    setReadme('');
  }, []);

  return {
    url,
    setUrl,
    isLoading,
    error,
    repoInfo,
    packageJson,
    directoryTree,
    readme,
    importRepo,
    applyImport,
    reset,
  };
}

export default useGitHubImport;
