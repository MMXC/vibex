'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './chat.module.css'
import { apiService, Message } from '@/services/api'

export default function Chat() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // 检查登录状态
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      router.push('/auth')
    }
  }, [router])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    const userId = localStorage.getItem('user_id')
    if (!userId) {
      setError('请先登录')
      return
    }

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: input,
      projectId: '',
      createdAt: new Date().toISOString(),
    }

    // 添加用户消息到列表
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsSending(true)
    setError('')

    // 创建 AI 消息的占位
    const aiMessageId = `ai-${Date.now()}`
    setMessages((prev) => [...prev, {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      projectId: '',
      createdAt: new Date().toISOString(),
    }])

    // 创建 SSE 连接
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.vibex.top'
    const eventSource = new EventSource(`${apiBaseUrl}/chat/stream?message=${encodeURIComponent(input)}&userId=${encodeURIComponent(userId)}`)

    let fullContent = ''

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.content) {
          fullContent += data.content
          setMessages((prev) => 
            prev.map((msg) => 
              msg.id === aiMessageId 
                ? { ...msg, content: fullContent }
                : msg
            )
          )
        }
        
        if (data.done) {
          eventSource.close()
          setIsSending(false)
        }
      } catch (e) {
        // 处理非 JSON 数据（如纯文本）
        if (event.data) {
          fullContent += event.data
          setMessages((prev) => 
            prev.map((msg) => 
              msg.id === aiMessageId 
                ? { ...msg, content: fullContent }
                : msg
            )
          )
        }
      }
    }

    eventSource.onerror = () => {
      eventSource.close()
      setIsSending(false)
      
      // 如果没有收到任何内容，显示错误
      if (!fullContent) {
        setError('连接失败，请稍后重试')
        setMessages((prev) => prev.filter(msg => msg.id !== aiMessageId))
      }
    }

    // 超时处理
    setTimeout(() => {
      if (eventSource.readyState === EventSource.OPEN) {
        eventSource.close()
        setIsSending(false)
      }
    }, 60000)
  }

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
          <button
            className={`${styles.agentItem} ${styles.active}`}
          >
            <span className={styles.agentIcon}>◈</span>
            <span className={styles.agentName}>General Agent</span>
            <span className={styles.activeIndicator} />
          </button>
        </div>

        <div className={styles.sidebarFooter}>
          <button 
            className={styles.newChatBtn}
            onClick={() => {
              setMessages([])
              setError('')
            }}
          >
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
            <span className={styles.headerIcon}>◈</span>
            <div>
              <h1 className={styles.headerTitle}>AI 对话</h1>
              <p className={styles.headerSubtitle}>
                当前 Agent: <span className={styles.agentTag}>General Agent</span>
              </p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.headerBtn} title="设置">⚙</button>
            <button className={styles.headerBtn} title="更多">⋯</button>
          </div>
        </header>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '12px',
            margin: '0 20px',
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#dc2626',
            fontSize: '14px',
          }}>
            {error}
          </div>
        )}

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
                {msg.role === 'user' ? 'U' : '◈'}
              </div>
              <div className={styles.messageContent}>
                <div className={styles.messageBubble}>
                  {msg.content}
                </div>
                <span className={styles.messageTime}>
                  {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
            </div>
          ))}
          {isSending && (
            <div className={`${styles.message} ${styles.assistantMessage}`}>
              <div className={styles.messageAvatar}>◈</div>
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
              disabled={isSending}
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
