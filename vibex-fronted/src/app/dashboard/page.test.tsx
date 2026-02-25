import { render, screen } from '@testing-library/react'
import Dashboard from '@/app/dashboard/page'

describe('Dashboard (/dashboard)', () => {
  it('DASH-001: 页面加载 - 项目列表区域正确渲染', () => {
    render(<Dashboard />)
    expect(screen.getByText(/我的项目/i)).toBeInTheDocument()
  })

  it('DASH-003: 项目卡片展示 - 显示项目名称', () => {
    render(<Dashboard />)
    expect(screen.getByText('VibeX Playground')).toBeInTheDocument()
  })

  it('DASH-004: 点击项目进入 - 跳转链接存在', () => {
    render(<Dashboard />)
    const projectLink = screen.getByRole('link', { name: /vibex playground/i })
    expect(projectLink).toHaveAttribute('href', '/chat')
  })
})
