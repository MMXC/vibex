import { render, screen, fireEvent } from '@testing-library/react'
import Auth from '@/app/auth/page'

// Mock router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}))

// Mock api service
jest.mock('@/services/api', () => ({
  apiService: {
    login: jest.fn().mockResolvedValue({ token: 'test' }),
    register: jest.fn().mockResolvedValue({ id: '1' }),
  }
}))

describe('Auth (/auth)', () => {
  it('renders page', () => {
    render(<Auth />)
  })

  it('renders login text', () => {
    render(<Auth />)
    expect(screen.getAllByText(/登录/)[0]).toBeInTheDocument()
  })

  it('toggles to register', () => {
    render(<Auth />)
    const switchBtn = screen.getByText(/注册/)
    fireEvent.click(switchBtn)
  })
})
