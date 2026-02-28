import { render, screen, fireEvent, act } from '@testing-library/react'
import Chat from '@/app/chat/page'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} }
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock EventSource
class MockEventSource {
  readyState = 1
  onmessage = null
  onerror = null
  close = jest.fn()
}

// Mock apiService
jest.mock('@/services/api', () => ({
  apiService: {
    getMessages: jest.fn().mockResolvedValue([]),
    createMessage: jest.fn().mockResolvedValue({ id: '1', role: 'assistant', content: 'Hello!' }),
    getConversations: jest.fn().mockResolvedValue([]),
    deleteConversation: jest.fn().mockResolvedValue(true),
  },
}))

describe('Chat (/chat)', () => {
  beforeEach(() => {
    localStorageMock.setItem('auth_token', 'test-token')
    localStorageMock.setItem('user_id', 'test-user')
    localStorageMock.setItem('selected_model', 'gpt-4')
    global.EventSource = MockEventSource as any
  })

  afterEach(() => {
    localStorageMock.clear()
    jest.clearAllMocks()
  })

  it('renders page', () => {
    render(<Chat />)
  })

  it('renders input', () => {
    render(<Chat />)
    expect(screen.getByPlaceholderText(/描述/)).toBeInTheDocument()
  })

  it('handles input', () => {
    render(<Chat />)
    const input = screen.getByPlaceholderText(/描述/)
    fireEvent.change(input, { target: { value: 'Test' } })
  })

  it('sends message', async () => {
    render(<Chat />)
    const input = screen.getByPlaceholderText(/描述/)
    fireEvent.change(input, { target: { value: 'Test' } })
    const button = screen.getAllByRole('button')[0]
    await act(async () => {
      fireEvent.click(button)
    })
  })

  it('handles empty input', async () => {
    render(<Chat />)
    const button = screen.getAllByRole('button')[0]
    await act(async () => {
      fireEvent.click(button)
    })
  })
})
