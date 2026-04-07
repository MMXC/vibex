/**
 * Prototype Link Generator
 * 静态原型链接生成
 */

import { designApi } from '@/services/api/modules/design';

export interface PrototypeLink {
  id: string;
  url: string;
  expiresAt: string;
  pageName: string;
}

export interface GenerateLinkRequest {
  pages: Array<{
    name: string;
    route: string;
    components: unknown[];
  }>;
  theme?: Record<string, unknown>;
  expiresIn?: number; // hours
}

export interface GenerateLinkResponse {
  success: boolean;
  link?: PrototypeLink;
  error?: string;
}

/**
 * Generate prototype preview link
 */
export async function generatePrototypeLink(
  pages: GenerateLinkRequest['pages'],
  options?: {
    theme?: Record<string, unknown>;
    expiresIn?: number;
  }
): Promise<GenerateLinkResponse> {
  try {
    // Call API to generate prototype
    const result = await designApi.generatePrototype({
      pages,
      theme: options?.theme,
    });

    if (!result.success || !result.prototype) {
      return {
        success: false,
        error: result.error || '生成失败',
      };
    }

    // Generate shareable link (in real app, this would be a backend-generated URL)
    const prototypeId = result.prototype.id;
    const expiresIn = options?.expiresIn || 24; // default 24 hours
    
    const link: PrototypeLink = {
      id: prototypeId,
      url: `/preview/prototype/${prototypeId}`,
      expiresAt: new Date(Date.now() + expiresIn * 60 * 60 * 1000).toISOString(),
      pageName: pages[0]?.name || 'Prototype',
    };

    // Store in localStorage for demo purposes
    if (typeof window !== 'undefined') {
      const existing = JSON.parse(localStorage.getItem('prototype_links') || '[]');
      existing.push(link);
      localStorage.setItem('prototype_links', JSON.stringify(existing.slice(-10))); // Keep last 10
    }

    return {
      success: true,
      link,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '生成失败',
    };
  }
}

/**
 * Get prototype link by ID
 */
export async function getPrototypeLink(id: string): Promise<PrototypeLink | null> {
  if (typeof window === 'undefined') return null;

  const links = JSON.parse(localStorage.getItem('prototype_links') || '[]') as PrototypeLink[];
  return links.find((l) => l.id === id) || null;
}

/**
 * Check if prototype link is valid
 */
export function isLinkValid(link: PrototypeLink): boolean {
  return new Date(link.expiresAt) > new Date();
}

/**
 * Get all prototype links
 */
export function getAllPrototypeLinks(): PrototypeLink[] {
  if (typeof window === 'undefined') return [];

  const links = JSON.parse(localStorage.getItem('prototype_links') || '[]') as PrototypeLink[];
  
  // Filter and return valid links
  return links.filter(isLinkValid);
}

/**
 * Delete prototype link
 */
export function deletePrototypeLink(id: string): void {
  if (typeof window === 'undefined') return;

  const links = JSON.parse(localStorage.getItem('prototype_links') || '[]') as PrototypeLink[];
  const filtered = links.filter((l) => l.id !== id);
  localStorage.setItem('prototype_links', JSON.stringify(filtered));
}

/**
 * Copy link to clipboard
 */
export async function copyLinkToClipboard(url: string): Promise<boolean> {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export default {
  generatePrototypeLink,
  getPrototypeLink,
  isLinkValid,
  getAllPrototypeLinks,
  deletePrototypeLink,
  copyLinkToClipboard,
};
