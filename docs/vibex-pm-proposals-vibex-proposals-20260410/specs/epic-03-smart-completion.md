# Epic E03 Spec: 需求智能补全

> **Epic ID**: E03
> **Epic 名称**: 需求智能补全（AI 主动澄清）
> **优先级**: P1
> **预计工时**: 4h
> **关联 Feature**: F03
> **关联提案**: P003

---

## 1. 概述

用户在首页输入需求时，AI 实时检测输入内容中的关键词（实体名、动词、业务术语），在输入框下方弹出追问气泡，主动引导用户补充关键信息，从而提升最终生成的领域模型质量。

---

## 2. 用户流程

```
用户输入需求（≥50 字）
    ↓
KeywordDetector 实时检测关键词
    ↓
检测到关键词（如"订单""用户""支付"）
    ↓
显示 SmartHintBubble 追问气泡
    ↓
用户回答追问 / 忽略追问 / 手动触发 AI 分析
    ↓
AI 收集多轮澄清上下文
    ↓
最终触发 AI 分析（质量提升 20%）
```

---

## 3. 关键词检测引擎

### 3.1 检测规则

```typescript
// src/services/keywordDetector.ts

interface KeywordRule {
  pattern: RegExp
  type: 'entity' | 'verb' | 'domain'
  questionTemplate: string  // "检测到您提到「{keyword}」，请补充..."
}

const rules: KeywordRule[] = [
  // 实体名检测（常见业务实体）
  { pattern: /订单|订单号|下单|退单|换货/g, type: 'entity', questionTemplate: '请补充「{keyword}」包含哪些字段（如订单号、金额、商品列表）？' },
  { pattern: /用户|会员|客户|买家|卖家/g, type: 'entity', questionTemplate: '请补充「{keyword}」需要记录哪些信息（如姓名、联系方式、地址）？' },
  { pattern: /商品|产品|库存|SKU/g, type: 'entity', questionTemplate: '请补充「{keyword}」需要管理哪些属性（如名称、价格、库存）？' },
  { pattern: /支付|收款|退款|结算|发票/g, type: 'entity', questionTemplate: '请补充「{keyword}」涉及哪些方式（如支付宝、微信、银行卡）？' },
  { pattern: /订单|购物车|结算/g, type: 'domain', questionTemplate: '请补充这个电商场景涉及哪些业务流程？' },
  { pattern: /社交|好友|关注|私信|动态/g, type: 'domain', questionTemplate: '请补充社交场景中用户之间的关系类型？' },
  
  // 动词检测（表示操作）
  { pattern: /管理|增删改查|CRUD|创建|修改|删除|查询/g, type: 'verb', questionTemplate: '「{keyword}」操作需要哪些权限角色？' },
  { pattern: /统计|分析|报表|导出|导入/g, type: 'verb', questionTemplate: '「{keyword}」功能需要支持哪些维度的数据？' },
]
```

### 3.2 检测算法

```typescript
interface DetectionResult {
  keyword: string
  type: 'entity' | 'verb' | 'domain'
  question: string
  position: { start: number; end: number }  // 在输入文本中的位置
}

export function detectKeywords(input: string): DetectionResult[] {
  if (input.length < 50) return []
  
  const results: DetectionResult[] = []
  for (const rule of rules) {
    let match
    const regex = new RegExp(rule.pattern.source, 'g')
    while ((match = regex.exec(input)) !== null) {
      results.push({
        keyword: match[0],
        type: rule.type,
        question: rule.questionTemplate.replace('{keyword}', match[0]),
        position: { start: match.index, end: match.index + match[0].length }
      })
    }
  }
  
  // 去重（同一关键词只显示一个追问）
  return deduplicateByKeyword(results)
}

function deduplicateByKeyword(results: DetectionResult[]): DetectionResult[] {
  const seen = new Set<string>()
  return results.filter(r => {
    if (seen.has(r.keyword)) return false
    seen.add(r.keyword)
    return true
  })
}
```

---

## 4. 组件设计

### 4.1 SmartHintBubble

| 属性 | 类型 | 说明 |
|------|------|------|
| detection | DetectionResult | 检测结果 |
| onAnswer | (answer: string) => void | 用户回答回调 |
| onDismiss | () => void | 忽略追问 |

**交互**:
- 气泡显示追问文字
- 提供「补充」按钮 → 打开输入框让用户回答
- 提供「忽略」按钮 → 关闭该气泡
- 支持多个气泡同时显示（最多 3 个）

### 4.2 KeywordHighlight

- 在输入框中对检测到的关键词高亮标注
- 高亮颜色区分类型：entity=蓝色，verb=绿色，domain=橙色

---

## 5. 多轮澄清上下文

```typescript
// src/stores/clarificationStore.ts
interface ClarificationContext {
  originalInput: string
  clarifications: Array<{
    question: string
    answer: string
    keyword: string
    timestamp: string
  }>
}

// 存储在组件 state 中，最终随需求一起发给 AI
const finalContext = {
  requirements: originalInput,
  clarifications: [...clarifications],
  // AI 分析时附加说明：clarifications 来自智能补全
}
```

---

## 6. API 设计

### POST /api/v1/keyword-detect

**请求**:
```json
{
  "input": "用户想要下单并完成支付",
  "context": "ecommerce"
}
```

**响应** (200ms 内返回):
```json
{
  "detections": [
    {
      "keyword": "下单",
      "type": "verb",
      "question": "请补充下单流程中涉及的环节（如加入购物车、确认订单、支付）",
      "position": { "start": 3, "end": 5 }
    },
    {
      "keyword": "支付",
      "type": "entity",
      "question": "请补充「支付」涉及哪些支付方式？",
      "position": { "start": 10, "end": 12 }
    }
  ],
  "responseTime": 87
}
```

---

## 7. Stories 实现细节

### E03-S1: 关键词检测引擎（1h）

- [ ] 创建 `src/services/keywordDetector.ts`
- [ ] 定义关键词规则（实体名/动词/业务术语）
- [ ] 实现 `detectKeywords(input: string)` 函数
- [ ] 实现 `deduplicateByKeyword()` 去重逻辑
- [ ] 编写单元测试覆盖率 > 80%

### E03-S2: 追问气泡 UI（1.5h）

- [ ] 实现 `SmartHintBubble` 组件
- [ ] 实现 `KeywordHighlight` 高亮组件
- [ ] 气泡定位跟随输入框
- [ ] 响应时间性能优化 < 1s
- [ ] 气泡动画过渡效果

### E03-S3: 多轮澄清逻辑（1.5h）

- [ ] 创建 `src/stores/clarificationStore.ts`
- [ ] 实现澄清上下文累积
- [ ] 与 AI 分析接口对接（附加 clarifications）
- [ ] 澄清完成后清除上下文
- [ ] E2E 测试验证多轮澄清

---

## 8. 验收测试用例

```typescript
describe('E03 需求智能补全', () => {
  it('E03-S1: 输入 ≥50 字时触发检测', async ({ page }) => {
    await page.goto('/')
    await page.fill('#requirement-input', '这是一个关于订单管理的系统，需要记录用户的购买记录和支付信息，包括订单号、商品列表、收货地址等')
    await page.waitForTimeout(500)
    await expect(page.locator('.smart-hint-bubble').first()).toBeVisible({ timeout: 1000 })
  })

  it('E03-S1: 关键词正确识别类型', async ({ page }) => {
    const result = detectKeywords('用户想要下单并完成支付')
    expect(result).toContainEqual(expect.objectContaining({ type: 'verb', keyword: '下单' }))
    expect(result).toContainEqual(expect.objectContaining({ type: 'entity', keyword: '支付' }))
  })

  it('E03-S2: 追问响应时间 < 1s', async ({ page }) => {
    const start = Date.now()
    await page.fill('#requirement-input', '用户想要下单并完成支付，需要记录订单信息')
    await page.waitForSelector('.smart-hint-bubble')
    expect(Date.now() - start).toBeLessThan(1000)
  })

  it('E03-S2: 可忽略追问气泡', async ({ page }) => {
    await page.fill('#requirement-input', '用户想要下单并完成支付')
    await page.waitForSelector('.smart-hint-bubble')
    await page.click('.smart-hint-dismiss')
    await expect(page.locator('.smart-hint-bubble')).toHaveCount(0)
  })

  it('E03-S3: 多轮澄清上下文累积', async ({ page }) => {
    await page.fill('#requirement-input', '用户想要下单并完成支付')
    await page.waitForSelector('.smart-hint-bubble')
    await page.click('.smart-hint-clarify')
    await page.fill('.clarification-input', '需要支持微信支付和支付宝')
    await page.click('.clarification-submit')
    // 第二轮追问
    await page.waitForSelector('.smart-hint-bubble')
    const context = page.evaluate(() => window.__clarificationStore)
    expect(context.clarifications).toHaveLength(1)
  })
})
```

---

## 9. 性能目标

| 指标 | 目标 |
|------|------|
| 关键词检测延迟 | < 50ms（本地计算） |
| 追问气泡渲染 | < 200ms |
| 端到端响应时间 | < 1s |
| 气泡同时显示数 | ≤ 3 个 |
