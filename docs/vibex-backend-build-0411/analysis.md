# Phase1 需求分析报告：vibex-backend Cloudflare Workers 构建修复

**项目**: vibex-backend-build-0411
**阶段**: analyze-requirements
**产出时间**: 2026-04-11 15:20 GMT+8
**Analyst**: analyst

---

## 1. Research 成果

### 1.1 历史经验搜索（docs/learnings/）

通过子代理搜索，发现以下高关联度历史文档：

| 文档 | 核心教训 | 关联度 |
|------|---------|--------|
| `.learnings/vibex-backend-p0-20260405.md` | OPTIONS 预检被 authMiddleware 拦截；Workers 需 `isWorkers()` 检测；JWT_SECRET 缺失报 500 | 🔴 高 |
| `.learnings/vibex-backend-deploy-stability.md` | SSE 流必须有 AbortController 超时兜底；PrismaClient 只能 dev 加载；Cache API 限流 | 🔴 高 |
| `vibex-backend-deploy-stability/analysis.md` | 详细 7 个风险的根因+修复方案，涵盖 CORS、限流、Prisma、SSE 超时 | 🔴 高 |
| `output/backend-build-fix-analysis.md` | `generateToken()` 签名变更导致多处 build error，涉及 4 个文件 | 🟡 中 |
| `output/build-error-fix-analysis.md` | JWT_SECRET 类型为 `string | undefined` 导致 `jwt.sign()` 类型报错 | 🟡 中 |
| `vibex-canvas-deploy/analysis.md` | 双部署（Vercel vs CF Pages）配置不一致导致 404 | 🟡 中 |
| `archive/.../review-report-cloudflare-build.md` | `next.config.ts` + `wrangler.toml` 完整配置规范 | 🔴 高 |

**关键模式识别**：
1. **路由注册顺序错误**（OPTIONS 在 authMiddleware 之后）是 CORS 500 的 P0 根因
2. **Unicode 弯引号**是本项目反复出现的 build error 来源（已有记录）
3. **Prisma 在 Workers 环境**必须条件加载，不能全局 import
4. **SSE 流**必须有 AbortController 超时兜底

### 1.2 Git History 分析

```
cd1814a8 [S2-1] feat: useAIController SSE streamGenerate integration with fallback
3695c569 fix(backend): remove duplicate /** JSDoc header from 57 legacy route files
```

- 最近一次构建修复（3695c569）清理了 57 个文件的重复 JSDoc 头，与 Unicode 引号问题同属代码污染类 bug
- S2-1 的 `useAIController` 集成引入了新的导入错误

---

## 2. 当前构建状态验证

### 2.1 Backend Build（vibex-backend）

```bash
$ cd vibex-backend && npm run build
✓ Compiled successfully
✓ Build: exit code 0 ✅
```

**结论**: Backend build 已自动修复（Unicode 弯引号问题已被处理），无构建障碍。

### 2.2 Frontend Build（vibex-fronted）- Cloudflare Pages

```bash
$ cd vibex-fronted && npm run build
✗ TypeScript Error

./src/hooks/canvas/useAIController.ts:21:1
Export "canvasSseApi" doesn't exist in target module

Import traces:
  useAIController.ts → CanvasPage.tsx → canvas/page.tsx
```

**根因**: `useAIController.ts` 第 21 行导入 `canvasSseApi`，第 143 行调用 `canvasSseApi.canvasSseAnalyze(...)`。但 `canvasSseApi.ts` 仅导出 `canvasSseAnalyze` 函数，无 `canvasSseApi` 命名空间对象。

```typescript
// 当前错误代码
import { canvasSseApi } from '@/lib/canvas/api/canvasSseApi';  // ❌ 不存在
await canvasSseApi.canvasSseAnalyze(requirementInput, {...}); // ❌

// 正确写法
import { canvasSseAnalyze } from '@/lib/canvas/api/canvasSseApi';  // ✅
await canvasSseAnalyze(requirementInput, {...});                    // ✅
```

**影响范围**: 仅 1 个文件（`useAIController.ts`），影响 Canvas 页面 SSR 和客户端渲染。

---

## 3. 业务场景分析

### 3.1 问题背景

VibeX 前端（部署在 Cloudflare Pages via wrangler.toml）构建失败，导致：
- 新代码无法部署到 `dev.vibex.top` / `vibex.top`
- Canvas 功能（包括 AI 生成、SSE 流）无法上线
- 影响所有用户

### 3.2 目标用户

- VibeX 所有终端用户（Canvas 页面是核心功能）
- Dev 团队（无法 CI/CD 部署）

### 3.3 核心价值

- 恢复前端构建 → 解除部署阻断
- 确保 Canvas SSE 流功能（`canvasSseAnalyze`）正常工作

---

## 4. 技术方案选项

### 方案 A：最小修复（推荐）

**改动**: 修复 `useAIController.ts` 中的导入语句

```typescript
// src/hooks/canvas/useAIController.ts
// 修改前
import { canvasSseApi } from '@/lib/canvas/api/canvasSseApi';

// 修改后
import { canvasSseAnalyze } from '@/lib/canvas/api/canvasSseApi';
```

同时将所有 `canvasSseApi.canvasSseAnalyze(...)` 替换为 `canvasSseAnalyze(...)`。

**优点**: 最小改动，1 行修复，零风险
**缺点**: 无

### 方案 B：导出兼容层

在 `canvasSseApi.ts` 中新增兼容导出：

```typescript
// src/lib/canvas/api/canvasSseApi.ts
export const canvasSseApi = {
  canvasSseAnalyze,
};
```

**优点**: 不改消费端代码
**缺点**: 引入了不必要的兼容层，增加维护负担；掩盖了原始导入错误

### 方案 C：类型 + 导入全面重构

系统检查 `canvasSseApi.ts` 中所有导出，确保命名一致性。

**优点**: 彻底消除命名混乱
**缺点**: 范围扩大，可能引入新问题

---

## 5. 可行性评估

| 维度 | 评估 |
|------|------|
| 技术难度 | **极低** — 仅 1 个文件，2 处修改 |
| 工期 | **5 分钟** — 改 import 语句即可 |
| 回滚成本 | **零** — 一行 git revert |
| 测试成本 | **低** — 运行 `npm run build` 即可验证 |

**结论**: 技术上完全可行，无任何障碍。

---

## 6. 风险矩阵

| 风险 | 可能性 | 影响 | 评级 | 缓解 |
|------|--------|------|------|------|
| 修复后仍有其他 TS 类型错误 | 低 | 高 | 🟡 中 | 修复后立即 `npm run build` 验证 |
| Canvas SSE 流功能损坏 | 低 | 高 | 🟡 中 | 对比 `canvasSseAnalyze` API 与原调用参数一致性 |
| wrangler.toml 配置不一致 | 低 | 中 | 🟢 低 | wrangler.toml 配置已通过历史文档验证 |
| Unicode 弯引号在其他文件复发 | 中 | 高 | 🟡 中 | 建议添加 lint 规则检测 Unicode 引号 |

---

## 7. 历史模式警示

| 模式 | 发生次数 | 本次状态 |
|------|---------|---------|
| Unicode 弯引号导致 build error | 2 | ✅ 已修复（backend） |
| `canvasSseApi` 命名不一致 | 1 | ❌ 待修复（frontend） |
| Prisma Workers 环境打包问题 | 2 | ⚠️ 待观察 |
| OPTIONS 路由顺序错误 | 2 | ✅ 当前未触发 |

**建议**: 添加 ESLint 规则 `no-irregular-whitespace` 防止 Unicode 引号再次出现。

---

## 8. 验收标准（具体可测试）

- [ ] `cd vibex-fronted && npm run build` 退出码为 0，无 TypeScript 错误
- [ ] `canvasSseAnalyze` 函数参数与原调用参数一致（S2-1 集成后端已就绪）
- [ ] Canvas 页面在 dev 模式下正常加载（`npm run dev`）
- [ ] wrangler.toml `pages_build_output_dir = "./out"` 与 `next.config.ts` 的 `distDir = "out"` 一致
- [ ] 无 Unicode 弯引号残留（`grep -rn "'" src/` 应无 JS/TS 文件匹配）

---

## 9. 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-backend-build-0411
- **执行日期**: 2026-04-11

**下一步**: 派 Dev 执行方案 A 最小修复，然后进入 `create-prd` 阶段。

---

## 附录：关键文件路径

| 文件 | 状态 | 说明 |
|------|------|------|
| `vibex-fronted/src/hooks/canvas/useAIController.ts` | ❌ 需修复 | 第 21 行导入错误 |
| `vibex-fronted/src/lib/canvas/api/canvasSseApi.ts` | ✅ 正常 | 导出 `canvasSseAnalyze` |
| `vibex-backend/src/app/api/agents/route.ts` | ✅ 已修复 | Unicode 引号已清理 |
| `vibex-backend/src/app/api/pages/route.ts` | ✅ 已修复 | Unicode 引号已清理 |
| `vibex-backend/src/app/api/prototype-snapshots/route.ts` | ✅ 已修复 | Unicode 引号已清理 |
| `vibex-fronted/wrangler.toml` | ✅ 正常 | pages_build_output_dir = "./out" |
