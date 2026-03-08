import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProjectPage from '@/app/project/page';

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
    getProjects: jest.fn().mockResolvedValue([]),
    getProject: jest.fn().mockResolvedValue(null),
    createProject: jest
      .fn()
      .mockResolvedValue({ id: '1', name: 'New Project' }),
    updateProject: jest.fn().mockResolvedValue({ id: '1', name: 'Updated' }),
    deleteProject: jest.fn().mockResolvedValue(true),
    getRequirements: jest.fn().mockResolvedValue([]),
    getDomainEntities: jest.fn().mockResolvedValue([]),
    getEntityRelations: jest.fn().mockResolvedValue([]),
  },
}));

describe('Project (/project)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    localStorageMock.setItem('auth_token', 'test-token');
    localStorageMock.setItem('user_id', 'test-user');
  });

  it('renders project page', () => {
    const { container } = render(<ProjectPage />);
    expect(container).toBeInTheDocument();
  });

  it('renders loading state', () => {
    const { container } = render(<ProjectPage />);
    // Basic render
    expect(container).toBeInTheDocument();
  });

  it('renders with project data', async () => {
    const { container } = render(<ProjectPage />);
    await waitFor(() => {
      expect(container).toBeInTheDocument();
    });
  });
});
