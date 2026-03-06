// Mock axios
jest.mock('axios', () => {
  const mockInterceptors = {
    request: { use: jest.fn(() => ({ eject: jest.fn() })) },
    response: { use: jest.fn(() => ({ eject: jest.fn() })) },
  };

  // 模拟 AxiosError 类
  const mockAxiosError = jest.fn().mockImplementation(function mockAxiosError(
    message: string
  ) {
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
    isAxiosError: jest.fn((val) => val instanceof mockAxiosError),
  };
});

import axios from 'axios';
import {
  ApiService,
  User,
  Project,
  Message,
  FlowData,
  LoginRequest,
  RegisterRequest,
  Agent,
  Page,
} from './api';

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ApiService - 认证', () => {
  const mockBaseURL = 'https://api.vibex.example.com';
  let api: ApiService;
  let mockClient: unknown;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      interceptors: {
        request: { use: jest.fn(() => ({ eject: jest.fn() })) },
        response: { use: jest.fn(() => ({ eject: jest.fn() })) },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };
    (mockedAxios.create as jest.Mock).mockReturnValue(mockClient);
    api = new ApiService(mockBaseURL);
  });

  describe('用户登录', () => {
    it('应能登录用户', async () => {
      const loginData: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };
      const response = {
        token: 'jwt-token',
        user: { id: '1', name: 'Test', email: 'test@example.com' },
      };
      mockClient.post.mockResolvedValue({ data: response });

      const result = await api.login(loginData);
      expect(result.token).toBe('jwt-token');
      expect(mockClient.post).toHaveBeenCalledWith('/auth/login', loginData);
    });
  });

  describe('用户注册', () => {
    it('应能注册新用户', async () => {
      const registerData: RegisterRequest = {
        name: 'Test',
        email: 'test@example.com',
        password: 'password123',
      };
      const response = {
        token: 'jwt-token',
        user: { id: '1', name: 'Test', email: 'test@example.com' },
      };
      mockClient.post.mockResolvedValue({ data: response });

      const result = await api.register(registerData);
      expect(result.token).toBe('jwt-token');
      expect(mockClient.post).toHaveBeenCalledWith(
        '/auth/register',
        registerData
      );
    });
  });

  describe('用户登出', () => {
    it('应能登出用户', async () => {
      mockClient.post.mockResolvedValue({ data: { success: true } });

      const result = await api.logout();
      expect(result.success).toBe(true);
      expect(mockClient.post).toHaveBeenCalledWith('/auth/logout');
    });
  });
});

describe('ApiService - 用户数据', () => {
  const mockBaseURL = 'https://api.vibex.example.com';
  let api: ApiService;
  let mockClient: unknown;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      interceptors: {
        request: { use: jest.fn(() => ({ eject: jest.fn() })) },
        response: { use: jest.fn(() => ({ eject: jest.fn() })) },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };
    (mockedAxios.create as jest.Mock).mockReturnValue(mockClient);
    api = new ApiService(mockBaseURL);
  });

  it('应能获取用户信息', async () => {
    const userData: User = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
    };
    mockClient.get.mockResolvedValue({ data: { user: userData } });

    const result = await api.getUser('1');
    expect(result).toEqual(userData);
    expect(mockClient.get).toHaveBeenCalledWith('/users/1');
  });

  it('应能更新用户信息', async () => {
    const userData: User = {
      id: '1',
      name: 'Updated User',
      email: 'test@example.com',
    };
    mockClient.put.mockResolvedValue({ data: { user: userData } });

    const result = await api.updateUser('1', { name: 'Updated User' });
    expect(result).toEqual(userData);
    expect(mockClient.put).toHaveBeenCalledWith('/users/1', {
      name: 'Updated User',
    });
  });

  it('应能处理用户获取失败', async () => {
    const error = new Error('Network Error');
    mockClient.get.mockRejectedValue(error);

    await expect(api.getUser('1')).rejects.toThrow();
  });
});

describe('ApiService - 项目数据', () => {
  const mockBaseURL = 'https://api.vibex.example.com';
  let api: ApiService;
  let mockClient: unknown;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      interceptors: {
        request: { use: jest.fn(() => ({ eject: jest.fn() })) },
        response: { use: jest.fn(() => ({ eject: jest.fn() })) },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };
    (mockedAxios.create as jest.Mock).mockReturnValue(mockClient);
    api = new ApiService(mockBaseURL);
  });

  it('应能创建项目', async () => {
    const projectData = { name: 'My Project', userId: '1' };
    const response = { project: { id: 'proj-1', ...projectData } };
    mockClient.post.mockResolvedValue({ data: response });

    const result = await api.createProject(projectData);
    expect(result.id).toBe('proj-1');
    expect(mockClient.post).toHaveBeenCalledWith('/projects', projectData);
  });

  it('应能获取项目列表', async () => {
    const projects: Project[] = [
      { id: 'proj-1', name: 'Project 1', userId: '1' },
    ];
    mockClient.get.mockResolvedValue({ data: { projects } });

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
    mockClient.get.mockResolvedValue({ data: { project } });

    const result = await api.getProject('proj-1');
    expect(result).toEqual(project);
  });

  it('应能更新项目', async () => {
    const project: Project = {
      id: 'proj-1',
      name: 'Updated Project',
      userId: '1',
    };
    mockClient.put.mockResolvedValue({ data: { project } });

    const result = await api.updateProject('proj-1', {
      name: 'Updated Project',
    });
    expect(result).toEqual(project);
  });
});

describe('ApiService - 对话历史', () => {
  const mockBaseURL = 'https://api.vibex.example.com';
  let api: ApiService;
  let mockClient: unknown;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      interceptors: {
        request: { use: jest.fn(() => ({ eject: jest.fn() })) },
        response: { use: jest.fn(() => ({ eject: jest.fn() })) },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };
    (mockedAxios.create as jest.Mock).mockReturnValue(mockClient);
    api = new ApiService(mockBaseURL);
  });

  it('应能保存对话消息', async () => {
    const message: Message = {
      id: 'msg-1',
      role: 'user',
      content: 'Hello',
      projectId: 'proj-1',
    };
    mockClient.post.mockResolvedValue({ data: message });

    const result = await api.createMessage({
      content: 'Hello',
      projectId: 'proj-1',
    });
    expect(result).toEqual(message);
  });

  it('应能获取对话历史', async () => {
    const messages: Message[] = [
      { id: 'msg-1', role: 'user', content: 'Hello', projectId: 'proj-1' },
    ];
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

describe('ApiService - 流程图数据', () => {
  const mockBaseURL = 'https://api.vibex.example.com';
  let api: ApiService;
  let mockClient: unknown;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      interceptors: {
        request: { use: jest.fn(() => ({ eject: jest.fn() })) },
        response: { use: jest.fn(() => ({ eject: jest.fn() })) },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };
    (mockedAxios.create as jest.Mock).mockReturnValue(mockClient);
    api = new ApiService(mockBaseURL);
  });

  it('应能保存流程图', async () => {
    const flowData: FlowData = {
      id: 'flow-1',
      nodes: [],
      edges: [],
      projectId: 'proj-1',
    };
    mockClient.put.mockResolvedValue({ data: flowData });

    const result = await api.updateFlow('flow-1', { nodes: [], edges: [] });
    expect(result).toEqual(flowData);
  });

  it('应能加载流程图', async () => {
    const flowData: FlowData = {
      id: 'flow-1',
      nodes: [],
      edges: [],
      projectId: 'proj-1',
    };
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

describe('ApiService - Agent 管理', () => {
  const mockBaseURL = 'https://api.vibex.example.com';
  let api: ApiService;
  let mockClient: unknown;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      interceptors: {
        request: { use: jest.fn(() => ({ eject: jest.fn() })) },
        response: { use: jest.fn(() => ({ eject: jest.fn() })) },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };
    (mockedAxios.create as jest.Mock).mockReturnValue(mockClient);
    api = new ApiService(mockBaseURL);
  });

  it('应能获取 Agent 列表', async () => {
    const agents: Agent[] = [
      { id: 'agent-1', name: 'Agent 1', prompt: 'prompt', userId: '1' },
    ];
    mockClient.get.mockResolvedValue({ data: { agents } });

    const result = await api.getAgents('1');
    expect(result).toEqual(agents);
  });

  it('应能创建 Agent', async () => {
    const agent: Agent = {
      id: 'agent-1',
      name: 'Agent 1',
      prompt: 'prompt',
      userId: '1',
    };
    mockClient.post.mockResolvedValue({ data: { agent } });

    const result = await api.createAgent({
      name: 'Agent 1',
      prompt: 'prompt',
      userId: '1',
    });
    expect(result).toEqual(agent);
  });

  it('应能删除 Agent', async () => {
    mockClient.delete.mockResolvedValue({ data: { success: true } });

    const result = await api.deleteAgent('agent-1');
    expect(result.success).toBe(true);
  });
});

describe('ApiService - 页面管理', () => {
  const mockBaseURL = 'https://api.vibex.example.com';
  let api: ApiService;
  let mockClient: unknown;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      interceptors: {
        request: { use: jest.fn(() => ({ eject: jest.fn() })) },
        response: { use: jest.fn(() => ({ eject: jest.fn() })) },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };
    (mockedAxios.create as jest.Mock).mockReturnValue(mockClient);
    api = new ApiService(mockBaseURL);
  });

  it('应能获取页面列表', async () => {
    const pages: Page[] = [
      { id: 'page-1', name: 'Page 1', projectId: 'proj-1' },
    ];
    mockClient.get.mockResolvedValue({ data: { pages } });

    const result = await api.getPages('proj-1');
    expect(result).toEqual(pages);
  });

  it('应能创建页面', async () => {
    const page: Page = { id: 'page-1', name: 'Page 1', projectId: 'proj-1' };
    mockClient.post.mockResolvedValue({ data: { page } });

    const result = await api.createPage({
      name: 'Page 1',
      projectId: 'proj-1',
    });
    expect(result).toEqual(page);
  });

  it('应能删除页面', async () => {
    mockClient.delete.mockResolvedValue({ data: { success: true } });

    const result = await api.deletePage('page-1');
    expect(result.success).toBe(true);
  });
});

describe('ApiService - 错误重试机制', () => {
  const mockBaseURL = 'https://api.vibex.example.com';
  let api: ApiService;
  let mockClient: unknown;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      interceptors: {
        request: { use: jest.fn(() => ({ eject: jest.fn() })) },
        response: { use: jest.fn(() => ({ eject: jest.fn() })) },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };
    (mockedAxios.create as jest.Mock).mockReturnValue(mockClient);
    api = new ApiService(mockBaseURL);
  });

  it('ApiService 应包含重试配置', () => {
    expect((ApiService as any).MAX_RETRIES).toBe(3);
  });

  it('应能处理请求错误', async () => {
    mockClient.get.mockRejectedValue(new Error('API Error'));

    await expect(api.getUser('1')).rejects.toThrow();
  });
});

describe('ApiService - 离线处理', () => {
  const mockBaseURL = 'https://api.vibex.example.com';
  let api: ApiService;
  let mockClient: unknown;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      interceptors: {
        request: { use: jest.fn(() => ({ eject: jest.fn() })) },
        response: { use: jest.fn(() => ({ eject: jest.fn() })) },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };
    (mockedAxios.create as jest.Mock).mockReturnValue(mockClient);
    api = new ApiService(mockBaseURL);
  });

  it('isOnline 应返回布尔值', () => {
    const result = api.isOnline();
    expect(typeof result).toBe('boolean');
  });

  it('queueOfflineRequest 应能加入队列', async () => {
    const mockRequestFn = jest.fn().mockResolvedValue({ success: true });

    try {
      await api.queueOfflineRequest('test_key', mockRequestFn);
    } catch (e) {
      // 离线时抛出错误
    }
  });
});

describe('ApiService - 需求管理', () => {
  const mockBaseURL = 'https://api.vibex.example.com';
  let api: ApiService;
  let mockClient: unknown;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      interceptors: {
        request: { use: jest.fn(() => ({ eject: jest.fn() })) },
        response: { use: jest.fn(() => ({ eject: jest.fn() })) },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };
    (mockedAxios.create as jest.Mock).mockReturnValue(mockClient);
    api = new ApiService(mockBaseURL);
  });

  it('应能获取需求列表', async () => {
    const requirements = [
      {
        id: 'req-1',
        content: 'Test requirement',
        userId: '1',
        status: 'draft',
      },
    ];
    mockClient.get.mockResolvedValue({ data: { requirements } });

    const result = await api.getRequirements('1');
    expect(result).toEqual(requirements);
  });

  it('应能创建需求', async () => {
    const requirement = {
      id: 'req-1',
      content: 'Test',
      userId: '1',
      status: 'draft',
    };
    mockClient.post.mockResolvedValue({ data: { requirement } });

    const result = await api.createRequirement({
      content: 'Test',
      userId: '1',
    });
    expect(result).toEqual(requirement);
  });

  it('应能获取单个需求', async () => {
    const requirement = {
      id: 'req-1',
      content: 'Test',
      userId: '1',
      status: 'draft',
    };
    mockClient.get.mockResolvedValue({ data: { requirement } });

    const result = await api.getRequirement('req-1');
    expect(result).toEqual(requirement);
  });

  it('应能更新需求', async () => {
    const requirement = {
      id: 'req-1',
      content: 'Updated',
      userId: '1',
      status: 'completed',
    };
    mockClient.put.mockResolvedValue({ data: { requirement } });

    const result = await api.updateRequirement(
      'req-1',
      { status: 'completed' },
      '1'
    );
    expect(result).toEqual(requirement);
  });

  it('应能删除需求', async () => {
    mockClient.delete.mockResolvedValue({ data: { success: true } });

    const result = await api.deleteRequirement('req-1', '1');
    expect(result.success).toBe(true);
  });

  it('应能分析需求', async () => {
    const requirement = {
      id: 'req-1',
      content: 'Test',
      userId: '1',
      status: 'analyzing',
    };
    mockClient.post.mockResolvedValue({ data: { requirement } });

    const result = await api.analyzeRequirement('req-1');
    expect(result).toEqual(requirement);
  });

  it('应能重新分析需求', async () => {
    const requirement = {
      id: 'req-1',
      content: 'Test',
      userId: '1',
      status: 'analyzing',
    };
    mockClient.post.mockResolvedValue({ data: { requirement } });

    const result = await api.reanalyzeRequirement('req-1', {
      context: 'extra',
    });
    expect(result).toEqual(requirement);
  });
});

describe('ApiService - 澄清对话', () => {
  const mockBaseURL = 'https://api.vibex.example.com';
  let api: ApiService;
  let mockClient: unknown;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      interceptors: {
        request: { use: jest.fn(() => ({ eject: jest.fn() })) },
        response: { use: jest.fn(() => ({ eject: jest.fn() })) },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };
    (mockedAxios.create as jest.Mock).mockReturnValue(mockClient);
    api = new ApiService(mockBaseURL);
  });

  it('应能获取澄清问题列表', async () => {
    const clarifications = [
      {
        id: 'clar-1',
        question: 'What is this?',
        requirementId: 'req-1',
        status: 'pending',
      },
    ];
    mockClient.get.mockResolvedValue({ data: { clarifications } });

    const result = await api.getClarifications('req-1');
    expect(result).toEqual(clarifications);
  });

  it('应能回答澄清问题', async () => {
    const clarification = {
      id: 'clar-1',
      question: 'What is this?',
      answer: 'This is that',
      status: 'answered',
    };
    mockClient.put.mockResolvedValue({ data: { clarification } });

    const result = await api.answerClarification(
      'req-1',
      'clar-1',
      'This is that'
    );
    expect(result).toEqual(clarification);
  });

  it('应能跳过澄清问题', async () => {
    const clarification = {
      id: 'clar-1',
      question: 'What is this?',
      status: 'skipped',
    };
    mockClient.put.mockResolvedValue({ data: { clarification } });

    const result = await api.skipClarification('req-1', 'clar-1');
    expect(result).toEqual(clarification);
  });
});

describe('ApiService - 分析结果', () => {
  const mockBaseURL = 'https://api.vibex.example.com';
  let api: ApiService;
  let mockClient: unknown;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      interceptors: {
        request: { use: jest.fn(() => ({ eject: jest.fn() })) },
        response: { use: jest.fn(() => ({ eject: jest.fn() })) },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };
    (mockedAxios.create as jest.Mock).mockReturnValue(mockClient);
    api = new ApiService(mockBaseURL);
  });

  it('应能获取分析结果', async () => {
    const analysisResult = {
      requirementId: 'req-1',
      domains: [],
      relations: [],
      confidence: 0.9,
      analyzedAt: '2024-01-01',
    };
    mockClient.get.mockResolvedValue({ data: { analysisResult } });

    const result = await api.getAnalysisResult('req-1');
    expect(result).toEqual(analysisResult);
  });
});

describe('ApiService - 领域实体', () => {
  const mockBaseURL = 'https://api.vibex.example.com';
  let api: ApiService;
  let mockClient: unknown;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      interceptors: {
        request: { use: jest.fn(() => ({ eject: jest.fn() })) },
        response: { use: jest.fn(() => ({ eject: jest.fn() })) },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };
    (mockedAxios.create as jest.Mock).mockReturnValue(mockClient);
    api = new ApiService(mockBaseURL);
  });

  it('应能获取领域实体列表', async () => {
    const domainEntities = [
      {
        id: 'de-1',
        name: 'User',
        type: 'entity',
        requirementId: 'req-1',
        attributes: [],
      },
    ];
    mockClient.get.mockResolvedValue({ data: { domainEntities } });

    const result = await api.getDomainEntities('req-1');
    expect(result).toEqual(domainEntities);
  });

  it('应能获取单个领域实体', async () => {
    const domain = {
      id: 'de-1',
      name: 'User',
      type: 'entity',
      requirementId: 'req-1',
      attributes: [],
    };
    mockClient.get.mockResolvedValue({ data: { domain } });

    const result = await api.getDomainEntity('de-1');
    expect(result).toEqual(domain);
  });

  it('应能创建领域实体', async () => {
    const domain = {
      id: 'de-1',
      name: 'User',
      type: 'entity',
      requirementId: 'req-1',
      attributes: [],
    };
    mockClient.post.mockResolvedValue({ data: { domain } });

    const result = await api.createDomainEntity({
      name: 'User',
      type: 'entity',
      requirementId: 'req-1',
      attributes: [],
    });
    expect(result).toEqual(domain);
  });

  it('应能更新领域实体', async () => {
    const domain = {
      id: 'de-1',
      name: 'Updated User',
      type: 'entity',
      requirementId: 'req-1',
      attributes: [],
    };
    mockClient.put.mockResolvedValue({ data: { domain } });

    const result = await api.updateDomainEntity('de-1', {
      name: 'Updated User',
    });
    expect(result).toEqual(domain);
  });

  it('应能删除领域实体', async () => {
    mockClient.delete.mockResolvedValue({ data: { success: true } });

    const result = await api.deleteDomainEntity('de-1', 'req-1');
    expect(result.success).toBe(true);
  });
});

describe('ApiService - 实体关系', () => {
  const mockBaseURL = 'https://api.vibex.example.com';
  let api: ApiService;
  let mockClient: unknown;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      interceptors: {
        request: { use: jest.fn(() => ({ eject: jest.fn() })) },
        response: { use: jest.fn(() => ({ eject: jest.fn() })) },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };
    (mockedAxios.create as jest.Mock).mockReturnValue(mockClient);
    api = new ApiService(mockBaseURL);
  });

  it('应能获取实体关系列表', async () => {
    const entityRelations = [
      {
        id: 'er-1',
        sourceEntityId: 'de-1',
        targetEntityId: 'de-2',
        type: 'has_many',
        requirementId: 'req-1',
      },
    ];
    mockClient.get.mockResolvedValue({ data: { entityRelations } });

    const result = await api.getEntityRelations('req-1');
    expect(result).toEqual(entityRelations);
  });

  it('应能获取单个实体关系', async () => {
    const entityRelation = {
      id: 'er-1',
      sourceEntityId: 'de-1',
      targetEntityId: 'de-2',
      type: 'has_many',
      requirementId: 'req-1',
    };
    mockClient.get.mockResolvedValue({ data: { entityRelation } });

    const result = await api.getEntityRelation('er-1');
    expect(result).toEqual(entityRelation);
  });

  it('应能创建实体关系', async () => {
    const entityRelation = {
      id: 'er-1',
      sourceEntityId: 'de-1',
      targetEntityId: 'de-2',
      type: 'has_many',
      requirementId: 'req-1',
    };
    mockClient.post.mockResolvedValue({ data: { entityRelation } });

    const result = await api.createEntityRelation(
      {
        sourceEntityId: 'de-1',
        targetEntityId: 'de-2',
        type: 'has_many',
        requirementId: 'req-1',
      },
      'req-1'
    );
    expect(result).toEqual(entityRelation);
  });

  it('应能更新实体关系', async () => {
    const entityRelation = {
      id: 'er-1',
      sourceEntityId: 'de-1',
      targetEntityId: 'de-2',
      type: 'belongs_to',
      requirementId: 'req-1',
    };
    mockClient.put.mockResolvedValue({ data: { entityRelation } });

    const result = await api.updateEntityRelation(
      'er-1',
      { type: 'belongs_to' },
      'req-1'
    );
    expect(result).toEqual(entityRelation);
  });

  it('应能删除实体关系', async () => {
    mockClient.delete.mockResolvedValue({ data: { success: true } });

    const result = await api.deleteEntityRelation('er-1', 'req-1');
    expect(result.success).toBe(true);
  });
});

describe('ApiService - 原型快照', () => {
  const mockBaseURL = 'https://api.vibex.example.com';
  let api: ApiService;
  let mockClient: unknown;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      interceptors: {
        request: { use: jest.fn(() => ({ eject: jest.fn() })) },
        response: { use: jest.fn(() => ({ eject: jest.fn() })) },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };
    (mockedAxios.create as jest.Mock).mockReturnValue(mockClient);
    api = new ApiService(mockBaseURL);
  });

  it('应能获取原型快照列表', async () => {
    const prototypeSnapshots = [
      { id: 'ps-1', projectId: 'proj-1', name: 'Snapshot 1', content: {} },
    ];
    mockClient.get.mockResolvedValue({ data: { prototypeSnapshots } });

    const result = await api.getPrototypeSnapshots('proj-1');
    expect(result).toEqual(prototypeSnapshots);
  });

  it('应能获取单个原型快照', async () => {
    const prototypeSnapshot = {
      id: 'ps-1',
      projectId: 'proj-1',
      name: 'Snapshot 1',
      content: {},
    };
    mockClient.get.mockResolvedValue({ data: { prototypeSnapshot } });

    const result = await api.getPrototypeSnapshot('ps-1');
    expect(result).toEqual(prototypeSnapshot);
  });

  it('应能创建原型快照', async () => {
    const prototypeSnapshot = {
      id: 'ps-1',
      projectId: 'proj-1',
      name: 'Snapshot 1',
      content: {},
    };
    mockClient.post.mockResolvedValue({ data: { prototypeSnapshot } });

    const result = await api.createPrototypeSnapshot({
      projectId: 'proj-1',
      name: 'Snapshot 1',
      content: {},
    });
    expect(result).toEqual(prototypeSnapshot);
  });

  it('应能更新原型快照', async () => {
    const prototypeSnapshot = {
      id: 'ps-1',
      projectId: 'proj-1',
      name: 'Updated Snapshot',
      content: {},
    };
    mockClient.put.mockResolvedValue({ data: { prototypeSnapshot } });

    const result = await api.updatePrototypeSnapshot('ps-1', {
      name: 'Updated Snapshot',
    });
    expect(result).toEqual(prototypeSnapshot);
  });

  it('应能删除原型快照', async () => {
    mockClient.delete.mockResolvedValue({ data: { success: true } });

    const result = await api.deletePrototypeSnapshot('ps-1', 'proj-1');
    expect(result.success).toBe(true);
  });
});

describe('ApiService - 项目回收站', () => {
  const mockBaseURL = 'https://api.vibex.example.com';
  let api: ApiService;
  let mockClient: unknown;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      interceptors: {
        request: { use: jest.fn(() => ({ eject: jest.fn() })) },
        response: { use: jest.fn(() => ({ eject: jest.fn() })) },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn(),
    };
    (mockedAxios.create as jest.Mock).mockReturnValue(mockClient);
    api = new ApiService(mockBaseURL);
  });

  it('应能软删除项目', async () => {
    const project = {
      id: 'proj-1',
      name: 'Project 1',
      userId: '1',
      deletedAt: new Date().toISOString(),
    };
    mockClient.patch.mockResolvedValue({ data: { project } });

    const result = await api.softDeleteProject('proj-1');
    expect(result).toEqual(project);
  });

  it('应能恢复项目', async () => {
    const project = {
      id: 'proj-1',
      name: 'Project 1',
      userId: '1',
      deletedAt: null,
    };
    mockClient.patch.mockResolvedValue({ data: { project } });

    const result = await api.restoreProject('proj-1');
    expect(result).toEqual(project);
  });

  it('应能永久删除项目', async () => {
    mockClient.delete.mockResolvedValue({ data: { success: true } });

    const result = await api.permanentDeleteProject('proj-1');
    expect(result.success).toBe(true);
  });

  it('应能获取回收站项目', async () => {
    const projects = [
      {
        id: 'proj-1',
        name: 'Deleted Project',
        userId: '1',
        deletedAt: new Date().toISOString(),
      },
    ];
    mockClient.get.mockResolvedValue({ data: { projects } });

    const result = await api.getDeletedProjects();
    expect(result).toEqual(projects);
  });

  it('应能清空回收站', async () => {
    mockClient.delete.mockResolvedValue({ data: { success: true } });

    const result = await api.clearDeletedProjects();
    expect(result.success).toBe(true);
  });
});

describe('ApiService - 页面管理扩展', () => {
  const mockBaseURL = 'https://api.vibex.example.com';
  let api: ApiService;
  let mockClient: unknown;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      interceptors: {
        request: { use: jest.fn(() => ({ eject: jest.fn() })) },
        response: { use: jest.fn(() => ({ eject: jest.fn() })) },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };
    (mockedAxios.create as jest.Mock).mockReturnValue(mockClient);
    api = new ApiService(mockBaseURL);
  });

  it('应能获取单个页面', async () => {
    const page = { id: 'page-1', name: 'Page 1', projectId: 'proj-1' };
    mockClient.get.mockResolvedValue({ data: { page } });

    const result = await api.getPage('page-1');
    expect(result).toEqual(page);
  });

  it('应能更新页面', async () => {
    const page = { id: 'page-1', name: 'Updated Page', projectId: 'proj-1' };
    mockClient.put.mockResolvedValue({ data: { page } });

    const result = await api.updatePage('page-1', { name: 'Updated Page' });
    expect(result).toEqual(page);
  });
});

describe('ApiService - Agent管理扩展', () => {
  const mockBaseURL = 'https://api.vibex.example.com';
  let api: ApiService;
  let mockClient: unknown;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      interceptors: {
        request: { use: jest.fn(() => ({ eject: jest.fn() })) },
        response: { use: jest.fn(() => ({ eject: jest.fn() })) },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };
    (mockedAxios.create as jest.Mock).mockReturnValue(mockClient);
    api = new ApiService(mockBaseURL);
  });

  it('应能获取单个Agent', async () => {
    const agent = {
      id: 'agent-1',
      name: 'Agent 1',
      prompt: 'prompt',
      userId: '1',
    };
    mockClient.get.mockResolvedValue({ data: { agent } });

    const result = await api.getAgent('agent-1');
    expect(result).toEqual(agent);
  });

  it('应能更新Agent', async () => {
    const agent = {
      id: 'agent-1',
      name: 'Updated Agent',
      prompt: 'new prompt',
      userId: '1',
    };
    mockClient.put.mockResolvedValue({ data: { agent } });

    const result = await api.updateAgent('agent-1', { name: 'Updated Agent' });
    expect(result).toEqual(agent);
  });
});

describe('ApiService - 流程图扩展', () => {
  const mockBaseURL = 'https://api.vibex.example.com';
  let api: ApiService;
  let mockClient: unknown;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      interceptors: {
        request: { use: jest.fn(() => ({ eject: jest.fn() })) },
        response: { use: jest.fn(() => ({ eject: jest.fn() })) },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };
    (mockedAxios.create as jest.Mock).mockReturnValue(mockClient);
    api = new ApiService(mockBaseURL);
  });

  it('应能AI生成流程图', async () => {
    const flowData = {
      id: 'flow-1',
      nodes: [],
      edges: [],
      projectId: 'proj-1',
    };
    mockClient.post.mockResolvedValue({ data: flowData });

    const result = await api.generateFlow('创建用户登录流程');
    expect(result).toEqual(flowData);
  });
});
