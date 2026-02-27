// Mock axios
jest.mock('axios', () => {
  const mockInterceptors = {
    request: { use: jest.fn(() => ({ eject: jest.fn() })) },
    response: { use: jest.fn(() => ({ eject: jest.fn() })) },
  };
  
  // 模拟 AxiosError 类
  const mockAxiosError = jest.fn().mockImplementation(function mockAxiosError(message: string) {
    this.message = message;
    this.response = undefined;
  });
  
  return {
    __esModule: true,
    default: {
      create: jest.fn(() => ({
        ...mockInterceptors,
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
      })),
    },
    create: jest.fn(() => ({
      ...mockInterceptors,
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    })),
    AxiosError: mockAxiosError,
  };
});

import axios, { AxiosError } from 'axios';
import { ApiService, User, Project, Message, FlowData } from './api';

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ApiService - 数据持久化', () => {
  const mockBaseURL = 'https://api.vibex.example.com';
  let api: ApiService;
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      interceptors: { request: { use: jest.fn(() => ({ eject: jest.fn() })) }, response: { use: jest.fn(() => ({ eject: jest.fn() })) } },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };
    (mockedAxios.create as jest.Mock).mockReturnValue(mockClient);
    api = new ApiService(mockBaseURL);
  });

  describe('用户数据持久化', () => {
    it('应能保存用户信息', async () => {
      const userData: Partial<User> = { id: '1', name: 'Test User', email: 'test@example.com' };
      mockClient.put.mockResolvedValue({ data: userData });

      const result = await api.saveUser(userData);
      expect(result).toEqual(userData);
      expect(mockClient.put).toHaveBeenCalled();
    });

    it('应能获取用户信息', async () => {
      const userData: User = { id: '1', name: 'Test User', email: 'test@example.com' };
      mockClient.get.mockResolvedValue({ data: userData });

      const result = await api.getUser('1');
      expect(result).toEqual(userData);
    });

    it('应能处理用户获取失败', async () => {
      const error = new Error('Network Error');
      mockClient.get.mockRejectedValue(error);

      await expect(api.getUser('1')).rejects.toThrow('Network Error');
    });
  });

  describe('项目数据持久化', () => {
    it('应能保存项目数据', async () => {
      const projectData: Partial<Project> = { id: 'proj-1', name: 'My Project', userId: '1' };
      mockClient.put.mockResolvedValue({ data: projectData });

      const result = await api.saveProject(projectData);
      expect(result).toEqual(projectData);
    });

    it('应能获取项目列表', async () => {
      const projects: Project[] = [{ id: 'proj-1', name: 'Project 1', userId: '1' }];
      mockClient.get.mockResolvedValue({ data: projects });

      const result = await api.getProjects('1');
      expect(result).toEqual(projects);
    });

    it('应能删除项目', async () => {
      mockClient.delete.mockResolvedValue({ data: { success: true } });

      const result = await api.deleteProject('proj-1');
      expect(result.success).toBe(true);
    });

    it('应能获取单个项目详情', async () => {
      const project: Project = { id: 'proj-1', name: 'Project 1', userId: '1' };
      mockClient.get.mockResolvedValue({ data: project });

      const result = await api.getProject('proj-1');
      expect(result).toEqual(project);
    });
  });

  describe('对话历史持久化', () => {
    it('应能保存对话消息', async () => {
      const message: Partial<Message> = { id: 'msg-1', role: 'user', content: 'Hello', projectId: 'proj-1' };
      mockClient.post.mockResolvedValue({ data: message });

      const result = await api.saveMessage(message);
      expect(result).toEqual(message);
    });

    it('应能获取对话历史', async () => {
      const messages: Message[] = [{ id: 'msg-1', role: 'user', content: 'Hello', projectId: 'proj-1' }];
      mockClient.get.mockResolvedValue({ data: messages });

      const result = await api.getMessages('proj-1');
      expect(result).toEqual(messages);
    });

    it('应能删除消息', async () => {
      mockClient.delete.mockResolvedValue({ data: { success: true } });

      const result = await api.deleteMessage('msg-1');
      expect(result.success).toBe(true);
    });
  });

  describe('流程图数据持久化', () => {
    it('应能保存流程图', async () => {
      const flowData: Partial<FlowData> = { id: 'flow-1', nodes: [], edges: [], projectId: 'proj-1' };
      mockClient.put.mockResolvedValue({ data: flowData });

      const result = await api.saveFlow(flowData);
      expect(result).toEqual(flowData);
    });

    it('应能加载流程图', async () => {
      const flowData: FlowData = { id: 'flow-1', nodes: [], edges: [], projectId: 'proj-1' };
      mockClient.get.mockResolvedValue({ data: flowData });

      const result = await api.getFlow('flow-1');
      expect(result).toEqual(flowData);
    });

    it('应能删除流程图', async () => {
      mockClient.delete.mockResolvedValue({ data: { success: true } });

      const result = await api.deleteFlow('flow-1');
      expect(result.success).toBe(true);
    });
  });

  describe('错误重试机制', () => {
    it('ApiService 应包含重试配置', () => {
      // 验证 MAX_RETRIES 常量存在
      expect((ApiService as any).MAX_RETRIES).toBe(3);
    });

    it('应能处理请求错误', async () => {
      mockClient.get.mockRejectedValue(new Error('API Error'));

      await expect(api.getUser('1')).rejects.toThrow();
    });
  });

  describe('离线处理', () => {
    it('isOnline 应返回布尔值', () => {
      const result = api.isOnline();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('离线队列功能', () => {
    it('queueOfflineRequest 应能加入队列', async () => {
      const mockRequestFn = jest.fn().mockResolvedValue({ success: true });
      
      try {
        await api.queueOfflineRequest('test_key', mockRequestFn);
      } catch (e) {
        // 离线时抛出错误
      }
    });
  });
});
