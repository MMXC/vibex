/**
 * Enhanced Template Matcher - F1.2 模板匹配引擎
 * 轻量级实现，性能目标: < 100ms
 */
// @ts-nocheck


import { Template, templateLibrary } from './templateMatcher';

// 扩展模板数据（包含更多匹配字段）
export interface ExtendedTemplate extends Template {
  industry?: string;
  complexity?: 'simple' | 'moderate' | 'complex';
  popularity?: number;  // 使用热度
}

// 增强的模板库
const enhancedTemplateLibrary: ExtendedTemplate[] = [
  {
    ...templateLibrary.find(t => t.id === 'user-management')!,
    industry: '用户管理',
    complexity: 'moderate',
    popularity: 0.9,
  },
  {
    ...templateLibrary.find(t => t.id === 'ecommerce')!,
    industry: '电商',
    complexity: 'complex',
    popularity: 0.95,
  },
  {
    ...templateLibrary.find(t => t.id === 'blog')!,
    industry: '内容',
    complexity: 'simple',
    popularity: 0.7,
  },
  {
    ...templateLibrary.find(t => t.id === 'crm')!,
    industry: 'CRM',
    complexity: 'complex',
    popularity: 0.8,
  },
  // 新增模板
  {
    id: 'oa',
    name: 'OA 办公系统',
    keywords: ['OA', '办公', '审批', '考勤', '报销', '请假', '会议', '日程'],
    pattern: /OA|办公|审批|考勤/i,
    industry: '企业',
    complexity: 'moderate',
    popularity: 0.85,
    structure: {
      boundedContexts: [
        { name: '审批', description: '审批流程管理' },
        { name: '考勤', description: '考勤管理' },
      ],
      domainEntities: [
        { name: 'Approval', type: 'aggregate', attributes: [{ name: 'id', type: 'string' }, { name: 'type', type: 'string' }] },
        { name: 'Attendance', type: 'entity', attributes: [{ name: 'id', type: 'string' }, { name: 'date', type: 'date' }] },
      ],
    },
  },
  {
    id: 'education',
    name: '在线教育平台',
    keywords: ['教育', '课程', '学习', '考试', '作业', '答疑', '讲师', '学员'],
    pattern: /教育|课程|学习|考试/i,
    industry: '教育',
    complexity: 'complex',
    popularity: 0.75,
    structure: {
      boundedContexts: [
        { name: '课程', description: '课程管理' },
        { name: '学习', description: '学习进度' },
      ],
      domainEntities: [
        { name: 'Course', type: 'aggregate', attributes: [{ name: 'id', type: 'string' }, { name: 'title', type: 'string' }] },
        { name: 'Exam', type: 'entity', attributes: [{ name: 'id', type: 'string' }, { name: 'duration', type: 'number' }] },
      ],
    },
  },
  {
    id: 'social',
    name: '社交应用',
    keywords: ['社交', '好友', '关注', '动态', '消息', '私信', '群组'],
    pattern: /社交|好友|关注|动态/i,
    industry: '社交',
    complexity: 'complex',
    popularity: 0.8,
    structure: {
      boundedContexts: [
        { name: '社交', description: '社交关系' },
        { name: '消息', description: '即时通讯' },
      ],
      domainEntities: [
        { name: 'User', type: 'aggregate', attributes: [{ name: 'id', type: 'string' }] },
        { name: 'Post', type: 'entity', attributes: [{ name: 'id', type: 'string' }, { name: 'content', type: 'string' }] },
      ],
    },
  },
];

export interface ExtendedMatchResult {
  template: ExtendedTemplate | null;
  confidence: number;
  matchedKeywords: string[];
  isMatch: boolean;
  alternatives: Array<{
    template: ExtendedTemplate;
    confidence: number;
  }>;
  processingTimeMs: number;
}

/**
 * 简单的模板匹配（无需 Fuse.js）
 * 性能目标: < 50ms
 */
export function matchTemplateWithFuse(input: string): ExtendedMatchResult {
  const startTime = performance.now();
  
  if (!input || input.trim().length === 0) {
    return {
      template: null,
      confidence: 0,
      matchedKeywords: [],
      isMatch: false,
      alternatives: [],
      processingTimeMs: performance.now() - startTime,
    };
  }

  const normalizedInput = input.toLowerCase();
  const results: Array<{ template: ExtendedTemplate; score: number }> = [];

  // 遍历所有模板，计算匹配分数
  for (const template of enhancedTemplateLibrary) {
    let score = 0;
    const matched: string[] = [];

    // 1. 关键词匹配
    for (const keyword of template.keywords) {
      if (normalizedInput.includes(keyword.toLowerCase())) {
        score += keyword.length / 10; // 关键词越长分数越高
        matched.push(keyword);
      }
    }

    // 2. 行业匹配
    if (template.industry && normalizedInput.includes(template.industry.toLowerCase())) {
      score += 0.5;
      matched.push(template.industry);
    }

    // 3. 热度加成
    score += (template.popularity || 0.5) * 0.3;

    if (score > 0) {
      results.push({ template, score });
    }
  }

  // 按分数排序
  results.sort((a, b) => b.score - a.score);

  if (results.length === 0) {
    return {
      template: null,
      confidence: 0,
      matchedKeywords: [],
      isMatch: false,
      alternatives: [],
      processingTimeMs: performance.now() - startTime,
    };
  }

  // 获取最佳匹配
  const best = results[0];
  const maxScore = results[0].score;
  const confidence = Math.min(1, maxScore / 2); // 归一化到 0-1

  // 获取备选
  const alternatives = results.slice(1, 4).map(r => ({
    template: r.template,
    confidence: Math.min(1, r.score / 2),
  }));

  return {
    template: best.template,
    confidence,
    matchedKeywords: [...new Set(best.template.keywords.filter(k => 
      normalizedInput.includes(k.toLowerCase())
    ))],
    isMatch: confidence >= 0.3,
    alternatives,
    processingTimeMs: performance.now() - startTime,
  };
}

/**
 * 结合关键词提取的智能匹配
 * F1.2 核心功能
 */
export function smartMatchTemplate(
  input: string,
  keywordResult?: { keywords: Array<{ keyword: string }> }
): ExtendedMatchResult {
  const startTime = performance.now();
  
  // 使用关键词或直接匹配
  const searchTerms = keywordResult?.keywords
    ?.slice(0, 5)
    .map(k => k.keyword)
    .join(' ') || input;
  
  const result = matchTemplateWithFuse(searchTerms || input);
  
  return {
    ...result,
    processingTimeMs: performance.now() - startTime,
  };
}

/**
 * 获取模板推荐列表
 * F1.3 基础功能
 */
export function getTemplateRecommendations(
  input: string,
  limit: number = 3
): Array<{ template: ExtendedTemplate; confidence: number }> {
  const result = matchTemplateWithFuse(input);
  
  if (!result.template) {
    // 返回默认推荐（最热门的模板）
    return enhancedTemplateLibrary
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, limit)
      .map(t => ({ template: t, confidence: 0.3 }));
  }
  
  // 合并主要结果和备选结果
  const recommendations = [
    { template: result.template, confidence: result.confidence },
    ...result.alternatives,
  ];
  
  return recommendations.slice(0, limit);
}

export default {
  matchTemplateWithFuse,
  smartMatchTemplate,
  getTemplateRecommendations,
  enhancedTemplateLibrary,
};
