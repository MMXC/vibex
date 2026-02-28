import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Chat from '@/app/chat/page'

// Mock apiService
jest.mock('@/services/api', () => ({
  apiService: {
    getMessages: jest.fn(() => Promise.resolve([])),
    createMessage: jest.fn(() => Promise.resolve({ id: '1', role: 'assistant', content: 'Hello!', projectId: '1' })),
  },
}))

describe('Chat (/chat)', () => {
  it('CHAT-001: 页面加载 - 聊天区域正确渲染', () => {
    render(<Chat />)
    expect(screen.getByText(/AI 对话/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/描述你想要创建的内容/i)).toBeInTheDocument()
  })

  it('CHAT-005: Agent列表展示', () => {
    render(<Chat />)
    expect(screen.getAllByText(/General Agent/i).length).toBeGreaterThan(0)
  })
})
