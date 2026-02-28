import { render, screen, waitFor } from '@testing-library/react'
import Dashboard from '@/app/dashboard/page'

// Mock router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}))

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    clear: () => { store = {} }
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock api service
jest.mock('@/services/api', () => ({
  apiService: {
    getProjects: jest.fn().mockResolvedValue([
      { id: '1', name: 'Project 1', description: 'Description 1', updatedAt: new Date().toISOString() }
    ]),
    createProject: jest.fn().mockResolvedValue({ id: '1' }),
  },
}))

describe('Dashboard (/dashboard)', () => {
  beforeEach(() => {
    localStorageMock.setItem('auth_token', 'test-token')
    localStorageMock.setItem('user_id', 'test-user')
  })

  afterEach(() => {
    localStorageMock.clear()
  })

  it('renders page', () => {
    render(<Dashboard />)
  })

  it('displays projects', async () => {
    render(<Dashboard />)
  })
})
