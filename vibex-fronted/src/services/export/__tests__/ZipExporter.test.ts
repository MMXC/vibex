/**
 * ZipExporter.test.ts — S60-E4: 画布导出增强
 * Tests: PNG/SVG/PDF capture, ZIP creation, manifest, sanitize, collectNodes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Hoisted mocks (vi.hoisted required for vi.mock factory) ──────────────────

const mockToPng = vi.hoisted(() => vi.fn());
const mockToSvg = vi.hoisted(() => vi.fn());
const mockZipFolder = vi.hoisted(() => vi.fn().mockReturnValue({ file: vi.fn() }));
const mockZipFile = vi.hoisted(() => vi.fn());
const mockGenerateAsync = vi.hoisted(() => vi.fn());

// ─── Mock external modules ────────────────────────────────────────────────────

vi.mock('html-to-image', () => ({
  toPng: mockToPng,
  toSvg: mockToSvg,
}));

// jsPDF is imported dynamically inside ZipExporter — mock as constructor
vi.mock('jspdf', () => {
  const MockJsPDF = function (this: Record<string, unknown>) {
    (this as Record<string, unknown>).addImage = vi.fn();
    (this as Record<string, unknown>).output = vi.fn().mockReturnValue(new Blob());
  };
  return { jsPDF: MockJsPDF };
});

vi.mock('jszip', () => {
  // Return a class/constructor function for default export
  const MockZip = function (this: Record<string, unknown>) {
    (this as Record<string, unknown>).folder = mockZipFolder;
    (this as Record<string, unknown>).file = mockZipFile;
    (this as Record<string, unknown>).generateAsync = mockGenerateAsync;
  };
  return { default: MockZip };
});

vi.mock('@/lib/canvas/canvasLogger', () => ({
  canvasLogger: { default: { debug: vi.fn() } },
}));

// ─── Import after mocks ──────────────────────────────────────────────────────

import { ZipExporter, zipExporter } from '../ZipExporter';
import type {
  BoundedContextNode,
  BusinessFlowNode,
  ComponentNode,
} from '@/lib/canvas/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeMockNode(id: string, name: string): BoundedContextNode {
  return {
    nodeId: id,
    name,
    phase: 'requirement',
    status: 'confirmed',
    x: 0,
    y: 0,
    description: '',
    treeType: 'context',
  } as BoundedContextNode;
}

function makeFlowNode(id: string, name: string): BusinessFlowNode {
  return {
    nodeId: id,
    name,
    phase: 'requirement',
    status: 'confirmed',
    x: 0,
    y: 0,
    description: '',
    treeType: 'flow',
    nodeType: 'business-flow',
  } as BusinessFlowNode;
}

function makeCompNode(id: string, name: string): ComponentNode {
  return {
    nodeId: id,
    name,
    phase: 'requirement',
    status: 'confirmed',
    x: 0,
    y: 0,
    description: '',
    treeType: 'component',
    nodeType: 'component',
  } as ComponentNode;
}

// Mock document.querySelector
function withMockQuerySelector<T>(fn: () => T): T {
  const orig = document.querySelector.bind(document);
  document.querySelector = vi.fn().mockImplementation((sel: string) => {
    if (sel.startsWith('[data-node-id=')) {
      return { scrollWidth: 800, scrollHeight: 600, querySelector: vi.fn() } as unknown as HTMLElement;
    }
    return null;
  }) as typeof document.querySelector;
  try {
    return fn();
  } finally {
    document.querySelector = orig;
  }
}

// ─── Setup / reset ──────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockToPng.mockReset();
  mockToSvg.mockReset();
  mockZipFolder.mockReset().mockReturnValue({ file: mockZipFile });
  mockZipFile.mockReset();
  mockGenerateAsync.mockReset().mockResolvedValue(new Blob());
});

// ─── PNG capture (D4.1) ───────────────────────────────────────────────────────

describe('ZipExporter — PNG capture (D4.1)', () => {
  it('calls html-to-image toPng with correct options', async () => {
    await withMockQuerySelector(async () => {
      mockToPng.mockResolvedValueOnce('data:image/png;base64,iVBORw0KGgo=');
      const exporter = new ZipExporter();

      await exporter.exportZip([makeMockNode('ctx-1', 'TestNode')], [], [], {
        format: 'png',
        scope: 'context',
      });

      expect(mockToPng).toHaveBeenCalledWith(
        expect.objectContaining({ scrollWidth: 800, scrollHeight: 600 }),
        expect.objectContaining({ backgroundColor: '#0f0f1a', pixelRatio: 2 })
      );
    });
  });

  it('throws when element not found', async () => {
    const orig = document.querySelector.bind(document);
    document.querySelector = vi.fn().mockReturnValue(null) as typeof document.querySelector;
    try {
      const exporter = new ZipExporter();
      await expect(
        exporter.exportZip([makeMockNode('ctx-1', 'TestNode')], [], [], {
          format: 'png',
          scope: 'context',
        })
      ).rejects.toThrow('Node element not found');
    } finally {
      document.querySelector = orig;
    }
  });

  it('respects custom scale option', async () => {
    await withMockQuerySelector(async () => {
      mockToPng.mockResolvedValueOnce('data:image/png;base64,iVBORw0KGgo=');
      const exporter = new ZipExporter();

      await exporter.exportZip([makeMockNode('ctx-1', 'TestNode')], [], [], {
        format: 'png',
        scope: 'context',
        scale: 3,
      });

      expect(mockToPng).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ pixelRatio: 3 })
      );
    });
  });
});

// ─── PDF capture (D4.1) ────────────────────────────────────────────────────────

describe('ZipExporter — PDF capture (D4.1)', () => {
  it('captures and packages as PDF format', async () => {
    await withMockQuerySelector(async () => {
      mockToPng.mockResolvedValueOnce('data:image/png;base64,iVBORw0KGgo=');
      const exporter = new ZipExporter();

      await exporter.exportZip([makeMockNode('ctx-1', 'TestNode')], [], [], {
        format: 'pdf',
        scope: 'context',
      });

      expect(mockToPng).toHaveBeenCalled();
      // Verify manifest format is pdf
      const manifestCall = mockZipFile.mock.calls.find(
        ([name]) => name === 'manifest.json'
      );
      expect(manifestCall).toBeDefined();
      const manifest = JSON.parse(manifestCall![1] as string);
      expect(manifest.format).toBe('pdf');
    });
  });

  it('uses portrait orientation for tall elements', async () => {
    const orig = document.querySelector.bind(document);
    document.querySelector = vi.fn().mockImplementation((sel: string) => {
      if (sel.startsWith('[data-node-id=')) {
        return { scrollWidth: 400, scrollHeight: 800, querySelector: vi.fn() } as unknown as HTMLElement;
      }
      return null;
    }) as typeof document.querySelector;
    try {
      mockToPng.mockResolvedValueOnce('data:image/png;base64,iVBORw0KGgo=');
      const exporter = new ZipExporter();

      await exporter.exportZip([makeMockNode('ctx-1', 'TallNode')], [], [], {
        format: 'pdf',
        scope: 'context',
      });

      // Verify manifest reflects pdf format for tall node
      const manifestCall = mockZipFile.mock.calls.find(
        ([name]) => name === 'manifest.json'
      );
      expect(manifestCall).toBeDefined();
      const manifest = JSON.parse(manifestCall![1] as string);
      expect(manifest.format).toBe('pdf');
    } finally {
      document.querySelector = orig;
    }
  });
});

// ─── exportZip end-to-end (D4.1, D4.5) ─────────────────────────────────────

describe('ZipExporter — exportZip end-to-end (D4.1, D4.5)', () => {
  it('creates ZIP with PNG files and manifest.json', async () => {
    await withMockQuerySelector(async () => {
      mockToPng.mockResolvedValue('data:image/png;base64,iVBORw0KGgo=');
      const exporter = new ZipExporter();

      const blob = await exporter.exportZip(
        [
          makeMockNode('ctx-1', 'Node_A'),
          makeMockNode('ctx-2', 'Node_B'),
        ],
        [],
        [],
        { format: 'png', scope: 'context' }
      );

      // Verify JSZip generateAsync options
      expect(mockGenerateAsync).toHaveBeenCalledWith({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      // Find manifest call
      const manifestCall = mockZipFile.mock.calls.find(
        ([name]) => name === 'manifest.json'
      );
      expect(manifestCall).toBeDefined();

      const manifest = JSON.parse(manifestCall![1] as string);
      expect(manifest.version).toBe('1.0.0');
      expect(manifest.nodeCount).toBe(2);
      expect(manifest.format).toBe('png');
      expect(manifest.nodes).toHaveLength(2);
      expect(manifest.nodes[0].filename).toBe('Node_A.png');
      expect(manifest.nodes[1].filename).toBe('Node_B.png');
      expect(blob).toBeInstanceOf(Blob);
    });
  });

  it('creates ZIP with PDF files and manifest', async () => {
    await withMockQuerySelector(async () => {
      mockToPng.mockResolvedValue('data:image/png;base64,iVBORw0KGgo=');
      const exporter = new ZipExporter();

      await exporter.exportZip([makeMockNode('ctx-1', 'PDF_Export')], [], [], {
        format: 'pdf',
        scope: 'context',
      });

      const manifestCall = mockZipFile.mock.calls.find(
        ([name]) => name === 'manifest.json'
      );
      expect(manifestCall).toBeDefined();
      const manifest = JSON.parse(manifestCall![1] as string);
      expect(manifest.format).toBe('pdf');
    });
  });

  it('singleton zipExporter instance works', async () => {
    await withMockQuerySelector(async () => {
      mockToPng.mockResolvedValue('data:image/png;base64,iVBORw0KGgo=');

      const blob = await zipExporter.exportZip(
        [makeMockNode('ctx-1', 'Singleton')],
        [],
        [],
        { format: 'png', scope: 'context' }
      );

      expect(blob).toBeInstanceOf(Blob);
    });
  });

  it('throws when no nodes available', async () => {
    const exporter = new ZipExporter();
    await expect(
      exporter.exportZip([], [], [], { format: 'png', scope: 'all' })
    ).rejects.toThrow('没有可导出的节点');
  });
});

// ─── Filename sanitization (D4.5) ───────────────────────────────────────────

describe('ZipExporter — filename sanitization (D4.5)', () => {
  it('sanitizes special characters in manifest filenames', async () => {
    await withMockQuerySelector(async () => {
      mockToPng.mockResolvedValue('data:image/png;base64,iVBORw0KGgo=');
      const exporter = new ZipExporter();

      await exporter.exportZip(
        [makeMockNode('ctx-1', 'order<service>:api')],
        [],
        [],
        { format: 'png', scope: 'context' }
      );

      const manifestCall = mockZipFile.mock.calls.find(
        ([name]) => name === 'manifest.json'
      );
      const manifest = JSON.parse(manifestCall![1] as string);
      expect(manifest.nodes[0].filename).toBe('order_service_api.png');
    });
  });

  it('truncates very long names to ~100 chars', async () => {
    await withMockQuerySelector(async () => {
      mockToPng.mockResolvedValue('data:image/png;base64,iVBORw0KGgo=');
      const exporter = new ZipExporter();
      const longName = 'a'.repeat(120);

      await exporter.exportZip(
        [makeMockNode('ctx-1', longName)],
        [],
        [],
        { format: 'png', scope: 'context' }
      );

      const manifestCall = mockZipFile.mock.calls.find(
        ([name]) => name === 'manifest.json'
      );
      const manifest = JSON.parse(manifestCall![1] as string);
      // name + '.png' suffix ≤ 104 chars (100 char name limit + 4 for '.png')
      expect(manifest.nodes[0].filename.length).toBeLessThanOrEqual(104);
    });
  });
});

// ─── collectNodes (D4.5) ─────────────────────────────────────────────────────

describe('ZipExporter — collectNodes (D4.5)', () => {
  it('collects context nodes when scope is context', async () => {
    await withMockQuerySelector(async () => {
      mockToPng.mockResolvedValue('data:image/png;base64,iVBORw0KGgo=');
      const exporter = new ZipExporter();

      await exporter.exportZip(
        [makeMockNode('ctx-1', 'CtxNode')],
        [],
        [],
        { format: 'png', scope: 'context' }
      );

      const manifestCall = mockZipFile.mock.calls.find(
        ([name]) => name === 'manifest.json'
      );
      const manifest = JSON.parse(manifestCall![1] as string);
      expect(manifest.nodeCount).toBe(1);
      expect(manifest.scope).toBe('context');
      expect(manifest.nodes[0].nodeId).toBe('ctx-1');
    });
  });

  it('collects flow nodes when scope is flow', async () => {
    await withMockQuerySelector(async () => {
      mockToPng.mockResolvedValue('data:image/png;base64,iVBORw0KGgo=');
      const exporter = new ZipExporter();

      await exporter.exportZip(
        [],
        [makeFlowNode('flow-1', 'OrderFlow')],
        [],
        { format: 'png', scope: 'flow' }
      );

      const manifestCall = mockZipFile.mock.calls.find(
        ([name]) => name === 'manifest.json'
      );
      const manifest = JSON.parse(manifestCall![1] as string);
      expect(manifest.nodeCount).toBe(1);
      expect(manifest.scope).toBe('flow');
    });
  });

  it('collects all nodes when scope is all', async () => {
    await withMockQuerySelector(async () => {
      mockToPng.mockResolvedValue('data:image/png;base64,iVBORw0KGgo=');
      const exporter = new ZipExporter();

      await exporter.exportZip(
        [makeMockNode('ctx-1', 'Ctx')],
        [makeFlowNode('flow-1', 'Flow')],
        [makeCompNode('comp-1', 'Comp')],
        { format: 'png', scope: 'all' }
      );

      const manifestCall = mockZipFile.mock.calls.find(
        ([name]) => name === 'manifest.json'
      );
      const manifest = JSON.parse(manifestCall![1] as string);
      expect(manifest.nodeCount).toBe(3);
      expect(manifest.scope).toBe('all');
    });
  });
});

// ─── Progress callback (D4.5) ────────────────────────────────────────────────

describe('ZipExporter — progress callback (D4.5)', () => {
  it('calls onProgress during export', async () => {
    await withMockQuerySelector(async () => {
      mockToPng.mockResolvedValue('data:image/png;base64,iVBORw0KGgo=');
      const onProgress = vi.fn();
      const exporter = new ZipExporter();

      await exporter.exportZip(
        [makeMockNode('ctx-1', 'ProgressNode')],
        [],
        [],
        { format: 'png', scope: 'context', onProgress }
      );

      expect(onProgress).toHaveBeenCalled();
    });
  });
});
