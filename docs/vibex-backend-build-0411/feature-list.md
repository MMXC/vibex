# Feature List: vibex-backend-build-0411

**项目**: vibex-backend-build-0411
**Planning 依据**: analysis.md
**产出时间**: 2026-04-11 15:25 GMT+8
**Planner**: pm

---

## 1. Feature List 表格

| ID | 功能点 | 描述 | 根因关联 | 工时估算 |
|----|--------|------|----------|----------|
| F1.1 | 修复 useAIController.ts 导入语句 | 将 `import { canvasSseApi }` 改为 `import { canvasSseAnalyze }` | `canvasSseApi` 命名空间不存在，实际导出为具名函数 `canvasSseAnalyze` | 5 min |
| F1.2 | 替换 canvasSseApi.canvasSseAnalyze 调用 | 将第143行 `await canvasSseApi.canvasSseAnalyze(...)` 改为 `await canvasSseAnalyze(...)` | 同上 | 2 min |
| F1.3 | 验证构建通过 | `cd vibex-fronted && npm run build` 退出码为 0 | 验证修复有效，无其他 TS 错误 | 5 min |

---

## 2. Epic / Story 划分

### Epic 1: 修复前端构建阻断

**问题根因**: `useAIController.ts` 第21行导入不存在的命名空间对象 `canvasSseApi`，实际导出为具名函数 `canvasSseAnalyze`。

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| S1.1 | 修复导入语句 | 5 min | `import { canvasSseAnalyze }` 可正常导入，无 TS 错误 |
| S1.2 | 替换函数调用 | 2 min | `await canvasSseAnalyze(...)` 调用与原参数一致 |
| S1.3 | 验证构建通过 | 5 min | `npm run build` 退出码为 0，无 TypeScript 错误 |

---

## 3. 依赖关系

- 无外部依赖
- 前置条件: analysis.md 已完成，根因已确认

---

## 4. 风险

| 风险 | 可能性 | 影响 | 缓解 |
|------|--------|------|------|
| 修复后仍有其他 TS 类型错误 | 低 | 高 | 修复后立即 `npm run build` 验证 |
| 其他文件存在相同导入错误 | 低 | 中 | 全局搜索 `canvasSseApi` 确认无遗漏 |

