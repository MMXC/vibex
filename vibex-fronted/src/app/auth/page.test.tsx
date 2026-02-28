import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Auth from '@/app/auth/page'

// Mock apiService
jest.mock('@/services/api', () => ({
  apiService: {
    login: jest.fn(() => Promise.resolve({ token: 'test-token', user: { id: '1', name: 'Test', email: 'test@example.com' } })),
    register: jest.fn(() => Promise.resolve({ token: 'test-token', user: { id: '1', name: 'Test', email: 'test@example.com' } })),
  },
}))

describe('Auth (/auth)', () => {
  it('AUTH-001: 登录页面 - 默认显示登录表单', () => {
    render(<Auth />)
    expect(screen.getByText('欢迎回来')).toBeInTheDocument()
    expect(screen.getByText('登录你的 VibeX 账号')).toBeInTheDocument()
  })

  it('AUTH-002: 登录表单 - 包含邮箱和密码输入框', () => {
    render(<Auth />)
    expect(screen.getByPlaceholderText('name@example.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
  })

  it('AUTH-003: 登录表单 - 包含登录按钮', () => {
    render(<Auth />)
    expect(screen.getByRole('button', { name: '登录' })).toBeInTheDocument()
  })

  it('AUTH-004: 登录表单 - 包含注册链接', () => {
    render(<Auth />)
    expect(screen.getByText('立即注册')).toBeInTheDocument()
  })

  it('AUTH-005: 切换到注册 - 点击注册按钮', () => {
    render(<Auth />)
    fireEvent.click(screen.getByText('立即注册'))
    // 验证表单切换到注册模式
    expect(screen.getByText('创建账号')).toBeInTheDocument()
  })
})
