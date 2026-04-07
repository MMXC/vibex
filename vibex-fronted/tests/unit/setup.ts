import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Provide jest.* globals as an alias to vi.* for backward compatibility
// with test files that still use Jest syntax (jest.fn, jest.mock, etc.)
// CRITICAL: jest.fn() returned by this wrapper MUST have all vitest mock methods
// (mockResolvedValue, mockReturnValue, etc.) since jest.mock() factories use jest.fn()
const jestFn = vi.fn.bind(vi) as typeof vi.fn & {
  mockResolvedValue: typeof vi.fn.prototype.mockResolvedValue;
  mockReturnValue: typeof vi.fn.prototype.mockReturnValue;
  mockImplementation: typeof vi.fn.prototype.mockImplementation;
  mockResolvedValueOnce: typeof vi.fn.prototype.mockResolvedValueOnce;
  mockReturnValueOnce: typeof vi.fn.prototype.mockReturnValueOnce;
  mockRejectedValue: typeof vi.fn.prototype.mockRejectedValue;
  mockRejectedValueOnce: typeof vi.fn.prototype.mockRejectedValueOnce;
  mockName: typeof vi.fn.prototype.mockName;
  getMockName: typeof vi.fn.prototype.getMockName;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const jestCompat: any = {
  fn: jestFn,
  spyOn: vi.spyOn,
  mock: vi.mock,
  doMock: vi.doMock,
  unmock: vi.unmock,
  clearAllMocks: vi.clearAllMocks,
  resetAllMocks: vi.resetAllMocks,
  restoreAllMocks: vi.restoreAllMocks,
  useFakeTimers: vi.useFakeTimers,
  useRealTimers: vi.useRealTimers,
  runAllTimers: vi.runAllTimers,
  runAllTicks: vi.runAllTicks,
  runOnlyPendingTimers: vi.runOnlyPendingTimers,
  advanceTimersByTime: vi.advanceTimersByTime,
  setSystemTime: vi.setSystemTime,
  mocked: vi.mocked,
  isMockFunction: vi.isMockFunction,
  je: undefined,
};
(global as any).jest = jestCompat;

// Mock axios with proper AxiosError
vi.mock('axios', () => {
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
      interceptors: {
        request: { use: vi.fn(() => ({ eject: vi.fn() })) },
        response: { use: vi.fn(() => ({ eject: vi.fn() })) },
      },
      create: vi.fn(() => ({
        interceptors: {
          request: { use: vi.fn(() => ({ eject: vi.fn() })) },
          response: { use: vi.fn(() => ({ eject: vi.fn() })) },
        },
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
      })),
    },
    create: vi.fn(() => ({
      interceptors: {
        request: { use: vi.fn(() => ({ eject: vi.fn() })) },
        response: { use: vi.fn(() => ({ eject: vi.fn() })) },
      },
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    })),
  };
});

// Mock window.scrollIntoView
Object.defineProperty(window, 'scrollIntoView', {
  writable: true,
  value: vi.fn(),
});

// Mock Element.prototype.scrollIntoView
if (typeof Element !== 'undefined') {
  Element.prototype.scrollIntoView = vi.fn();
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/test',
  useSearchParams: () => new URLSearchParams(),
  Router: {
    events: null,
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((i: number) => Object.keys(store)[i] || null),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock react-resizable-panels
vi.mock('react-resizable-panels', () => {
  const React = require('react');
  return {
    Group: (props: any) => React.createElement('div', { 'data-testid': 'panel-group', ...props }, props.children),
    Panel: (props: any) => React.createElement('div', { 'data-testid': 'panel', ...props }, props.children),
    Separator: (props: any) => React.createElement('div', { 'data-testid': 'panel-resize-handle', ...props }),
    ImperativePanelGroupHandle: {},
    ImperativePanelHandle: {},
  };
});

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
(global as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver = MockResizeObserver;
