// services/context/MessageQueue.ts - 消息队列管理

import { ChatMessage } from './types'
import { estimateTokens } from '@/lib/token-utils'

export class MessageQueue {
  private messages: ChatMessage[] = []
  private tokenCount: number = 0
  private importanceMap: Map<number, number> = new Map()
  
  /**
   * 添加消息到队列
   */
  add(message: ChatMessage): void {
    // 设置时间戳
    const msgWithTimestamp = {
      ...message,
      timestamp: message.timestamp ?? Date.now()
    }
    
    this.messages.push(msgWithTimestamp)
    this.tokenCount += estimateTokens(message.content)
  }
  
  /**
   * 获取所有消息
   */
  getAll(): ChatMessage[] {
    return [...this.messages]
  }
  
  /**
   * 获取消息数量
   */
  get length(): number {
    return this.messages.length
  }
  
  /**
   * 获取 Token 总数
   */
  get tokens(): number {
    return this.tokenCount
  }
  
  /**
   * 获取最近 N 条消息
   */
  getRecent(count: number): ChatMessage[] {
    return this.messages.slice(-count)
  }
  
  /**
   * 移除指定索引的消息
   */
  remove(index: number): ChatMessage | null {
    if (index < 0 || index >= this.messages.length) {
      return null
    }
    
    const removed = this.messages.splice(index, 1)[0]
    this.recalculateTokens()
    return removed
  }
  
  /**
   * 替换消息列表
   */
  replace(newMessages: ChatMessage[]): void {
    this.messages = newMessages
    this.recalculateTokens()
  }
  
  /**
   * 设置重要性评分
   */
  setImportance(index: number, score: number): void {
    this.importanceMap.set(index, score)
  }
  
  /**
   * 获取重要性评分
   */
  getImportance(index: number): number {
    return this.importanceMap.get(index) ?? 0
  }
  
  /**
   * 标记消息为重要
   */
  markImportant(index: number, level: 'low' | 'medium' | 'high'): boolean {
    if (index < 0 || index >= this.messages.length) {
      return false
    }
    
    const importanceScore = level === 'high' ? 1.0 : level === 'medium' ? 0.7 : 0.4
    this.importanceMap.set(index, importanceScore)
    
    // 更新消息的 importance 字段
    this.messages[index] = {
      ...this.messages[index],
      importance: importanceScore
    }
    
    return true
  }
  
  /**
   * 重新计算 Token 总数
   */
  private recalculateTokens(): void {
    this.tokenCount = this.messages.reduce(
      (sum, msg) => sum + estimateTokens(msg.content),
      0
    )
  }
  
  /**
   * 清空队列
   */
  clear(): void {
    this.messages = []
    this.tokenCount = 0
    this.importanceMap.clear()
  }
  
  /**
   * 获取队列统计信息
   */
  getStats(): { messageCount: number; tokenCount: number } {
    return {
      messageCount: this.messages.length,
      tokenCount: this.tokenCount
    }
  }
}
