/**
 * Completeness Scorer
 * 评估需求收集的完整度
 */
// @ts-nocheck


interface ScoreCriterion {
  name: string;
  keywords: string[];
  weight: number;
}

const CRITERIA: ScoreCriterion[] = [
  {
    name: 'project_type',
    keywords: ['系统', '平台', '网站', '应用', 'APP', '小程序', '管理', '商城', '博客', '社区'],
    weight: 15,
  },
  {
    name: 'core_features',
    keywords: ['功能', '核心', '主要', '支持', '包含', '具备', '实现', '提供'],
    weight: 20,
  },
  {
    name: 'target_users',
    keywords: ['用户', '客户', '会员', '管理员', '人员', '用户群体', '目标'],
    weight: 15,
  },
  {
    name: 'technical_requirements',
    keywords: ['技术', '框架', '语言', '数据库', '接口', 'API', '性能', '安全'],
    weight: 15,
  },
  {
    name: 'ui_requirements',
    keywords: ['界面', 'UI', '设计', '风格', '主题', '响应式', '移动端', 'PC端'],
    weight: 10,
  },
  {
    name: 'business_requirements',
    keywords: ['流程', '业务', '订单', '支付', '报表', '统计', '管理'],
    weight: 15,
  },
  {
    name: 'quality_requirements',
    keywords: ['质量', '测试', '性能', '优化', '维护', '文档', '培训'],
    weight: 10,
  },
];

export interface ScoringResult {
  totalScore: number;
  criteria: { name: string; score: number; matched: string[] }[];
  suggestions: string[];
}

export function scoreCompleteness(text: string): ScoringResult {
  const lowerText = text.toLowerCase();
  
  const criteriaResults = CRITERIA.map((criterion) => {
    const matched = criterion.keywords.filter((keyword) => 
      lowerText.includes(keyword)
    );
    const score = Math.round((matched.length / criterion.keywords.length) * criterion.weight);
    return {
      name: criterion.name,
      score,
      matched,
    };
  });

  const totalScore = Math.min(
    100,
    criteriaResults.reduce((sum, r) => sum + r.score, 0)
  );

  // Generate suggestions
  const suggestions: string[] = [];
  criteriaResults
    .filter((r) => r.score < criterionWeight(r.name) * 0.5)
    .forEach((r) => {
      switch (r.name) {
        case 'project_type':
          suggestions.push('请说明项目类型（如管理系统、电商平台等）');
          break;
        case 'core_features':
          suggestions.push('请详细描述核心功能需求');
          break;
        case 'target_users':
          suggestions.push('请说明目标用户群体');
          break;
        case 'technical_requirements':
          suggestions.push('是否有技术栈要求？');
          break;
        case 'ui_requirements':
          suggestions.push('请描述界面设计要求');
          break;
        case 'business_requirements':
          suggestions.push('请说明业务流程需求');
          break;
      }
    });

  return {
    totalScore,
    criteria: criteriaResults,
    suggestions: suggestions.slice(0, 3),
  };
}

function criterionWeight(name: string): number {
  const criterion = CRITERIA.find((c) => c.name === name);
  return criterion?.weight ?? 0;
}
