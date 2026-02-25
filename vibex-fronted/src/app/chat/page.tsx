'use client'

import { useState } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Agent {
  id: string
  name: string
}

const agents: Agent[] = [
  { id: 'general', name: 'General Agent' },
  { id: 'coder', name: 'Coder Agent' },
  { id: 'designer', name: 'Designer Agent' },
]

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [selectedAgent, setSelectedAgent] = useState('general')
  const [isSending, setIsSending] = useState(false)

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsSending(true)

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `收到消息: ${userMessage.content}. 这是 AI 的回复 (${selectedAgent})`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])
      setIsSending(false)
    }, 1000)
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Agent Sidebar */}
      <aside
        style={{
          width: '240px',
          borderRight: '1px solid #e5e5e5',
          padding: '16px',
          backgroundColor: '#fafafa',
        }}
      >
        <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>Agent 列表</h2>
        <select
          value={selectedAgent}
          onChange={(e) => setSelectedAgent(e.target.value)}
          role="combobox"
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '6px',
            border: '1px solid #ddd',
          }}
        >
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>
      </aside>

      {/* Chat Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #e5e5e5',
          }}
        >
          <h1 style={{ fontSize: '20px', fontWeight: '600' }}>AI 对话</h1>
          <p style={{ color: '#666', fontSize: '14px' }}>
            当前 Agent: {agents.find((a) => a.id === selectedAgent)?.name}
          </p>
        </header>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            padding: '24px',
            overflowY: 'auto',
          }}
        >
          {messages.length === 0 && (
            <div style={{ color: '#999', textAlign: 'center', marginTop: '40px' }}>
              暂无消息，开始对话吧
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                marginBottom: '16px',
                textAlign: msg.role === 'user' ? 'right' : 'left',
              }}
            >
              <div
                style={{
                  display: 'inline-block',
                  maxWidth: '70%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  backgroundColor: msg.role === 'user' ? '#0070f3' : '#f0f0f0',
                  color: msg.role === 'user' ? 'white' : 'inherit',
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e5e5e5',
            display: 'flex',
            gap: '12px',
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="输入消息..."
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '14px',
            }}
          />
          <button
            onClick={handleSend}
            disabled={isSending}
            style={{
              padding: '12px 24px',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isSending ? 'not-allowed' : 'pointer',
              opacity: isSending ? 0.6 : 1,
            }}
          >
            {isSending ? '发送中...' : '发送'}
          </button>
        </div>
      </main>
    </div>
  )
}
