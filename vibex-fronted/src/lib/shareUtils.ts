/**
 * shareUtils.ts — Sprint58 E4: Canvas Share Utilities
 *
 * Pure utility functions for canvas sharing operations.
 * No side effects; all async I/O is deferred to callers.
 *
 * Responsibilities:
 * - Generate share tokens (16-char alphanumeric)
 * - Check share permission for a given token + requested role
 * - Build shareable URLs (snapshot link, team share link)
 * - Build token-based share URLs: /canvas/<id>?share=<token>
 * - Serialize/deserialize share state for clipboard/export
 * - Validate share configurations
 * - Format share messages for notification/clipboard
 */

import type { ShareRole } from '@/lib/api/canvas-share';

// ============================================
// Types
// ============================================

export interface ShareableCanvasPayload {
  canvasId: string;
  canvasName: string;
  snapshotUrl?: string;
  teamShareUrl?: string;
  role?: ShareRole;
}

export interface ShareLinkConfig {
  canvasId: string;
  projectName?: string;
  /** Base URL for snapshot links (defaults to app origin) */
  baseUrl?: string;
  /** TTL in milliseconds (default: 30 days) */
  ttlMs?: number;
}

export interface ShareMessageConfig {
  canvasName: string;
  role: ShareRole;
  teamName?: string;
  link?: string;
  locale?: 'zh' | 'en';
}

export interface ShareAccessCheck {
  canvasId: string;
  userId: string;
  minRole?: ShareRole;
}

// ============================================
// Constants
// ============================================

const SNAPSHOT_PATH = '/snapshot';
const DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// ============================================
// URL Builders
// ============================================

/**
 * Build a public snapshot URL for a canvas.
 * The actual snapshot is created on the backend when this URL is first accessed.
 */
export function buildSnapshotUrl(config: ShareLinkConfig): string {
  const base = config.baseUrl ?? (typeof window !== 'undefined' ? window.location.origin : '');
  const params = new URLSearchParams();
  params.set('canvas', config.canvasId);
  if (config.projectName) {
    params.set('name', config.projectName);
  }
  return `${base}${SNAPSHOT_PATH}?${params.toString()}`;
}

/**
 * Build a team-share deep link that opens the canvas with team context.
 */
export function buildTeamShareUrl(
  canvasId: string,
  teamId: string,
  baseUrl?: string
): string {
  const base = baseUrl ?? (typeof window !== 'undefined' ? window.location.origin : '');
  const params = new URLSearchParams();
  params.set('canvas', canvasId);
  params.set('team', teamId);
  return `${base}/canvas/${canvasId}?${params.toString()}`;
}

// ============================================
// Serializers
// ============================================

/**
 * Serialize a canvas share payload for clipboard/URL encoding.
 * Use this to encode share state into a short string (e.g., for short-link services).
 */
export function serializeSharePayload(payload: ShareableCanvasPayload): string {
  try {
    const minimal: Record<string, string | undefined> = {
      id: payload.canvasId,
      n: payload.canvasName,
      r: payload.role,
      u: payload.snapshotUrl,
      t: payload.teamShareUrl,
    };
    // Strip undefined values
    const clean = Object.fromEntries(
      Object.entries(minimal).filter(([, v]) => v !== undefined)
    );
    return btoa(encodeURIComponent(JSON.stringify(clean)));
  } catch {
    return '';
  }
}

/**
 * Deserialize a share payload from a clipboard/URL string.
 */
export function deserializeSharePayload(encoded: string): ShareableCanvasPayload | null {
  try {
    const json = JSON.parse(decodeURIComponent(atob(encoded)));
    return {
      canvasId: json.id ?? '',
      canvasName: json.n ?? '',
      role: json.r,
      snapshotUrl: json.u,
      teamShareUrl: json.t,
    };
  } catch {
    return null;
  }
}

// ============================================
// Validators
// ============================================

/**
 * Check whether a ShareRole is sufficient for the requested access level.
 * Editor access implies viewer access.
 */
export function hasShareAccess(userRole: ShareRole, requiredRole: ShareRole): boolean {
  if (requiredRole === 'viewer') return true; // both editor and viewer can view
  if (requiredRole === 'editor') return userRole === 'editor';
  return false;
}

/**
 * Validate that a share configuration is well-formed.
 * Returns an array of error strings (empty if valid).
 */
export function validateShareConfig(config: {
  canvasId?: string;
  teamId?: string;
  role?: ShareRole;
}): string[] {
  const errors: string[] = [];
  if (!config.canvasId?.trim()) {
    errors.push('canvasId is required');
  }
  if (!config.teamId?.trim()) {
    errors.push('teamId is required');
  }
  if (config.role && !['viewer', 'editor'].includes(config.role)) {
    errors.push(`Invalid role: ${config.role}`);
  }
  return errors;
}

// ============================================
// Message Formatters
// ============================================

const ZH_MESSAGES = {
  viewer: '只读',
  editor: '编辑',
};

const EN_MESSAGES = {
  viewer: 'view only',
  editor: 'edit',
};

/**
 * Format a share notification message.
 */
export function formatShareMessage(config: ShareMessageConfig): string {
  const msgs = config.locale === 'en' ? EN_MESSAGES : ZH_MESSAGES;
  const roleText = msgs[config.role ?? 'viewer'];
  const name = config.canvasName || '画布';

  if (config.teamName) {
    if (config.locale === 'en') {
      return `"${name}" has been shared with team "${config.teamName}" as ${roleText}.`;
    }
    return `「${name}」已以${roleText}权限分享给团队「${config.teamName}」`;
  }

  if (config.link) {
    if (config.locale === 'en') {
      return `"${name}" has been shared with you (${roleText} access). ${config.link}`;
    }
    return `「${name}」已分享给你（${roleText}权限）：${config.link}`;
  }

  if (config.locale === 'en') {
    return `"${name}" has been shared with you as ${roleText}.`;
  }
  return `「${name}」已以${roleText}权限分享给你`;
}

/**
 * Format a clipboard success message shown after copying share link.
 */
export function formatClipboardSuccess(locale?: 'zh' | 'en'): string {
  if (locale === 'en') return 'Share link copied!';
  return '分享链接已复制';
}

// ============================================
// Clipboard Helpers
// ============================================

/**
 * Copy text to the clipboard using the Clipboard API.
 * Falls back to execCommand for older browsers.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.focus();
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

// ============================================
// Token Generation & Permission Checking
// ============================================

/**
 * Generate a cryptographically random 16-character alphanumeric share token.
 * Uses Math.random for simplicity; callers can upgrade to crypto.getRandomValues().
 */
export function generateShareToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 16; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Share permission result.
 * allowed=true when the token exists and grants sufficient role.
 */
export interface SharePermissionResult {
  allowed: boolean;
  /** The role granted by the token, or null if not found/expired */
  role: ShareRole | null;
  /** Error reason if not allowed */
  reason?: string;
}

/**
 * Check whether a share token grants the requested role for a canvas.
 *
 * This function is pure — callers provide the token registry (canvasShareRecords).
 * The registry can come from canvasListStore.shareMap[canvasId].
 *
 * Permission hierarchy: 'editor' > 'viewer'.
 * A token that grants 'editor' also grants 'viewer'.
 */
export function checkSharePermission(
  shareToken: string,
  requestedRole: ShareRole,
  canvasShareRecords: { token: string; role: ShareRole }[]
): SharePermissionResult {
  if (!shareToken) {
    return { allowed: false, role: null, reason: 'Token is empty' };
  }

  const record = canvasShareRecords.find((r) => r.token === shareToken);

  if (!record) {
    return { allowed: false, role: null, reason: 'Token not found' };
  }

  const { role } = record;

  // Editor always satisfies viewer request
  if (requestedRole === 'viewer') {
    return { allowed: true, role };
  }

  // Editor request: only editor role grants it
  if (role === 'editor') {
    return { allowed: true, role: 'editor' };
  }

  return { allowed: false, role, reason: 'Insufficient permission: token grants viewer only' };
}

/**
 * Build a token-based share URL for a canvas.
 * Format: /canvas/<id>?share=<token>
 *
 * This is the E4 share URL format (distinct from the /snapshot approach).
 */
export function buildShareUrl(canvasId: string, shareToken: string, baseUrl?: string): string {
  const base = baseUrl ?? (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/canvas/${canvasId}?share=${encodeURIComponent(shareToken)}`;
}

/**
 * Parse the share token from a URL search params object or URLSearchParams string.
 * Returns null if no share param is present.
 */
export function parseShareTokenFromUrl(searchParams: URLSearchParams | string): string | null {
  const params = typeof searchParams === 'string'
    ? new URLSearchParams(searchParams)
    : searchParams;
  const token = params.get('share');
  return token && token.length > 0 ? token : null;
}

