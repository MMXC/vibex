import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock Element.scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// Mock next/image
jest.mock('next/image', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: (props) => React.createElement('img', props),
  };
});

// Mock Monaco Editor
jest.mock('@monaco-editor/react', () => ({
  Editor: (props) => {
    return require('react').createElement('textarea', { 
      'data-testid': 'monaco-editor', 
      value: props.value, 
      onChange: (e) => props.onChange?.(e.target.value)
    });
  },
}));

// Mock Mermaid
jest.mock('mermaid', () => ({
  initialize: jest.fn(),
  render: jest.fn().mockResolvedValue({ svg: '<svg></svg>' }),
}));

// Mock html-to-image
jest.mock('html-to-image', () => ({
  toSvg: jest.fn().mockResolvedValue('<svg></svg>'),
  toPng: jest.fn().mockResolvedValue('data:image/png;base64,'),
}));

// Mock axios
jest.mock('axios', () => ({
  isAxiosError: jest.fn(() => false),
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
}));

// Mock React Flow
jest.mock('reactflow', () => ({
  ReactFlow: ({ children }) => children,
  Controls: () => null,
  Background: () => null,
  MiniMap: () => null,
  useNodesState: () => [[], jest.fn(), jest.fn()],
  useEdgesState: () => [[], jest.fn(), jest.fn()],
  addEdge: jest.fn(),
  MarkerType: {
    Arrow: 'arrow',
  },
}));

// Mock SSE (Server-Sent Events)
global.EventSource = jest.fn().mockImplementation(() => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  close: jest.fn(),
}));

// Mock console errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
