// services/context/SummaryGenerator.ts - AI 摘要生成器

import { ChatMessage, StructuredContext } from './types'
import { estimateTokens } from '@/lib/token-utils'

// MiniMax API 配置
const MINIMAX_CONFIG = {
  model: 'abab6.5s-chat',
  apiKey: '', // 从环境变量获取
  apiBase: 'https://api.minimax.chat/v1',
}

interface SummaryOptions {
  maxLength?: number
  focusOnUserGoals?: boolean
  includeDecisions?: boolean
}

const DEFAULT_SUMMARY_OPTIONS: SummaryOptions = {
  maxLength: 1000,
  focusOnUserGoals: true,
  includeDecisions: true,
}

/**
 * 摘要生成器
 * 使用 AI 生成会话摘要
 */
export class SummaryGenerator {
  private apiKey: string
  private apiBase: string
  private model: string

  constructor(apiKey?: string, apiBase?: string) {
    this.apiKey = apiKey ?? MINIMAX_CONFIG.apiKey
    this.apiBase = apiBase ?? MINIMAX_CONFIG.apiBase
    this.model = MINIMAX_CONFIG.model
  }

  /**
   * 生成会话摘要
   */
  async generate(
    messages: ChatMessage[],
    options: SummaryOptions = DEFAULT_SUMMARY_OPTIONS
  ): Promise<string> {
    if (messages.length === 0) {
      return ''
    }

    const opts = { ...DEFAULT_SUMMARY_OPTIONS, ...options }

    // 构建提示词
    const prompt = this.buildPrompt(messages, opts)

    // 调用 AI 生成摘要
    try {
      const summary = await this.callAI(prompt, opts.maxLength ?? 1000)
      return summary
    } catch (error) {
      console.error('Summary generation failed:', error)
      // 降级：使用简单摘要
      return this.simpleSummary(messages)
    }
  }

  /**
   * 使用关键信息生成摘要
   */
  async generateWithKeyInfo(
    messages: ChatMessage[],
    keyInfo: string[],
    maxLength: number = 1000
  ): Promise<string> {
    const keyInfoText = keyInfo.length > 0
      ? `\n关键信息:\n${keyInfo.map((info, i) => `${i + 1}. ${info}`).join('\n')}`
      : ''

    const prompt = `请根据以下对话生成简洁摘要：${keyInfoText}\n\n对话内容：\n${this.formatMessages(messages)}\n\n要求：\n1. 保留用户需求和目标\n2. 记录已确认的决策\n3. 保留关键的业务规则\n4. 摘要长度不超过 ${maxLength} tokens`

    try {
      return await this.callAI(prompt, maxLength)
    } catch (error) {
      return this.simpleSummary(messages)
    }
  }

  /**
   * 构建提示词
   */
  private buildPrompt(messages: ChatMessage[], options: SummaryOptions): string {
    const formattedMessages = this.formatMessages(messages)

    let prompt = `请分析以下对话，生成简洁摘要：\n\n${formattedMessages}\n\n`

    if (options.focusOnUserGoals) {
      prompt += '重点关注：用户目标和需求\n'
    }

    if (options.includeDecisions) {
      prompt += '记录：已确认的决策和约定\n'
    }

    prompt += `\n要求：\n1. 摘要长度不超过 ${options.maxLength} tokens\n2. 使用中文\n3. 保留关键信息`

    return prompt
  }

  /**
   * 格式化消息为文本
   */
  private formatMessages(messages: ChatMessage[]): string {
    return messages
      .map((msg, i) => {
        const role = msg.role === 'user' ? '用户' : msg.role === 'assistant' ? 'AI' : '系统'
        const decision = msg.isKeyDecision ? ' [关键决策]' : ''
        return `${i + 1}. ${role}：${msg.content}${decision}`
      })
      .join('\n')
  }

  /**
   * 调用 AI 生成摘要
   */
  private async callAI(prompt: string, maxTokens: number): Promise<string> {
    if (!this.apiKey) {
      // 如果没有 API key，使用简单摘要
      return this.simpleSummaryFromPrompt(prompt)
    }

    const url = `${this.apiBase}/text/chatcompletion_v2`

    const messages: ChatMessage[] = [
      { role: 'user', content: prompt }
    ]

    const body = {
      model: this.model,
      messages,
      temperature: 0.5,
      max_tokens: Math.min(maxTokens, 2000),
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`)
    }

    const data = await response.json() as any
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No content in AI response')
    }

    return content
  }

  /**
   * 简单摘要（无 AI 时降级使用）
   */
  private simpleSummary(messages: ChatMessage[]): string {
    if (messages.length === 0) {
      return ''
    }

    const userMessages = messages.filter(m => m.role === 'user')
    const assistantMessages = messages.filter(m => m.role === 'assistant')

    // 提取关键信息
    const keyPoints: string[] = []

    // 用户目标
    const goalMessages = userMessages.filter(m =>
      m.content.includes('目标') || m.content.includes('需求') || m.content.includes('想要')
    )
    if (goalMessages.length > 0) {
      keyPoints.push(`用户目标：${goalMessages[0].content.slice(0, 100)}`)
    }

    // 决策
    const decisions = messages.filter(m => m.isKeyDecision)
    if (decisions.length > 0) {
      keyPoints.push(`已确认决策：${decisions.length} 项`)
    }

    // 摘要
    const summary = [
      `会话轮次：${messages.length} 轮（用户 ${userMessages.length} 次，AI ${assistantMessages.length} 次）`,
      ...keyPoints,
      `最近消息：${messages[messages.length - 1].content.slice(0, 80)}...`
    ]

    return summary.join('\n')
  }

  /**
   * 从提示词生成简单摘要
   */
  private simpleSummaryFromPrompt(prompt: string): string {
    // 提取关键句子
    const lines = prompt.split('\n').filter(l => l.trim())
    const importantKeywords = ['目标', '需求', '决策', '确认', '用户']

    const keySentences = lines.filter(line =>
      importantKeywords.some(keyword => line.includes(keyword))
    )

    if (keySentences.length > 0) {
      return keySentences.slice(0, 5).join('；')
    }

    return '会话摘要'
  }
  
  /**
   * 格式化结构化摘要
   */
  formatStructuredSummary(context: StructuredContext): string {
    const parts: string[] = []
    
    // 限界上下文
    if (context.boundedContexts.length > 0) {
      parts.push('限界上下文:')
      context.boundedContexts.forEach(bc => {
        parts.push(`- ${bc.name}: ${bc.description}`)
      })
    }
    
    // 领域模型
    if (context.domainModels.length > 0) {
      parts.push('领域模型:')
      context.domainModels.forEach(dm => {
        parts.push(`- ${dm.name} (${dm.type})`)
      })
    }
    
    // 业务流程
    if (context.businessFlow) {
      parts.push(`业务流程: ${context.businessFlow.name}`)
    }
    
    // 决策
    if (context.decisions && context.decisions.length > 0) {
      parts.push('决策:')
      context.decisions.forEach(d => {
        parts.push(`- ${d.decision}`)
        if (d.reason) {
          parts.push(`  原因: ${d.reason}`)
        }
      })
    }
    
    return parts.join('\n')
  }
}
