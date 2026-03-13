// services/context/ImportanceScorer.ts - 消息重要性评分

import { ChatMessage } from './types'

const IMPORTANCE_KEYWORDS: Record<string, number> = {
  '用户目标': 1.0,
  '需求': 0.9,
  '决策': 0.9,
  '确认': 0.8,
  '修改': 0.7,
  '重要': 0.6,
  '关键': 0.6,
  '必须': 0.5,
  '建议': 0.4,
  '可以': 0.3,
}

const ROLE_WEIGHTS = {
  user: 0.8,
  assistant: 0.5,
  system: 0.6,
}

const RECENCY_WEIGHT = 0.3
const STRUCTURED_DATA_BONUS = 0.2

export class ImportanceScorer {
  /**
   * 计算单条消息的重要性评分 (0-1)
   */
  calculate(message: ChatMessage, index: number, total: number): number {
    let score = ROLE_WEIGHTS[message.role] ?? 0.5
    
    // 关键词加分
    const content = message.content
    for (const [keyword, weight] of Object.entries(IMPORTANCE_KEYWORDS)) {
      if (content.includes(keyword)) {
        score += weight
      }
    }
    
    // 新近度加分
    const recencyScore = (index / Math.max(total, 1)) * RECENCY_WEIGHT
    score += recencyScore
    
    // 结构化数据加分
    if (message.structuredData) {
      score += STRUCTURED_DATA_BONUS
    }
    
    // 关键决策标记
    if (message.isKeyDecision) {
      score += 0.3
    }
    
    return Math.min(score, 1.0)
  }

  /**
   * 批量计算所有消息的重要性
   */
  scoreAll(messages: ChatMessage[]): Map<number, number> {
    const scores = new Map<number, number>()
    
    messages.forEach((msg, index) => {
      scores.set(index, this.calculate(msg, index, messages.length))
    })
    
    return scores
  }

  /**
   * 提取关键信息（用于混合压缩策略）
   */
  extractKeyInfo(messages: ChatMessage[]): string[] {
    const keyInfo: string[] = []
    const scores = this.scoreAll(messages)
    
    // 找出高重要性消息（分数 > 0.7）
    messages.forEach((msg, index) => {
      const score = scores.get(index) ?? 0
      if (score > 0.7 || msg.isKeyDecision) {
        // 提取关键句子
        const sentences = msg.content.split(/[。！？\n]/)
        sentences.forEach(sentence => {
          const trimmed = sentence.trim()
          if (trimmed.length > 10) {
            keyInfo.push(trimmed)
          }
        })
      }
    })
    
    return keyInfo
  }

  /**
   * 排序消息重要性（返回索引）
   */
  rankByImportance(messages: ChatMessage[]): number[] {
    const scores = this.scoreAll(messages)
    
    // 按分数降序排序，返回原始索引
    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([index]) => index)
  }
}
