import { render, screen, waitFor } from '@testing-library/react';
import DomainPage from '@/app/domain/page';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock API service
jest.mock('@/services/api', () => ({
  apiService: {
    getProject: jest.fn().mockResolvedValue({
      id: '1',
      name: 'Test Project',
      description: 'Test Description',
    }),
    getDomainEntities: jest.fn().mockResolvedValue([
      {
        id: 'entity-1',
        name: 'User',
        type: 'user',
        description: 'User entity',
        attributes: [
          { name: 'id', type: 'string', required: true },
          { name: 'name', type: 'string', required: true },
        ],
      },
    ]),
    getEntityRelations: jest.fn().mockResolvedValue([]),
    createDomainEntity: jest.fn().mockResolvedValue({ id: 'new-entity' }),
    updateDomainEntity: jest.fn().mockResolvedValue({ id: 'entity-1' }),
    deleteDomainEntity: jest.fn().mockResolvedValue(true),
    createEntityRelation: jest.fn().mockResolvedValue({ id: 'new-rel' }),
    deleteEntityRelation: jest.fn().mockResolvedValue(true),
  },
  generateBoundedContext: jest.fn().mockResolvedValue({
    success: true,
    boundedContexts: [],
  }),
  BoundedContext: jest.fn().mockImplementation((data) => ({
    id: data.id,
    name: data.name,
    type: data.type,
    description: data.description || '',
    relationships: data.relationships || [],
  })),
}));

// Mock confirmation store
jest.mock('@/stores/confirmationStore', () => ({
  useConfirmationStore: jest.fn(() => ({
    requirementText: 'Test requirement',
    boundedContexts: [],
    selectedContextIds: [],
    domainModels: [],
    currentStep: 'model',
    setBoundedContexts: jest.fn(),
    setSelectedContextIds: jest.fn(),
    setContextMermaidCode: jest.fn(),
    setDomainModels: jest.fn(),
    goToNextStep: jest.fn(),
    goToPreviousStep: jest.fn(),
    reset: jest.fn(),
  })),
}));

// Mock React Flow
jest.mock('reactflow', () => ({
  __esModule: true,
  default: () => <div data-testid="react-flow">React Flow</div>,
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => children,
  Controls: () => null,
  Background: () => null,
  MiniMap: () => null,
  useNodesState: () => [[], jest.fn(), jest.fn()],
  useEdgesState: () => [[], jest.fn(), jest.fn()],
  addEdge: jest.fn(),
  Handle: () => null,
  Position: { Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' },
  MarkerType: { Arrow: 'arrow' },
}));

// Mock ConfirmationSteps component
jest.mock('@/components/ui/ConfirmationSteps', () => ({
  ConfirmationSteps: ({ currentStep }: { currentStep: string }) => (
    <div data-testid="confirmation-steps">Step: {currentStep}</div>
  ),
}));

describe('Domain (/domain)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    localStorageMock.setItem('auth_token', 'test-token');
    localStorageMock.setItem('user_id', 'test-user');
  });

  it('DOM-001: 页面加载成功', async () => {
    const { container } = render(<DomainPage />);
    await waitFor(() => {
      // 页面应该渲染成功
      expect(container.querySelector('.container')).toBeInTheDocument();
    });
  });

  it('DOM-002: 显示图谱和列表切换按钮', async () => {
    render(<DomainPage />);
    await waitFor(() => {
      expect(screen.getByText('图谱')).toBeInTheDocument();
      expect(screen.getByText('列表')).toBeInTheDocument();
    });
  });

  it('DOM-003: 确认按钮存在', async () => {
    render(<DomainPage />);
    await waitFor(() => {
      expect(screen.getByText('确认并继续')).toBeInTheDocument();
    });
  });

  it('DOM-004: 确认按钮在无实体时禁用', async () => {
    const mockApi = require('@/services/api');
    mockApi.apiService.getDomainEntities.mockResolvedValueOnce([]);

    render(<DomainPage />);
    await waitFor(() => {
      const confirmBtn = screen.getByText('确认并继续');
      expect(confirmBtn).toBeDisabled();
    });
  });

  it('DOM-005: 步骤指示器显示', async () => {
    render(<DomainPage />);
    await waitFor(() => {
      expect(screen.getByTestId('confirmation-steps')).toBeInTheDocument();
    });
  });
});
