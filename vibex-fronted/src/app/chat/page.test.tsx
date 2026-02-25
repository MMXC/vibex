import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Chat from '@/app/chat/page'

describe('Chat (/chat)', () => {
  it('CHAT-001: 页面加载 - 聊天区域正确渲染', () => {
    render(<Chat />)
    expect(screen.getByText(/AI 对话/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/输入消息/i)).toBeInTheDocument()
  })

  it('CHAT-002: 发送用户消息 - 消息出现在对话流中', async () => {
    render(<Chat />)
    const input = screen.getByPlaceholderText(/输入消息/i)
    const sendButton = screen.getByRole('button', { name: /发送/i })

    fireEvent.change(input, { target: { value: '你好' } })
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(screen.getByText('你好')).toBeInTheDocument()
    })
  })

  it('CHAT-004: Agent切换 - 对话上下文正确更新', () => {
    render(<Chat />)
    const agentSelect = screen.getByRole('combobox')
    fireEvent.change(agentSelect, { target: { value: 'coder' } })
    expect(screen.getAllByText(/Coder Agent/i).length).toBeGreaterThan(0)
  })

  it('CHAT-005: Agent列表展示', () => {
    render(<Chat />)
    expect(screen.getAllByText(/General Agent/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Coder Agent/i).length).toBeGreaterThan(0)
  })
})
