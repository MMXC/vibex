/**
 * Project API Tests
 * Tests the ProjectApi interface methods with mocked httpClient/retry/cache
 */

import { projectApi } from '../project';

// Mock httpClient
vi.mock('../../client', () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock retry — execute just calls the fn directly
vi.mock('../../retry', () => ({
  retry: {
    execute: vi.fn((fn) => fn()),
  },
  DEFAULT_RETRY_CONFIG: { maxRetries: 0, baseDelay: 1000, timeout: 5000, retryableStatusCodes: [500, 502, 503, 504] },
}));

// Mock cache
vi.mock('../../cache', () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
  },
  getCacheKey: vi.fn().mockImplementation((type, id) => `${type}:${id}`),
}));

import { httpClient } from '../../client';
const mockHttp = httpClient as any;

describe('ProjectApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProjects', () => {
    it('返回项目列表', async () => {
      const mockResponse = {
        projects: [
          { id: 'p1', name: 'Project 1', userId: 'u1' },
          { id: 'p2', name: 'Project 2', userId: 'u1' },
        ],
      };
      mockHttp.get.mockResolvedValue(mockResponse);

      const projects = await projectApi.getProjects('u1');

      expect(projects).toHaveLength(2);
      expect(projects[0].id).toBe('p1');
      expect(mockHttp.get).toHaveBeenCalledWith('/projects', { params: { userId: 'u1' } });
    });

    it('空列表返回空数组', async () => {
      const mockResponse = { projects: [] };
      mockHttp.get.mockResolvedValue(mockResponse);

      const projects = await projectApi.getProjects('u999');
      expect(projects).toEqual([]);
    });
  });

  describe('getProject', () => {
    it('返回指定项目', async () => {
      const mockResponse = { project: { id: 'p1', name: 'Project 1' } };
      mockHttp.get.mockResolvedValue(mockResponse);

      const project = await projectApi.getProject('p1');
      expect(project.id).toBe('p1');
    });

    it('不存在的项目抛出错误', async () => {
      mockHttp.get.mockRejectedValue(new Error('Project not found'));

      await expect(projectApi.getProject('nonexistent')).rejects.toThrow('Project not found');
    });
  });

  describe('createProject', () => {
    it('创建后返回项目', async () => {
      const mockResponse = { project: { id: 'p3', name: 'New Project', userId: 'u1' } };
      mockHttp.post.mockResolvedValue(mockResponse);

      const project = await projectApi.createProject({ name: 'New Project', userId: 'u1' });
      expect(project.id).toBe('p3');
    });

    it('创建时调用正确的API路径', async () => {
      const mockResponse = { project: { id: 'p3', name: 'Test', userId: 'u1' } };
      mockHttp.post.mockResolvedValue(mockResponse);

      await projectApi.createProject({ name: 'Test', userId: 'u1' });
      expect(mockHttp.post).toHaveBeenCalledWith('/projects', { name: 'Test', userId: 'u1' });
    });
  });

  describe('updateProject', () => {
    it('更新后返回项目', async () => {
      const mockResponse = { project: { id: 'p1', name: 'Updated Project' } };
      mockHttp.put.mockResolvedValue(mockResponse);

      const project = await projectApi.updateProject('p1', { name: 'Updated Project' });
      expect(project.name).toBe('Updated Project');
    });
  });

  describe('deleteProject', () => {
    it('删除成功返回success', async () => {
      const mockResponse = { success: true };
      mockHttp.delete.mockResolvedValue(mockResponse);

      const result = await projectApi.deleteProject('p1');
      expect(result).toEqual({ success: true });
    });
  });

  describe('softDeleteProject', () => {
    it('软删除成功返回项目', async () => {
      const mockResponse = { project: { id: 'p1', deletedAt: '2026-05-03' } };
      mockHttp.patch.mockResolvedValue(mockResponse);

      const project = await projectApi.softDeleteProject('p1');
      expect(project.id).toBe('p1');
      expect(mockHttp.patch).toHaveBeenCalledWith('/projects/p1/soft-delete', {});
    });
  });

  describe('restoreProject', () => {
    it('恢复项目成功', async () => {
      const mockResponse = { project: { id: 'p1', deletedAt: null } };
      mockHttp.patch.mockResolvedValue(mockResponse);

      const project = await projectApi.restoreProject('p1');
      expect(project.id).toBe('p1');
      expect(mockHttp.patch).toHaveBeenCalledWith('/projects/p1/restore', {});
    });
  });

  describe('permanentDeleteProject', () => {
    it('永久删除成功', async () => {
      const mockResponse = { success: true };
      mockHttp.delete.mockResolvedValue(mockResponse);

      const result = await projectApi.permanentDeleteProject('p1');
      expect(result).toEqual({ success: true });
      expect(mockHttp.delete).toHaveBeenCalledWith('/projects/p1/permanent');
    });
  });

  describe('getDeletedProjects', () => {
    it('返回已删除项目列表', async () => {
      const mockResponse = {
        projects: [{ id: 'p1', name: 'Deleted Project', deletedAt: '2026-05-01' }],
      };
      mockHttp.get.mockResolvedValue(mockResponse);

      const deleted = await projectApi.getDeletedProjects();
      expect(deleted).toHaveLength(1);
      expect(mockHttp.get).toHaveBeenCalledWith('/projects/deleted');
    });
  });

  describe('clearDeletedProjects', () => {
    it('清空已删除项目', async () => {
      const mockResponse = { success: true };
      mockHttp.delete.mockResolvedValue(mockResponse);

      const result = await projectApi.clearDeletedProjects();
      expect(result).toEqual({ success: true });
      expect(mockHttp.delete).toHaveBeenCalledWith('/projects/deleted-all');
    });
  });

  describe('getProjectRole', () => {
    it('返回项目角色', async () => {
      const mockResponse = { role: { role: 'admin' } };
      mockHttp.get.mockResolvedValue(mockResponse);

      const roleInfo = await projectApi.getProjectRole('p1');
      expect(roleInfo.role).toBe('admin');
      expect(mockHttp.get).toHaveBeenCalledWith('/projects/p1/role');
    });
  });

  describe('ProjectApi interface', () => {
    it('should have getProjects method', () => {
      expect(typeof projectApi.getProjects).toBe('function');
    });

    it('should have createProject method', () => {
      expect(typeof projectApi.createProject).toBe('function');
    });

    it('should have updateProject method', () => {
      expect(typeof projectApi.updateProject).toBe('function');
    });

    it('should have deleteProject method', () => {
      expect(typeof projectApi.deleteProject).toBe('function');
    });

    it('should have softDeleteProject method', () => {
      expect(typeof projectApi.softDeleteProject).toBe('function');
    });

    it('should have restoreProject method', () => {
      expect(typeof projectApi.restoreProject).toBe('function');
    });

    it('should have permanentDeleteProject method', () => {
      expect(typeof projectApi.permanentDeleteProject).toBe('function');
    });

    it('should have getDeletedProjects method', () => {
      expect(typeof projectApi.getDeletedProjects).toBe('function');
    });

    it('should have clearDeletedProjects method', () => {
      expect(typeof projectApi.clearDeletedProjects).toBe('function');
    });

    it('should have getProjectRole method', () => {
      expect(typeof projectApi.getProjectRole).toBe('function');
    });
  });
});