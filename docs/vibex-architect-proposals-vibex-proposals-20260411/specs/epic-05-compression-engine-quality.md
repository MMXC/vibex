# Spec: Epic 5 — Context CompressionEngine 质量保障

**Epic ID**: E5
**提案**: A-P2-1
**优先级**: P2
**工时**: 5h
**负责人**: Backend Dev

---

## 1. Overview

为 CompressionEngine 引入压缩质量评分（qualityScore），通过 keyConceptsPreserved 追踪领域概念保留情况，在质量过低时自动降级为全量上下文。

## 2. Scope

### In Scope
- `vibex-backend/src/services/context/CompressionEngine.ts`
- `vibex-backend/src/services/context/ImportanceScorer.ts`
- 新增 CompressionReport 类型定义

### Out of Scope
- 改变现有压缩策略的底层算法
- 全新的 importance scoring 算法

## 3. Technical Approach

采用**方案一：引入压缩质量评分**。

### 3.1 CompressionReport 类型

```typescript
// packages/types/schemas/context.ts (复用 Epic 3 的类型共享)
export interface CompressionReport {
  originalTokens: number
  compressedTokens: number
  compressionRatio: number      // compressedTokens / originalTokens
  keyConceptsPreserved: string[] // 通过 NER 提取的关键领域概念
  qualityScore: number           // 0-100
  degradedToFullContext: boolean // 是否降级全量
  strategy: 'full' | 'smart' | 'aggressive'
}
```

### 3.2 质量评分算法

```typescript
function calculateQualityScore(
  originalTokens: number,
  compressedTokens: number,
  keyConceptsPreserved: string[],
  allConcepts: string[]
): number {
  const ratio = compressedTokens / originalTokens
  const conceptPreservationRate = keyConceptsPreserved.length / allConcepts.length

  // 压缩比权重 40%，概念保留权重 60%
  const ratioScore = Math.max(0, (1 - ratio) * 50)  // 压缩越少分越高
  const conceptScore = conceptPreservationRate * 100

  return Math.round(ratioScore * 0.4 + conceptScore * 0.6)
}
```

### 3.3 降级逻辑

```typescript
// CompressionEngine.compress()
const report = calculateReport(messages)
if (report.qualityScore < 70) {
  // 降级全量上下文
  return {
    ...report,
    degradedToFullContext: true,
    compressedTokens: report.originalTokens,
    strategy: 'full'
  }
}
```

### 3.4 领域概念提取（NER）

```typescript
// 使用 LLM 或规则提取关键领域概念
async function extractKeyConcepts(messages: Message[]): Promise<string[]> {
  // 示例 prompt: "Extract domain concepts from: [messages]"
  // 返回如 ['Order', 'Payment', 'Shipping', 'Customer']
  const recentMessages = messages.slice(-10).map(m => m.content).join('\n')
  // 调用 LLM 提取关键实体
}
```

## 4. File Changes

```
Modified:
  vibex-backend/src/services/context/CompressionEngine.ts   (新增 qualityScore)
  vibex-backend/src/services/context/ImportanceScorer.ts    (支持 keyConcepts)

Added:
  vibex-backend/src/services/context/__tests__/compression.test.ts  (测试质量评分)
  vibex-backend/src/services/context/__tests__/importance-scorer.test.ts
```

## 5. Stories

| Story ID | 描述 | 工时 | 验收条件 |
|----------|------|------|---------|
| E5-S1 | CompressionReport 质量评分实现 | 2h | 输出包含 qualityScore (0-100) |
| E5-S2 | qualityScore < 70 降级全量上下文 | 2h | 质量不达标时 compressedTokens=originalTokens |
| E5-S3 | keyConceptsPreserved 领域概念保留 | 1h | 关键领域概念在压缩后被追踪 |

## 6. Acceptance Criteria

```typescript
// E5-S1
describe('CompressionEngine', () => {
  it('should output CompressionReport with qualityScore', () => {
    const messages = generateTestMessages(100)
    const result = engine.compress(messages)
    expect(result.qualityScore).toBeGreaterThanOrEqual(0)
    expect(result.qualityScore).toBeLessThanOrEqual(100)
    expect(result.compressionRatio).toBeLessThanOrEqual(1)
  })

  it('should include keyConceptsPreserved in report', () => {
    const result = engine.compress(messages)
    expect(Array.isArray(result.keyConceptsPreserved)).toBe(true)
  })
})

// E5-S2
it('should degrade to full context when qualityScore < 70', () => {
  const lowQualityMessages = generateLowQualityMessages()
  const result = engine.compress(lowQualityMessages)
  expect(result.qualityScore).toBeLessThan(70)
  expect(result.degradedToFullContext).toBe(true)
  expect(result.compressedTokens).toBe(result.originalTokens)
})
```

## 7. Test Cases

| ID | 输入 | 预期输出 |
|----|------|---------|
| TC01 | 100 条消息（正常） | qualityScore ≥70，压缩有效 |
| TC02 | 高度重复消息 | qualityScore <70，降级全量 |
| TC03 | 关键领域概念全保留 | keyConceptsPreserved 包含所有概念 |
| TC04 | 压缩比 0% (空输出) | qualityScore = 0 |
| TC05 | 无压缩场景 (<50 messages) | strategy='full'，qualityScore=100 |

## 8. Edge Cases

- **LLM 调用开销**：质量评分可能需要额外 LLM 调用（Ner extraction），需设 timeout
- **keyConcepts 全为空**：allConcepts 也为空时，除零处理
- **performance 影响**：qualityScore 计算不应显著增加压缩延迟（目标 <100ms）

## 9. Definition of Done

- [ ] CompressionReport 包含 qualityScore 字段
- [ ] qualityScore < 70 触发全量上下文降级
- [ ] keyConceptsPreserved 正确追踪领域概念
- [ ] 单元测试覆盖质量评分逻辑
- [ ] Code review 通过（≥1 reviewer）
