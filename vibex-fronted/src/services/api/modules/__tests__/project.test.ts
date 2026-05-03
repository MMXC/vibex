/**
 * Project API Tests
 * Tests the ProjectApi interface methods with mocked httpClient
 */

import { projectApi } from '../project';

// Mock httpClient
vi.mock('../../client', () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
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
        data: [
          { id: 'p1', name: 'Project 1', userId: 'u1' },
          { id: 'p2', name: 'Project 2', userId: 'u1' },
        ],
      };
      mockHttp.get.mockResolvedValue(mockResponse);

      const projects = await projectApi.getProjects('u1');

      expect(projects).toHaveLength(2);
      expect(projects[0].id).toBe('p1');
    });

    it('按用户过滤', async () => {
      const mockResponse = { data: [{ id: 'p1', name: 'Project 1', userId: 'u2' }] };
      mockHttp.get.mockResolvedValue(mockResponse);

      const projects = await projectApi.getProjects('u2');

      expect(mockHttp.get).toHaveBeenCalled();
      expect(projects).toHaveLength(1);
    });

    it('空列表返回空数组', async () => {
      const mockResponse = { data: [] };
      mockHttp.get.mockResolvedValue(mockResponse);

      const projects = await projectApi.getProjects('u999');

      expect(projects).toEqual([]);
    });
  });

  describe('getProject', () => {
    it('返回指定项目', async () => {
      const mockResponse = { data: { id: 'p1', name: 'Project 1' } };
      mockHttp.get.mockResolvedValue(mockResponse);

      const project = await projectApi.getProject('p1');

      expect(project.id).toBe('p1');
    });

    it('不存在的项目返回null', async () => {
      const mockResponse = { data: null };
      mockHttp.get.mockResolvedValue(mockResponse);

      const project = await projectApi.getProject('nonexistent');
      expect(project).toBeNull();
    });
  });

  describe('createProject', () => {
    it('创建后返回项目', async () => {
      const mockResponse = { data: { id: 'p3', name: 'New Project' } };
      mockHttp.post.mockResolvedValue(mockResponse);

      const project = await projectApi.createProject({ name: 'New Project', description: 'desc' });

      expect(project.id).toBe('p3');
    });

    it('创建时调用正确的API路径', async () => {
      const mockResponse = { data: { id: 'p3', name: 'Test' } };
      mockHttp.post.mockResolvedValue(mockResponse);

      await projectApi.createProject({ name: 'Test' });

      expect(mockHttp.post).toHaveBeenCalledWith('/projects', { name: 'Test' });
    });
  });

  describe('updateProject', () => {
    it('更新后返回项目', async () => {
      const mockResponse = { data: { id: 'p1', name: 'Updated Project' } };
      mockHttp.put.mockResolvedValue(mockResponse);

      const project = await projectApi.updateProject('p1', { name: 'Updated Project' });

      expect(project.name).toBe('Updated Project');
    });

    it('不存在的项目返回null', async () => {
      const mockResponse = { data: null };
      mockHttp.put.mockResolvedValue(mockResponse);

      const project = await projectApi.updateProject('nonexistent', { name: 'x' });
      expect(project).toBeNull();
    });
  });

  describe('deleteProject', () => {
    it('软删除成功', async () => {
      const mockResponse = { data: { id: 'p1', deletedAt: '2026-05-03' } };
      mockHttp.delete.mockResolvedValue(mockResponse);

      const result = await projectApi.deleteProject('p1');

      expect(result).toBeTruthy();
    });

    it('永久删除成功', async () => {
      const mockResponse = { data: { success: true } };
      mockHttp.delete.mockResolvedValue(mockResponse);

      const result = await projectApi.permanentDeleteProject('p1');

      expect(result).toBeTruthy();
    });
  });

  describe('restoreProject', () => {
    it('恢复项目成功', async () => {
      const mockResponse = { data: { id: 'p1', deletedAt: null } };
      mockHttp.post.mockResolvedValue(mockResponse);

      const project = await projectApi.restoreProject('p1');

      expect(project.id).toBe('p1');
    });
  });

  describe('getDeletedProjects', () => {
    it('返回已删除项目列表', async () => {
      const mockResponse = { data: [{ id: 'p1', deletedAt: '2026-05-01' }] };
      mockHttp.get.mockResolvedValue(mockResponse);

      const deleted = await projectApi.getDeletedProjects('u1');

      expect(deleted).toHaveLength(1);
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
  });
});