# Implementation Plan — vibex-proposals-20260405-2

**项目**: vibex-proposals-20260405-2
**日期**: 2026-04-05
**仓库**: /root/.openclaw/vibex
**总工时**: 6-7h

---

## Sprint 概览

| Sprint | Epic | 工时 | 目标 |
|--------|------|------|------|
| Sprint 1 | E1: Zod Schema 统一 | 1h | Schema 验证100% Zod |
| Sprint 2 | E3: API 错误处理规范 | 2h | 统一错误码 |
| Sprint 3 | E2: Mock 清理追踪 | 2-3h | mock-coverage 命令 |
| Sprint 4 | E4: 优先级机制 | 1h | priority_calculator.py |

---

## Sprint 1: E1 — Zod Schema 统一

### E1-T1: 改造 canvasApiValidation.ts（1h）

```typescript
// 1. 移除手写 validator
// 2. 使用 Zod schema
import { z } from 'zod';

export const GenerateContextsResponseSchema = z.object({
  success: z.boolean(),
  contexts: z.array(BoundedContextSchema),
  generationId: z.string(),  // ✅ 正确字段
  confidence: z.number(),
});

export function isValidGenerateContextsResponse(obj: unknown): boolean {
  return GenerateContextsResponseSchema.safeParse(obj).success;
}
```

### 交付物
- `vibex-fronted/src/lib/api/canvasApiValidation.ts`（改造）
- `vibex-fronted/src/lib/api/__tests__/canvasApiValidation.test.ts`（测试）

---

## Sprint 2: E3 — API 错误处理规范

### E3-T1: 统一错误码（2h）

在三个 API 端点（contexts/flows/components）中统一错误码。

### 交付物
- 统一 `CanvasAPIError` 接口定义
- 三个端点统一错误码

---

## Sprint 3: E2 — Mock 清理追踪

### E3-T1: mock-coverage 命令（2-3h）

```python
# task_manager.py 新增
def mock_coverage(project: str):
    """报告项目的 API mock 覆盖度"""
    ...
```

### 交付物
- `task mock-coverage <project>` 命令

---

## Sprint 4: E4 — 提案优先级机制

### E4-T1: priority_calculator.py（1h）

```python
# proposals/priority_calculator.py
def calculate_priority(impact, urgency, effort):
    ...
```

### 交付物
- `proposals/priority_calculator.py`

---

## 验收检查清单

- [x] ✅ `GenerateContextsResponseSchema.safeParse` 对 `generationId` 返回 `success: true`
- [x] ✅ `safeParse` 对 `sessionId` 返回 `success: false`
- [ ] `task mock-coverage` 输出所有 Canvas API 状态
- [ ] `calculate_priority` 边界用例测试通过

---

## 回滚计划

```bash
git checkout HEAD -- \
  vibex-fronted/src/lib/api/canvasApiValidation.ts \
  ~/.openclaw/skills/team-tasks/scripts/task_manager.py
```

---

*本文档由 Architect Agent 生成于 2026-04-05 02:28 GMT+8*
