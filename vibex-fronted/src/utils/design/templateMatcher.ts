/**
 * Template Matcher Utility
 * 模板匹配：识别'和xxx类似'自动套用模板
 */

export interface Template {
  id: string;
  name: string;
  keywords: string[];
  pattern: RegExp;
  structure: TemplateStructure;
}

export interface TemplateStructure {
  boundedContexts?: Array<{ name: string; description: string }>;
  domainEntities?: Array<{ name: string; type: string; attributes: Array<{ name: string; type: string }> }>;
  businessFlows?: Array<{ name: string; steps: Array<{ action: string; actor: string }> }>;
}

// 预定义模板库
export const templateLibrary: Template[] = [
  {
    id: 'user-management',
    name: '用户管理系统',
    keywords: ['用户管理', '用户注册', '用户登录', '权限管理', '角色'],
    pattern: /用户|注册|登录|权限|角色/i,
    structure: {
      boundedContexts: [
        { name: '用户', description: '系统用户管理' },
        { name: '认证', description: '身份认证和授权' },
      ],
      domainEntities: [
        { name: 'User', type: 'aggregate', attributes: [{ name: 'id', type: 'string' }, { name: 'email', type: 'string' }, { name: 'password', type: 'string' }] },
        { name: 'Role', type: 'entity', attributes: [{ name: 'id', type: 'string' }, { name: 'name', type: 'string' }] },
        { name: 'Permission', type: 'entity', attributes: [{ name: 'id', type: 'string' }, { name: 'action', type: 'string' }] },
      ],
    },
  },
  {
    id: 'ecommerce',
    name: '电商平台',
    keywords: ['电商', '商品', '购物车', '订单', '支付'],
    pattern: /电商|商品|购物车|订单|支付/i,
    structure: {
      boundedContexts: [
        { name: '商品', description: '商品管理' },
        { name: '订单', description: '订单处理' },
        { name: '支付', description: '支付处理' },
      ],
      domainEntities: [
        { name: 'Product', type: 'aggregate', attributes: [{ name: 'id', type: 'string' }, { name: 'name', type: 'string' }, { name: 'price', type: 'number' }] },
        { name: 'Order', type: 'aggregate', attributes: [{ name: 'id', type: 'string' }, { name: 'status', type: 'string' }, { name: 'total', type: 'number' }] },
        { name: 'Cart', type: 'entity', attributes: [{ name: 'id', type: 'string' }, { name: 'items', type: 'array' }] },
      ],
    },
  },
  {
    id: 'blog',
    name: '博客系统',
    keywords: ['博客', '文章', '评论', '标签', '分类'],
    pattern: /博客|文章|评论|标签/i,
    structure: {
      boundedContexts: [
        { name: '内容', description: '内容管理' },
        { name: '社区', description: '评论互动' },
      ],
      domainEntities: [
        { name: 'Post', type: 'aggregate', attributes: [{ name: 'id', type: 'string' }, { name: 'title', type: 'string' }, { name: 'content', type: 'string' }] },
        { name: 'Comment', type: 'entity', attributes: [{ name: 'id', type: 'string' }, { name: 'content', type: 'string' }, { name: 'author', type: 'string' }] },
        { name: 'Tag', type: 'value-object', attributes: [{ name: 'name', type: 'string' }] },
      ],
    },
  },
  {
    id: 'crm',
    name: 'CRM系统',
    keywords: ['CRM', '客户', '销售', '线索', '商机'],
    pattern: /CRM|客户|销售|线索|商机/i,
    structure: {
      boundedContexts: [
        { name: '客户', description: '客户管理' },
        { name: '销售', description: '销售流程' },
      ],
      domainEntities: [
        { name: 'Customer', type: 'aggregate', attributes: [{ name: 'id', type: 'string' }, { name: 'name', type: 'string' }, { name: 'company', type: 'string' }] },
        { name: 'Lead', type: 'entity', attributes: [{ name: 'id', type: 'string' }, { name: 'source', type: 'string' }, { name: 'status', type: 'string' }] },
        { name: 'Opportunity', type: 'entity', attributes: [{ name: 'id', type: 'string' }, { name: 'value', type: 'number' }, { name: 'stage', type: 'string' }] },
      ],
    },
  },
];

export interface MatchResult {
  template: Template | null;
  confidence: number;
  matchedKeywords: string[];
  isMatch: boolean;
}

/**
 * 匹配需求文本与模板
 */
export function matchTemplate(requirementText: string): MatchResult {
  const normalizedText = requirementText.toLowerCase();
  
  let bestMatch: Template | null = null;
  let bestConfidence = 0;
  const matchedKeywords: string[] = [];

  for (const template of templateLibrary) {
    // 检查关键词匹配
    const keywordMatches = template.keywords.filter((keyword) =>
      normalizedText.includes(keyword.toLowerCase())
    );
    
    // 计算置信度
    const keywordConfidence = keywordMatches.length / template.keywords.length;
    
    // 检查正则匹配
    const patternMatch = template.pattern.test(requirementText);
    const patternConfidence = patternMatch ? 0.5 : 0;
    
    const totalConfidence = keywordConfidence + patternConfidence;
    
    if (totalConfidence > bestConfidence) {
      bestConfidence = totalConfidence;
      bestMatch = template;
      matchedKeywords.push(...keywordMatches);
    }
  }

  // 阈值判断
  const isMatch = bestConfidence >= 0.3 && bestMatch !== null;

  return {
    template: bestMatch,
    confidence: bestConfidence,
    matchedKeywords: [...new Set(matchedKeywords)],
    isMatch,
  };
}

/**
 * 识别"和xxx类似"模式
 */
export function detectSimilarPattern(requirementText: string): string | null {
  const patterns = [
    /和(.+?)类似/,
    /像(.+?)一样/,
    /类似于(.+?)/,
    /和(.+?)差不多/,
    /参照(.+?)/,
  ];

  for (const pattern of patterns) {
    const match = requirementText.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * 智能模板匹配：结合相似模式检测和关键词匹配
 */
export function smartMatch(requirementText: string): MatchResult {
  // 首先检查是否有"和xxx类似"模式
  const similar = detectSimilarPattern(requirementText);
  
  if (similar) {
    // 尝试在模板库中找到相似的
    for (const template of templateLibrary) {
      if (similar.toLowerCase().includes(template.name.toLowerCase()) ||
          template.name.toLowerCase().includes(similar.toLowerCase())) {
        return {
          template,
          confidence: 1.0,
          matchedKeywords: [similar],
          isMatch: true,
        };
      }
    }
  }

  // 回退到普通关键词匹配
  return matchTemplate(requirementText);
}

/**
 * 获取模板建议列表
 */
export function getTemplateSuggestions(requirementText: string, limit = 3): Template[] {
  const matches = templateLibrary
    .map((template) => ({
      template,
      confidence: matchTemplate(requirementText).confidence,
    }))
    .filter((m) => m.confidence > 0)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, limit)
    .map((m) => m.template);

  return matches;
}

export default {
  matchTemplate,
  detectSimilarPattern,
  smartMatch,
  getTemplateSuggestions,
  templateLibrary,
};
