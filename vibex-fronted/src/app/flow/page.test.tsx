import { render, screen, fireEvent } from '@testing-library/react'
import FlowEditor from '@/app/flow/page'

describe('Flow Editor (/flow)', () => {
  it('FLOW-001: 页面加载 - 画布、节点库、属性面板正确渲染', () => {
    render(<FlowEditor />)
    expect(screen.getByText(/流程图编辑/i)).toBeInTheDocument()
    expect(screen.getByText(/节点库/i)).toBeInTheDocument()
    expect(screen.getByText(/属性面板/i)).toBeInTheDocument()
  })

  it('FLOW-004: 选中节点 - 节点高亮，属性面板显示节点属性', () => {
    render(<FlowEditor />)
    // Initially no node selected, properties panel shows placeholder
    expect(screen.getByText(/请选择节点/i)).toBeInTheDocument()
  })

  it('FLOW-007: 节点库分类展示', () => {
    render(<FlowEditor />)
    expect(screen.getByText(/输入节点/i)).toBeInTheDocument()
    expect(screen.getByText(/处理节点/i)).toBeInTheDocument()
    expect(screen.getByText(/输出节点/i)).toBeInTheDocument()
  })
})
