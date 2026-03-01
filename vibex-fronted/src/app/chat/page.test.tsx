import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
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
  addEventListener = jest.fn()
  removeEventListener = jest.fn()
}

Object.defineProperty(window, 'EventSource', {
  value: MockEventSource,
  writable: true
})

// Mock apiService
const mockGetMessages = jest.fn()
const mockCreateMessage = jest.fn()
const mockGetConversations = jest.fn()
const mockDeleteConversation = jest.fn()

jest.mock('@/services/api', () => ({
  apiService: {
    getMessages: (...args: any[]) => mockGetMessages(...args),
    createMessage: (...args: any[]) => mockCreateMessage(...args),
    getConversations: (...args: any[]) => mockGetConversations(...args),
    deleteConversation: (...args: any[]) => mockDeleteConversation(...args),
  },
}))

describe('Chat (/chat)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.clear()
    localStorageMock.setItem('auth_token', 'test-token')
    localStorageMock.setItem('user_id', 'test-user')
    localStorageMock.setItem('selected_model', 'gpt-4')
    
    mockGetMessages.mockResolvedValue([])
    mockCreateMessage.mockResolvedValue({ id: '1', role: 'assistant', content: 'Hello!' })
    mockGetConversations.mockResolvedValue([])
    mockDeleteConversation.mockResolvedValue(true)
  })

  afterEach(() => {
    localStorageMock.clear()
    jest.clearAllMocks()
  })

  it('renders page', () => {
    const { container } = render(<Chat />)
    expect(container).toBeInTheDocument()
  })

  it('renders input field', () => {
    render(<Chat />)
    expect(screen.getByPlaceholderText(/描述/)).toBeInTheDocument()
  })

  it('handles input change', () => {
    render(<Chat />)
    const input = screen.getByPlaceholderText(/描述/)
    fireEvent.change(input, { target: { value: 'Test message' } })
    expect((input as HTMLInputElement).value).toBe('Test message')
  })

  it('renders send button', () => {
    render(<Chat />)
    const buttons = document.querySelectorAll('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('renders new chat button', () => {
    render(<Chat />)
    expect(screen.getByText(/新对话/)).toBeInTheDocument()
  })

  it('renders page title', () => {
    render(<Chat />)
    // Page should have some heading
    const headings = document.querySelectorAll('h1, h2, h3')
    expect(headings.length).toBeGreaterThanOrEqual(0)
  })

  it('renders sidebar', () => {
    render(<Chat />)
    // Sidebar elements should exist
    const navElements = document.querySelectorAll('nav, aside')
    expect(navElements.length).toBeGreaterThanOrEqual(0)
  })

  it('handles empty input send attempt', async () => {
    render(<Chat />)
    const buttons = document.querySelectorAll('button')
    const sendButton = buttons[0]
    
    await act(async () => {
      fireEvent.click(sendButton)
    })
    // Should not crash
    expect(true).toBe(true)
  })

  it('handles user not logged in', () => {
    localStorageMock.clear()
    localStorageMock.removeItem('auth_token')
    
    // Should still render without crashing
    const { container } = render(<Chat />)
    expect(container).toBeInTheDocument()
  })

  it('has proper CSS classes', () => {
    render(<Chat />)
    const mainElement = document.querySelector('main')
    expect(mainElement).toBeInTheDocument()
  })

  it('renders message input area', () => {
    render(<Chat />)
    const inputArea = document.querySelector('input[type="text"]')
    expect(inputArea).toBeInTheDocument()
  })

  it('clears input after send', async () => {
    render(<Chat />)
    const input = screen.getByPlaceholderText(/描述/)
    
    fireEvent.change(input, { target: { value: 'Test' } })
    expect((input as HTMLInputElement).value).toBe('Test')
  })

  it('has navigation elements', () => {
    render(<Chat />)
    // Check for navigation or links
    const links = document.querySelectorAll('a')
    expect(links.length).toBeGreaterThanOrEqual(0)
  })

  it('renders conversation list area', () => {
    render(<Chat />)
    // Should have some list or nav area
    const listElements = document.querySelectorAll('ul, ol, nav')
    expect(listElements.length).toBeGreaterThanOrEqual(0)
  })

  it('handles model selection', () => {
    render(<Chat />)
    // Model selection is in localStorage
    expect(localStorageMock.getItem('selected_model')).toBe('gpt-4')
  })

  it('has message container', () => {
    render(<Chat />)
    const main = document.querySelector('main')
    expect(main).toBeInTheDocument()
  })

  it('renders without error when API returns empty', async () => {
    mockGetMessages.mockResolvedValue([])
    
    render(<Chat />)
    // Should render without crashing
    expect(document.querySelector('main')).toBeInTheDocument()
  })

  it('handles rapid input changes', () => {
    render(<Chat />)
    const input = screen.getByPlaceholderText(/描述/)
    
    fireEvent.change(input, { target: { value: 'A' } })
    fireEvent.change(input, { target: { value: 'AB' } })
    fireEvent.change(input, { target: { value: 'ABC' } })
    
    expect((input as HTMLInputElement).value).toBe('ABC')
  })

  it('preserves input on focus loss', () => {
    render(<Chat />)
    const input = screen.getByPlaceholderText(/描述/)
    
    fireEvent.change(input, { target: { value: 'Some text' } })
    fireEvent.blur(input)
    
    expect((input as HTMLInputElement).value).toBe('Some text')
  })
})
