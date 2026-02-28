import '@testing-library/jest-dom'

// Mock window.scrollIntoView
Object.defineProperty(window, 'scrollIntoView', {
  writable: true,
  value: jest.fn(),
})

// Mock Element.prototype.scrollIntoView
if (typeof Element !== 'undefined') {
  Element.prototype.scrollIntoView = jest.fn()
}

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
})

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
}))

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })
