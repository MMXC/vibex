/**
 * Vitest Setup — replaces jest.setup.ts / jest.setup.js for Vitest compatibility
 *
 * This file provides Jest-compatible globals (jest.fn, jest.mock, etc.)
 * so existing test files can run in Vitest without modification.
 */
import { vi } from 'vitest'
import '@testing-library/jest-dom'

// Make jest globals available via vitest compatibility layer
// Vitest automatically provides `jest` as an alias to `vi` in Jest compatibility mode
// But we need to ensure test files using `jest.fn()` still work

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock Element.scrollIntoView
Element.prototype.scrollIntoView = vi.fn()

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
  useParams: () => ({}),
}))

// Mock next/image
vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    return null; // next/image mock
  },
}))

// Mock axios
vi.mock('axios', () => {
  class MockAxiosError extends Error {
    code?: string
    response?: { status?: number }
    isAxiosError = true
    config: any = {}
    request: any = {}

    constructor(message: string, code?: string, config?: any, response?: { status?: number }) {
      super(message)
      this.name = 'AxiosError'
      this.code = code
      this.config = config
      this.response = response
    }
  }

  return {
    __esModule: true,
    AxiosError: MockAxiosError,
    default: {
      create: vi.fn(() => ({
        interceptors: {
          request: { use: vi.fn(), eject: vi.fn() },
          response: { use: vi.fn(), eject: vi.fn() },
        },
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        patch: vi.fn(),
        request: vi.fn(),
      })),
      interceptors: {
        request: { use: vi.fn(), eject: vi.fn() },
        response: { use: vi.fn(), eject: vi.fn() },
      },
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn(),
      request: vi.fn(),
    },
  }
})

// Mock crypto for secure random
const mockCrypto = {
  getRandomValues: vi.fn((arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256)
    return arr
  }),
}
vi.stubGlobal('crypto', mockCrypto)

// Suppress console errors in tests unless in DEBUG mode
if (!process.env.DEBUG) {
  vi.spyOn(console, 'error').mockImplementation(() => {})
}
