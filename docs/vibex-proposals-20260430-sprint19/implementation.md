# E19-1 实现方案 — Design Review 真实 MCP 集成

## 背景
E19-1 的目标是消除 `useDesignReview` 中的 `setTimeout(1500)` mock，将前端接入真实的后端 review 逻辑。

## 分析

### 现有代码结构
- `vibex-fronted/src/hooks/useDesignReview.ts` — 包含 mock 实现（setTimeout 1500 + 硬编码假数据）
- `packages/mcp-server/src/tools/reviewDesign.ts` — 后端核心逻辑（`reviewDesign()` 函数）
- `vibex-backend/src/lib/prompts/designCompliance.ts` — 颜色/字体/间距合规检查
- `vibex-backend/src/lib/prompts/a11yChecker.ts` — WCAG 合规检查
- `vibex-backend/src/lib/prompts/componentReuse.ts` — 组件复用分析
- `vibex-fronted/src/components/design-review/ReviewReportPanel.tsx` — 已实现 UI
- `vibex-fronted/tests/e2e/design-review.spec.ts` — E2E 测试文件存在但只测 UI

### 影响范围
- `useDesignReview.ts` — 核心改动
- `ReviewReportPanel.tsx` — 优雅降级（已有部分状态，缺 error 文案和 empty 状态引导）
- E2E 测试 — 需覆盖真实 API 路径
- 新增 API Route — `/api/mcp/review_design`

### 依赖关系
S1(API Route) → S2(Hook) → S3(UI降级) → S4(E2E)

## 方案设计

### 方案A（推荐）：内联核心逻辑到 API Route
- 在 `route.ts` 中内联 `reviewDesign` 核心逻辑（直接 import 后端 checker 函数）
- 优点：零额外依赖，类型一致，单点维护
- 缺点：需要同步后端 checker 签名

### 方案B：MCP stdio transport
- 通过 child_process spawn 调用 MCP server
- 缺点：每次请求多一个进程，性能差
- 已排除

### 实施步骤

#### S1: API Route 桥接层
1. 创建 `/api/mcp/review_design/route.ts`
2. Import 后端 checker 函数
3. 实现请求解析、响应格式化、错误处理

#### S2: Hook 接入
1. 修改 `callReviewDesignMCP`，移除 mock，调用 API Route
2. 添加适配层（DesignReviewReport → DesignReviewResult）

#### S3: 优雅降级
1. 更新 `ReviewReportPanel` 的 error state 文案
2. 添加 empty state 文案（"暂无评审结果，按 Ctrl+Shift+R 触发评审"）
3. 添加重试按钮

#### S4: E2E 测试
1. 更新 `design-review.spec.ts`
2. 添加 TC1（真实 API 调用）、TC2（非假数据验证）、TC3（降级路径）

## 验收标准
- [ ] `tsc --noEmit` 在 frontend 目录 0 errors
- [ ] `grep -r "setTimeout.*1500\|// Mock\|simulated" src/hooks/useDesignReview` → 0 matches
- [ ] `pnpm run build` 0 errors
- [ ] E2E 测试通过

## 回滚计划
- 如 API Route 失败，回退到 hook 中的 mock（保留当前行为）
- 如 monorepo import 失败，复制核心逻辑到 route.ts 内

## 变更文件清单
| 文件 | 操作 |
|------|------|
| `vibex-fronted/src/app/api/mcp/review_design/route.ts` | 新增 |
| `vibex-fronted/src/hooks/useDesignReview.ts` | 修改 |
| `vibex-fronted/src/components/design-review/ReviewReportPanel.tsx` | 修改 |
| `vibex-fronted/tests/e2e/design-review.spec.ts` | 修改 |