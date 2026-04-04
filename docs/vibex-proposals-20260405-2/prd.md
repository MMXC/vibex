# PRD — vibex-proposals-20260405-2

**Agent**: PM
**日期**: 2026-04-05 02:20
**仓库**: /root/.openclaw/vibex
**基于**: proposals/20260405-2/analyst.md + pm.md

---

## 执行摘要

### 背景
vibex-proposals-20260405-2 第二轮提案，聚焦深度分析和 Sprint 5 规划。analyst 深度分析了 Canvas API 91.7% 缺失率和 Schema 不匹配问题。

### 目标
- 统一 Schema 验证：Zod schema 替代手写 validator
- 制定 Canvas API Mock 清理计划
- 建立提案优先级排序机制

### 成功指标
| KPI | 当前 | 目标 |
|-----|------|------|
| 手写 validator 使用率 | >0 | 0（全部用 Zod） |
| Canvas API 覆盖率 | 8.3% | 100% |
| Mock 清理自动化 | 无 | 有 |

---

## 提案汇总

| 来源 | 提案数 | P0 | P1 | P2 |
|------|--------|-----|-----|-----|
| Analyst | 4 | 2 | 2 | 0 |
| PM | 3 | 1 | 1 | 1 |
| **合计** | **7** | **3** | **3** | **1** |

### 完整提案清单

| ID | 来源 | 标题 | 优先级 |
|----|------|------|--------|
| P001 | PM | Schema 验证统一（Zod 替代 validator） | P0 |
| A-P0-1 | Analyst | Canvas API 端点系统性实现 | P0 |
| A-P0-2 | Analyst | Schema 验证统一 | P0 |
| P002 | PM | Canvas API Mock 清理追踪 | P1 |
| A-P1-1 | Analyst | API 错误处理规范化 | P1 |
| A-P1-2 | Analyst | 前端 Mock 清理计划 | P1 |
| P003 | PM | 提案优先级排序机制 | P2 |

---

## Epic 总览

| Epic | 名称 | 来源提案 | 工时 | 优先级 |
|------|------|----------|------|--------|
| E1 | Schema 验证统一 | P001+A-P0-2 | 1h | P0 |
| E2 | Canvas API Mock 清理 | P002+A-P1-2 | 2-3h | P1 |
| E3 | API 错误处理规范 | A-P1-1 | 2h | P1 |
| E4 | 提案优先级机制 | P003 | 1h | P2 |

**总工时**: 6-7h

---

## Epic 1: Schema 验证统一

### 概述
Zod schema 替代手写 validator 函数，消除字段名不匹配问题。

### Stories

#### Story E1-S1: Zod Schema 替代手写 Validator
- **来源**: P001 + A-P0-2
- **工时**: 1h
- **验收标准**:
```typescript
// E1-S1.1: 测试文件使用 Zod schema 验证
const testSource = readFileSync('canvasApiValidation.test.ts', 'utf8');
expect(testSource).toMatch(/GenerateContextsResponseSchema\.safeParse/);
expect(testSource).not.toMatch(/isValid.*Response.*function/);

// E1-S1.2: validator 函数使用 Zod schema
const validatorSource = readFileSync('canvasApiValidation.ts', 'utf8');
expect(validatorSource).toMatch(/z\.object/);
expect(validatorSource).not.toMatch(/typeof obj\.sessionId/);

// E1-S1.3: 对 generationId 返回 true，对 sessionId 返回 false
const genResult = GenerateContextsResponseSchema.safeParse({
  success: true, contexts: [], generationId: 'gen_123', confidence: 0.9
});
expect(genResult.success).toBe(true);

const sessResult = GenerateContextsResponseSchema.safeParse({
  success: true, contexts: [], sessionId: 'gen_123', confidence: 0.9
});
expect(sessResult.success).toBe(false);
```
- **页面集成**: 无

### 功能点汇总

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| E1-F1 | Zod替代validator | 测试使用Zod.safeParse | expect(safeParse, not isValid) | 无 |

### DoD
- [ ] `canvasApiValidation.test.ts` 使用 `GenerateContextsResponseSchema.safeParse()`
- [ ] validator 函数内部使用 Zod schema 定义
- [ ] `npm test -- canvasApiValidation` 通过

---

## Epic 2: Canvas API Mock 清理

### 概述
Canvas API 真实实现后，系统性移除前端 Mock 测试。

### Stories

#### Story E2-S1: Mock 清理触发机制
- **来源**: P002 + A-P1-2
- **工时**: 0.5h
- **验收标准**:
```bash
# E2-S1.1: 有 API 实现后，移除对应 Mock 测试
# generate-contexts 实现完成 → canvasApi.test.ts 中对应 mock 移除

# E2-S1.2: 清理后无 canvas 相关 jest.mock
grep -r "jest.mock" src/ --include="*.test.ts" | grep canvas
# 期望: 无输出（已清理）
```
- **页面集成**: 无

#### Story E2-S2: Mock 清理验收
- **工时**: 0.5h
- **验收标准**:
```bash
# 每次 API 端点通过验收后，清理对应 Mock
# 验证: 真实 API 测试通过，Mock 测试文件被删除或 skip
```

### 功能点汇总

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| E2-F1 | Mock清理触发 | API实现后移除Mock | expect(no jest.mock canvas) | 无 |

### DoD
- [ ] 每个 Canvas API 真实实现后，对应 Mock 测试被移除
- [ ] 无 canvas 相关的 `jest.mock` 测试

---

## Epic 3: API 错误处理规范

### 概述
统一 Canvas API 错误处理规范，参照 canvas-api-500-fix 的 spec。

### Stories

#### Story E3-S1: 统一错误处理模板
- **来源**: A-P1-1
- **工时**: 2h
- **验收标准**:
```typescript
// E3-S1.1: 所有 Canvas API 使用统一错误处理模板
// 每个端点 route.ts 包含：
const errorHandler = (err: unknown) => {
  console.error('[API] Error:', err);
  return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
};

// E3-S1.2: AI 服务调用后检查 success
if (!result.success) {
  return NextResponse.json({ success: false, error: result.error }, { status: 500 });
}
```
- **页面集成**: 无

### 功能点汇总

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| E3-F1 | 错误处理模板 | 所有Canvas API使用统一模板 | expect(template in all routes) | 无 |

### DoD
- [ ] `generate-contexts` / `generate-flows` / `generate-components` 都使用统一错误处理模板
- [ ] 所有端点 `catch` 块统一返回 `NextResponse.json({ success: false })`

---

## Epic 4: 提案优先级机制

### Stories

#### Story E4-S1: 优先级计算脚本
- **来源**: P003
- **工时**: 1h
- **验收标准**:
```bash
# proposals/priority_calculator.py 存在并可执行
python3 proposals/priority_calculator.py --help
# 期望: 显示帮助信息

# 优先级计算
python3 proposals/priority_calculator.py --impact 9 --urgency 9 --effort 3
# 期望: P0
```
- **页面集成**: 无

### 功能点汇总

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| E4-F1 | 优先级脚本 | 自动计算P0/P1/P2 | expect(P0 for high impact) | 无 |

### DoD
- [ ] `proposals/priority_calculator.py` 存在且可执行
- [ ] 计算结果与人工判断一致（P0 案例验证）

---

## 验收标准汇总

| 功能ID | 验收断言 | 测试方式 |
|--------|----------|----------|
| E1-F1 | `expect(safeParse success for generationId)` | 单元测试 |
| E2-F1 | `expect(no jest.mock in canvas tests)` | 静态检查 |
| E3-F1 | `expect(errorHandler in all routes)` | 静态检查 |
| E4-F1 | `expect(P0 for impact=9,urgency=9,effort=3)` | 集成测试 |

---

**PRD 状态**: ✅ 完成
**下一步**: Architect 架构确认 → Dev 实现
