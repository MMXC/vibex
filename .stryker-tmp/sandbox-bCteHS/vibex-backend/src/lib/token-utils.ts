// @ts-nocheck
// lib/token-utils.ts - Token 工具函数

/**
 * 估算文本的 Token 数量
 * 使用字符数近似：英文 ~4 chars/token，中文 ~2 chars/token
 */
export function estimateTokens(text: string): number {
  if (!text) return 0
  
  // 分离中英文
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const otherChars = text.length - chineseChars
  
  // 中文约 2 字符/token，英文约 4 字符/token
  const estimatedTokens = Math.ceil(chineseChars / 2) + Math.ceil(otherChars / 4)
  
  return estimatedTokens
}

/**
 * 计算消息列表的总 Token 数
 */
export function estimateMessagesTokens(messages: { content: string }[]): number {
  return messages.reduce((sum, m) => sum + estimateTokens(m.content), 0)
}

/**
 * 截断文本到指定 Token 数
 */
export function truncateToTokens(text: string, maxTokens: number): string {
  const currentTokens = estimateTokens(text)
  if (currentTokens <= maxTokens) return text
  
  // 估算需要保留的字符数
  const ratio = maxTokens / currentTokens
  const targetChars = Math.floor(text.length * ratio * 0.9) // 留 10% 余量
  
  return text.slice(0, targetChars) + '...'
}

/**
 * 批量估算消息列表的 Token
 */
export function estimateBatchTokens(
  messages: { content: string }[],
  options?: { maxMessages?: number; startIndex?: number }
): { tokens: number; messageCount: number } {
  const startIdx = options?.startIndex ?? 0
  const maxMsgs = options?.maxMessages ?? messages.length
  
  const selectedMessages = messages.slice(startIdx, startIdx + maxMsgs)
  const tokens = estimateMessagesTokens(selectedMessages)
  
  return { tokens, messageCount: selectedMessages.length }
}
