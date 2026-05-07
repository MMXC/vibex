/**
 * lib/ai/ruleEngine.ts — E03 S03.3 降级规则引擎
 *
 * 无 API Key 或 LLM 超时时，降级为正则+关键词匹配。
 * 返回与 LLM 结构化输出相同的 ClarifyResult 格式。
 *
 * 关键词映射：
 *   角色  → "我作为" / "作为" / "用户" / "管理员" / "我希望"
 *   目标  → "想要" / "需要" / "能够" / "实现" / "完成"
 *   约束  → "不能" / "必须" / "限制" / "仅" / "只能"
 */

export interface RuleEngineInput {
  requirement: string;
}

export interface RuleEngineOutput {
  role: string | null;
  goal: string | null;
  constraints: string[];
  raw: string;
  parsed: { role: string; goal: string; constraints: string[] } | null;
  guidance: string;
}

/** 角色关键词 */
const ROLE_PATTERNS = [
  /作为([^，,。\n]{2,30})/u,
  /我作为([^，,。\n]{2,30})/u,
  /(?:以)?用户([^，,。\n]{0,20}?(?:角色|身份))/u,
  /(?:角色|身份)为?([^，,。\n]{2,20})/u,
  /管理员([^，,。\n]{0,20})/u,
  /我希望作为([^，,。\n]{2,30})/u,
];

/** 目标关键词 */
const GOAL_PATTERNS = [
  /想要([^，,。\n]{5,80})/u,
  /需要能够([^，,。\n]{5,80})/u,
  /实现([^，,。\n]{5,80})/u,
  /能够([^，,。\n]{5,80})/u,
  /完成([^，,。\n]{5,80})/u,
  /希望([^，,。\n]{5,80})/u,
  /(?:主要)?目标[是为]?([^，,。\n]{5,80})/u,
];

/** 约束关键词 */
const CONSTRAINT_PATTERNS = [
  /不能([^，,。\n]{2,50})/gu,
  /必须([^，,。\n]{2,50})/gu,
  /(?:只能|仅)([^，,。\n]{2,50})/gu,
  /限制([^，,。\n]{2,50})/gu,
  /不能超过([^，,。\n]{2,50})/gu,
  /每次最多([^，,。\n]{2,50})/gu,
  /至少([^，,。\n]{2,50})/gu,
  /不包含([^，,。\n]{2,50})/gu,
];

function extractRole(text: string): string | null {
  for (const pattern of ROLE_PATTERNS) {
    const m = text.match(pattern);
    if (m) return m[1]?.trim() ?? null;
  }
  return null;
}

function extractGoal(text: string): string | null {
  for (const pattern of GOAL_PATTERNS) {
    const m = text.match(pattern);
    if (m) return m[1]?.trim() ?? null;
  }
  // Fallback: use first sentence
  const firstSentence = text.split(/[。！？.!?]/)[0];
  if (firstSentence && firstSentence.length > 5) return firstSentence.trim();
  return null;
}

function extractConstraints(text: string): string[] {
  const constraints: string[] = [];
  for (const pattern of CONSTRAINT_PATTERNS) {
    // Reset lastIndex for global patterns
    if (pattern.global) pattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(text)) !== null) {
      const c = m[1]?.trim();
      if (c && !constraints.includes(c)) {
        constraints.push(c);
      }
    }
  }
  return constraints;
}

/**
 * ruleEngine — 降级路径解析
 * 输入需求文本，返回结构化的角色/目标/约束提取结果。
 */
export function ruleEngine(input: RuleEngineInput): RuleEngineOutput {
  const { requirement } = input;

  const role = extractRole(requirement);
  const goal = extractGoal(requirement);
  const constraints = extractConstraints(requirement);

  const parsed =
    role || goal
      ? {
          role: role ?? '未识别',
          goal: goal ?? requirement.slice(0, 80),
          constraints,
        }
      : null;

  return {
    role,
    goal,
    constraints,
    raw: requirement,
    parsed,
    guidance:
      '⚠️ 当前使用规则引擎解析结果，AI 解析更准确。配置 AI_API_KEY 可获得更好的解析效果。',
  };
}
