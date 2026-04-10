# VibeX 构建修复 — 技术架构设计

**项目**: vibex-build-fixes-20260411
**角色**: Architect
**日期**: 2026-04-11
**状态**: 设计完成

---

## 1. 背景与目标

### 1.1 问题背景

VibeX monorepo 存在两个阻塞性构建错误：

| # | 问题 | 严重度 | 根因 |
|---|------|--------|------|
| 1 | 前端构建失败：TypeScript 编译错误 | 🔴 高 | `CanvasHeader.stories.tsx` 引用已删除的 `CanvasHeader` 组件 |
| 2 | 后端构建失败：Unicode 弯引号 | 🔴 高 | 3个 API route 使用了 `'''` 而非标准引号 |

### 1.2 目标

- 前端 `pnpm build` 退出码 = 0
- 后端 `pnpm build` 退出码 = 0
- 修复已 commit 并 push 到 main

---

## 2. 技术分析

### 2.1 问题1: CanvasHeader.stories.tsx

**文件路径**: `vibex-fronted/src/components/canvas/stories/CanvasHeader.stories.tsx`

**错误信息**:
```
Type error: Cannot find module '../CanvasHeader' or its corresponding type declarations.
```

**根因链路**:
```
feat/e2-code-cleanup 分支删除 CanvasHeader 组件
    ↓
CanvasHeader.stories.tsx 引用了已删除的组件
    ↓
build 失败
```

**技术方案**: 删除孤立 story 文件

### 2.2 问题2: Unicode 弯引号

**受影响文件**:
- `vibex-backend/src/app/api/agents/route.ts`
- `vibex-backend/src/app/api/pages/route.ts`
- `vibex-backend/src/app/api/prototype-snapshots/route.ts`

**工作区状态**: 修复已存在于工作区（`git diff` 显示 `'''` → `"` 或 `'`）

**验证结果**: `pnpm build` 退出码 = 0 ✅

---

## 3. 架构决策

### ADR-001: 孤立的 Storybook 文件处理

**状态**: 已采纳

**决策**: 删除 `CanvasHeader.stories.tsx`

**理由**:
- 组件已被删除且无计划恢复
- 保留孤立 story 无业务价值
- 删除成本极低（1行命令）

### ADR-002: 后端构建修复策略

**状态**: 已采纳

**决策**: 确认并 commit 工作区修复

**理由**:
- 工作区已有弯引号修复，无需重新操作
- 验证 `pnpm build` 成功

---

## 4. 数据流与模块

本项目不涉及新增模块，仅为构建修复。

```
vibex-fronted/
  src/components/canvas/stories/
    - CanvasHeader.stories.tsx  ← 删除

vibex-backend/
  src/app/api/
    agents/route.ts            ← 工作区已修复
    pages/route.ts              ← 工作区已修复
    prototype-snapshots/route.ts ← 工作区已修复
```

---

## 5. 技术验证

### 5.1 前端构建验证

```bash
cd vibex-fronted && pnpm build
# 期望: 退出码 0，无 TypeScript 错误
```

### 5.2 后端构建验证

```bash
cd vibex-backend && pnpm build
# 期望: 退出码 0
# 实际: EXIT: 0 ✅
```

### 5.3 TypeScript 全面检查

```bash
cd vibex-fronted && npx tsc --noEmit
# 期望: 退出码 0
```

---

## 6. 风险评估

| 风险 | 可能性 | 影响 | 缓解 |
|------|--------|------|------|
| 其他文件引用 CanvasHeader | 低 | 低 | 全局搜索确认无引用 |
| 后端构建存在其他未知错误 | 低 | 高 | `pnpm build` 全量验证已通过 |
| feat/e2-code-cleanup 分支合并时冲突 | 低 | 中 | 本次仅处理 main 上的构建错误 |

---

## 7. 技术审查 (Self-Review)

### 审查结论

| 检查项 | 结果 | 说明 |
|--------|------|------|
| 架构可行性 | ✅ 通过 | 文件删除 + prop 修复，方案极简无风险 |
| 功能点覆盖 | ✅ 通过 | PRD 两个问题均已解决 |
| 风险评估 | ✅ 通过 | 3 个风险均已识别并有缓解方案 |
| 实施计划 | ✅ 通过 | IMPLEMENTATION_PLAN.md 包含 3 个 Story |
| 开发约束 | ✅ 通过 | AGENTS.md 约束范围清晰 |
| 代码已 push | ✅ 通过 | commit 378f8a56 已推送至 main |
| TypeScript check | ✅ 通过 | `pnpm exec tsc --noEmit` 退出码 0 |

**架构风险**: 无重大风险。此项目仅删除孤立文件和修 prop，不涉及业务逻辑。

**验证记录**:
- 前端: `pnpm exec tsc --noEmit` → EXIT: 0 ✅
- 后端: `pnpm build` → EXIT: 0 ✅
- 额外发现修复（PRD 未列但实际存在）: 6 个额外孤立 story 文件已清理

---

## 8. 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-dev-proposals-vibex-build-fixes-20260411
- **执行日期**: 2026-04-11

