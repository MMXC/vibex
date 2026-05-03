/**
 * Canvas API Tests
 * Tests the canvasApi interface methods with mocked fetch
 */

import { canvasApi } from './canvasApi';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);
vi.stubGlobal('window', { location: { pathname: '/test' } });

describe('CanvasApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createProject', () => {
    it('创建项目成功返回结果', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true, projectId: 'p1' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await canvasApi.createProject({
        name: 'Test Project',
        description: 'A test project',
      });

      expect(mockFetch).toHaveBeenCalled();
      expect(result.projectId).toBe('p1');
    });

    it('项目名称重复抛出错误', async () => {
      const mockResponse = {
        ok: false,
        status: 409,
      };
      mockFetch.mockResolvedValue(mockResponse);
      window.location = { pathname: '/test' } as any;

      await expect(
        canvasApi.createProject({ name: 'Duplicate Project' })
      ).rejects.toThrow();
    });
  });

  describe('generate', () => {
    it('触发生成成功返回结果', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true, jobId: 'job1' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await canvasApi.generate({
        projectId: 'p1',
        pages: [],
      });

      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('getStatus', () => {
    it('返回生成状态', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          pages: [{ id: 'page1', status: 'completed' }],
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const status = await canvasApi.getStatus('p1');

      expect(status.success).toBe(true);
    });
  });

  describe('generateContexts', () => {
    it('生成限界上下文成功', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true, contexts: [] }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await canvasApi.generateContexts({
        projectId: 'p1',
        requirement: 'Test requirement',
      });

      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('generateFlows', () => {
    it('生成流程成功', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true, flows: [] }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await canvasApi.generateFlows({
        projectId: 'p1',
        contexts: [],
      });

      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('generateComponents', () => {
    it('生成组件成功', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true, components: [] }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await canvasApi.generateComponents({
        projectId: 'p1',
        flows: [],
      });

      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('fetchComponentTree', () => {
    it('获取组件树成功', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          tree: { id: 'root', children: [] },
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await canvasApi.fetchComponentTree({
        projectId: 'p1',
        pageId: 'page1',
      });

      expect(result.tree).toBeDefined();
    });
  });

  describe('createSnapshot', () => {
    it('创建快照成功', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          snapshot: { id: 'snap1', createdAt: '2026-05-03' },
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await canvasApi.createSnapshot({
        projectId: 'p1',
      });

      expect(result.snapshot).toBeDefined();
    });
  });

  describe('listSnapshots', () => {
    it('列出项目快照', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          snapshots: [
            { id: 'snap1', createdAt: '2026-05-03' },
            { id: 'snap2', createdAt: '2026-05-02' },
          ],
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await canvasApi.listSnapshots('p1');

      expect(result.snapshots).toHaveLength(2);
    });
  });

  describe('getSnapshot', () => {
    it('获取指定快照', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          snapshot: { id: 'snap1', data: {} },
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await canvasApi.getSnapshot('snap1');

      expect(result.success).toBe(true);
      expect(result.snapshot.id).toBe('snap1');
    });
  });

  describe('restoreSnapshot', () => {
    it('恢复快照成功', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await canvasApi.restoreSnapshot('snap1');

      expect(result.success).toBe(true);
    });
  });

  describe('getLatestVersion', () => {
    it('获取最新版本号', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          latestVersion: 5,
          updatedAt: '2026-05-03T10:00:00Z',
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

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

    it('should have createSnapshot method', () => {
      expect(typeof canvasApi.createSnapshot).toBe('function');
    });

    it('should have listSnapshots method', () => {
      expect(typeof canvasApi.listSnapshots).toBe('function');
    });

    it('should have getLatestVersion method', () => {
      expect(typeof canvasApi.getLatestVersion).toBe('function');
    });
  });
});