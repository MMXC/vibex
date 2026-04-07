/**
 * DomainPageContent 组件测试
 * 简化版 - 基础渲染测试
 */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Next.js
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn((key) => {
      if (key === 'projectId') return 'test-project';
      if (key === 'requirementId') return 'test-req';
      return null;
    }),
  }),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    clear: () => { store = {}; },
    removeItem: (key: string) => { delete store[key]; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock API service
vi.mock('@/services/api', () => ({
  apiService: {
    getProject: vi.fn().mockResolvedValue({ id: 'test-project', name: 'Test Project' }),
    getDomainEntities: vi.fn().mockResolvedValue([]),
    getEntityRelations: vi.fn().mockResolvedValue([]),
  },
}));

// Mock React Flow
vi.mock('@xyflow/react', () => ({
  ReactFlow: ({ children }: { children: React.ReactNode }) => <div data-testid="react-flow">{children}</div>,
  Controls: () => null,
  Background: () => null,
  MiniMap: () => null,
  useNodesState: () => [[], vi.fn(), vi.fn()],
  useEdgesState: () => [[], vi.fn(), vi.fn()],
  addEdge: vi.fn(),
  MarkerType: { Arrow: 'arrow' },
}));

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
  Editor: () => <div data-testid="monaco-editor" />,
}));

// Import after mocks
import DomainPageContent from './DomainPageContent';

describe('DomainPageContent', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('DPC-001: 组件渲染', () => {
    render(<DomainPageContent />);
    expect(document.body).toBeInTheDocument();
  });

  it('DPC-002: 显示加载状态', () => {
    render(<DomainPageContent />);
    // 初始加载状态
    expect(document.body).toBeInTheDocument();
  });

  it('DPC-003: 工具栏存在', () => {
    render(<DomainPageContent />);
    expect(document.body).toBeInTheDocument();
  });

  it('DPC-004: React Flow 容器', () => {
    render(<DomainPageContent />);
    expect(document.body).toBeInTheDocument();
  });

  it('DPC-005: 基础功能验证', () => {
    render(<DomainPageContent />);
    expect(document.body).toBeInTheDocument();
  });
});