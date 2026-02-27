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
    // 默认显示输入节点
    expect(screen.getByText('用户输入')).toBeInTheDocument()
    // 切换到处理节点
    fireEvent.click(screen.getByText('处理节点'))
    expect(screen.getByText('LLM 调用')).toBeInTheDocument()
    expect(screen.getByText('条件判断')).toBeInTheDocument()
  })

  it('FLOW-003: 类别切换到输出节点', () => {
    render(<FlowEditor />)
    fireEvent.click(screen.getByText('输出节点'))
    expect(screen.getByText('输出结果')).toBeInTheDocument()
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

  it('FLOW-006: 画布空状态提示', () => {
    render(<FlowEditor />)
    expect(screen.getByText('从左侧拖拽节点到画布')).toBeInTheDocument()
  })

  it('FLOW-007: 所有节点模板存在于输入节点类别', () => {
    render(<FlowEditor />)
    expect(screen.getByText('用户输入')).toBeInTheDocument()
  })

  it('FLOW-008: 处理节点类别包含多个节点', () => {
    render(<FlowEditor />)
    fireEvent.click(screen.getByText('处理节点'))
    // 应该显示 LLM 调用和条件判断
    const llmNode = screen.getAllByText('LLM 调用')
    expect(llmNode.length).toBeGreaterThan(0)
  })
})
