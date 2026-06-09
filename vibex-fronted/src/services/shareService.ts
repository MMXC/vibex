/**
 * shareService.ts — Sprint82 E3: Canvas Share Service
 * Sprint83 E2: Added backend token sync for import-from-share support
 *
 * Service layer for canvas share link management.
 * Provides generateShareLink, revokeShareLink, listShareLinks operations.
 *
 * Architecture:
 * - Uses localStorage for share link persistence (no backend required for link-share)
 * - Syncs tokens to backend via canvasShareApi.registerShareToken() for import-from-share support
 * - In a real backend deployment, these would be API calls
 */

import { generateShareToken, buildSnapshotUrl } from '@/lib/shareUtils';
import type { ShareRole } from '@/lib/api/canvas-share';
import { canvasShareApi } from '@/lib/api/canvas-share';

// ============================================
// Types
// ============================================

export interface ShareLink {
  /** Unique share token */
  token: string;
  /** Canvas ID this link belongs to */
  canvasId: string;
  /** Permission level */
  role: ShareRole;
  /** When the link was created */
  createdAt: string;
  /** When the link expires (null = never) */
  expiresAt: string | null;
  /** Optional TTL in milliseconds (default: 30 days) */
  ttlMs?: number;
}

export interface GenerateShareLinkOptions {
  canvasId: string;
  canvasName: string;
  role: ShareRole;
  /** TTL in milliseconds. Default: 30 days */
  ttlMs?: number;
}

export interface GenerateShareLinkResult {
  token: string;
  url: string;
  expiresAt: string | null;
}

// ============================================
// Storage Key
// ============================================

const STORAGE_KEY = 'vibex_share_links';

/** Get all stored share links from localStorage */
function getStoredLinks(): ShareLink[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ShareLink[];
  } catch {
    return [];
  }
}

/** Persist share links to localStorage */
function saveLinks(links: ShareLink[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
  } catch {
    // Storage full or unavailable — ignore
  }
}

// ============================================
// Public API
// ============================================

/**
 * Generate a new share link for a canvas.
 * Stores the link metadata in localStorage AND syncs to backend for import-from-share support.
 */
export async function generateShareLink(
  options: GenerateShareLinkOptions
): Promise<GenerateShareLinkResult> {
  const token = generateShareToken();
  const now = new Date().toISOString();
  const ttlMs = options.ttlMs ?? 30 * 24 * 60 * 60 * 1000; // 30 days default
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();

  const link: ShareLink = {
    token,
    canvasId: options.canvasId,
    role: options.role,
    createdAt: now,
    expiresAt,
    ttlMs,
  };

  const links = getStoredLinks();
  links.push(link);
  saveLinks(links);

  // Sync token to backend for import-from-share support (S83-E2)
  // Fire-and-forget — localStorage is the primary store
  canvasShareApi.registerShareToken({
    token,
    canvasId: options.canvasId,
    role: options.role,
    expiresAt,
  }).catch(() => {
    // Backend sync failure is non-fatal — localStorage still has the token
  });

  const url = buildSnapshotUrl({
    canvasId: options.canvasId,
    projectName: options.canvasName,
  }) + `&share=${token}`;

  return { token, url, expiresAt };
}

/**
 * Revoke (delete) a share link by token.
 * Returns false if the link was not found.
 */
export async function revokeShareLink(token: string): Promise<boolean> {
  const links = getStoredLinks();
  const before = links.length;
  const filtered = links.filter((l) => l.token !== token);
  if (filtered.length === before) {
    return false; // Not found
  }
  saveLinks(filtered);

  // Sync revocation to backend (S83-E2) — fire-and-forget
  canvasShareApi.revokeShareToken(token).catch(() => {
    // Backend sync failure is non-fatal
  });

  return true;
}

/**
 * List all share links for a given canvas.
 * Automatically removes expired links.
 */
export async function listShareLinks(canvasId: string): Promise<ShareLink[]> {
  const now = new Date().getTime();
  const links = getStoredLinks();

  // Filter to this canvas, removing expired
  const valid = links.filter((l) => {
    if (l.canvasId !== canvasId) return false;
    if (!l.expiresAt) return true;
    return new Date(l.expiresAt).getTime() > now;
  });

  // Remove expired links from storage
  if (valid.length < links.length) {
    saveLinks(valid);
  }

  return valid;
}

/**
 * Check if a given token is valid for a canvas.
 */
export async function validateShareToken(
  token: string,
  canvasId: string
): Promise<ShareRole | null> {
  const links = await listShareLinks(canvasId);
  const link = links.find((l) => l.token === token);
  return link ? link.role : null;
}

/**
 * Copy text to clipboard, returning success boolean.
 */
export async function copyToClipboardShare(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
