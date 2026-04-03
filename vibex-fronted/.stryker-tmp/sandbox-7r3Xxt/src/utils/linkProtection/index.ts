/**
 * Link Protection Utilities
 * 链接有效期设置和密码保护
 */
// @ts-nocheck


export interface ProtectedLink {
  id: string;
  url: string;
  expiresAt: string | null; // null means never expires
  password: string | null;   // null means no password
  createdAt: string;
  accessCount: number;
  maxAccess?: number;
}

const STORAGE_KEY = 'protected_links';

/**
 * Create a protected link with expiration and/or password
 */
export function createProtectedLink(
  url: string,
  options?: {
    expiresIn?: number;     // hours, null = never expires
    password?: string;       // null = no password
    maxAccess?: number;     // max access count
  }
): ProtectedLink {
  const link: ProtectedLink = {
    id: generateId(),
    url,
    expiresAt: options?.expiresIn 
      ? new Date(Date.now() + options.expiresIn * 60 * 60 * 1000).toISOString()
      : null,
    password: options?.password || null,
    createdAt: new Date().toISOString(),
    accessCount: 0,
    maxAccess: options?.maxAccess,
  };

  // Store
  const links = getAllLinks();
  links.push(link);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links));

  return link;
}

/**
 * Check if link is accessible (not expired, password valid)
 */
export function checkLinkAccess(
  linkId: string,
  password?: string
): { accessible: boolean; reason?: string } {
  const links = getAllLinks();
  const link = links.find((l) => l.id === linkId);

  if (!link) {
    return { accessible: false, reason: '链接不存在' };
  }

  // Check expiration
  if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
    return { accessible: false, reason: '链接已过期' };
  }

  // Check max access
  if (link.maxAccess && link.accessCount >= link.maxAccess) {
    return { accessible: false, reason: '访问次数已达上限' };
  }

  // Check password
  if (link.password && link.password !== password) {
    return { accessible: false, reason: '密码错误' };
  }

  // Increment access count
  link.accessCount++;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links));

  return { accessible: true };
}

/**
 * Update link expiration
 */
export function updateLinkExpiration(linkId: string, expiresIn: number | null): boolean {
  const links = getAllLinks();
  const link = links.find((l) => l.id === linkId);

  if (!link) return false;

  link.expiresAt = expiresIn 
    ? new Date(Date.now() + expiresIn * 60 * 60 * 1000).toISOString()
    : null;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
  return true;
}

/**
 * Update link password
 */
export function updateLinkPassword(linkId: string, password: string | null): boolean {
  const links = getAllLinks();
  const link = links.find((l) => l.id === linkId);

  if (!link) return false;

  link.password = password;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
  return true;
}

/**
 * Verify password for a link
 */
export function verifyLinkPassword(linkId: string, password: string): boolean {
  const links = getAllLinks();
  const link = links.find((l) => l.id === linkId);

  if (!link) return false;
  return link.password === password;
}

/**
 * Get all protected links
 */
export function getAllLinks(): ProtectedLink[] {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

/**
 * Get link by ID
 */
export function getLink(linkId: string): ProtectedLink | null {
  const links = getAllLinks();
  return links.find((l) => l.id === linkId) || null;
}

/**
 * Delete a protected link
 */
export function deleteLink(linkId: string): boolean {
  const links = getAllLinks();
  const filtered = links.filter((l) => l.id !== linkId);
  
  if (filtered.length === links.length) return false;
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

/**
 * Check if link is expired
 */
export function isLinkExpired(linkId: string): boolean {
  const link = getLink(linkId);
  if (!link || !link.expiresAt) return false;
  return new Date(link.expiresAt) < new Date();
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export default {
  createProtectedLink,
  checkLinkAccess,
  updateLinkExpiration,
  updateLinkPassword,
  verifyLinkPassword,
  getAllLinks,
  getLink,
  deleteLink,
  isLinkExpired,
};
