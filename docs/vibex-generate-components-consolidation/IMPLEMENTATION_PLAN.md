# Implementation Plan: Generate Components Consolidation

> **项目**: vibex-generate-components-consolidation  
> **阶段**: Implementation Plan  
> **日期**: 2026-04-06  
> **版本**: v2.0 (adapted from v1.0)

---

## 概述

本计划描述如何将两套 `generate-components` 实现合并为单一实现。

## 现状分析

**实际文件位置**（v2.0 路径）：

| 实现 | 路径 | URL | 状态 |
|------|------|-----|------|
| Next.js | `src/app/api/v1/canvas/generate-components/route.ts` | `/api/canvas/generate-components` | ⚠️ 未被前端调用 |
| Hono | `src/routes/v1/canvas/index.ts` (line 260+) | `/v1/canvas/generate-components` | ✅ 生产主力 |

**前端调用**: `https://api.vibex.top/api/v1/canvas/generate-components` → Hono route

**问题**:
1. Hono prompt 缺少 context 信息（只有 flowSummary，无 contextSummary）
2. Hono 组件输出缺少 `contextId` 字段
3. Next.js prompt 更好（含 contextSummary + contextId 约束），但未被使用

---

## 决策

保留 **Hono route** 作为生产实现（因为前端调用它），合并 Next.js 的优点：
- ✅ 统一 prompt（含 contextSummary + flowSummary）
- ✅ 组件输出包含 contextId
- ✅ 更完善的类型和验证

---

## Epic1: 合并 API 函数 ✅ DONE

### Step 1: 对比两份实现 ✅ (0.1h)
已确认 Next.js route 有更好的 prompt（含 contextSummary + contextId 约束）

**Next.js route.ts 优点**:
- `contextSummary` 包含 `ctx.id` + description → AI 知道真实 context ID
- Prompt 约束 `contextId` 必须来自 ctx-xxx 格式
- 组件输出包含 `contextId` 字段

**Hono index.ts 缺陷**:
- prompt 只有 `flowSummary`，无 context 信息
- 组件输出缺少 `contextId` 字段

### Step 2: 标记废弃 (0.05h) ⚠️ N/A

> Hono 是生产主力，不标记废弃。合并到 Hono。

### Step 3: 统一 Prompt (0.5h) ✅ DONE

**执行**： ✅ DONE
1. 读取 Next.js `USER_PROMPT` 模板 ✅
2. 在 Hono `componentPrompt` 中添加 `contextSummary` ✅
3. 在组件 schema 中添加 `contextId: string` 约束 ✅
4. 在响应处理中添加 contextId 映射 ✅

**验收**：
- [x] Hono prompt 包含 contextSummary ✅
- [x] AI 被要求输出 contextId ✅
- [x] 组件响应包含 contextId ✅

### Step 4: 迁移调用方 (0.1h) ✅ DONE

> 前端已调用 Hono，无需迁移。API_CONFIG 正确指向 `/v1/canvas/generate-components`（Hono route）。

### Step 5: 更新测试 (0.3h)

**执行**：
1. 运行现有 generate-components 测试
2. 添加 contextId 验证测试

**验收**：
- [ ] `npm test -- --grep "generate-components"` 通过
- [ ] contextId 在组件响应中存在

### Step 6: 清理废弃代码 (0.1h) ⚠️ N/A

> Next.js route.ts 保留（未来可能迁移到 Next.js 部署）

---

## 回滚计划

| 步骤 | 操作 |
|------|------|
| 1 | 回滚 Hono componentPrompt 到原版本 |
| 2 | 移除 contextId 映射逻辑 |
