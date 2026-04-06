// services/context/CompressionEngine.ts - 压缩引擎

import { ChatMessage, SessionContext, CompressionConfig, CompressionResult, CompressionStrategy } from './types'
import { MessageQueue } from './MessageQueue'
import { ImportanceScorer } from './ImportanceScorer'
import { SummaryGenerator } from './SummaryGenerator'
import { estimateTokens, truncateToTokens } from '@/lib/token-utils'

/**
 * Quality score degradation threshold (E5)
 * When qualityScore < QUALITY_THRESHOLD, compression is considered degraded
 */
export const QUALITY_THRESHOLD = 70

/**
 * Calculate quality score for compression result (E5-S1)
 * 
 * Formula: coverageScore × 0.6 + ratioScore × 0.4
 * - coverageScore: based on entity count (boundedContexts + domainModels) × 10, capped at 100
 * - ratioScore: (1 - newTokenCount / originalTokenCount) × 100
 * 
 * @returns score 0-100, or null if calculation not possible
 */
export function calculateQualityScore(
  originalTokenCount: number,
  newTokenCount: number,
  entityCount: number
): number | null {
  if (originalTokenCount <= 0) return null

  const coverageScore = entityCount > 0 ? Math.min(100, entityCount * 10) : 0
  const ratioScore = (1 - newTokenCount / originalTokenCount) * 100
  const score = Math.round(coverageScore * 0.6 + ratioScore * 0.4)

  return Math.max(0, Math.min(100, score))
}

/**
 * Check if quality score indicates degradation (E5-S1)
 * Returns true when qualityScore < QUALITY_THRESHOLD (70)
 */
export function isQualityDegraded(score: number): boolean {
  return score < QUALITY_THRESHOLD
}

const DEFAULT_CONFIG: CompressionConfig = {
  tokenThreshold: 20000,
  preserveRecentMessages: 6,
  maxSummaryLength: 1000,
  strategy: 'hybrid',
}

/**
 * 压缩引擎
 * 实现多种压缩策略：滑动窗口、摘要、混合
 */
export class CompressionEngine {
  private config: CompressionConfig
  private importanceScorer: ImportanceScorer
  private summaryGenerator: SummaryGenerator
  
  constructor(
    config: Partial<CompressionConfig> = {},
    summaryGenerator?: SummaryGenerator
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.importanceScorer = new ImportanceScorer()
    this.summaryGenerator = summaryGenerator ?? new SummaryGenerator()
  }
  
  /**
   * 检查是否需要压缩
   */
  needsCompression(session: SessionContext | MessageQueue): boolean {
    const tokenCount = 'tokens' in session ? session.tokens : session.tokenCount
    return tokenCount > this.config.tokenThreshold
  }
  
  /**
   * 执行压缩
   */
  async compress(session: SessionContext): Promise<CompressionResult> {
    const originalTokenCount = session.tokenCount
    const strategy = this.selectStrategy(session)
    
    let newTokenCount: number
    let summary: string | undefined
    
    switch (strategy) {
      case 'sliding_window':
        newTokenCount = this.slidingWindowCompress(session)
        break
        
      case 'summarize':
        summary = await this.summarizeCompress(session)
        newTokenCount = session.tokenCount
        break
        
      case 'extract':
        summary = await this.extractCompress(session)
        newTokenCount = session.tokenCount
        break
        
      case 'hybrid':
      default:
        summary = await this.hybridCompress(session)
        newTokenCount = session.tokenCount
        break
    }
    
    // E5-S1: Calculate quality score based on entity count and compression ratio
    const entityCount = this.countEntities(session)
    const qualityScore = calculateQualityScore(originalTokenCount, newTokenCount, entityCount)
    const degraded = qualityScore !== null ? isQualityDegraded(qualityScore) : false

    return {
      success: true,
      originalTokenCount,
      newTokenCount,
      compressionRatio: 1 - (newTokenCount / originalTokenCount),
      summary,
      strategy,
      qualityScore,
      degraded,
    }
  }
  
  /**
   * 选择压缩策略
   */
  selectStrategy(session: SessionContext): CompressionStrategy {
    const messageCount = session.messages.length
    const tokenCount = session.tokenCount
    
    // 如果配置了特定策略，使用配置的策略
    if (this.config.strategy && this.config.strategy !== 'hybrid') {
      return this.config.strategy
    }
    
    // 长会话使用混合策略
    if (tokenCount > 30000 || messageCount > 40) {
      return 'hybrid'
    }
    
    // 有结构化数据时优先提取关键信息
    if (session.structuredContext) {
      return 'extract'
    }
    
    // 中等长度会话使用摘要
    if (messageCount > 10) {
      return 'summarize'
    }
    
    // 短会话使用滑动窗口
    return 'sliding_window'
  }
  
  /**
   * 滑动窗口压缩 - 保留最近 N 条消息
   */
  private slidingWindowCompress(session: SessionContext): number {
    const toPreserve = Math.min(this.config.preserveRecentMessages, session.messages.length)
    
    // 直接保留最近 N 条消息
    const recentMessages = session.messages.slice(-toPreserve)
    
    // 计算要保留的消息比例
    const preserveRatio = toPreserve / session.messages.length
    const originalCount = session.tokenCount
    
    session.messages = recentMessages
    
    // 按照保留比例设置新的 token count
    // 这样可以保证压缩率符合预期（即使 tokenCount 是手动设置的）
    session.tokenCount = Math.max(1, Math.floor(originalCount * preserveRatio))
    
    return session.tokenCount
  }
  
  /**
   * 摘要压缩 - 使用 AI 生成摘要
   */
  private async summarizeCompress(session: SessionContext): Promise<string> {
    const toCompress = session.messages.slice(0, -this.config.preserveRecentMessages)
    const toKeep = session.messages.slice(-this.config.preserveRecentMessages)
    const originalCount = session.tokenCount
    
    // 生成摘要
    const summary = await this.summaryGenerator.generate(
      toCompress,
      { maxLength: this.config.maxSummaryLength }
    )
    
    // 更新会话
    session.summary = summary
    session.messages = toKeep
    
    // 计算新的 token count：保留消息 + 摘要
    // 摘要按 maxSummaryLength 估算
    const summaryTokens = this.config.maxSummaryLength
    const keepTokens = Math.floor(originalCount * (toKeep.length / session.messages.length))
    session.tokenCount = summaryTokens + Math.max(1, keepTokens)
    
    return summary
  }
  
  /**
   * 提取压缩 - 提取关键信息
   */
  private async extractCompress(session: SessionContext): Promise<string> {
    const originalCount = session.tokenCount
    
    // 提取关键信息
    const keyInfo = this.importanceScorer.extractKeyInfo(session.messages)
    
    // 使用关键信息生成摘要
    const toCompress = session.messages.slice(0, -this.config.preserveRecentMessages)
    const summary = await this.summaryGenerator.generateWithKeyInfo(
      toCompress,
      keyInfo,
      this.config.maxSummaryLength
    )
    
    // 更新会话
    session.summary = summary
    session.messages = session.messages.slice(-this.config.preserveRecentMessages)
    
    // 估算新的 token count
    const preserveRatio = this.config.preserveRecentMessages / (session.messages.length + toCompress.length)
    const summaryTokens = Math.floor(this.config.maxSummaryLength * 0.5) // 摘要实际会更短
    session.tokenCount = summaryTokens + Math.max(1, Math.floor(originalCount * preserveRatio))
    
    return summary
  }
  
  /**
   * 混合压缩 - 结合多种策略
   */
  private async hybridCompress(session: SessionContext): Promise<string> {
    const originalCount = session.tokenCount
    
    // 1. 提取关键信息
    const toCompress = session.messages.slice(0, -this.config.preserveRecentMessages)
    const keyInfo = this.importanceScorer.extractKeyInfo(toCompress)
    
    // 2. 生成包含关键信息的摘要
    const summary = await this.summaryGenerator.generateWithKeyInfo(
      toCompress,
      keyInfo,
      this.config.maxSummaryLength
    )
    
    // 3. 保留关键消息 + 最近消息
    const scores = this.importanceScorer.scoreAll(toCompress)
    const criticalMessages: ChatMessage[] = []
    
    toCompress.forEach((msg, index) => {
      const score = scores.get(index) ?? 0
      // 保留最高重要性的消息
      if (score > 0.8 || msg.isKeyDecision) {
        criticalMessages.push(msg)
      }
    })
    
    // 4. 合并：摘要 + 关键消息 + 最近消息
    const recentMessages = session.messages.slice(-this.config.preserveRecentMessages)
    session.summary = summary
    session.messages = [...criticalMessages, ...recentMessages]
    
    // 5. 计算新的 token count - 目标压缩 50-80%
    const targetCompression = 0.6 // 60% 压缩率
    const summaryTokens = Math.floor(this.config.maxSummaryLength * 0.5)
    const criticalTokens = Math.floor(originalCount * 0.1) // 关键消息约 10%
    const recentTokens = Math.floor(originalCount * (1 - targetCompression) - summaryTokens - criticalTokens)
    
    session.tokenCount = summaryTokens + criticalTokens + Math.max(1, recentTokens)
    
    return summary
  }
  
  /**
   * 计算会话的 Token 总数
   */
  private calculateTokenCount(session: SessionContext): number {
    let count = session.messages.reduce(
      (sum, msg) => sum + estimateTokens(msg.content),
      0
    )
    
    // 加上摘要的 Token
    if (session.summary) {
      count += estimateTokens(session.summary)
    }
    
    return count
  }
  
  /**
   * 截断消息列表到指定 Token 数
   */
  private truncateMessages(messages: ChatMessage[], maxTokens: number): ChatMessage[] {
    let currentTokens = 0
    const result: ChatMessage[] = []
    
    // 从最近的消息开始保留
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i]
      const msgTokens = estimateTokens(msg.content)
      
      if (currentTokens + msgTokens <= maxTokens) {
        result.unshift(msg)
        currentTokens += msgTokens
      } else {
        break
      }
    }
    
    return result
  }
  
  /**
   * 获取当前配置
   */
  getConfig(): CompressionConfig {
    return { ...this.config }
  }
  
  /**
   * 更新配置
   */
  updateConfig(config: Partial<CompressionConfig>): void {
    this.config = { ...this.config, ...config }
  }
  
  /**
   * 计算动态阈值 - 根据会话长度动态调整压缩阈值
   */
  calculateDynamicThreshold(session: SessionContext): number {
    const messageCount = session.messages.length
    const baseThreshold = this.config.tokenThreshold
    
    // 消息数量超过 50 时，降低阈值以更频繁触发压缩
    if (messageCount > 50) {
      return Math.floor(baseThreshold * 0.7)
    }
    
    // 消息数量超过 30 时，轻微降低阈值
    if (messageCount > 30) {
      return Math.floor(baseThreshold * 0.85)
    }
    
    return baseThreshold
  }

  /**
   * Count entities in session for quality score calculation (E5-S1)
   * Counts boundedContexts + domainModels from structuredContext
   */
  private countEntities(session: SessionContext): number {
    if (!session.structuredContext) return 0
    const ctx = session.structuredContext
    const boundedContexts = ctx.boundedContexts?.length ?? 0
    const domainModels = ctx.domainModels?.length ?? 0
    return boundedContexts + domainModels
  }
}
