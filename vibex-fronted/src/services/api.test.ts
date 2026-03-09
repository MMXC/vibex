/**
 * API Service Tests - Modular API
 * 测试模块化的 API 服务导出和结构
 */

describe('Modular API Service', () => {
  describe('apiService 兼容层', () => {
    it('应该导出 apiService 对象', async () => {
      const { apiService } = await import('./api');
      expect(apiService).toBeDefined();
      expect(typeof apiService).toBe('object');
    });

    it('应该包含认证方法', async () => {
      const { apiService } = await import('./api');
      expect(apiService.login).toBeDefined();
      expect(apiService.register).toBeDefined();
      expect(apiService.getCurrentUser).toBeDefined();
      expect(apiService.logout).toBeDefined();
    });

    it('应该包含项目方法', async () => {
      const { apiService } = await import('./api');
      expect(apiService.getProjects).toBeDefined();
      expect(apiService.getProject).toBeDefined();
      expect(apiService.createProject).toBeDefined();
      expect(apiService.updateProject).toBeDefined();
      expect(apiService.deleteProject).toBeDefined();
    });

    it('应该包含用户方法', async () => {
      const { apiService } = await import('./api');
      expect(apiService.getUser).toBeDefined();
      expect(apiService.updateUser).toBeDefined();
    });

    it('应该包含 DDD 方法', async () => {
      const { apiService } = await import('./api');
      expect(apiService.generateBoundedContext).toBeDefined();
      expect(apiService.generateDomainModel).toBeDefined();
      expect(apiService.generateBusinessFlow).toBeDefined();
    });

    it('应该包含工具方法', async () => {
      const { apiService } = await import('./api');
      expect(apiService.isOnline).toBeDefined();
      expect(typeof apiService.isOnline).toBe('function');
    });
  });

  describe('模块化 API', () => {
    it('应该导出 authApi', async () => {
      const { authApi } = await import('./api');
      expect(authApi).toBeDefined();
      expect(authApi.login).toBeDefined();
      expect(authApi.register).toBeDefined();
    });

    it('应该导出 projectApi', async () => {
      const { projectApi } = await import('./api');
      expect(projectApi).toBeDefined();
      expect(projectApi.getProjects).toBeDefined();
      expect(projectApi.createProject).toBeDefined();
    });

    it('应该导出 userApi', async () => {
      const { userApi } = await import('./api');
      expect(userApi).toBeDefined();
      expect(userApi.getUser).toBeDefined();
      expect(userApi.updateUser).toBeDefined();
    });

    it('应该导出 httpClient', async () => {
      const { httpClient } = await import('./api');
      expect(httpClient).toBeDefined();
    });
  });

  describe('类型导出', () => {
    it('应该导出常用类型', async () => {
      const api = await import('./api');
      // 检查类型导出是否存在（运行时只是验证模块可以正常加载）
      expect(api).toBeDefined();
    });
  });
});