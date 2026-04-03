/**
 * Requirement Validation Module
 * Keyword density detection + quality scoring algorithm
 */
// @ts-nocheck


export interface ValidationResult {
  score: number // 0-100
  level: 'low' | 'medium' | 'high' | 'excellent'
  issues: ValidationIssue[]
  suggestions: string[]
  keywords: KeywordInfo[]
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info'
  message: string
}

export interface KeywordInfo {
  word: string
  count: number
  density: number // percentage
  category: 'domain' | 'function' | 'entity' | 'action'
}

// Domain-specific keywords for different industries
const KEYWORD_CATEGORIES = {
  domain: [
    '用户', '客户', '会员', '管理员', '角色', '权限', '认证', '授权',
    '订单', '支付', '商品', '库存', '物流', '配送',
    '课程', '学习', '作业', '考试', '证书',
    '文章', '内容', '评论', '点赞', '分享',
    '消息', '通知', '邮件', '短信',
    '数据', '报表', '统计', '分析',
  ],
  function: [
    '管理', '创建', '编辑', '删除', '查询', '搜索', '筛选', '排序',
    '上传', '下载', '导入', '导出',
    '登录', '注册', '登出', '验证', '找回密码',
    '支付', '退款', '提现',
    '通知', '提醒', '推送',
  ],
  entity: [
    '用户', '订单', '商品', '课程', '文章', '评论',
    '角色', '权限', '分类', '标签', '配置',
    '文件', '图片', '视频', '音频',
  ],
  action: [
    '实现', '提供', '支持', '包含', '具有', '支持',
    '可以', '能够', '允许', '禁止',
    '自动', '手动', '实时', '批量',
  ],
}

// Scoring weights
const SCORE_WEIGHTS = {
  minLength: 15,
  keywordDensity: 30,
  structure: 20,
  clarity: 20,
  specificity: 15,
}

const MIN_LENGTH = 20 // Minimum characters
const OPTIMAL_LENGTH = 100 // Optimal length for scoring

/**
 * Analyze requirement text and return validation result
 */
export function validateRequirement(text: string): ValidationResult {
  const issues: ValidationIssue[] = []
  const suggestions: string[] = []
  
  // 1. Check minimum length
  const lengthScore = calculateLengthScore(text)
  if (lengthScore < 50) {
    issues.push({
      type: 'error',
      message: `需求描述过短 (${text.length} 字符)，建议至少 ${MIN_LENGTH} 字符`,
    })
    suggestions.push('添加更多细节描述您的产品需求')
  }

  // 2. Keyword density analysis
  const keywords = analyzeKeywords(text)
  const keywordScore = calculateKeywordScore(keywords)
  
  if (keywords.length < 3) {
    issues.push({
      type: 'warning',
      message: '建议添加更多领域关键词',
    })
    suggestions.push('使用明确的领域术语，如：用户管理、订单处理、支付系统')
  }

  // 3. Structure analysis
  const structureScore = analyzeStructure(text)
  if (structureScore < 50) {
    suggestions.push('使用清晰的段落结构，分点描述功能需求')
  }

  // 4. Clarity analysis
  const clarityScore = analyzeClarity(text)
  if (clarityScore < 50) {
    issues.push({
      type: 'info',
      message: '建议使用更清晰的语言描述需求',
    })
    suggestions.push('避免使用模糊的词汇，如"等等"、"若干"')
  }

  // 5. Specificity analysis
  const specificityScore = analyzeSpecificity(text)
  if (specificityScore < 50) {
    suggestions.push('添加具体的功能细节和业务规则')
  }

  // Calculate total score
  const totalScore = Math.round(
    lengthScore * 0.15 +
    keywordScore * 0.30 +
    structureScore * 0.20 +
    clarityScore * 0.20 +
    specificityScore * 0.15
  )

  // Determine level
  let level: ValidationResult['level']
  if (totalScore >= 80) level = 'excellent'
  else if (totalScore >= 60) level = 'high'
  else if (totalScore >= 40) level = 'medium'
  else level = 'low'

  return {
    score: totalScore,
    level,
    issues,
    suggestions,
    keywords,
  }
}

/**
 * Calculate length score
 */
function calculateLengthScore(text: string): number {
  if (text.length < MIN_LENGTH) return 20
  if (text.length > 500) return 80 // Too long starts decreasing
  if (text.length >= OPTIMAL_LENGTH) return 100
  
  // Linear interpolation between MIN and OPTIMAL
  return Math.round(((text.length - MIN_LENGTH) / (OPTIMAL_LENGTH - MIN_LENGTH)) * 100)
}

/**
 * Analyze keywords in text
 */
function analyzeKeywords(text: string): KeywordInfo[] {
  const textLower = text.toLowerCase()
  const foundKeywords: KeywordInfo[] = []

  for (const [category, words] of Object.entries(KEYWORD_CATEGORIES)) {
    for (const word of words) {
      if (textLower.includes(word)) {
        const regex = new RegExp(word, 'gi')
        const matches = text.match(regex) || []
        
        foundKeywords.push({
          word,
          count: matches.length,
          density: (matches.length / text.length) * 100,
          category: category as KeywordInfo['category'],
        })
      }
    }
  }

  // Sort by count and return top keywords
  return foundKeywords
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
}

/**
 * Calculate keyword score based on variety and density
 */
function calculateKeywordScore(keywords: KeywordInfo[]): number {
  if (keywords.length === 0) return 0

  // Factor 1: Number of unique keywords (max 30 points)
  const varietyScore = Math.min(keywords.length / 10, 1) * 30

  // Factor 2: Total keyword count (max 30 points)
  const totalCount = keywords.reduce((sum, k) => sum + k.count, 1)
  const countScore = Math.min(totalCount / 20, 1) * 30

  // Factor 3: Category coverage (max 40 points)
  const categories = new Set(keywords.map(k => k.category))
  const categoryScore = (categories.size / 4) * 40

  return Math.round(varietyScore + countScore + categoryScore)
}

/**
 * Analyze text structure
 */
function analyzeStructure(text: string): number {
  let score = 50 // Base score

  // Check for bullet points
  if (/^[•\-\*]\s/m.test(text)) score += 15

  // Check for numbered lists
  if (/^\d+[.)]\s/m.test(text)) score += 15

  // Check for paragraphs (line breaks)
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim())
  if (paragraphs.length >= 2) score += 10

  // Check for conjunctions that indicate structure
  if (/首先|其次|然后|最后|第一|第二|第三/m.test(text)) score += 10

  return Math.min(score, 100)
}

/**
 * Analyze text clarity
 */
function analyzeClarity(text: string): number {
  let score = 100

  // Check for vague words that reduce clarity
  const vagueWords = ['等等', '若干', '一些', '某些', '大概', '可能', '或许']
  for (const word of vagueWords) {
    if (text.includes(word)) {
      score -= 10
    }
  }

  // Check for incomplete sentences
  if (text.endsWith('，') || text.endsWith('、')) {
    score -= 10
  }

  return Math.max(score, 0)
}

/**
 * Analyze specificity
 */
function analyzeSpecificity(text: string): number {
  let score = 50 // Base score

  // Check for specific numbers
  const numbers = text.match(/\d+/g)
  if (numbers && numbers.length > 0) {
    score += Math.min(numbers.length * 5, 25)
  }

  // Check for specific modules/features
  const specificTerms = ['模块', '功能', '页面', '接口', '流程', '规则']
  for (const term of specificTerms) {
    if (text.includes(term)) {
      score += 5
    }
  }

  return Math.min(score, 100)
}

/**
 * Get real-time validation as user types (debounced)
 */
export function createRequirementValidator() {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  return {
    validate: (text: string): Promise<ValidationResult> => {
      return new Promise((resolve) => {
        if (debounceTimer) {
          clearTimeout(debounceTimer)
        }

        debounceTimer = setTimeout(() => {
          resolve(validateRequirement(text))
        }, 300) // 300ms debounce
      })
    },

    validateImmediate: (text: string): ValidationResult => {
      return validateRequirement(text)
    },
  }
}
