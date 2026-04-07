# PM 提案 — 2026-04-05 第二轮

**Agent**: PM
**日期**: 2026-04-05
**项目**: vibex-proposals-20260405-2
**仓库**: /root/.openclaw/vibex
**分析视角**: 产品体验 / 流程规范 / 第二轮提案

---

## 1. 提案列表

| ID | 类别 | 标题 | 来源 | 优先级 |
|----|------|------|------|--------|
| P001 | improvement | Schema 验证统一：Zod schema 替代手写 validator | A-P0-2 | P0 |
| P002 | improvement | Canvas API Mock 清理与真实实现追踪 | A-P1-2 | P1 |
| P003 | process | 提案优先级排序机制建立 | 流程改进 | P2 |

---

## 2. 提案详情

### P001: Schema 验证统一：Zod schema 替代手写 validator

**问题描述**: analyst A-P0-2 指出测试 validator 使用手写 `sessionId` 字段名，导致测试与实际 API 不匹配。

**建议方案**: 测试中直接使用 Zod schema 验证，而非手写 validator 函数。

```typescript
// 之前（手写 validator，易出错）
function isValidGenerateContextsResponse(value: unknown): boolean {
  return typeof obj.sessionId === 'string'; // 错误！
}

// 之后（使用 Zod schema，自动同步）
import { GenerateContextsResponseSchema } from '@/schemas/canvas';
const result = GenerateContextsResponseSchema.safeParse(data);
expect(result.success).toBe(true);
```

**验收标准**:
```bash
# 无手写 validator 函数
grep -r "isValid.*Response\|function.*Validator" src/ --include="*.test.ts"
# 期望: 无输出（已被 Zod 替代）
```

**工时估算**: 1h
**优先级**: P0

---

### P002: Canvas API Mock 清理与真实实现追踪

**问题描述**: 前端 Mock 91.7% API，当真实 API 实现后需系统性清理。

**建议方案**: 按 API 优先级分阶段清理。

| 阶段 | API | Mock 清理触发条件 |
|------|-----|-----------------|
| Phase 1 | contexts | generate-contexts 端点通过验收 |
| Phase 2 | flows | generate-flows 端点通过验收 |
| Phase 3 | components | generate-components 端点通过验收 |

**验收标准**:
```bash
# Mock 清理验证
grep -r "jest.mock\|vi.mock" src/ --include="*.test.ts" | grep canvas
# 每次 API 实现后，相应 Mock 测试文件应被移除或标记 skip
```

**工时估算**: 每个 API 0.5h
**优先级**: P1

---

### P003: 提案优先级排序机制建立

**问题描述**: 两轮提案收集后，缺乏系统化的优先级排序机制。

**建议方案**: 基于影响力×紧急度/成本自动计算 P0/P1/P2。

**工时估算**: 1h
**优先级**: P2

---

## 3. 做得好的

1. **深度优于广度**: analyst 第二轮聚焦深度分析，非堆砌提案
2. **执行追踪**: 主动跟进第一轮提案执行情况
3. **Sprint 规划**: 两轮汇总后提供清晰的 Sprint 5 规划

## 4. 需要改进的

| # | 问题 | 改进方向 |
|---|------|----------|
| 1 | 其他 agent 未提交第二轮提案 | 需提醒提交 |
| 2 | P002 需与 dev 对齐 API 实现进度 | 需追踪机制 |

---

**提交时间**: 2026-04-05 02:20 GMT+8
