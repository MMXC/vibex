/**
 * Accessibility Test Suite — P1-7 WCAG Compliance Baseline
 *
 * Epic: vibex-epic2-frontend-20260324 / dev-p1-7-accessibility
 * Coverage: dashboard, flow, chat pages
 * Tool: jest-axe (axe-core WCAG 2.1 A/AA rules)
 */

import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import Dashboard from '@/app/dashboard/page';
import FlowPage from '@/app/flow/page';
import Chat from '@/app/chat/page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ─── Shared test helpers ────────────────────────────────────────────────────

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();
  return {
    ...render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>),
    queryClient,
  };
}

// ─── Shared mocks (used across all pages) ───────────────────────────────────

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const mockRouter = {
  push: vi.fn(),
  back: vi.fn(),
};

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => new URLSearchParams({ projectId: 'test-project-id' }),
}));

// Mock FlowEditor component (renders a simple div for accessibility testing)
vi.mock('@/components/ui/FlowEditor', () => ({
  __esModule: true,
  default: function MockFlowEditor() {
    return <div data-testid="flow-editor">Flow Editor</div>;
  },
  FlowNode: {},
  FlowEdge: {},
  flowUtils: {},
}));

// Mock FlowPropertiesPanel
vi.mock('@/components/ui/FlowPropertiesPanel', () => ({
  __esModule: true,
  default: function MockFlowPropertiesPanel() {
    return <div data-testid="flow-properties-panel" />;
  },
}));

// Mock usePermission hook - return admin permissions for tests
vi.mock('@/hooks/usePermission', () => ({
  usePermission: () => ({
    globalRole: 'super_admin',
    isAuthenticated: true,
    isSuperAdmin: true,
    isUser: true,
    isGuest: false,
    hasPermission: () => true,
    canAccess: () => true,
    user: {
      userId: 'test-user',
      email: 'test@example.com',
      role: 'super_admin',
    },
    refreshUser: vi.fn(),
    getProjectRole: vi.fn(() => null),
    hasProjectPermission: vi.fn(() => Promise.resolve(true)),
    setProjectRole: vi.fn(),
    clearProjectRole: vi.fn(),
  }),
}));

// Mock API modules
const mockGetProjects = vi.fn();
const mockCreateProject = vi.fn();
const mockDeleteProject = vi.fn();
const mockLogout = vi.fn();
const mockGetDeletedProjects = vi.fn();
const mockGetMessages = vi.fn();
const mockCreateMessage = vi.fn();
const mockGetConversations = vi.fn();

vi.mock('@/services/api/modules/project', () => ({
  projectApi: {
    getProjects: (...args: unknown[]) => mockGetProjects(...args),
    createProject: (...args: unknown[]) => mockCreateProject(...args),
    deleteProject: (...args: unknown[]) => mockDeleteProject(...args),
    softDeleteProject: vi.fn(),
    restoreProject: vi.fn(),
    permanentDeleteProject: vi.fn(),
    getDeletedProjects: (...args: unknown[]) => mockGetDeletedProjects(...args),
    clearDeletedProjects: vi.fn(),
    getProjectRole: vi.fn(),
    getProject: vi.fn(),
    updateProject: vi.fn(),
  },
}));

vi.mock('@/services/api/modules/auth', () => ({
  authApi: {
    logout: (...args: unknown[]) => mockLogout(...args),
    login: vi.fn(),
    register: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

vi.mock('@/services/api', () => ({
  authApi: {
    logout: (...args: unknown[]) => mockLogout(...args),
    login: vi.fn(),
    register: vi.fn(),
    getCurrentUser: vi.fn(),
  },
  projectApi: {
    getProjects: (...args: unknown[]) => mockGetProjects(...args),
    createProject: (...args: unknown[]) => mockCreateProject(...args),
    deleteProject: (...args: unknown[]) => mockDeleteProject(...args),
    getDeletedProjects: (...args: unknown[]) => mockGetDeletedProjects(...args),
  },
  apiService: {
    logout: (...args: unknown[]) => mockLogout(...args),
    getProjects: (...args: unknown[]) => mockGetProjects(...args),
    createProject: (...args: unknown[]) => mockCreateProject(...args),
    deleteProject: (...args: unknown[]) => mockDeleteProject(...args),
    getDeletedProjects: (...args: unknown[]) => mockGetDeletedProjects(...args),
    getMessages: (...args: unknown[]) => mockGetMessages(...args),
    createMessage: (...args: unknown[]) => mockCreateMessage(...args),
    getConversations: (...args: unknown[]) => mockGetConversations(...args),
    getFlow: vi.fn().mockResolvedValue({ nodes: [], edges: [] }),
    updateFlow: vi.fn().mockResolvedValue({ success: true }),
    generateFlow: vi.fn().mockResolvedValue({
      nodes: [
        { id: '1', position: { x: 100, y: 100 }, data: { label: 'AI Generated' } },
      ],
      edges: [],
    }),
  },
}));

// Mock EventSource for SSE
class MockEventSource {
  readyState = 1;
  onmessage = null;
  onerror = null;
  close = vi.fn();
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
}

Object.defineProperty(window, 'EventSource', {
  value: MockEventSource,
  writable: true,
});

// ─── Helper: extract critical axe violations ───────────────────────────────

function extractCriticalViolations(results: { violations: Array<{ id: string; impact: string; description: string; nodes: unknown[] }> }) {
  const critical = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious'
  );
  return critical.map((v) => ({
    id: v.id,
    impact: v.impact,
    description: v.description,
    nodes: v.nodes.length,
  }));
}

function expectNoViolations(results: { violations: unknown[] }) {
  expect(results.violations).toHaveLength(0);
}

// ─── BeforeEach setup ───────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
  localStorageMock.setItem('auth_token', 'test-token');
  localStorageMock.setItem('user_id', 'test-user');
  localStorageMock.setItem('selected_model', 'gpt-4');
  localStorageMock.setItem('user_role', 'admin');

  mockGetProjects.mockResolvedValue([
    { id: '1', name: 'Project 1', description: 'Description 1' },
  ]);
  mockCreateProject.mockResolvedValue({ id: 'new-project-id' });
  mockDeleteProject.mockResolvedValue({ success: true });
  mockLogout.mockResolvedValue({});
  mockGetDeletedProjects.mockResolvedValue([]);
  mockGetMessages.mockResolvedValue([]);
  mockCreateMessage.mockResolvedValue({ id: '1', role: 'assistant', content: 'Hello!' });
  mockGetConversations.mockResolvedValue([]);
});

afterEach(() => {
  localStorageMock.clear();
});

// ─── Dashboard (/dashboard) ──────────────────────────────────────────────────

describe('Dashboard (/dashboard) — WCAG 2.1 AA Accessibility', () => {
  it('should have no axe violations on initial render', async () => {
    const { container } = renderWithQueryClient(<Dashboard />);

    // Wait for async content
    await new Promise((r) => setTimeout(r, 100));

    const results = await axe(container);
    expectNoViolations(results);
  });

  it('should have no critical violations in project list', async () => {
    const { container } = renderWithQueryClient(<Dashboard />);

    await new Promise((r) => setTimeout(r, 100));

    const results = await axe(container);
    const critical = extractCriticalViolations(results);
    expect(critical).toHaveLength(0);
  });

  it('should have no axe violations with multiple projects', async () => {
    mockGetProjects.mockResolvedValue([
      { id: '1', name: 'Project 1', description: 'Description 1' },
      { id: '2', name: 'Project 2', description: 'Description 2' },
      { id: '3', name: 'Project 3', description: null },
    ]);

    const { container } = renderWithQueryClient(<Dashboard />);

    await new Promise((r) => setTimeout(r, 100));

    const results = await axe(container);
    expectNoViolations(results);
  });
});

// ─── Flow Editor (/flow) ────────────────────────────────────────────────────

describe('Flow (/flow) — WCAG 2.1 AA Accessibility', () => {
  it('should have no axe violations on initial render', async () => {
    const { container } = render(<FlowPage />);

    await new Promise((r) => setTimeout(r, 100));

    const results = await axe(container);
    expectNoViolations(results);
  });

  it('should have no critical violations with nodes rendered', async () => {
    const { container } = render(<FlowPage />);

    await new Promise((r) => setTimeout(r, 100));

    const results = await axe(container);
    const critical = extractCriticalViolations(results);
    expect(critical).toHaveLength(0);
  });
});

// ─── Chat (/chat) ───────────────────────────────────────────────────────────

describe('Chat (/chat) — WCAG 2.1 AA Accessibility', () => {
  it('should have no axe violations on initial render', async () => {
    const { container } = render(<Chat />);

    await new Promise((r) => setTimeout(r, 100));

    const results = await axe(container);
    expectNoViolations(results);
  });

  it('should have no critical violations in message thread', async () => {
    mockGetMessages.mockResolvedValue([
      { id: '1', role: 'user', content: 'Hello' },
      { id: '2', role: 'assistant', content: 'Hi there!' },
    ]);

    const { container } = render(<Chat />);

    await new Promise((r) => setTimeout(r, 100));

    const results = await axe(container);
    const critical = extractCriticalViolations(results);
    expect(critical).toHaveLength(0);
  });

  it('should have no axe violations with empty state', async () => {
    mockGetMessages.mockResolvedValue([]);
    mockGetConversations.mockResolvedValue([]);

    const { container } = render(<Chat />);

    await new Promise((r) => setTimeout(r, 100));

    const results = await axe(container);
    expectNoViolations(results);
  });
});

// ─── Summary test (informational) ──────────────────────────────────────────

describe('Accessibility Baseline Summary', () => {
  it('confirms axe-core is configured and running', async () => {
    const { container } = render(<div role="button">test</div>);
    const results = await axe(container);
    // Just verify axe itself is working — this div is intentionally minimal
    expect(results.violations).toHaveLength(0);
  });
});
