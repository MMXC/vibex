/**
 * E-P0-4 P0-12: AI智能补全 - 关键词检测器
 * 检测用户输入是否模糊/不完整，触发 AI 澄清流程
 */

interface VaguePattern {
  pattern: RegExp;
  reason: string;
}

const VAGUE_PATTERNS: VaguePattern[] = [
  // Chinese vague inputs
  { pattern: /^我想做个?/, reason: '需求过于笼统（想做xxx）' },
  { pattern: /^帮我做/, reason: '缺少具体功能描述' },
  { pattern: /^做个?[网站页面系统应用小程序]/, reason: '缺少具体功能描述' },
  { pattern: /^登录?$/, reason: '缺少上下文（谁登录？从哪里登录？）' },
  { pattern: /^注册$/, reason: '缺少具体注册流程' },
  { pattern: /^做个?网站$/, reason: '缺少具体功能模块描述' },
  // English vague inputs
  { pattern: /^i want a$/i, reason: 'Vague: specify which type of application' },
  { pattern: /^make a$/i, reason: 'What kind of application?' },
  { pattern: /^build a$/i, reason: 'Missing specific features' },
  { pattern: /^simple app$/i, reason: 'What should the app do?' },
  { pattern: /^login$/i, reason: 'Missing context: who logs in? From where?' },
  // Short inputs (very likely to be vague)
  { pattern: /^.{0,5}$/, reason: '输入过短，缺少详细描述' },
];

export interface DetectionResult {
  isVague: boolean;
  reason?: string;
  suggestions?: string[];
}

/**
 * 检测用户需求输入是否模糊/不完整
 * @param input 用户原始输入
 * @returns 检测结果
 */
export function detectVagueInput(input: string): DetectionResult {
  const trimmed = input.trim();

  for (const { pattern, reason } of VAGUE_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        isVague: true,
        reason,
        suggestions: generateSuggestions(trimmed),
      };
    }
  }

  return { isVague: false };
}

/**
 * 根据输入类型生成澄清建议
 */
function generateSuggestions(input: string): string[] {
  const suggestions: string[] = [];
  const lower = input.toLowerCase();

  if (/网站|web|site/i.test(lower)) {
    suggestions.push('描述主要功能模块（用户管理、内容管理、搜索等）');
    suggestions.push('目标用户群体是谁？');
    suggestions.push('是否需要移动端适配？');
  }

  if (/登录|login|register|注册/i.test(lower)) {
    suggestions.push('支持哪些登录方式？（手机号/邮箱/第三方）');
    suggestions.push('是否需要记住登录状态？');
    suggestions.push('登录后的默认页面是什么？');
  }

  if (input.length <= 5) {
    suggestions.push('请详细描述您的需求，例如：我要做一个课程管理网站，支持教师创建课程、学生选课、作业提交');
  }

  // Default suggestions
  if (suggestions.length === 0) {
    suggestions.push('请描述具体的业务流程');
    suggestions.push('主要用户角色有哪些？');
    suggestions.push('核心功能模块是什么？');
  }

  return suggestions;
}
