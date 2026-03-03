'use client'

import { useState, useRef, useEffect } from 'react'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface AIChatPanelProps {
  messages: ChatMessage[]
  onSendMessage: (message: string) => Promise<void>
  onClear?: () => void
  isLoading?: boolean
  disabled?: boolean
}

export default function AIChatPanel({
  messages,
  onSendMessage,
  onClear,
  isLoading = false,
  disabled = false,
}: AIChatPanelProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const message = input.trim()
    if (!message || isLoading || disabled) return

    setInput('')
    
    try {
      await onSendMessage(message)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'rgba(30, 30, 46, 0.95)',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>🤖</span>
          <span style={{ fontWeight: 600, color: '#fff' }}>AI 助手</span>
        </div>
        {onClear && messages.length > 0 && (
          <button
            onClick={onClear}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.5)',
              cursor: 'pointer',
              fontSize: '12px',
              padding: '4px 8px',
              borderRadius: '4px',
            }}
          >
            🗑️ 清空
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.5)',
            padding: '40px 20px',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>💬</div>
            <p>开始与 AI 助手对话，</p>
            <p>描述您想要的图表修改</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
                gap: '4px',
              }}
            >
              <div
                style={{
                  maxWidth: '80%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: message.role === 'user'
                    ? 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)'
                    : 'rgba(255, 255, 255, 0.1)',
                  color: message.role === 'user' ? '#1a1a2e' : '#fff',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {message.content}
              </div>
              <span style={{
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.4)',
              }}>
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
          ))
        )}
        
        {isLoading && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '14px',
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#4ade80',
              animation: 'pulse 1s infinite',
            }} />
            AI 正在思考...
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          gap: '8px',
        }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? '等待中...' : '描述您的修改需求...'}
          disabled={disabled || isLoading}
          rows={1}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            background: 'rgba(255, 255, 255, 0.05)',
            color: '#fff',
            fontSize: '14px',
            resize: 'none',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading || disabled}
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            border: 'none',
            background: input.trim() && !isLoading && !disabled
              ? 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)'
              : 'rgba(255, 255, 255, 0.1)',
            color: input.trim() && !isLoading && !disabled ? '#1a1a2e' : 'rgba(255, 255, 255, 0.4)',
            fontWeight: 600,
            cursor: input.trim() && !isLoading && !disabled ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
          }}
        >
          ➤
        </button>
      </form>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
