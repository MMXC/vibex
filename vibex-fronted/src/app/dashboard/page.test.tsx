import { render, screen } from '@testing-library/react'
import Dashboard from '@/app/dashboard/page'

// Mock apiService
jest.mock('@/services/api', () => ({
  apiService: {
    getProjects: jest.fn(() => Promise.resolve([
      {
        id: '1',
        name: 'VibeX Playground',
        description: 'AI Agent Flow Builder',
        userId: 'user-1',
      },
    ])),
    logout: jest.fn(() => Promise.resolve({ success: true })),
  },
}))

// Mock router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

describe('Dashboard (/dashboard)', () => {
  // Test the static elements that don't require async data
  it('DASH-001: 页面渲染 - 基础结构存在', () => {
    render(<Dashboard />)
    // Just verify the component renders without error
    expect(document.querySelector('.page')).toBeInTheDocument()
  })
})