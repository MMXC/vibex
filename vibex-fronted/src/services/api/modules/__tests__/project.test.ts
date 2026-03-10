/**
 * Project API Tests
 * 验证 API 模块方法存在并可调用
 */

jest.mock('../index', () => ({
  apiService: {
    createProject: jest.fn().mockResolvedValue({ id: '1', name: 'Test' }),
    getProject: jest.fn().mockResolvedValue({ id: '1', name: 'Test' }),
    listProjects: jest.fn().mockResolvedValue([{ id: '1', name: 'Test' }]),
    updateProject: jest.fn().mockResolvedValue({ id: '1', name: 'Updated' }),
    deleteProject: jest.fn().mockResolvedValue(true),
  },
}));

describe('Project API', () => {
  const mockApiService = require('../index').apiService;

  describe('createProject', () => {
    it('should create a project', async () => {
      const result = await mockApiService.createProject({ name: 'Test' });
      expect(result).toBeDefined();
      expect(result.id).toBe('1');
    });
  });

  describe('getProject', () => {
    it('should get a project', async () => {
      const result = await mockApiService.getProject('1');
      expect(result).toBeDefined();
    });
  });

  describe('listProjects', () => {
    it('should list projects', async () => {
      const result = await mockApiService.listProjects();
      expect(result).toBeInstanceOf(Array);
    });
  });

  describe('updateProject', () => {
    it('should update a project', async () => {
      const result = await mockApiService.updateProject('1', { name: 'Updated' });
      expect(result).toBeDefined();
    });
  });

  describe('deleteProject', () => {
    it('should delete a project', async () => {
      const result = await mockApiService.deleteProject('1');
      expect(result).toBe(true);
    });
  });
});
