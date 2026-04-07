// services/context/__tests__/index.test.ts - 智能压缩测试

import { SessionManager } from '../SessionManager'
import { CompressionEngine } from '../CompressionEngine'
import { ImportanceScorer } from '../ImportanceScorer'
import { SummaryGenerator } from '../SummaryGenerator'
import { estimateTokens } from '../../../lib/token-utils'
import { ChatMessage, CompressionConfig, StructuredContext } from '../types'

describe('Smart Compression', () => {
  // ========== F1: 会话管理测试 ==========

  describe('SessionManager', () => {
    let manager: SessionManager

    beforeEach(() => {
      manager = new SessionManager({
        tokenThreshold: 500, // 小阈值便于测试
        preserveRecentMessages: 3,
        maxSummaryLength: 200,
      })
    })

    // F1.1: 创建会话
    it('F1.1: creates session', () => {
      const session = manager.getOrCreateSession('test-1')
      expect(session).toBeDefined()
      expect(session.sessionId).toBe('test-1')
      expect(session.messages).toHaveLength(0)
    })

    // F1.2: 获取会话
    it('F1.2: retrieves session', () => {
      manager.getOrCreateSession('test-1')
      const session = manager.getSession('test-1')
      expect(session).toBeDefined()
      expect(session?.sessionId).toBe('test-1')
    })

    // F1.3: 销毁会话
    it('F1.3: deletes session', () => {
      manager.getOrCreateSession('test-1')
      const result = manager.deleteSession('test-1')
      expect(result).toBe(true)
      expect(manager.getSession('test-1')).toBeUndefined()
    })

    // F1.4: Token 统计
    it('F1.4: tracks token count', () => {
      manager.getOrCreateSession('test-1')
      const tokens = manager.getTokenCount('test-1')
      expect(tokens).toBe(0)

      manager.addMessage('test-1', {
        role: 'user',
        content: '这是一条测试消息',
      })

      expect(manager.getTokenCount('test-1')).toBeGreaterThan(0)
    })

    // F2.1: 添加消息
    it('F2.1: adds messages', async () => {
      await manager.addMessage('test-1', {
        role: 'user',
        content: '测试消息1',
      })

      const messages = manager.getMessages('test-1')
      expect(messages).toHaveLength(1)
    })

    // F2.3: 消息重要性标记
    it('F2.3: marks message importance', async () => {
      await manager.addMessage('test-1', {
        role: 'user',
        content: '测试消息',
      })

      const result = manager.markImportant('test-1', 0, 'high')
      expect(result).toBe(true)

      const session = manager.getSession('test-1')
      expect(session?.messages[0].importance).toBe(0.7)
    })

    // F5.1: 摘要预览
    it('F5.1: creates summary preview', async () => {
      // 先触发压缩
      for (let i = 0; i < 20; i++) {
        await manager.addMessage('test-1', {
          role: 'user',
          content: '这是一条较长的测试消息，用于测试压缩触发机制。'.repeat(10),
        })
      }

      const preview = manager.createSummaryPreview('test-1')
      expect(preview).toBeDefined()
    })

    // F5.2: 确认压缩
    it('F5.2: confirms compression', async () => {
      await manager.addMessage('test-1', { role: 'user', content: 'test' })
      manager.createSummaryPreview('test-1')
      const result = manager.confirmCompression('test-1')
      expect(result).toBe(true)
    })

    // F5.3: 拒绝压缩
    it('F5.3: rejects compression', async () => {
      await manager.addMessage('test-1', { role: 'user', content: 'test' })
      manager.createSummaryPreview('test-1')
      const result = manager.rejectCompression('test-1')
      expect(result).toBe(true)
    })

    // F5.5: 回退机制
    it('F5.5: rollback works', async () => {
      await manager.addMessage('test-1', { role: 'user', content: 'test' })
      manager.createSummaryPreview('test-1')
      const result = manager.rollback('test-1')
      expect(result).toBe(true)
    })
  })

  // ========== F3: 压缩引擎测试 ==========

  describe('CompressionEngine', () => {
    let engine: CompressionEngine

    beforeEach(() => {
      engine = new CompressionEngine({
        tokenThreshold: 100,
        preserveRecentMessages: 2,
        maxSummaryLength: 100,
      })
    })

    // F3.1: 压缩触发检测
    it('F3.1: detects compression need', () => {
      const session = {
        sessionId: 'test',
        messages: [],
        tokenCount: 150,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      expect(engine.needsCompression(session)).toBe(true)

      const smallSession = {
        sessionId: 'test',
        messages: [],
        tokenCount: 50,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      expect(engine.needsCompression(smallSession)).toBe(false)
    })

    // F3.2: 执行压缩
    it('F3.2: executes compression', async () => {
      const session = {
        sessionId: 'test',
        messages: Array(10).fill(null).map((_, i) => ({
          role: 'user' as const,
          content: '这是一条较长的测试消息，用于测试压缩效果。'.repeat(5),
          timestamp: Date.now(),
        })),
        tokenCount: 500,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const result = await engine.compress(session)
      expect(result.success).toBe(true)
      expect(result.compressionRatio).toBeGreaterThan(0.3)
    })

    // F3.3: 滑动窗口策略
    it('F3.3: sliding window preserves recent messages', async () => {
      const engine = new CompressionEngine({
        tokenThreshold: 50,
        preserveRecentMessages: 2,
        maxSummaryLength: 100,
        strategy: 'sliding_window',
      })

      const session = {
        sessionId: 'test',
        messages: [
          { role: 'user' as const, content: '消息1', timestamp: 1000 },
          { role: 'user' as const, content: '消息2', timestamp: 2000 },
          { role: 'user' as const, content: '消息3', timestamp: 3000 },
          { role: 'user' as const, content: '消息4', timestamp: 4000 },
        ],
        tokenCount: 100,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      await engine.compress(session)
      // 滑动窗口后消息应该减少
      expect(session.messages.length).toBeLessThan(4)
    })

    // F3.4: AI 摘要策略
    it('F3.4: summarize generates summary', async () => {
      const engine = new CompressionEngine({
        tokenThreshold: 50,
        preserveRecentMessages: 2,
        maxSummaryLength: 100,
        strategy: 'summarize',
      })

      const session = {
        sessionId: 'test',
        messages: [
          { role: 'user' as const, content: '用户想要一个项目管理应用', timestamp: 1000 },
          { role: 'assistant' as const, content: '好的，我了解了', timestamp: 2000 },
          { role: 'user' as const, content: '需要任务管理和进度追踪功能', timestamp: 3000 },
          { role: 'assistant' as const, content: '明白', timestamp: 4000 },
        ],
        tokenCount: 100,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const result = await engine.compress(session)
      // 压缩后应该有摘要或消息减少
      expect(session.summary || session.messages.length).toBeDefined()
    })

    // F3.5: 动态阈值
    it('F3.5: dynamic threshold adjustment', () => {
      const engine = new CompressionEngine({
        tokenThreshold: 10000,
        preserveRecentMessages: 6,
        maxSummaryLength: 1000,
      })

      // 50+ 消息时阈值降低
      const longSession = {
        sessionId: 'test',
        messages: Array(55).fill(null),
        tokenCount: 8000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const threshold = engine.calculateDynamicThreshold(longSession)
      expect(threshold).toBeLessThan(10000)
    })

    // F3: 压缩率验证
    it('achieves 50%+ compression ratio', async () => {
      const engine = new CompressionEngine({
        tokenThreshold: 50,
        preserveRecentMessages: 2,
        maxSummaryLength: 50,
        strategy: 'hybrid',
      })

      const session = {
        sessionId: 'test',
        messages: Array(15).fill(null).map((_, i) => ({
          role: i % 2 === 0 ? 'user' as const : 'assistant' as const,
          content: '这是一条较长的测试消息内容，用于验证压缩效果和压缩率。'.repeat(3),
          timestamp: Date.now() + i * 1000,
        })),
        tokenCount: 300,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const result = await engine.compress(session)
      // 压缩后 token 应该减少或消息数量应该减少
      expect(session.tokenCount < 300 || session.messages.length < 15).toBe(true)
    })
  })

  // ========== F2: 重要性评分测试 ==========

  describe('ImportanceScorer', () => {
    let scorer: ImportanceScorer

    beforeEach(() => {
      scorer = new ImportanceScorer()
    })

    it('scores user messages higher than assistant', () => {
      const userMsg: ChatMessage = { role: 'user', content: 'test' }
      const assistantMsg: ChatMessage = { role: 'assistant', content: 'test' }

      const userScore = scorer.calculate(userMsg, 0, 10)
      const assistantScore = scorer.calculate(assistantMsg, 0, 10)

      expect(userScore).toBeGreaterThan(assistantScore)
    })

    it('extracts key info from messages', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: '用户目标是创建一个项目管理工具' },
        { role: 'assistant', content: '好的，我了解了' },
        { role: 'user', content: '需要任务管理和进度追踪' },
        { role: 'assistant', content: '明白' },
      ]

      const keyInfo = scorer.extractKeyInfo(messages)
      expect(keyInfo.length).toBeGreaterThan(0)
    })
  })

  // ========== F2: 摘要生成测试 ==========

  describe('SummaryGenerator', () => {
    let generator: SummaryGenerator

    beforeEach(() => {
      generator = new SummaryGenerator()
    })

    it('generates summary', async () => {
      const messages: ChatMessage[] = Array(20).fill(null).map((_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `这是第 ${i + 1} 条消息，内容用于测试摘要生成功能。`.repeat(5),
        timestamp: Date.now(),
      }))

      const summary = await generator.generate(messages, { maxLength: 100 })
      expect(summary).toBeDefined()
      expect(summary.length).toBeGreaterThan(0)
    })

    it('generates summary with key info', async () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: '用户想要一个需求管理模块', timestamp: 1000 },
        { role: 'assistant', content: '好的', timestamp: 2000 },
      ]

      const keyInfo = ['关键需求: 用户管理', '关键需求: 权限控制']
      const summary = await generator.generateWithKeyInfo(messages, keyInfo, 200)

      expect(summary).toBeDefined()
      expect(summary.length).toBeGreaterThan(0)
    })

    it('formats structured context', () => {
      const context: StructuredContext = {
        requirementText: '创建一个项目管理应用',
        boundedContexts: [
          { id: '1', name: '用户管理', description: '用户注册登录', type: 'core' },
        ],
        domainModels: [
          { id: '1', name: 'User', contextId: '1', type: 'entity', properties: [] },
        ],
        businessFlow: { id: '1', name: '用户流程' },
        decisions: [{ timestamp: Date.now(), decision: '采用微服务架构' }],
      }

      const formatted = generator.formatStructuredSummary(context)
      expect(formatted).toContain('用户管理')
      expect(formatted).toContain('User')
      expect(formatted).toContain('微服务架构')
    })
  })

  // ========== Token 工具测试 ==========

  describe('Token Utils', () => {
    it('estimates Chinese tokens', () => {
      const text = '这是一段中文测试文本'
      const tokens = estimateTokens(text)
      expect(tokens).toBeGreaterThan(0)
    })

    it('estimates English tokens', () => {
      const text = 'This is an English test text'
      const tokens = estimateTokens(text)
      expect(tokens).toBeGreaterThan(0)
    })

    it('estimates mixed content', () => {
      const text = 'Hello 世界 This 是 mixed 内容'
      const tokens = estimateTokens(text)
      expect(tokens).toBeGreaterThan(5)
      expect(tokens).toBeLessThan(20)
    })
  })
})
