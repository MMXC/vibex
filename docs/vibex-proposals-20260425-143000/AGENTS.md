# VibeX Sprint 9 开发约束

**版本**: v1.0
**日期**: 2026-04-25
**Agent**: architect
**项目**: vibex-proposals-20260425-143000

---

## 1. 全局约束（所有 Epic 强制遵守）

### 1.1 代码质量

- [ ] `pnpm lint && pnpm typecheck` 必须通过才能提 PR
- [ ] TypeScript strict 模式（无 `as any`，无 `// @ts-ignore`）
- [ ] 组件使用 CSS Modules（`.module.css`），禁止内联 `style={{}}`（DESIGN.md 已有变量的场景）
- [ ] 所有新组件必须加 `data-testid`，用于 Playwright E2E 定位
- [ ] 新增 `import` 需确认 `design-tokens.css` 中有对应变量

### 1.2 Git 规范

- 分支命名: `s9-{epic}-{feature}`（如 `s9-e1-analytics-widget`）
- Commit message: `feat/fix/refactor: <description>`（参考 CLAUDE.md）
- PR 需 reviewer 审查后才能合并

### 1.3 测试规范

| 层级 | 覆盖率目标 | 框架 |
|------|-----------|------|
| 单元测试 | ≥ 80% | Vitest |
| E2E 测试 | 路径覆盖 ≥ 80% | Playwright |

- [ ] 每个 Story 至少一个 Vitest 文件（`*.test.ts` / `*.test.tsx`）
- [ ] 每个 Story 至少一个 Playwright 文件（`*.spec.ts`）
- [ ] E2E 测试文件统一放在 `tests/e2e/`
- [ ] 单元测试文件放在同目录 `*.test.ts`

### 1.4 生产环境

- 前端部署: Cloudflare Pages（自动部署）
- API 地址: `https://api.vibex.top`
- 前端地址: `https://vibex-app.pages.dev`
- 生产验证: gstack 或 CI/CD 部署后测试

---

## 2. Epic 专用约束

### E1: Analytics

| 约束 | 说明 |
|------|------|
| 禁止引入新图表库 | AnalyticsWidget 必须纯 SVG（无 recharts / chart.js） |
| 错误不阻断用户 | Analytics 异常静默失败（不 throw，不弹 toast） |
| 四态必须完整 | idle / loading / success / error 四态均有 UI |
| API 修复优先 | E1-S1 完成后才能开发 E1-S2 |
| `data-testid` 规范 | `analytics-skeleton` / `analytics-empty` / `analytics-error` |

**白名单依赖**（仅限 E1）: 无新依赖

**黑名单依赖**:
- recharts
- chart.js
- victory
- any other charting library

### E2: Teams

| 约束 | 说明 |
|------|------|
| 状态管理 | 使用 TanStack Query（`useQuery` / `useMutation`），**禁止使用 Zustand** |
| 乐观更新 | 通过 `onMutate` + `onError` + `onSettled` 实现 |
| E2E 测试数 | 必须 ≥ 8 个用例 |
| Console 清洁 | Console 无 error 级别日志 |
| 生产验证 | 必须 gstack 验证 `/dashboard/teams` 可访问 |

**白名单依赖**（仅限 E2）: 无新依赖

**黑名单依赖**:
- Zustand（Teams 状态管理）

### E3: Firebase 实时协作

| 约束 | 说明 |
|------|------|
| 前置条件 | Sprint 8 P002 验证通过，否则 **不启动** |
| SDK 控制 | Firebase SDK bundle 必须 < 50KB（避免影响冷启动） |
| 冷启动验证 | E3-S1 开发前重新测量冷启动，确保 < 500ms |
| Cursor 同步 | React Flow 内实现，禁止修改 React Flow 源码 |
| 冲突解决 | ConflictBubble 必须含节点 ID（格式 `node-[a-z0-9]+`） |
| 并发测试 | 5 用户并发场景必须测试通过 |

**⚠️ 条件触发**: 若 Sprint 8 验证失败，本 Epic 全部延后到 Sprint 10，并切换到 PartyKit/HocusPocus。

**白名单依赖**（仅限 E3）: Firebase SDK（已安装）

**黑名单依赖**:
- Socket.io
- PeerJS（除非 Firebase 验证失败后的备选方案）

### E4: DDL/PRD Generator

| 约束 | 说明 |
|------|------|
| 类型覆盖 | 7/7 类型（VARCHAR/INT/DATE/ENUM/JSONB/UUID/ARRAY） |
| DDL 可执行 | 生成的 DDL 必须在 pgAdmin 可执行 |
| JSON Schema | 必须含 `type` / `properties` / `required` 字段 |
| 预览无刷新 | Tab 切换不触发页面刷新（纯客户端渲染） |
| Markdown 渲染 | 使用 `react-markdown`（如已安装）或手动实现 |

**白名单依赖**（仅限 E4）:
- react-markdown（若 Generator 页面需渲染 Markdown）

**黑名单依赖**:
- 禁止引入大型 DDL 解析库（手写正则即可，DDLGenerator 逻辑简单）

### E5: Canvas 性能

| 约束 | 说明 |
|------|------|
| 基线优先 | E5-S1 必须先完成基线测量，再做优化 |
| 无回归 | 优化后 Performance score 不低于基线 -5% |
| FPS 目标 | 节点 100 时 FPS ≥ 30 |
| 虚拟化 | `react-window` 按需引入，不强制 |
| 测量工具 | 使用 Chrome DevTools Profiler + Lighthouse |

**白名单依赖**（仅限 E5）:
- react-window（条件引入）

**黑名单依赖**:
- react-virtualized（已被 react-window 取代）

### E6: Canvas 全局搜索

| 约束 | 说明 |
|------|------|
| 纯前端实现 | 搜索不依赖后端（仅前端过滤当前 canvas 节点） |
| 响应时间 | 搜索响应 < 200ms（使用 `useMemo` 优化） |
| 高亮规范 | 使用 `<mark>` 标签包裹匹配文本 |
| 快捷键 | `/` 聚焦，`Escape` 关闭，不与已有快捷键冲突 |
| 搜索框位置 | Canvas 工具栏右侧，宽度 240px |

**白名单依赖**（仅限 E6）: 无新依赖

**黑名单依赖**:
- Algolia
- Typesense
- 任何后端搜索服务

---

## 3. Epic 间依赖约束

```
E1-S1 → E1-S2  （API 修复 → 前端展示）
E2-S1 → E2-S2  （生产验证 → E2E 补全）
Sprint 8 P002 → E3-S1/E3-S2/E3-S3  （Firebase 验证通过 → 协作功能）
E5-S1 → E5-S2  （基线建立 → 性能优化）
E6-S1 → E6-S2  （搜索功能 → 快捷键）
E4-S2 → E4-S3  （PRD 双格式 → 预览面板）
```

**强制**: 上游未完成前，下游不得开发。

---

## 4. 驳回红线

以下情况 dev 必须驳回，不允许合并：

| 规则 | 描述 |
|------|------|
| R-1 | `pnpm lint` 或 `pnpm typecheck` 失败 |
| R-2 | Vitest 测试有 FAIL |
| R-3 | Playwright E2E 有 FAIL |
| R-4 | E1 引入了图表库依赖（recharts / chart.js） |
| R-5 | E2 使用 Zustand 管理 Teams 状态 |
| R-6 | E3 在 Sprint 8 验证未通过时启动 |
| R-7 | E5 优化后 Lighthouse Performance 低于基线 -5% |
| R-8 | E4 DDL 生成的 SQL 在 pgAdmin 不可执行 |
| R-9 | 新增组件缺少 `data-testid` 属性 |
| R-10 | Console 出现 error 级别日志（E2 专用） |

---

## 5. 验收检查清单

每个 Story 完成前必须自检：

- [ ] `pnpm lint && pnpm typecheck` → 0 errors
- [ ] `npx vitest run` → 100% pass
- [ ] `npx playwright test` → 100% pass
- [ ] gstack 验证（或 CI/CD 部署后测试）
- [ ] Commit message 符合 `feat/fix/refactor:` 格式
- [ ] PR 已 review 并合并

---

## 6. 执行决策

- **决策**: 已采纳
- **执行项目**: team-tasks 项目 ID 待 coord 补充
- **执行日期**: 2026-04-25
