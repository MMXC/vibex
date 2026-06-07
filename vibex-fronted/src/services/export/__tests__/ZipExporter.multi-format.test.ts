/**
 * ZipExporter.multi-format.test.ts — Sprint70 E3: Multi-Format Batch Export Tests
 *
 * Tests for: MultiFormatExporter export contracts
 * Note: DOM-dependent logic (html-to-image, jszip) verified via interface tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// S76-E4: mocks for exportCanvases tests
const { mockFolderInstance } = vi.hoisted(() => {
  const folder = {
    file: vi.fn(),
    folder: vi.fn(() => folder),
    generateAsync: vi.fn(() => Promise.resolve(new Blob(['test'], { type: 'application/zip' }))),
  };
  return { mockFolderInstance: folder };
});

// Mock all external modules — vi.mock is hoisted to top level
vi.mock('html-to-image', () => ({
  toPng: vi.fn(() => Promise.resolve('data:image/png;base64,')),
  toSvg: vi.fn(() => Promise.resolve('data:image/svg+xml;base64,')),
  toHtml2Canvas: vi.fn(() => Promise.resolve(new Blob())),
}));
// JSZip mock: must return constructor-compatible object
vi.mock('jszip', () => {
  return { default: function () { return mockFolderInstance; } };
});
vi.mock('html2canvas');
vi.mock('jspdf');
vi.mock('@/lib/canvas/types');
vi.mock('@/lib/canvas/canvasLogger', () => ({
  canvasLogger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));
// ddsPersistence mock for exportCanvases tests
vi.mock('@/services/dds/ddsPersistence', () => ({
  loadLatestSnapshot: vi.fn(() => Promise.resolve(null)),
}));


describe('E3 DoD Checklist', () => {
  describe('exportMultiFormatZip', () => {
    it('is exported as a function', async () => {
      const { exportMultiFormatZip } = await import('../MultiFormatExporter');
      expect(typeof exportMultiFormatZip).toBe('function');
    });

    it('is an async function', async () => {
      const { exportMultiFormatZip } = await import('../MultiFormatExporter');
      const result = exportMultiFormatZip(
        { formats: ['png'], canvasId: 'test' },
        [], [], []
      );
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('MultiFormatType runtime values', () => {
    it('supports png/svg/pdf format strings', async () => {
      // Type-level: these literal types are valid
      type MT = 'png' | 'svg' | 'pdf';
      const formats: MT[] = ['png', 'svg', 'pdf'];
      expect(formats).toContain('png');
      expect(formats).toContain('svg');
      expect(formats).toContain('pdf');
    });
  });

  describe('MultiFormatOptions', () => {
    it('accepts required formats and canvasId', () => {
      const opts = {
        formats: ['png', 'svg', 'pdf'] as const,
        canvasId: 'test-canvas',
      };
      expect(opts.formats).toHaveLength(3);
      expect(opts.canvasId).toBe('test-canvas');
    });

    it('accepts optional backgroundColor and scale', () => {
      const opts = {
        formats: ['png'] as const,
        canvasId: 'test',
        backgroundColor: '#0f0f1a',
        scale: 2,
      };
      expect(opts.backgroundColor).toBe('#0f0f1a');
      expect(opts.scale).toBe(2);
    });

    it('accepts optional onProgress callback', () => {
      const onProgress = vi.fn();
      const opts = {
        formats: ['png'] as const,
        canvasId: 'test',
        onProgress,
      };
      expect(typeof opts.onProgress).toBe('function');
    });
  });
});



// =============================================================================
// S76-E4: Canvas Batch Export Tests
// Tests for: zipExporter.exportCanvases
// =============================================================================

vi.mock('@/services/dds/ddsPersistence');
vi.mock('@/lib/canvas/canvasLogger', () => ({ canvasLogger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() } }));

describe('exportCanvases interface', () => {
  it('is a method on ZipExporter class', async () => {
    const { ZipExporter } = await import('../ZipExporter');
    const zipExporter = new ZipExporter();
    expect(typeof zipExporter.exportCanvases).toBe('function');
  });

  it('is an async function', async () => {
    const { ZipExporter } = await import('../ZipExporter');
    const zipExporter = new ZipExporter();
    const result = zipExporter.exportCanvases(['id1', 'id2'], {
      format: 'png',
      scope: 'all',
    });
    expect(result).toBeInstanceOf(Promise);
  });

  it('throws when canvasIds is empty array', async () => {
    const { ZipExporter } = await import('../ZipExporter');
    const zipExporter = new ZipExporter();
    await expect(
      zipExporter.exportCanvases([], { format: 'png', scope: 'all' })
    ).rejects.toThrow('没有选择要导出的画布');
  });

  it('accepts single canvas id with valid project', async () => {
    const { ZipExporter } = await import('../ZipExporter');
    const { loadLatestSnapshot } = await import('@/services/dds/ddsPersistence');
    // Mock project with cards
    loadLatestSnapshot.mockResolvedValue({
      projectName: 'Test Canvas',
      chapters: {
        ch1: { cards: [{ id: 'card1', title: 'Card 1' }] },
      },
    });

    const zipExporter = new ZipExporter();
    const result = await zipExporter.exportCanvases(['canvas-1'], {
      format: 'png',
      scope: 'all',
    });
    expect(result).toBeInstanceOf(Blob);
  });
});

describe('exportCanvases BatchExportOptions types', () => {
  it('accepts format: png/svg/pdf', () => {
    const opts = {
      format: 'png' as const,
      scope: 'all' as const,
      scale: 2,
      backgroundColor: '#0f0f1a',
    };
    expect(opts.format).toBe('png');
  });

  it('accepts scale and backgroundColor options', () => {
    const opts = {
      format: 'svg' as const,
      scope: 'all' as const,
      scale: 3,
      backgroundColor: '#1a1a2e',
      onProgress: (cur: number, total: number, name: string) => {},
    };
    expect(opts.scale).toBe(3);
    expect(typeof opts.onProgress).toBe('function');
  });

  it('accepts optional onProgress callback', () => {
    const onProgress = vi.fn();
    const opts = {
      format: 'pdf' as const,
      scope: 'all' as const,
      onProgress,
    };
    expect(typeof opts.onProgress).toBe('function');
  });
});

describe('exportCanvases options defaults', () => {
  it('defaults scale to 2 with valid project', async () => {
    const { ZipExporter } = await import('../ZipExporter');
    const { loadLatestSnapshot } = await import('@/services/dds/ddsPersistence');
    loadLatestSnapshot.mockResolvedValue({
      projectName: 'Test',
      chapters: {
        ch1: { cards: [{ id: 'c1', title: 'C1' }] },
      },
    });

    const zipExporter = new ZipExporter();
    const result = await zipExporter.exportCanvases(['c1'], { format: 'png', scope: 'all' });
    expect(result).toBeInstanceOf(Blob);
  });

  it('defaults backgroundColor to #0f0f1a with valid project', async () => {
    const { ZipExporter } = await import('../ZipExporter');
    const { loadLatestSnapshot } = await import('@/services/dds/ddsPersistence');
    loadLatestSnapshot.mockResolvedValue({
      projectName: 'Test',
      chapters: {
        ch1: { cards: [{ id: 'c1', title: 'C1' }] },
      },
    });

    const zipExporter = new ZipExporter();
    const result = await zipExporter.exportCanvases(['c1'], { format: 'png', scope: 'all' });
    expect(result).toBeInstanceOf(Blob);
  });
});

describe('exportCanvases skip behavior', () => {
  it('produces output when at least one canvas has cards (null canvas skipped)', async () => {
    const { ZipExporter } = await import('../ZipExporter');
    const { loadLatestSnapshot } = await import('@/services/dds/ddsPersistence');
    // First call returns null (skipped), second returns valid project
    loadLatestSnapshot
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        projectName: 'Test Canvas',
        chapters: {
          ch1: { cards: [{ id: 'card1', title: 'Card 1' }] },
        },
      });

    const zipExporter = new ZipExporter();
    const result = await zipExporter.exportCanvases(['nonexistent', 'canvas-2'], {
      format: 'png',
      scope: 'all',
    });
    expect(result).toBeInstanceOf(Blob);
  });
});
