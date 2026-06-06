/**
 * templateShare.ts — S69-E3: 模板市场
 *
 * URL-based canvas template sharing via Base64 encoding.
 * Format: ?template=<base64(JSON.stringify({version, id, name, snapshot}))>
 */

import type { CanvasTemplateData } from './templateStore';

// ─── Constants ────────────────────────────────────────────────────────────────

const SHARE_VERSION = '1.0';
/** Warn user if encoded URL exceeds this size (8 KB). */
const URL_SIZE_WARN_THRESHOLD = 8 * 1024;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SharePayload {
  version: string;
  id: string;
  name: string;
  description: string;
  icon: string;
  category: CanvasTemplateData['category'];
  tags: string[];
  snapshot: string;
}

export interface ParseResult {
  success: true;
  payload: SharePayload;
  urlTooLong: boolean;
}

export interface ParseError {
  success: false;
  error: string;
}

// ─── Encoding ────────────────────────────────────────────────────────────────

/**
 * Encode a canvas template into a shareable Base64 URL fragment.
 * Returns { encoded, urlTooLong, urlLength }.
 */
export function encodeTemplateToShareUrl(
  template: Pick<CanvasTemplateData, 'id' | 'name' | 'description' | 'icon' | 'category' | 'tags' | 'snapshot'>
): { encoded: string; urlTooLong: boolean; urlLength: number } {
  const payload: SharePayload = {
    version: SHARE_VERSION,
    id: template.id,
    name: template.name,
    description: template.description,
    icon: template.icon,
    category: template.category,
    tags: template.tags,
    snapshot: template.snapshot,
  };

  const json = JSON.stringify(payload);
  // btoa requires a binary string; encode each char code
  const encoded = btoa(unescape(encodeURIComponent(json)));
  // URL-safe base64: replace +/= with -_. (URI component encoding handles + -> %2B, / -> %2F)
  const urlSafe = encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  const paramValue = `template=${encodeURIComponent(urlSafe)}`;
  const urlLength = paramValue.length + 1; // +1 for the leading ?

  return {
    encoded: urlSafe,
    urlTooLong: urlLength > URL_SIZE_WARN_THRESHOLD,
    urlLength,
  };
}

/**
 * Build the full share URL for a given template.
 * Appends ?template=... to the current origin.
 */
export function buildTemplateShareUrl(
  template: Pick<CanvasTemplateData, 'id' | 'name' | 'description' | 'icon' | 'category' | 'tags' | 'snapshot'>
): { url: string; urlTooLong: boolean } {
  const { encoded, urlTooLong } = encodeTemplateToShareUrl(template);
  const url = `${window.location.origin}${window.location.pathname}?template=${encodeURIComponent(encoded)}`;
  return { url, urlTooLong };
}

// ─── Decoding ────────────────────────────────────────────────────────────────

/**
 * Decode a Base64 share URL fragment back into a SharePayload.
 */
export function decodeShareUrl(url: string): ParseResult | ParseError {
  try {
    const parsed = new URL(url);
    const raw = parsed.searchParams.get('template');
    if (!raw) {
      return { success: false, error: 'URL 中未找到 template 参数' };
    }

    // Restore standard base64: - -> +, _ -> /, add padding
    let standard = raw.replace(/-/g, '+').replace(/_/g, '/');
    const padding = (4 - (standard.length % 4)) % 4;
    standard += '='.repeat(padding);

    const json = decodeURIComponent(escape(atob(standard)));
    const payload: SharePayload = JSON.parse(json);

    // Version check
    if (!payload.version || !payload.snapshot || !payload.id || !payload.name) {
      return { success: false, error: '分享链接格式无效，缺少必要字段' };
    }

    // Warn if URL is long
    const paramValue = `template=${encodeURIComponent(raw)}`;
    const urlTooLong = paramValue.length + 1 > URL_SIZE_WARN_THRESHOLD;

    return { success: true, payload, urlTooLong };
  } catch (e) {
    if (e instanceof Error) {
      return { success: false, error: `解析失败: ${e.message}` };
    }
    return { success: false, error: '解析失败: 未知错误' };
  }
}

// ─── Clipboard ───────────────────────────────────────────────────────────────

/**
 * Copy text to clipboard. Returns true on success.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
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

// ─── URL Extraction ───────────────────────────────────────────────────────────

/**
 * Extract template share URL from the current browser location.
 * Returns null if no ?template= param is present.
 */
export function extractShareUrlFromLocation(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const template = params.get('template');
  if (!template) return null;
  return `${window.location.origin}${window.location.pathname}?template=${encodeURIComponent(template)}`;
}

/**
 * Clear the ?template= param from the browser URL without triggering navigation.
 */
export function clearShareUrlFromLocation(): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.delete('template');
  window.history.replaceState({}, '', url.toString());
}
