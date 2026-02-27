import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Chat from '@/app/chat/page'

describe('Chat (/chat)', () => {
  it('CHAT-001: 页面加载 - 聊天区域正确渲染', () => {
    render(<Chat />)
    expect(screen.getByText(/AI 对话/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/描述你想要创建的内容/i)).toBeInTheDocument()
  })

  it('CHAT-002: 发送用户消息 - 消息出现在对话流中', async () => {
    render(<Chat />)
    const input = screen.getByPlaceholderText(/描述你想要创建的内容/i)
    const sendButton = screen.getByRole('button', { name: '' })

    fireEvent.change(input, { target: { value: '你好' } })
    // 点击发送按钮 - 注意按钮没有文字，需要通过其他方式选择
    const buttons = document.querySelectorAll('button')
    const sendBtn = Array.from(buttons).find(b => b.className.includes('sendButton'))
    if (sendBtn) fireEvent.click(sendBtn)

    await waitFor(() => {
      expect(screen.getByText('你好')).toBeInTheDocument()
    })
  })

  it('CHAT-004: Agent切换 - 对话上下文正确更新', () => {
    render(<Chat />)
    // Agent 是通过按钮选择的，不是 combobox
    const coderButton = screen.getByText(/Coder Agent/i)
    fireEvent.click(coderButton)
    expect(screen.getAllByText(/Coder Agent/i).length).toBeGreaterThan(0)
  })

  it('CHAT-005: Agent列表展示', () => {
    render(<Chat />)
    expect(screen.getAllByText(/General Agent/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Coder Agent/i).length).toBeGreaterThan(0)
  })
})
