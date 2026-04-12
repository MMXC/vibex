# Implementation Plan: vibex-backend-build-0411 — 前端构建修复

**项目**: vibex-backend-build-0411
**阶段**: design-architecture (implementation plan)
**产出时间**: 2026-04-11 15:32 GMT+8
**Agent**: architect

---

## 1. 概述

### 1.1 目标

修复 `vibex-fronted` 前端构建阻断，使 `npm run build` 退出码为 0。

### 1.2 变更范围

- `vibex-fronted/src/hooks/canvas/useAIController.ts` — 1 处导入 + 1 处调用修复

### 1.3 依赖关系

```
canvasSseApi.ts (已有，无需修改)
    ↓
useAIController.ts (修复导入和调用)
    ↓
npm run build (验证通过)
```

---

## 2. 变更详情

### 2.1 修改: `src/hooks/canvas/useAIController.ts`

#### 变更 1: 第 21 行导入语句

```diff
- import { canvasSseApi } from '@/lib/canvas/api/canvasSseApi';
+ import { canvasSseAnalyze } from '@/lib/canvas/api/canvasSseApi';
```

#### 变更 2: 第 143 行函数调用

```diff
- await canvasSseApi.canvasSseAnalyze(requirementInput, {
+ await canvasSseAnalyze(requirementInput, {
```

**说明**: 参数对象 `options` 保持不变（`onThinking`, `onStepContext`, `onDone`, `onError` 等回调）。

---

## 3. 执行步骤

| 步骤 | 操作 | 命令/动作 |
|------|------|---------|
| 1 | 修改导入行 | `sed -i 's/import { canvasSseApi }/import { canvasSseAnalyze }/' useAIController.ts` |
| 2 | 修改调用行 | `sed -i 's/canvasSseApi\\.canvasSseAnalyze/canvasSseAnalyze/' useAIController.ts` |
| 3 | 验证修改正确 | `grep -n "canvasSseAnalyze" src/hooks/canvas/useAIController.ts` |
| 4 | 运行构建 | `cd vibex-fronted && npm run build` |
| 5 | 验证构建退出码 | `echo $?` 应为 0 |

---

## 4. 验收标准（每步可测试）

- [ ] `grep -n "import.*canvasSseAnalyze" useAIController.ts` 输出第 21 行包含 `canvasSseAnalyze`
- [ ] `grep -n "canvasSseApi" useAIController.ts` 无输出（不存在该命名空间对象引用）
- [ ] `cd vibex-fronted && npm run build` 退出码为 0
- [ ] stderr 中无 `TS\d+:` TypeScript 错误

---

## 5. 回滚方案

```bash
cd vibex-fronted
git checkout -- src/hooks/canvas/useAIController.ts
```

回滚耗时：< 1 秒

---

## 6. 额外建议（非阻断）

### 6.1 添加 ESLint 规则防止 Unicode 引号

在 `eslint.config.mjs` 或 `.eslintrc.json` 中添加：

```json
{
  "rules": {
    "no-irregular-whitespace": "error",
    "no-tabs": "error"
  }
}
```

### 6.2 全局搜索确认无遗漏

```bash
grep -rn "canvasSseApi" vibex-fronted/src/
# 应无任何匹配（除 canvasSseApi.ts 自身）
```

---

## 7. 后续步骤（不在本次范围）

| 步骤 | 内容 | 依赖 |
|------|------|------|
| 1 | Dev 合并 PR 后触发 CI/CD 部署 | 本次修复完成 |
| 2 | Canary 验证 `dev.vibex.top` Canvas 功能 | 部署成功 |
| 3 | 生产灰度发布 | Canary 通过 |

---

## 8. 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-backend-build-0411
- **执行日期**: 2026-04-11

---

*本文件由 Architect Agent 生成，配套 architecture.md 使用。*
