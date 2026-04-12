# Learnings: vibex-backend-build-0411 — 前端构建修复

**项目**: vibex-backend-build-0411
**完成时间**: 2026-04-11
**基线**: `cd1814a8` → `65b3f433`
**结果**: ✅ Epic1 完成

---

## 项目结果

- **Epic1**: ✅ `65b3f433` — useAIController import 修复 + flowStore async 类型
- **验证**: pnpm tsc ✅, vitest 15/15 ✅, pnpm build ✅

---

## 教训

### 1. 命名空间导入错误的识别

**问题**: `import { canvasSseApi } from '@/lib/canvas/api/canvasSseApi'` 看起来像是一个命名空间导入（`* as canvasSseApi`），但实际上 `canvasSseApi.ts` 只导出具名函数 `canvasSseAnalyze`。

**教训**: TypeScript import 语句不报错，直到实际调用时才发现 `canvasSseApi` 不存在。命名空间导入 `import * as X` 和具名导入 `import { X }` 在视觉上容易混淆。解决方案：避免创建"看起来像命名空间对象"的具名导出。

**适用场景**: 任何使用 `import { xxxApi }` 格式（api后缀）但实际是具名导出而非命名空间时。

---

### 2. coord-decision 驳回是有效质量门

**问题**: 首次 coord-decision 被驳回，原因是缺少 architecture.md / IMPLEMENTATION_PLAN.md / AGENTS.md。虽然项目范围极小（单行修复），但文档规范不省略。

**结果**: Architect 补充文档后重新派发，dev 修复时还额外发现了 `flowStore.autoGenerateFlows` 返回类型问题（应为 `Promise<void>` 而非 `void`）。如果第一次直接放行，这个类型问题可能进入生产。

**教训**: 文档审查的价值不是文档本身，而是强制 Architect 在结构化输出中重新审视方案完整性。极小范围 ≠ 可以跳过审查。

---

### 3. TypeScript --skipLibCheck 是临时方案

**现象**: Dev 修复后用 `pnpm tsc --skipLibCheck` 验证（跳过了 lib 检查）。PR 检查时需要完整 tsc。

**教训**: `--skipLibCheck` 掩盖 lib 类型问题。仅用于快速验证，PR 前必须全量 `tsc --noEmit`。

---

## PR 审查发现

| 项目 | 描述 |
|------|------|
| 原 PRD 范围 | useAIController.ts import 修复（1行） |
| 实际修复 | import 修复 + flowStore 返回类型 `Promise<void>` |
| 超出范围 | flowStore.ts 类型修复不在原 PRD 中，但是相关兼容性问题，属于合理范围扩展 |

---

## 文档引用

- PRD: `/root/.openclaw/vibex/docs/vibex-backend-build-0411/prd.md`
- 分析: `/root/.openclaw/vibex/docs/vibex-backend-build-0411/analysis.md`
- Feature specs: `/root/.openclaw/vibex/docs/vibex-backend-build-0411/specs/`
