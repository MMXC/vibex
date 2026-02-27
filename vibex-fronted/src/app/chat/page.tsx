'use client'

import { useState, useRef, useEffect } from 'react'
import styles from './chat.module.css'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Agent {
  id: string
  name: string
  icon: string
}

const agents: Agent[] = [
  { id: 'general', name: 'General Agent', icon: '◈' },
  { id: 'coder', name: 'Coder Agent', icon: '⌘' },
  { id: 'designer', name: 'Designer Agent', icon: '◫' },
]

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [selectedAgent, setSelectedAgent] = useState('general')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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
        content: `收到消息: ${userMessage.content}. 这是 AI 的回复 (${agents.find(a => a.id === selectedAgent)?.name})`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])
      setIsSending(false)
    }, 1500)
  }

  const currentAgent = agents.find(a => a.id === selectedAgent)

  return (
    <div className={styles.page}>
      {/* 背景特效 */}
      <div className={styles.bgEffect}>
        <div className={styles.gridOverlay} />
      </div>

      {/* Agent Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>AI Agents</h2>
        </div>
        
        <div className={styles.agentList}>
          {agents.map((agent) => (
            <button
              key={agent.id}
              className={`${styles.agentItem} ${selectedAgent === agent.id ? styles.active : ''}`}
              onClick={() => setSelectedAgent(agent.id)}
            >
              <span className={styles.agentIcon}>{agent.icon}</span>
              <span className={styles.agentName}>{agent.name}</span>
              {selectedAgent === agent.id && <span className={styles.activeIndicator} />}
            </button>
          ))}
        </div>

        <div className={styles.sidebarFooter}>
          <button className={styles.newChatBtn}>
            <span>+</span>
            <span>新建对话</span>
          </button>
        </div>
      </aside>

      {/* Chat Area */}
      <main className={styles.main}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerInfo}>
            <span className={styles.headerIcon}>{currentAgent?.icon}</span>
            <div>
              <h1 className={styles.headerTitle}>AI 对话</h1>
              <p className={styles.headerSubtitle}>
                当前 Agent: <span className={styles.agentTag}>{currentAgent?.name}</span>
              </p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.headerBtn} title="设置">⚙</button>
            <button className={styles.headerBtn} title="更多">⋯</button>
          </div>
        </header>

        {/* Messages */}
        <div className={styles.messages}>
          {messages.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>◈</div>
              <h3 className={styles.emptyTitle}>开始新对话</h3>
              <p className={styles.emptyDesc}>向 AI 描述你想要创建的应用或功能</p>
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.assistantMessage}`}
            >
              <div className={styles.messageAvatar}>
                {msg.role === 'user' ? 'U' : currentAgent?.icon}
              </div>
              <div className={styles.messageContent}>
                <div className={styles.messageBubble}>
                  {msg.content}
                </div>
                <span className={styles.messageTime}>
                  {msg.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          {isSending && (
            <div className={`${styles.message} ${styles.assistantMessage}`}>
              <div className={styles.messageAvatar}>{currentAgent?.icon}</div>
              <div className={styles.messageContent}>
                <div className={styles.typingIndicator}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className={styles.inputArea}>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="描述你想要创建的内容..."
              className={styles.input}
            />
            <button 
              className={styles.sendButton}
              onClick={handleSend}
              disabled={isSending || !input.trim()}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" />
              </svg>
            </button>
          </div>
          <p className={styles.inputHint}>按 Enter 发送，Shift + Enter 换行</p>
        </div>
      </main>
    </div>
  )
}
