# PRD: Canvas Generate Components Consolidation

> **项目**: vibex-generate-components-consolidation  
> **目标**: 合并重复的 API 函数  
> **分析者**: analyst agent  
> **PRD 作者**: pm agent  
> **日期**: 2026-04-06  
> **版本**: v1.0

---

## 1. 执行摘要

### 背景
前端存在两个 API 函数调用同一后端端点：
- `generateComponents` (canvasApi.ts:258)
- `fetchComponentTree` (canvasApi.ts:280)

### 目标
- P0: 合并重复的 API 函数为单一函数
- P1: 更新所有调用方

### 成功指标
- AC1: 单一 API 函数存在
- AC2: 所有调用方使用同一函数
- AC3: 功能测试通过

---

## 2. Epic 拆分

| Epic | 名称 | 优先级 | 工时 |
|------|------|--------|------|
| E1 | 合并 API 函数 | P0 | 0.5h |
| E2 | 更新调用方 | P1 | 0.3h |
| **合计** | | | **0.8h** |

---

### Epic 1: 合并 API 函数

**问题根因**: 两个不同开发者创建了功能相同的 API 函数。

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S1.1 | 合并为单一函数 | 0.5h | 只保留一个函数 ✓ |

**验收标准**:
- `expect(generateComponents).toBeDefined()` ✓
- `expect(fetchComponentTree).toBeUndefined()` 或导出为 alias ✓
- 两者行为一致 ✓

**DoD**:
- [ ] 保留 `generateComponents` 作为主函数
- [ ] `fetchComponentTree` 导出为 `generateComponents` 的 alias
- [ ] 测试验证功能一致

---

### Epic 2: 更新调用方

**问题根因**: `BusinessFlowTree.tsx` 使用 `fetchComponentTree`。

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S2.1 | 更新 BusinessFlowTree | 0.3h | 使用合并后的函数 ✓ |

**验收标准**:
- `expect(imports).toContain('generateComponents')` ✓
- 无 `fetchComponentTree` 调用 ✓

**DoD**:
- [ ] `BusinessFlowTree.tsx` 导入 `generateComponents`
- [ ] `CanvasPage.tsx` 保持不变
- [ ] 功能测试通过

---

## 3. 功能点汇总

| ID | 功能点 | Epic | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | 合并 API 函数 | E1 | expect(fetchComponentTree).toBe(alias) | 无 |
| F2.1 | 更新 BusinessFlowTree | E2 | expect(imports).toContain('generateComponents') | 【需页面集成】 |

---

## 4. 验收标准汇总

| ID | Given | When | Then |
|----|-------|------|------|
| AC1 | API 调用 | `generateComponents` 或 `fetchComponentTree` | 返回相同结果 |
| AC2 | BusinessFlowTree | 导入 | 使用 `generateComponents` |
| AC3 | CanvasPage | 导入 | 继续正常工作 |

---

## 5. DoD

### E1: 合并 API 函数
- [ ] `generateComponents` 作为主函数
- [ ] `fetchComponentTree` 作为 alias
- [ ] 测试验证行为一致

### E2: 更新调用方
- [ ] `BusinessFlowTree.tsx` 使用 `generateComponents`
- [ ] `CanvasPage.tsx` 保持不变
- [ ] 功能测试通过

---

## 6. 实施计划

| Epic | 内容 | 工时 |
|------|------|------|
| E1 | 合并 API 函数 | 0.5h |
| E2 | 更新调用方 | 0.3h |

---

## 7. 非功能需求

| 需求 | 描述 |
|------|------|
| 兼容性 | 不破坏现有功能 |
| 可维护性 | 单一职责，减少冗余 |

---

## 8. 风险缓解

| 风险 | 缓解措施 |
|------|----------|
| 修改破坏 BusinessFlowTree | 更新后功能测试 |
| alias 导致混淆 | 文档说明 alias 用途 |

---

*文档版本: v1.0 | 最后更新: 2026-04-06*
