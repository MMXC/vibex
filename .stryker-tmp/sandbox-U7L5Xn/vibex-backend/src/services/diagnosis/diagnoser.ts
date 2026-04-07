/**
 * Requirement Diagnoser Service
 * 
 * Core service for analyzing requirement quality across multiple dimensions:
 * - Completeness: Domain coverage
 * - Clarity: Unambiguous expression
 * - Consistency: Logical coherence
 * - Feasibility: Technical feasibility
 * 
 * @module services/diagnosis/diagnoser
 */
// @ts-nocheck


import { createHash } from 'crypto'
import {
  DiagnosisResult,
  IdentifiedDomain,
  MissingInfo,
  Suggestion,
  SimilarCase,
  ScoreWeights,
  DEFAULT_WEIGHTS,
  GRADE_THRESHOLDS,
} from './types'

// Domain Knowledge Base
const DOMAIN_KNOWLEDGE: Record<string, {
  coreFunctions: string[]
  commonEntities: string[]
  typicalWorkflows: string[]
}> = {
  '用户管理': {
    coreFunctions: ['注册', '登录', '登出', '权限管理', '角色管理', '个人信息管理', '密码重置'],
    commonEntities: ['用户', '角色', '权限', '会话', 'Token'],
    typicalWorkflows: ['注册流程', '登录流程', '权限分配流程'],
  },
  '订单管理': {
    coreFunctions: ['创建订单', '查询订单', '修改订单', '取消订单', '支付', '退款'],
    commonEntities: ['订单', '商品', '支付记录', '物流信息'],
    typicalWorkflows: ['下单流程', '支付流程', '退款流程'],
  },
  '内容管理': {
    coreFunctions: ['发布内容', '编辑内容', '删除内容', '审核内容', '分类管理', '标签管理'],
    commonEntities: ['内容', '分类', '标签', '评论'],
    typicalWorkflows: ['内容发布流程', '审核流程'],
  },
  '数据分析': {
    coreFunctions: ['数据采集', '数据处理', '数据可视化', '报表生成', '导出数据'],
    commonEntities: ['数据源', '报表', '图表', '指标'],
    typicalWorkflows: ['报表生成流程', '数据导出流程'],
  },
  '消息通知': {
    coreFunctions: ['发送消息', '接收消息', '消息推送', '消息提醒', '订阅管理'],
    commonEntities: ['消息', '通知', '订阅', '推送记录'],
    typicalWorkflows: ['消息推送流程', '订阅管理流程'],
  },
  '支付网关': {
    coreFunctions: ['支付', '退款', '对账', '账单查询', '支付方式管理'],
    commonEntities: ['支付', '账单', '交易记录', '支付方式'],
    typicalWorkflows: ['支付流程', '退款流程'],
  },
  '文件管理': {
    coreFunctions: ['上传文件', '下载文件', '删除文件', '文件预览', '权限设置'],
    commonEntities: ['文件', '文件夹', '存储空间'],
    typicalWorkflows: ['文件上传流程', '文件分享流程'],
  },
}

// Vague words that reduce clarity
const VAGUE_WORDS = ['等', '之类', '大概', '可能', '一些', '相关', '等等', '若干', '某些', '某种']

// Industry case library
const CASE_LIBRARY = [
  { name: '电商平台', industry: '零售', keywords: ['商品', '订单', '购物车', '支付', '物流'] },
  { name: '企业管理系统', industry: '企业服务', keywords: ['员工', '部门', '审批', '考勤', '绩效'] },
  { name: '社交应用', industry: '社交', keywords: ['好友', '动态', '消息', '评论', '点赞'] },
  { name: '在线教育平台', industry: '教育', keywords: ['课程', '学员', '作业', '考试', '证书'] },
  { name: '医疗管理系统', industry: '医疗', keywords: ['患者', '医生', '挂号', '处方', '病历'] },
]

export class RequirementDiagnoser {
  private cache: Map<string, { result: DiagnosisResult; expiresAt: number }> = new Map()
  private readonly CACHE_TTL = 15 * 60 * 1000 // 15 minutes

  /**
   * Diagnose a requirement text
   */
  async diagnose(requirementText: string, enableCache = true): Promise<DiagnosisResult> {
    // Check cache
    const cacheKey = this.hashText(requirementText)
    if (enableCache) {
      const cached = this.cache.get(cacheKey)
      if (cached && cached.expiresAt > Date.now()) {
        return { ...cached.result, cached: true } as any
      }
    }

    // Step 1: Domain identification
    const domains = this.identifyDomains(requirementText)

    // Step 2: Dimension assessment
    const completeness = this.assessCompleteness(domains)
    const clarity = this.assessClarity(requirementText)
    const consistency = this.assessConsistency(requirementText, domains)
    const feasibility = this.assessFeasibility(requirementText, domains)

    // Step 3: Calculate overall score
    const scores = { completeness, clarity, consistency, feasibility }
    const overallScore = this.calculateOverall(scores)
    const grade = this.determineGrade(overallScore)

    // Step 4: Generate suggestions
    const missingInfo = this.identifyMissingInfo(domains)
    const suggestions = this.generateSuggestions(domains, scores)

    // Step 5: Find similar cases
    const similarCases = this.matchSimilarCases(requirementText)

    const result: DiagnosisResult = {
      overallScore,
      grade,
      scores,
      identifiedDomains: domains,
      missingInfo,
      suggestions,
      similarCases,
    }

    // Cache result
    if (enableCache) {
      this.cache.set(cacheKey, { result, expiresAt: Date.now() + this.CACHE_TTL })
    }

    return result
  }

  /**
   * Identify business domains from requirement text
   */
  private identifyDomains(text: string): IdentifiedDomain[] {
    const identified: IdentifiedDomain[] = []
    const textLower = text.toLowerCase()

    for (const [domainName, knowledge] of Object.entries(DOMAIN_KNOWLEDGE)) {
      const matchedKeywords: string[] = []
      let matchCount = 0

      // Match keywords
      for (const keyword of [...knowledge.coreFunctions, ...knowledge.commonEntities]) {
        if (textLower.includes(keyword.toLowerCase())) {
          matchedKeywords.push(keyword)
          matchCount++
        }
      }

      if (matchCount > 0) {
        // Calculate completeness
        const totalItems = knowledge.coreFunctions.length + knowledge.commonEntities.length
        const completeness = Math.min(1, matchCount / (totalItems * 0.3)) // At least 30% match

        // Find missing functions
        const missingFunctions = knowledge.coreFunctions.filter(
          func => !textLower.includes(func.toLowerCase())
        )

        identified.push({
          name: domainName,
          confidence: Math.min(1, matchCount / 3),
          keywords: matchedKeywords.slice(0, 5),
          completeness,
          missingFunctions: missingFunctions.slice(0, 3),
        })
      }
    }

    // Sort by confidence
    return identified.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Assess completeness (domain coverage)
   */
  private assessCompleteness(domains: IdentifiedDomain[]): number {
    if (domains.length === 0) return 20 // Low score for no identified domains

    const avgCompleteness = domains.reduce((sum, d) => sum + d.completeness, 0) / domains.length
    return Math.round(avgCompleteness * 100)
  }

  /**
   * Assess clarity (detect vague expressions)
   */
  private assessClarity(text: string): number {
    let vagueCount = 0

    for (const word of VAGUE_WORDS) {
      const regex = new RegExp(word, 'gi')
      const matches = text.match(regex)
      if (matches) {
        vagueCount += matches.length
      }
    }

    // Check for very short requirements
    if (text.length < 50) {
      vagueCount += 2
    }

    // Check for proper structure (has user, action, object)
    const hasStructure = /用户|需要|实现|功能|系统/i.test(text)
    if (!hasStructure) {
      vagueCount += 1
    }

    // Calculate score (max 100, decrease by 10 per vague word)
    const clarityScore = Math.max(0, 100 - vagueCount * 10)
    return clarityScore
  }

  /**
   * Assess consistency
   */
  private assessConsistency(text: string, domains: IdentifiedDomain[]): number {
    // Basic consistency checks
    let score = 80 // Start with good score

    // Check for contradictory terms (simple heuristic)
    const contradictions = [
      ['创建', '删除'],
      ['启用', '禁用'],
      ['显示', '隐藏'],
    ]

    for (const [positive, negative] of contradictions) {
      if (text.includes(positive) && text.includes(negative)) {
        // Check if in same context (simple check)
        const posIndex = text.indexOf(positive)
        const negIndex = text.indexOf(negative)
        const distance = Math.abs(posIndex - negIndex)
        
        if (distance < 50) {
          score -= 15
        }
      }
    }

    // Multiple domains should have clear relationships
    if (domains.length > 2) {
      // Check for connection words
      if (!/和|与|以及|或者|或者|关联/i.test(text)) {
        score -= 10
      }
    }

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Assess feasibility (technical feasibility)
   */
  private assessFeasibility(text: string, _domains: IdentifiedDomain[]): number {
    let score = 75 // Start with neutral-good score

    // Check for unrealistic requirements
    const unrealistic = ['实时', '无限', '绝对', '完美', '全自动', '无需']
    for (const term of unrealistic) {
      if (text.includes(term)) {
        score -= 5
      }
    }

    // Check for technology-specific requirements that are feasible
    const feasible = ['API', '数据库', '缓存', '队列', '微服务', '前端', '后端', '移动端']
    for (const term of feasible) {
      if (text.includes(term)) {
        score += 3
      }
    }

    // Check for scope indicators
    if (text.includes('MVP') || text.includes('最小') || text.includes('核心')) {
      score += 10
    }

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Calculate overall score with weights
   */
  private calculateOverall(scores: {
    completeness: number
    clarity: number
    consistency: number
    feasibility: number
  }, weights: ScoreWeights = DEFAULT_WEIGHTS): number {
    return Math.round(
      scores.completeness * weights.completeness +
      scores.clarity * weights.clarity +
      scores.consistency * weights.consistency +
      scores.feasibility * weights.feasibility
    )
  }

  /**
   * Determine grade from score
   */
  private determineGrade(score: number): 'A' | 'B' | 'C' | 'D' {
    if (score >= GRADE_THRESHOLDS.A) return 'A'
    if (score >= GRADE_THRESHOLDS.B) return 'B'
    if (score >= GRADE_THRESHOLDS.C) return 'C'
    return 'D'
  }

  /**
   * Identify missing information
   */
  private identifyMissingInfo(domains: IdentifiedDomain[]): MissingInfo[] {
    const missing: MissingInfo[] = []

    for (const domain of domains) {
      for (const func of domain.missingFunctions) {
        const importance = domain.missingFunctions.indexOf(func) < 2 ? 'high' : 'medium'
        
        missing.push({
          domain: domain.name,
          item: func,
          importance,
          suggestion: `建议补充${domain.name}的${func}功能`,
          example: `添加${func}模块，支持用户${func}`,
        })
      }
    }

    // Add general missing info if no domains identified
    if (domains.length === 0) {
      missing.push({
        domain: '通用',
        item: '业务领域',
        importance: 'high',
        suggestion: '请明确需求涉及的业务领域',
        example: '如：用户管理、订单管理、内容管理等',
      })
    }

    return missing.slice(0, 6) // Max 6 items
  }

  /**
   * Generate improvement suggestions
   */
  private generateSuggestions(domains: IdentifiedDomain[], scores: {
    completeness: number
    clarity: number
    consistency: number
    feasibility: number
  }): Suggestion[] {
    const suggestions: Suggestion[] = []

    // Completeness suggestions
    if (scores.completeness < 70) {
      suggestions.push({
        type: 'add',
        target: '功能完整性',
        description: '建议补充更多业务功能细节',
        example: domains.length > 0 
          ? `可考虑添加：${domains[0].missingFunctions.slice(0, 2).join('、')}`
          : '请先明确业务领域',
      })
    }

    // Clarity suggestions
    if (scores.clarity < 70) {
      suggestions.push({
        type: 'clarify',
        target: '表达清晰度',
        description: '需求描述存在模糊词汇，建议明确表达',
        example: '避免使用"等"、"之类"、"大概"等词汇',
      })
    }

    // Consistency suggestions
    if (scores.consistency < 70) {
      suggestions.push({
        type: 'modify',
        target: '逻辑一致性',
        description: '建议检查需求描述的逻辑一致性',
        example: '确保不同功能之间的描述不矛盾',
      })
    }

    // Feasibility suggestions
    if (scores.feasibility < 70) {
      suggestions.push({
        type: 'modify',
        target: '可执行性',
        description: '建议将需求描述得更具体、可实现',
        example: '明确技术栈、边界条件、性能要求等',
      })
    }

    return suggestions.slice(0, 4) // Max 4 suggestions
  }

  /**
   * Match similar cases from library
   */
  private matchSimilarCases(text: string): SimilarCase[] {
    const textLower = text.toLowerCase()
    const scored: Array<{ case: typeof CASE_LIBRARY[0]; score: number }> = []

    for (const c of CASE_LIBRARY) {
      let matchCount = 0
      for (const kw of c.keywords) {
        if (textLower.includes(kw)) {
          matchCount++
        }
      }
      if (matchCount > 0) {
        scored.push({ case: c, score: matchCount / c.keywords.length })
      }
    }

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(s => ({
        name: s.case.name,
        industry: s.case.industry,
        similarity: Math.round(s.score * 100) / 100,
      }))
  }

  /**
   * Hash text for cache key
   */
  private hashText(text: string): string {
    return createHash('sha256').update(text).digest('hex').slice(0, 16)
  }
}

// Export singleton instance
export const requirementDiagnoser = new RequirementDiagnoser()
