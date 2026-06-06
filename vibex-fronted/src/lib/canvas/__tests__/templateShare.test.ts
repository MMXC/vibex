/**
 * templateShare.test.ts — S69-E3: 模板市场
 *
 * Tests for Base64 URL encode/decode, share URL building, clipboard copy,
 * and the importFromShareUrl store function.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock window before importing the module ────────────────────────────────
// vi.mock is hoisted and runs before the module is evaluated
vi.mock('@/lib/canvas/templateShare', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/canvas/templateShare')>();
  return { ...mod };
});

beforeEach(() => {
  // jsdom doesn't set window.location.origin/pathname properly
  // We use Object.defineProperty so we can update search between tests
  const loc = {
    origin: 'https://vibex.app',
    pathname: '/canvas',
    _search: '',
    get search() { return this._search; },
    set search(v: string) { this._search = v; },
  };
  Object.defineProperty(globalThis, 'window', {
    value: { location: loc },
    writable: true,
    configurable: true,
  });
  vi.stubGlobal('location', loc);
});

import {
  encodeTemplateToShareUrl,
  buildTemplateShareUrl,
  decodeShareUrl,
  copyToClipboard,
  extractShareUrlFromLocation,
} from '@/lib/canvas/templateShare';
import type { CanvasTemplateData } from '@/lib/canvas/templateStore';

const MOCK_TEMPLATE: CanvasTemplateData = {
  id: 'tpl-test-001',
  name: '测试流程图',
  description: '用于单元测试的模板',
  icon: '🔀',
  createdAt: '2026-06-13T10:00:00.000Z',
  updatedAt: '2026-06-13T10:00:00.000Z',
  snapshot: JSON.stringify({ schemaVersion: '1.2.0', chapters: [], crossChapterEdges: [] }),
  category: 'flowchart',
  tags: ['flow', 'test'],
  isPreset: false,
};

// ─── encodeTemplateToShareUrl ──────────────────────────────────────────────

describe('encodeTemplateToShareUrl', () => {
  it('should encode a template into a non-empty Base64 string', () => {
    const result = encodeTemplateToShareUrl(MOCK_TEMPLATE);
    expect(result.encoded).toBeTruthy();
    expect(result.urlTooLong).toBe(false);
    expect(result.urlLength).toBeGreaterThan(0);
  });

  it('should mark small templates as not too long', () => {
    const result = encodeTemplateToShareUrl(MOCK_TEMPLATE);
    expect(result.urlTooLong).toBe(false);
  });

  it('should encode a template with URL-safe base64 (no +, /, or =)', () => {
    const result = encodeTemplateToShareUrl(MOCK_TEMPLATE);
    expect(result.encoded).not.toContain('+');
    expect(result.encoded).not.toContain('/');
    expect(result.encoded).not.toContain('=');
  });

  it('should mark large templates as too long', () => {
    const largeTemplate: CanvasTemplateData = {
      ...MOCK_TEMPLATE,
      snapshot: JSON.stringify({ data: 'x'.repeat(10000) }),
    };
    const result = encodeTemplateToShareUrl(largeTemplate);
    expect(result.urlTooLong).toBe(true);
  });
});

// ─── buildTemplateShareUrl ──────────────────────────────────────────────────

describe('buildTemplateShareUrl', () => {
  it('should return a full URL with ?template= param', () => {
    const result = buildTemplateShareUrl(MOCK_TEMPLATE);
    expect(result.url).toContain('?template=');
    expect(result.url.startsWith('https://vibex.app/canvas?template=')).toBe(true);
  });

  it('should return urlTooLong=false for normal templates', () => {
    const result = buildTemplateShareUrl(MOCK_TEMPLATE);
    expect(result.urlTooLong).toBe(false);
  });

  it('should include the encoded template data in the URL', () => {
    const { url } = buildTemplateShareUrl(MOCK_TEMPLATE);
    const param = url.split('?template=')[1];
    expect(param).toBeTruthy();
    expect(param.length).toBeGreaterThan(10);
  });

  it('should be a roundtrip: build → decode → same data', () => {
    const { url } = buildTemplateShareUrl(MOCK_TEMPLATE);
    const result = decodeShareUrl(url);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.payload.id).toBe(MOCK_TEMPLATE.id);
      expect(result.payload.name).toBe(MOCK_TEMPLATE.name);
      expect(result.payload.description).toBe(MOCK_TEMPLATE.description);
      expect(result.payload.icon).toBe(MOCK_TEMPLATE.icon);
      expect(result.payload.category).toBe(MOCK_TEMPLATE.category);
      expect(result.payload.tags).toEqual(MOCK_TEMPLATE.tags);
    }
  });
});

// ─── decodeShareUrl ─────────────────────────────────────────────────────────

describe('decodeShareUrl', () => {
  it('should decode a valid share URL back to a template', () => {
    const { url } = buildTemplateShareUrl(MOCK_TEMPLATE);
    const result = decodeShareUrl(url);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.payload.id).toBe('tpl-test-001');
      expect(result.payload.name).toBe('测试流程图');
    }
  });

  it('should return error for empty URL', () => {
    const result = decodeShareUrl('');
    expect(result.success).toBe(false);
  });

  it('should return error for URL without template param', () => {
    const result = decodeShareUrl('https://vibex.app/canvas?q=hello');
    expect(result.success).toBe(false);
  });

  it('should return error for corrupted Base64', () => {
    const result = decodeShareUrl('https://vibex.app/canvas?template=NOT_BASE64!!!');
    expect(result.success).toBe(false);
  });

  it('should return error for valid Base64 but invalid JSON', () => {
    const invalid = btoa('not json at all');
    const result = decodeShareUrl(
      `https://vibex.app/canvas?template=${encodeURIComponent(invalid)}`
    );
    expect(result.success).toBe(false);
  });

  it('should return error for missing required fields', () => {
    const payload = { name: 'No ID', version: '1.0' };
    const encoded = btoa(JSON.stringify(payload));
    const result = decodeShareUrl(
      `https://vibex.app/canvas?template=${encodeURIComponent(encoded)}`
    );
    expect(result.success).toBe(false);
  });

  it('should return urlTooLong=true when encoded URL exceeds threshold', () => {
    const largeTemplate: CanvasTemplateData = {
      ...MOCK_TEMPLATE,
      description: 'x'.repeat(10000),
    };
    const { url } = buildTemplateShareUrl(largeTemplate);
    const result = decodeShareUrl(url);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.urlTooLong).toBe(true);
    }
  });
});

// ─── copyToClipboard ───────────────────────────────────────────────────────

describe('copyToClipboard', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('should call navigator.clipboard.writeText with the given text', async () => {
    await copyToClipboard('hello world');
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('hello world');
  });

  it('should return true on success', async () => {
    const result = await copyToClipboard('test');
    expect(result).toBe(true);
  });

  it('should return false on clipboard failure', async () => {
    // @ts-expect-error — force rejection
    navigator.clipboard.writeText = vi.fn().mockRejectedValue(new Error('denied'));
    const result = await copyToClipboard('test');
    expect(result).toBe(false);
  });
});

// ─── extractShareUrlFromLocation ────────────────────────────────────────────

describe('extractShareUrlFromLocation', () => {
  it('should return null when no template param is present', () => {
    location.search = '?q=hello';
    expect(extractShareUrlFromLocation()).toBeNull();
  });

  it('should return null when search is empty', () => {
    location.search = '';
    expect(extractShareUrlFromLocation()).toBeNull();
  });

  it('should return the full URL when template param exists', () => {
    const { url } = buildTemplateShareUrl(MOCK_TEMPLATE);
    const param = url.split('?template=')[1];
    location.search = `?template=${param}&other=val`;
    const result = extractShareUrlFromLocation();
    expect(result).not.toBeNull();
    expect(result).toContain('?template=');
  });
});
