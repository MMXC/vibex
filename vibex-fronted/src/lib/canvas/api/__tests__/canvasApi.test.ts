/**
 * Canvas API Tests
 * Tests the canvasApi interface methods — focusing on interface completeness
 * since the implementation uses validatedFetch with internal schema parsing.
 */

import { canvasApi } from '../canvasApi';

// Mock fetch — used by validatedFetch internally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Stub window.location to prevent SSR errors
Object.defineProperty(globalThis, 'window', {
  value: { location: { pathname: '/test' } },
  writable: true,
});

describe('CanvasApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createProject', () => {
    it('创建项目成功返回结果', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true, projectId: 'p1' }),
      });

      const result = await canvasApi.createProject({ name: 'Test Project', description: 'A test project' });
      expect(mockFetch).toHaveBeenCalled();
      expect(result.projectId).toBe('p1');
    });
  });

  describe('generate', () => {
    it('触发生成成功返回结果', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true, jobId: 'job1' }),
      });

      await canvasApi.generate({ projectId: 'p1', pages: [] });
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('getStatus', () => {
    it('返回生成状态', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true, pages: [{ id: 'page1', status: 'completed' }] }),
      });

      const status = await canvasApi.getStatus('p1');
      expect(status.success).toBe(true);
    });
  });

  describe('generateContexts', () => {
    it('生成限界上下文成功', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          contexts: [],
          generationId: 'gen-123',
          confidence: 0.95,
        }),
      });

      await canvasApi.generateContexts({ requirementText: 'Test requirement' });
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('generateFlows', () => {
    it('生成流程成功', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true, flows: [], confidence: 0.9 }),
      });

      await canvasApi.generateFlows({ contexts: [], sessionId: 'sess1' });
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('generateComponents', () => {
    it('生成组件成功', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true, components: [] }),
      });

      await canvasApi.generateComponents({ contexts: [], flows: [], sessionId: 'sess1' });
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('fetchComponentTree', () => {
    it('获取组件树成功', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          components: [{ name: 'TestComp', type: 'page', flowId: 'f1' }],
        }),
      });

      const result = await canvasApi.fetchComponentTree({ contexts: [], flows: [], sessionId: 'sess1' });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('createSnapshot', () => {
    it('创建快照成功', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true, snapshot: { id: 'snap1', createdAt: '2026-05-03' } }),
      });

      const result = await canvasApi.createSnapshot({ projectId: 'p1' });
      expect(result.snapshot).toBeDefined();
    });
  });

  describe('listSnapshots', () => {
    it('列出项目快照', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true, snapshots: [{ id: 'snap1' }, { id: 'snap2' }] }),
      });

      const result = await canvasApi.listSnapshots('p1');
      expect(result.snapshots).toHaveLength(2);
    });
  });

  describe('getSnapshot', () => {
    it('获取指定快照', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true, snapshot: { id: 'snap1', data: {} } }),
      });

      const result = await canvasApi.getSnapshot('snap1');
      expect(result.success).toBe(true);
      expect(result.snapshot.id).toBe('snap1');
    });
  });

  describe('restoreSnapshot', () => {
    it('恢复快照成功', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true }),
      });

      const result = await canvasApi.restoreSnapshot('snap1');
      expect(result.success).toBe(true);
    });
  });

  describe('getLatestVersion', () => {
    it('获取最新版本号', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true, latestVersion: 5, updatedAt: '2026-05-03T10:00:00Z' }),
      });

      const result = await canvasApi.getLatestVersion('p1');
      expect(result.latestVersion).toBe(5);
    });
  });

  describe('CanvasApi interface', () => {
    it('should have createProject method', () => {
      expect(typeof canvasApi.createProject).toBe('function');
    });
    it('should have generate method', () => {
      expect(typeof canvasApi.generate).toBe('function');
    });
    it('should have getStatus method', () => {
      expect(typeof canvasApi.getStatus).toBe('function');
    });
    it('should have generateContexts method', () => {
      expect(typeof canvasApi.generateContexts).toBe('function');
    });
    it('should have generateFlows method', () => {
      expect(typeof canvasApi.generateFlows).toBe('function');
    });
    it('should have generateComponents method', () => {
      expect(typeof canvasApi.generateComponents).toBe('function');
    });
    it('should have fetchComponentTree method', () => {
      expect(typeof canvasApi.fetchComponentTree).toBe('function');
    });
    it('should have createSnapshot method', () => {
      expect(typeof canvasApi.createSnapshot).toBe('function');
    });
    it('should have listSnapshots method', () => {
      expect(typeof canvasApi.listSnapshots).toBe('function');
    });
    it('should have getSnapshot method', () => {
      expect(typeof canvasApi.getSnapshot).toBe('function');
    });
    it('should have restoreSnapshot method', () => {
      expect(typeof canvasApi.restoreSnapshot).toBe('function');
    });
    it('should have getLatestVersion method', () => {
      expect(typeof canvasApi.getLatestVersion).toBe('function');
    });
    it('should have exportZip method', () => {
      expect(typeof canvasApi.exportZip).toBe('function');
    });
  });
});