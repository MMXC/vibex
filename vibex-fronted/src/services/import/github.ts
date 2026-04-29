/**
 * GitHub Import Service
 * 处理 GitHub 仓库导入逻辑
 */

import { getApiUrl } from '@/lib/api-config';

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface GitHubRepoInfo {
  name: string;
  fullName: string;
  description: string | null;
  owner: string;
  ownerAvatar: string;
  stars: number;
  forks: number;
  language: string | null;
  license: string | null;
  defaultBranch: string;
  createdAt: string;
  updatedAt: string;
}

export interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  sha: string;
}

export interface PackageJsonInfo {
  name: string;
  version: string;
  description?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

export interface DirectoryTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: DirectoryTreeNode[];
}

/**
 * 解析 GitHub 仓库 URL
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  // 支持的格式:
  // https://github.com/owner/repo
  // https://github.com/owner/repo.git
  // github.com/owner/repo
  // owner/repo
  
  const patterns = [
    /github\.com\/([^\/]+)\/([^\/\s.]+)/,
    /^([^\/]+)\/([^\/\s.]+)$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return { owner: match[1] ?? '', repo: (match[2] ?? '').replace('.git', '') };
    }
  }
  return null;
}

/**
 * 获取仓库信息
 */
export async function fetchRepoInfo(owner: string, repo: string): Promise<GitHubRepoInfo> {
  const response = await fetch(getApiUrl(`/api/github/repos/${owner}/${repo}`), {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    if (response.status === 401) throw new Error('登录已过期，请重新登录');
    const error = await response.json().catch(() => ({ message: 'Failed to fetch repository' }));
    throw new Error(error.message || 'Failed to fetch repository');
  }
  
  return response.json();
}

/**
 * 获取仓库 README
 */
export async function fetchReadme(owner: string, repo: string, branch?: string): Promise<string> {
  const params = branch ? `?ref=${branch}` : '';
  const response = await fetch(getApiUrl(`/api/github/repos/${owner}/${repo}/readme${params}`), {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    if (response.status === 401) throw new Error('登录已过期，请重新登录');
    throw new Error('Failed to fetch README');
  }
  
  const data = await response.json();
  // README 内容是 Base64 编码的
  return atob(data.content);
}

/**
 * 解析 package.json
 */
export async function parsePackageJson(owner: string, repo: string, branch?: string): Promise<PackageJsonInfo | null> {
  try {
    const response = await fetch(
      getApiUrl(`/api/github/repos/${owner}/${repo}/contents/package.json${branch ? `?ref=${branch}` : ''}`),
      { headers: getAuthHeaders() }
    );
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    const content = atob(data.content);
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * 获取目录结构
 */
export async function fetchDirectoryTree(
  owner: string, 
  repo: string, 
  path: string = '',
  branch?: string
): Promise<DirectoryTreeNode[]> {
  const params = new URLSearchParams({ path });
  if (branch) params.append('ref', branch);
  
  const response = await fetch(getApiUrl(`/api/github/repos/${owner}/${repo}/contents?${params}`), {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    if (response.status === 401) throw new Error('登录已过期，请重新登录');
    throw new Error('Failed to fetch directory contents');
  }
  
  const data = await response.json();
  
  return data.map((item: GitHubFile) => ({
    name: item.name,
    path: item.path,
    type: item.type,
    sha: item.sha,
    size: item.size,
  }));
}

/**
 * 完整导入仓库
 */
export async function importRepository(url: string): Promise<{
  repoInfo: GitHubRepoInfo;
  readme: string;
  packageJson: PackageJsonInfo | null;
  directoryTree: DirectoryTreeNode[];
}> {
  const parsed = parseGitHubUrl(url);
  if (!parsed) {
    throw new Error('Invalid GitHub URL');
  }

  const { owner, repo } = parsed;

  // 并行获取所有信息
  const [repoInfo, readme, packageJson, directoryTree] = await Promise.all([
    fetchRepoInfo(owner, repo).catch(() => null),
    fetchReadme(owner, repo).catch(() => ''),
    parsePackageJson(owner, repo).catch(() => null),
    fetchDirectoryTree(owner, repo).catch(() => []),
  ]);

  if (!repoInfo) {
    throw new Error('Repository not found or not accessible');
  }

  return {
    repoInfo,
    readme,
    packageJson,
    directoryTree,
  };
}

/**
 * 从仓库信息生成需求文本
 */
export function generateRequirementFromRepo(
  repoInfo: GitHubRepoInfo,
  packageJson?: PackageJsonInfo | null,
  readme?: string
): string {
  let requirement = `导入 GitHub 仓库: ${repoInfo.fullName}\n\n`;
  
  if (repoInfo.description) {
    requirement += `## 项目描述\n${repoInfo.description}\n\n`;
  }
  
  if (packageJson) {
    requirement += `## 技术栈\n`;
    if (packageJson.dependencies) {
      requirement += `### 生产依赖\n`;
      Object.entries(packageJson.dependencies).forEach(([name, version]) => {
        requirement += `- ${name}: ${version}\n`;
      });
      requirement += '\n';
    }
    if (packageJson.devDependencies) {
      requirement += `### 开发依赖\n`;
      Object.entries(packageJson.devDependencies).forEach(([name, version]) => {
        requirement += `- ${name}: ${version}\n`;
      });
    }
  }
  
  if (readme && readme.length > 0) {
    const summary = readme.slice(0, 1000);
    requirement += `\n## README\n${summary}${readme.length > 1000 ? '...' : ''}`;
  }
  
  return requirement;
}
