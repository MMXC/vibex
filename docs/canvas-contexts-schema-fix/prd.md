# PRD — canvas-contexts-schema-fix

**Agent**: PM
**日期**: 2026-04-05 01:05
**仓库**: /root/.openclaw/vibex
**基于**: docs/canvas-contexts-schema-fix/analysis.md

---

## 执行摘要

### 背景
`generate-contexts` API 响应中后端 JSDoc 注释使用 `sessionId`，但实际代码和前端 Zod schema 都使用 `generationId`。测试 validator 使用了错误的字段名 `sessionId`，导致测试可能失败。

### 目标
统一使用 `generationId` 字段名，修复 JSDoc 注释和测试 validator。

### 成功指标
| KPI | 当前 | 目标 |
|-----|------|------|
| 字段名一致性 | 混乱（sessionId vs generationId） | 100% 使用 generationId |
| 测试通过率 | 未知（validator 错误） | 100% |

---

## Epic 总览

| Epic | 名称 | 工时 | 优先级 |
|------|------|------|--------|
| E1 | Schema 字段统一 | 0.3h | P0 |

---

## Epic 1: Schema 字段统一

### Stories

#### Story E1-S1: 后端 JSDoc 修复
- **问题**: JSDoc 注释使用 `sessionId`，应为 `generationId`
- **工时**: 0.1h
- **验收标准**:
```typescript
// E1-S1.1: JSDoc 注释使用 generationId
const source = readFileSync('route.ts', 'utf8');
expect(source).toMatch(/generationId.*string/);
expect(source).not.toMatch(/sessionId.*string/);  // JSDoc 中不应出现
```
- **页面集成**: 无

#### Story E1-S2: 测试 Validator 修复
- **问题**: validator 测试使用 `sessionId`，应为 `generationId`
- **工时**: 0.2h
- **验收标准**:
```typescript
// E1-S2.1: Validator 使用 generationId
const testSource = readFileSync('canvasApiValidation.test.ts', 'utf8');
expect(testSource).toMatch(/generationId/);
expect(testSource).not.toMatch(/sessionId.*===.*'string'/);

// E1-S2.2: validator 函数接受正确字段名的响应
expect(isValidGenerateContextsResponse({
  success: true,
  contexts: [],
  generationId: 'gen_123',  // ✅ 正确字段名
  confidence: 0.85,
})).toBe(true);

// E1-S2.3: validator 函数拒绝错误字段名的响应
expect(isValidGenerateContextsResponse({
  success: true,
  contexts: [],
  sessionId: 'gen_123',  // ❌ 错误字段名
  confidence: 0.85,
})).toBe(false);
```
- **页面集成**: 无

### 功能点汇总

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| E1-F1 | JSDoc修复 | JSDoc使用generationId | expect(no sessionId in JSDoc) | 无 |
| E1-F2 | Validator修复 | validator使用generationId | expect(valid generationId, invalid sessionId) | 无 |

### DoD
- [ ] `route.ts` 的 JSDoc 注释使用 `generationId: string`
- [ ] `canvasApiValidation.test.ts` 的 validator 使用 `generationId`
- [ ] validator 对 `generationId` 返回 true，对 `sessionId` 返回 false
- [ ] `npm test -- canvasApiValidation` 通过

---

## 验收标准汇总

| 功能ID | 验收断言 | 测试方式 |
|--------|----------|----------|
| E1-F1 | `expect(source).not.toMatch(/sessionId.*string/)` | 静态检查 |
| E1-F2 | `expect(valid(generationId)).toBe(true)` | 单元测试 |
| E1-F2 | `expect(valid(sessionId)).toBe(false)` | 单元测试 |

---

## 非功能需求

| 类型 | 要求 |
|------|------|
| 兼容性 | 不破坏现有 API 响应格式 |
| 性能 | 无性能影响 |

---

**PRD 状态**: ✅ 完成
**下一步**: Dev 快速修复
