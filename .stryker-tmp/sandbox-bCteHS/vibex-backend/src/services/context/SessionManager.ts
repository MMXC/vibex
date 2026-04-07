// @ts-nocheck
// services/context/SessionManager.ts - 会话管理器

import { devDebug } from '../../lib/log-sanitizer';
import {
  SessionContext,
  SessionStats,
  ChatMessage,
  StructuredContext,
  CompressionConfig,
  ConfirmationState,
} from './types'
import { CompressionEngine } from './CompressionEngine'
import { estimateTokens, estimateMessagesTokens } from '../../lib/token-utils'

const DEFAULT_CONFIG: CompressionConfig = {
  tokenThreshold: 20000,
  preserveRecentMessages: 6,
  maxSummaryLength: 1000,
  strategy: 'hybrid',
}

/**
 * 会话管理器
 * 负责会话的生命周期管理、消息队列、压缩触发
 */
export class SessionManager {
  private sessions: Map<string, SessionContext> = new Map()
  private compressionEngine: CompressionEngine
  private confirmations: Map<string, ConfirmationState> = new Map()
  private config: CompressionConfig

  constructor(config?: Partial<CompressionConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.compressionEngine = new CompressionEngine(this.config)
  }

  /**
   * F1.1: 创建会话
   */
  getOrCreateSession(sessionId: string): SessionContext {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        sessionId,
        messages: [],
        tokenCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      devDebug(`[SessionManager] Created new session: ${sessionId}`)
    }
    return this.sessions.get(sessionId)!
  }

  // 兼容别名
  createSession(sessionId: string): SessionContext {
    return this.getOrCreateSession(sessionId)
  }

  getOrCreate(sessionId: string): SessionContext {
    return this.getOrCreateSession(sessionId)
  }

  /**
   * F1.2: 获取会话
   */
  getSession(sessionId: string): SessionContext | undefined {
    return this.sessions.get(sessionId)
  }

  /**
   * F1.3: 销毁会话
   */
  deleteSession(sessionId: string): boolean {
    const existed = this.sessions.has(sessionId)
    this.sessions.delete(sessionId)
    this.confirmations.delete(sessionId)
    if (existed) {
      devDebug(`[SessionManager] Deleted session: ${sessionId}`)
    }
    return existed
  }

  /**
   * F1.4: Token 统计
   */
  getTokenCount(sessionId: string): number {
    const session = this.sessions.get(sessionId)
    return session?.tokenCount ?? 0
  }

  /**
   * F2.1: 添加消息
   */
  async addMessage(sessionId: string, message: ChatMessage): Promise<void> {
    const session = this.getOrCreateSession(sessionId)

    // 添加时间戳
    const msgWithTimestamp = {
      ...message,
      timestamp: message.timestamp ?? Date.now(),
    }

    // 添加到消息列表
    session.messages.push(msgWithTimestamp)

    // 更新 Token 计数
    session.tokenCount += estimateTokens(msgWithTimestamp.content)
    session.updatedAt = Date.now()

    devDebug(`[SessionManager] Added message to ${sessionId}, total tokens: ${session.tokenCount}`)

    // 检查是否需要压缩
    if (this.compressionEngine.needsCompression(session)) {
      devDebug(`[SessionManager] Triggering compression for ${sessionId}`)
      await this.compressionEngine.compress(session)
    }
  }

  /**
   * F2.2: 获取消息列表
   */
  getMessages(sessionId: string): ChatMessage[] {
    const session = this.sessions.get(sessionId)
    return session?.messages ?? []
  }

  /**
   * F2.3: 消息重要性标记
   */
  markImportant(sessionId: string, messageIndex: number, importance: 'low' | 'medium' | 'high' | 'critical'): boolean {
    const session = this.sessions.get(sessionId)
    if (!session || messageIndex >= session.messages.length) {
      return false
    }

    const importanceMap = {
      low: 0.3,
      medium: 0.5,
      high: 0.7,
      critical: 1.0,
    }

    session.messages[messageIndex].importance = importanceMap[importance]

    if (importance === 'critical') {
      session.messages[messageIndex].isKeyDecision = true
    }

    return true
  }

  /**
   * F4.1: 设置结构化上下文
   */
  setStructuredContext(sessionId: string, context: StructuredContext): void {
    const session = this.getOrCreateSession(sessionId)
    session.structuredContext = context
    session.updatedAt = Date.now()
    devDebug(`[SessionManager] Set structured context for ${sessionId}`)
  }

  /**
   * F4: 构建 LLM 上下文
   */
  getContextForLLM(sessionId: string): ChatMessage[] {
    const session = this.sessions.get(sessionId)
    if (!session) return []

    return this.buildContext(session)
  }

  /**
   * F4: 构建上下文（结构化数据 + 摘要 + 最近对话）
   */
  private buildContext(session: SessionContext): ChatMessage[] {
    const context: ChatMessage[] = []

    // F4.1-4: 注入结构化上下文
    if (session.structuredContext) {
      context.push({
        role: 'system',
        content: this.formatStructuredContext(session.structuredContext),
        importance: 1.0,
      })
    }

    // 注入历史摘要
    if (session.summary) {
      context.push({
        role: 'system',
        content: `[历史讨论摘要]\n${session.summary}`,
        importance: 0.9,
      })
    }

    // 添加最近对话
    context.push(...session.messages)

    return context
  }

  /**
   * F4.1-4: 格式化结构化上下文为 System Message
   */
  formatStructuredContext(ctx: StructuredContext): string {
    const parts: string[] = ['【当前项目状态】']

    // 需求
    if (ctx.requirementText) {
      parts.push(`\n【需求】\n${ctx.requirementText}`)
    }

    // 限界上下文
    if (ctx.boundedContexts.length > 0) {
      parts.push('\n【已确认的限界上下文】')
      ctx.boundedContexts.forEach((bc, i) => {
        parts.push(`${i + 1}. ${bc.name} (${bc.type}): ${bc.description}`)
      })
    }

    // 领域模型
    if (ctx.domainModels.length > 0) {
      parts.push('\n【已确认的领域模型】')
      ctx.domainModels.forEach((dm, i) => {
        const props = dm.properties.map(p => `${p.name}: ${p.type}`).join(', ')
        parts.push(`${i + 1}. ${dm.name} (${dm.type}): ${props}`)
      })
    }

    // 业务流程
    if (ctx.businessFlow) {
      parts.push(`\n【业务流程】\n${ctx.businessFlow.name}`)
      if (ctx.businessFlow.mermaidCode) {
        parts.push(`\n${ctx.businessFlow.mermaidCode}`)
      }
    }

    // 决策记录
    if (ctx.decisions && ctx.decisions.length > 0) {
      parts.push('\n【关键决策】')
      ctx.decisions.forEach((d, i) => {
        parts.push(`${i + 1}. ${d.decision}${d.reason ? ` (${d.reason})` : ''}`)
      })
    }

    return parts.join('\n')
  }

  /**
   * F1: 获取会话统计
   */
  getStats(sessionId: string): SessionStats {
    const session = this.sessions.get(sessionId)
    if (!session) {
      return {
        messageCount: 0,
        tokenCount: 0,
        compressionCount: 0,
      }
    }

    return {
      messageCount: session.messages.length,
      tokenCount: session.tokenCount,
      compressionCount: 0,
      lastCompressedAt: session.summary ? session.updatedAt : undefined,
    }
  }

  // ========== 用户确认机制 (F5) ==========

  /**
   * F5.1: 创建摘要预览
   */
  createSummaryPreview(sessionId: string): string | null {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    // 备份原始消息
    const backup = [...session.messages]

    // 创建临时确认状态
    const confirmation: ConfirmationState = {
      sessionId,
      summary: session.summary ?? '无摘要',
      isConfirmed: false,
      originalMessagesBackup: backup,
      createdAt: Date.now(),
    }

    this.confirmations.set(sessionId, confirmation)

    return confirmation.summary
  }

  /**
   * F5.2/F5.4: 确认压缩结果
   */
  confirmCompression(sessionId: string): boolean {
    const confirmation = this.confirmations.get(sessionId)
    if (!confirmation) return false

    confirmation.isConfirmed = true
    devDebug(`[SessionManager] Compression confirmed for ${sessionId}`)
    return true
  }

  /**
   * F5.3: 拒绝/编辑摘要
   */
  rejectCompression(sessionId: string): boolean {
    const confirmation = this.confirmations.get(sessionId)
    if (!confirmation) return false

    const session = this.sessions.get(sessionId)
    if (!session || !confirmation.originalMessagesBackup) return false

    // 恢复原始消息
    session.messages = confirmation.originalMessagesBackup
    session.tokenCount = estimateMessagesTokens(session.messages)
    session.summary = undefined

    this.confirmations.delete(sessionId)

    devDebug(`[SessionManager] Compression rejected for ${sessionId}, restored ${session.messages.length} messages`)
    return true
  }

  /**
   * F5.3: 更新摘要（用户编辑后）
   */
  updateSummary(sessionId: string, newSummary: string): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    session.summary = newSummary
    session.tokenCount = estimateMessagesTokens(session.messages) + estimateTokens(newSummary)
    session.updatedAt = Date.now()

    devDebug(`[SessionManager] Summary updated for ${sessionId}`)
    return true
  }

  /**
   * F5.5: 回退机制
   */
  rollback(sessionId: string): boolean {
    return this.rejectCompression(sessionId)
  }

  /**
   * 获取确认状态
   */
  getConfirmationState(sessionId: string): ConfirmationState | undefined {
    return this.confirmations.get(sessionId)
  }

  /**
   * 获取所有会话 ID
   */
  getAllSessionIds(): string[] {
    return Array.from(this.sessions.keys())
  }

  /**
   * 清理过期会话
   */
  cleanupExpiredSessions(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
    const now = Date.now()
    let cleaned = 0

    for (const [sessionId, session] of this.sessions) {
      if (now - session.updatedAt > maxAgeMs) {
        this.deleteSession(sessionId)
        cleaned++
      }
    }

    if (cleaned > 0) {
      devDebug(`[SessionManager] Cleaned up ${cleaned} expired sessions`)
    }

    return cleaned
  }
}
