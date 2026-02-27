import { render, screen, fireEvent } from '@testing-library/react'
import Auth from '@/app/auth/page'

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
    expect(screen.getByText('开始你的 AI 构建之旅')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('输入用户名')).toBeInTheDocument()
  })

  it('AUTH-006: 注册表单 - 包含用户名输入框', () => {
    render(<Auth />)
    // 切换到注册模式
    fireEvent.click(screen.getByText('立即注册'))
    expect(screen.getByPlaceholderText('输入用户名')).toBeInTheDocument()
  })

  it('AUTH-007: 注册表单 - 包含注册按钮', () => {
    render(<Auth />)
    fireEvent.click(screen.getByText('立即注册'))
    expect(screen.getByRole('button', { name: '注册' })).toBeInTheDocument()
  })

  it('AUTH-008: 注册表单 - 包含登录链接', () => {
    render(<Auth />)
    fireEvent.click(screen.getByText('立即注册'))
    expect(screen.getByText('立即登录')).toBeInTheDocument()
  })

  it('AUTH-009: 切换回登录 - 点击登录按钮', () => {
    render(<Auth />)
    // 先切换到注册
    fireEvent.click(screen.getByText('立即注册'))
    // 再切换回登录
    fireEvent.click(screen.getByText('立即登录'))
    // 验证回到登录模式
    expect(screen.getByText('欢迎回来')).toBeInTheDocument()
  })

  it('AUTH-010: 表单输入 - 输入邮箱', () => {
    render(<Auth />)
    const emailInput = screen.getByPlaceholderText('name@example.com')
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    expect(emailInput).toHaveValue('test@example.com')
  })

  it('AUTH-011: 表单输入 - 输入密码', () => {
    render(<Auth />)
    const passwordInput = screen.getByPlaceholderText('••••••••')
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    expect(passwordInput).toHaveValue('password123')
  })

  it('AUTH-012: 表单输入 - 输入用户名（注册模式）', () => {
    render(<Auth />)
    fireEvent.click(screen.getByText('立即注册'))
    const nameInput = screen.getByPlaceholderText('输入用户名')
    fireEvent.change(nameInput, { target: { value: 'testuser' } })
    expect(nameInput).toHaveValue('testuser')
  })

  it('AUTH-013: 返回首页链接存在', () => {
    render(<Auth />)
    expect(screen.getByText('← 返回首页')).toBeInTheDocument()
  })

  it('AUTH-014: 表单提交 - 登录', () => {
    render(<Auth />)
    const emailInput = screen.getByPlaceholderText('name@example.com')
    const passwordInput = screen.getByPlaceholderText('••••••••')
    const submitButton = screen.getByRole('button', { name: '登录' })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.submit(submitButton)
    
    // 表单提交不应抛出错误
    expect(submitButton).toBeInTheDocument()
  })

  it('AUTH-15: 表单提交 - 注册', () => {
    render(<Auth />)
    // 切换到注册
    fireEvent.click(screen.getByText('立即注册'))
    
    const nameInput = screen.getByPlaceholderText('输入用户名')
    const emailInput = screen.getByPlaceholderText('name@example.com')
    const passwordInput = screen.getByPlaceholderText('••••••••')
    const submitButton = screen.getByRole('button', { name: '注册' })
    
    fireEvent.change(nameInput, { target: { value: 'testuser' } })
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.submit(submitButton)
    
    // 表单提交不应抛出错误
    expect(submitButton).toBeInTheDocument()
  })
})
