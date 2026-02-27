import { render, screen, fireEvent } from '@testing-library/react'
import Editor from '@/app/editor/page'

describe('Editor (/editor)', () => {
  it('EDIT-001: 页面加载 - 编辑器各区域正确渲染', () => {
    render(<Editor />)
    expect(screen.getByText('VibeX')).toBeInTheDocument()
    expect(screen.getByText('页面编辑器')).toBeInTheDocument()
    expect(screen.getByText('组件')).toBeInTheDocument()
    expect(screen.getByText('图层')).toBeInTheDocument()
    expect(screen.getByText('设置')).toBeInTheDocument()
  })

  it('EDIT-002: Tab 切换 - 切换到图层面板', () => {
    render(<Editor />)
    // 默认显示组件面板
    expect(screen.getByText('文本')).toBeInTheDocument()
    // 切换到图层
    fireEvent.click(screen.getByText('图层'))
    expect(screen.getByText('导航栏')).toBeInTheDocument()
  })

  it('EDIT-003: Tab 切换 - 切换到设置面板', () => {
    render(<Editor />)
    fireEvent.click(screen.getByText('设置'))
    expect(screen.getByDisplayValue('我的页面')).toBeInTheDocument()
  })

  it('EDIT-004: 添加组件 - 点击组件添加到画布', () => {
    render(<Editor />)
    // 初始有 5 个组件
    const buttons = screen.getAllByText('按钮')
    // 点击添加按钮组件
    fireEvent.click(buttons[0])
    // 验证添加成功（按钮文本存在）
    const buttonTexts = screen.getAllByText('按钮')
    expect(buttonTexts.length).toBeGreaterThan(1)
  })

  it('EDIT-005: 选择组件 - 点击图层选中组件', () => {
    render(<Editor />)
    // 切换到图层面板
    fireEvent.click(screen.getByText('图层'))
    // 点击选择导航栏
    fireEvent.click(screen.getByText('导航栏'))
    // 验证属性面板显示
    expect(screen.getByDisplayValue('导航栏')).toBeInTheDocument()
  })

  it('EDIT-006: 图层列表显示所有组件', () => {
    render(<Editor />)
    // 切换到图层面板
    fireEvent.click(screen.getByText('图层'))
    // 验证所有组件都显示在图层列表中
    expect(screen.getByText('导航栏')).toBeInTheDocument()
    expect(screen.getByText('标题文本')).toBeInTheDocument()
    expect(screen.getByText('正文文本')).toBeInTheDocument()
    expect(screen.getByText('按钮')).toBeInTheDocument()
    expect(screen.getByText('卡片')).toBeInTheDocument()
  })

  it('EDIT-007: 组件分类 - 基础组件分类显示', () => {
    render(<Editor />)
    expect(screen.getByText('基础')).toBeInTheDocument()
    expect(screen.getByText('表单')).toBeInTheDocument()
    expect(screen.getByText('布局')).toBeInTheDocument()
    expect(screen.getByText('导航')).toBeInTheDocument()
    expect(screen.getByText('反馈')).toBeInTheDocument()
  })

  it('EDIT-008: 画布组件渲染 - 显示导航栏组件', () => {
    render(<Editor />)
    // 初始有导航栏组件
    expect(screen.getByText('首页')).toBeInTheDocument()
    expect(screen.getByText('关于')).toBeInTheDocument()
    expect(screen.getByText('产品')).toBeInTheDocument()
    expect(screen.getByText('联系')).toBeInTheDocument()
  })

  it('EDIT-009: 画布组件渲染 - 显示卡片组件', () => {
    render(<Editor />)
    expect(screen.getByText('特性一')).toBeInTheDocument()
  })

  it('EDIT-010: 属性面板 - 未选择组件时显示提示', () => {
    render(<Editor />)
    // 默认没有选中组件
    expect(screen.getByText('选择一个组件查看属性')).toBeInTheDocument()
  })

  it('EDIT-011: 编辑组件属性 - 修改组件名称', () => {
    render(<Editor />)
    // 切换到图层面板
    fireEvent.click(screen.getByText('图层'))
    // 选择导航栏
    fireEvent.click(screen.getByText('导航栏'))
    // 修改名称
    const nameInput = screen.getByDisplayValue('导航栏')
    fireEvent.change(nameInput, { target: { value: '新的导航栏' } })
    // 验证图层列表更新
    expect(screen.getByText('新的导航栏')).toBeInTheDocument()
  })

  it('EDIT-012: 工具栏按钮存在', () => {
    render(<Editor />)
    expect(screen.getByText('👁️ 预览')).toBeInTheDocument()
    expect(screen.getByText('💾 保存')).toBeInTheDocument()
  })

  it('EDIT-013: 未保存状态显示', () => {
    render(<Editor />)
    expect(screen.getByText('未保存')).toBeInTheDocument()
  })

  it('EDIT-014: 按钮组件显示', () => {
    render(<Editor />)
    expect(screen.getByText('立即开始')).toBeInTheDocument()
  })

  it('EDIT-015: 正文文本显示', () => {
    render(<Editor />)
    expect(screen.getByText('这是一个使用 VibeX 构建的现代网站。')).toBeInTheDocument()
  })
})
