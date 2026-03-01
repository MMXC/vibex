import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Auth from '@/app/auth/page'

// Mock router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

// Mock api service
const mockLogin = jest.fn().mockResolvedValue({ token: 'test-token', user: { id: '1' } })
const mockRegister = jest.fn().mockResolvedValue({ id: '1' })
jest.mock('@/services/api', () => ({
  apiService: {
    login: (...args: any[]) => mockLogin(...args),
    register: (...args: any[]) => mockRegister(...args),
  }
}))

describe('Auth (/auth)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

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
    expect(screen.getByText(/已有账号/)).toBeInTheDocument()
  })

  it('toggles back to login', () => {
    render(<Auth />)
    // First toggle to register
    const switchToRegister = screen.getByText(/注册/)
    fireEvent.click(switchToRegister)
    // Then toggle back to login
    const switchToLogin = screen.getByText(/已有账号/)
    fireEvent.click(switchToLogin)
    expect(screen.getByText(/登录/)).toBeInTheDocument()
  })

  it('handles login success', async () => {
    render(<Auth />)
    const form = document.querySelector('form')
    expect(form).toBeInTheDocument()
    if (form) {
      fireEvent.submit(form)
    }
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled()
    })
  })

  it('handles register success', async () => {
    render(<Auth />)
    // Switch to register
    const switchBtn = screen.getByText(/注册/)
    fireEvent.click(switchBtn)
    // Submit the form
    const form = document.querySelector('form')
    expect(form).toBeInTheDocument()
    if (form) {
      fireEvent.submit(form)
    }
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalled()
    })
  })
})
