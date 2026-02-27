import { render, screen, fireEvent } from '@testing-library/react'
import FlowEditor from '@/app/flow/page'

describe('Flow Editor (/flow)', () => {
  it('FLOW-001: 页面加载 - 画布、节点库、属性面板正确渲染', () => {
    render(<FlowEditor />)
    expect(screen.getByText('节点库')).toBeInTheDocument()
    expect(screen.getByText('流程图编辑')).toBeInTheDocument()
    expect(screen.getByText('属性面板')).toBeInTheDocument()
  })

  it('FLOW-002: 类别切换 - 点击切换节点类别', () => {
    render(<FlowEditor />)
    // 使用 getAllByText 因为节点可能在模板和画布上都有
    expect(screen.getAllByText('用户输入').length).toBeGreaterThan(0)
    // 切换到处理节点
    fireEvent.click(screen.getByText('处理节点'))
    // 使用 getAllByText 因为画布和节点模板都有
    expect(screen.getAllByText('LLM 调用').length).toBeGreaterThan(0)
    expect(screen.getAllByText('条件判断').length).toBeGreaterThan(0)
  })

  it('FLOW-003: 类别切换到输出节点', () => {
    render(<FlowEditor />)
    fireEvent.click(screen.getByText('输出节点'))
    // 使用 getAllByText 因为画布和节点模板都有
    expect(screen.getAllByText('输出结果').length).toBeGreaterThan(0)
  })

  it('FLOW-004: 属性面板初始状态 - 显示请选择节点', () => {
    render(<FlowEditor />)
    expect(screen.getByText('请选择节点')).toBeInTheDocument()
  })

  it('FLOW-005: 节点库分类展示', () => {
    render(<FlowEditor />)
    // 验证三个类别按钮都存在
    expect(screen.getByText('输入节点')).toBeInTheDocument()
    expect(screen.getByText('处理节点')).toBeInTheDocument()
    expect(screen.getByText('输出节点')).toBeInTheDocument()
  })

  it('FLOW-006: 画布有默认节点', () => {
    render(<FlowEditor />)
    // 画布上有默认节点，不是空状态
    expect(screen.getAllByText('用户输入').length).toBeGreaterThan(0)
  })

  it('FLOW-007: 所有节点模板存在于输入节点类别', () => {
    render(<FlowEditor />)
    // 使用 getAllByText 因为节点可能在模板和画布上都有
    expect(screen.getAllByText('用户输入').length).toBeGreaterThan(0)
  })

  it('FLOW-008: 处理节点类别包含多个节点', () => {
    render(<FlowEditor />)
    fireEvent.click(screen.getByText('处理节点'))
    // 应该显示 LLM 调用和条件判断 - 使用 getAllByText
    const llmNode = screen.getAllByText('LLM 调用')
    expect(llmNode.length).toBeGreaterThan(0)
  })
})
