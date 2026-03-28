import '@testing-library/jest-dom';

// Mock axios with proper AxiosError
jest.mock('axios', () => {
  class MockAxiosError extends Error {
    code?: string;
    response?: { status?: number };
    isAxiosError: boolean = true;
    config: any = {};
    request: any = {};

    constructor(
      message: string,
      code?: string,
      config?: any,
      response?: { status?: number }
    ) {
      super(message);
      this.name = 'AxiosError';
      this.code = code;
      this.config = config;
      this.response = response;
    }
  }

  return {
    __esModule: true,
    AxiosError: MockAxiosError,
    default: {
      create: jest.fn(() => ({
        interceptors: {
          request: { use: jest.fn(() => ({ eject: jest.fn() })) },
          response: { use: jest.fn(() => ({ eject: jest.fn() })) },
        },
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
      })),
    },
    create: jest.fn(() => ({
      interceptors: {
        request: { use: jest.fn(() => ({ eject: jest.fn() })) },
        response: { use: jest.fn(() => ({ eject: jest.fn() })) },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    })),
  };
});

// Mock window.scrollIntoView
Object.defineProperty(window, 'scrollIntoView', {
  writable: true,
  value: jest.fn(),
});

// Mock Element.prototype.scrollIntoView
if (typeof Element !== 'undefined') {
  Element.prototype.scrollIntoView = jest.fn();
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
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

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/test',
  useSearchParams: () => new URLSearchParams(),
  Router: {
    events: null,
  },
}));

// Mock localStorage - 完整实现
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: jest.fn((i: number) => Object.keys(store)[i] || null),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock react-resizable-panels for Jest
jest.mock('react-resizable-panels', () => {
  const React = require('react');
  return {
    Group: (props: any) => React.createElement('div', { 'data-testid': 'panel-group', ...props }, props.children),
    Panel: (props: any) => React.createElement('div', { 'data-testid': 'panel', ...props }, props.children),
    Separator: (props: any) => React.createElement('div', { 'data-testid': 'panel-resize-handle', ...props }),
    ImperativePanelGroupHandle: {},
    ImperativePanelHandle: {},
  };
});

// Mock ResizeObserver (not available in jsdom by default — used by ComponentGroupOverlay)
class MockResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}
(global as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver = MockResizeObserver;
