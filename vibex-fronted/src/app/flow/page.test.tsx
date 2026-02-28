import { render, screen } from '@testing-library/react'
import FlowEditor from '@/app/flow/page'

describe('Flow (/flow)', () => {
  it('renders page', () => {
    render(<FlowEditor />)
  })

  it('renders nodes', () => {
    render(<FlowEditor />)
    const nodes = screen.getAllByText(/输入/)
    expect(nodes.length).toBeGreaterThan(0)
  })

  it('renders llm node', () => {
    render(<FlowEditor />)
    expect(screen.getByText('LLM 调用')).toBeInTheDocument()
  })

  it('renders categories', () => {
    render(<FlowEditor />)
    expect(screen.getByText('输入节点')).toBeInTheDocument()
  })

  it('handles node click', () => {
    render(<FlowEditor />)
    const node = screen.getByText('LLM 调用')
    node.click()
  })
})
