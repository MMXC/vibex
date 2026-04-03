/**
 * Figma Import Service
 * 处理 Figma 设计稿导入逻辑
 */
// @ts-nocheck


import { getApiUrl } from '@/lib/api-config';

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface FigmaFileInfo {
  name: string;
  thumbnailUrl: string;
  lastModified: string;
  version: string;
}

export interface FigmaPage {
  id: string;
  name: string;
  type: string;
}

export interface FigmaComponent {
  id: string;
  name: string;
  description: string;
  thumbnailUrl?: string;
}

export interface FigmaStyle {
  key: string;
  name: string;
  styleType: string;
  description?: string;
}

export interface FigmaFileData {
  file: FigmaFileInfo;
  pages: FigmaPage[];
  components: FigmaComponent[];
  styles: FigmaStyle[];
}

/**
 * 解析 Figma 文件 URL
 */
export function parseFigmaUrl(url: string): { fileKey: string } | null {
  // 支持的格式:
  // https://www.figma.com/file/FILE_KEY/Project-Name
  // https://www.figma.com/design/FILE_KEY/Project-Name
  // https://www.figma.com/file/FILE_KEY
  
  const patterns = [
    /figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/,
    /figma\.com\/file\/([a-zA-Z0-9]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return { fileKey: match[1] };
    }
  }
  return null;
}

/**
 * 获取 OAuth 授权 URL
 */
export async function getFigmaAuthUrl(): Promise<{ authUrl: string; state: string }> {
  const response = await fetch(getApiUrl('/api/figma/auth-url'), {
    method: 'POST',
    headers: { ...getAuthHeaders() },
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('登录已过期，请重新登录');
    }
    throw new Error('Failed to get Figma auth URL');
  }
  
  return response.json();
}

/**
 * 处理 OAuth 回调
 */
export async function handleFigmaCallback(code: string, state: string): Promise<{ success: boolean }> {
  const response = await fetch(getApiUrl('/api/figma/callback'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ code, state }),
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('登录已过期，请重新登录');
    }
    throw new Error('Failed to complete Figma authentication');
  }
  
  return response.json();
}

/**
 * 获取 Figma 文件信息
 */
export async function fetchFigmaFile(fileKey: string): Promise<FigmaFileData> {
  const response = await fetch(getApiUrl(`/api/figma/file`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ fileKey }),
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('登录已过期，请重新登录');
    }
    const error = await response.json().catch(() => ({ message: 'Failed to fetch Figma file' }));
    throw new Error(error.message || 'Failed to fetch Figma file');
  }
  
  return response.json();
}

/**
 * 完整导入 Figma 文件
 */
export async function importFigmaFile(url: string): Promise<FigmaFileData> {
  const parsed = parseFigmaUrl(url);
  if (!parsed) {
    throw new Error('Invalid Figma URL');
  }

  return fetchFigmaFile(parsed.fileKey);
}

/**
 * 从 Figma 文件生成需求文本
 */
export function generateRequirementFromFigma(fileData: FigmaFileData): string {
  let requirement = `导入 Figma 设计稿: ${fileData.file.name}\n\n`;
  
  if (fileData.pages.length > 0) {
    requirement += `## 页面\n`;
    fileData.pages.forEach(page => {
      requirement += `- ${page.name}\n`;
    });
    requirement += '\n';
  }
  
  if (fileData.components.length > 0) {
    requirement += `## 组件 (${fileData.components.length} 个)\n`;
    fileData.components.slice(0, 20).forEach(comp => {
      requirement += `- ${comp.name}: ${comp.description || '无描述'}\n`;
    });
    if (fileData.components.length > 20) {
      requirement += `- ... 还有 ${fileData.components.length - 20} 个组件\n`;
    }
  }
  
  if (fileData.styles.length > 0) {
    requirement += `\n## 设计风格\n`;
    fileData.styles.forEach(style => {
      requirement += `- ${style.name} (${style.styleType})\n`;
    });
  }
  
  return requirement;
}
