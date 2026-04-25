# VibeX Sprint 9 实施计划

**版本**: v1.0
**日期**: 2026-04-25
**Agent**: architect
**项目**: vibex-proposals-20260425-143000

---

## Sprint 9 批次规划

### 第一批次（3.5d，立即执行，零依赖）

| Epic | Story | 工时 | 担当 | 依赖 |
|------|-------|------|------|------|
| E1 | E1-S1 后端 API 修复 | 0.5d | dev | 无 | ✅ |
| E1 | E1-S2 前端 Widget | 1d | dev | E1-S1 | ✅ |
| E2 | E2-S1 生产验证 | 0.5d | dev | 无 |
| E2 | E2-S2 E2E 补全 | 1.5d | dev | E2-S1 |

### 第二批次（2d，零依赖）

| Epic | Story | 工时 | 担当 | 依赖 |
|------|-------|------|------|------|
| E4 | E4-S1 DDL 类型扩展 | 1d | dev | 无 |
| E4 | E4-S2 PRD 双格式 | 0.5d | dev | 无 |
| E4 | E4-S3 PRD 预览面板 | 0.5d | dev | E4-S2 |

### 第三批次（3d，条件性执行）

| Epic | Story | 工时 | 担当 | 依赖 |
|------|-------|------|------|------|
| E3 | E3-S1 多用户 Presence | 2d | dev | Sprint 8 P002 验证通过 |
| E3 | E3-S2 Cursor 同步 | 1.5d | dev | E3-S1 |
| E3 | E3-S3 ConflictBubble 增强 | 0.5d | dev | E3-S1 |

> ⚠️ E3 Epic 条件：Sprint 8 P002-S1（Firebase Architect 评审）和 P002-S2（冷启动 < 500ms）必须通过。否则延后到 Sprint 10 并切换 PartyKit/HocusPocus。

### 备选池（时间允许时执行）

| Epic | Story | 工时 | 担当 | 依赖 |
|------|-------|------|------|------|
| E5 | E5-S1 性能基线 | 0.5d | dev | 无 |
| E5 | E5-S2 三树优化 | 1.5-2d | dev | E5-S1 |
| E6 | E6-S1 Canvas 搜索 | 1d | dev | 无 |
| E6 | E6-S2 键盘快捷键 | 0.5d | dev | E6-S1 |

---

## 详细任务分解

### E1-S1: 后端 API 修复（0.5d）

**状态**: ✅ 完成
**Commit**: `83b2caac9 fix(e1-api): graceful degradation for analytics GET/health endpoints`
**分支**: `s9-e1-analytics-fix`

**执行步骤**:
1. 拉取 `vibex-backend`，定位 `src/routes/v1/analytics.ts`
2. 排查生产日志，确认 500 根因（RTDB 超时 / D1 查询异常）
3. 添加 try-catch，RTDB 超时时返回空数组 `[]` 而非 500
4. 错误注入测试：模拟 RTDB 超时，确保返回 200
5. `curl https://api.vibex.top/api/v1/analytics` 验证 200

**交付物**: `vibex-backend/src/routes/v1/analytics.ts` 修复后通过 API 测试

**分支**: `s9-e1-analytics-fix`

---

### E1-S2: 前端 AnalyticsWidget（1d）

**状态**: ✅ 完成
**Commit**: `21005374e feat(e1-widget): add AnalyticsWidget with pure SVG line chart`
**分支**: `s9-e1-analytics-fix`

**执行步骤**:
1. 新建 `src/components/dashboard/AnalyticsWidget.tsx`
   - 四态: idle / loading / success / error
   - 纯 SVG 折线图（无 recharts 依赖）
   - `data-testid` 标注: `analytics-skeleton` / `analytics-empty` / `analytics-error`
2. 在 `src/app/dashboard/page.tsx` 中集成 widget（延迟加载 `loading="lazy"`）
3. 写 `src/components/dashboard/AnalyticsWidget.test.ts`（Vitest）
4. 写 `tests/e2e/analytics-widget.spec.ts`（Playwright）
5. `pnpm lint && pnpm typecheck`

**交付物**: AnalyticsWidget 组件 + 测试 + Dashboard 集成

**分支**: `s9-e1-analytics-widget`

---

### E2-S1: Teams 生产验证（0.5d）

**执行步骤**:
1. `cd vibex-fronted && pnpm dev`
2. gstack 访问 `/dashboard/teams`
3. 验证 h1 包含 "Teams" + `.teams-list` 可见
4. 测试 401 / 404 / 空态 UI
5. 记录测试结果到 `docs/vibex-proposals-20260425-143000/specs/teams-integration.md`

**交付物**: Teams 页面生产环境验证报告

**分支**: `s9-e2-teams-verification`

---

### E2-S2: E2E 测试补全（1.5d）

**执行步骤**:
1. 读取现有 `tests/e2e/teams-ui.spec.ts`（4 个测试 E3-U1 ~ U4）
2. 新增 4 个测试场景:
   - E3-U5: 404 路由 → `.teams-error` 可见
   - E3-U6: 网络错误 mock（`route.abort()`）→ `teams-network-error`
   - E3-U7: 成员视角登录 → settings 按钮隐藏
   - E3-U8: 重复创建同名团队 → "已存在" 错误
3. `npx playwright test teams-ui.spec.ts`，确保 8+ 测试 100% 通过
4. Console 无 error 级别日志验证

**交付物**: `tests/e2e/teams-ui.spec.ts` 扩展到 8+ 用例

**分支**: `s9-e2-teams-e2e`

---

### E4-S1: DDL 类型扩展（1d）

**执行步骤**:
1. 定位 `DDLGenerator` 实现（可能在 `src/lib/generators/ddl.ts`）
2. 新增 4 种类型映射:
   - `ENUM` → `CHECK` 约束
   - `JSONB` → JSONB 类型
   - `UUID` → UUID + `gen_random_uuid()`
   - `ARRAY` → `INTEGER[]`
3. 新增 `CREATE INDEX` 语句生成
4. 写 `generators.test.ts`（Vitest），覆盖 7 种类型
5. E2E: DDL 在 pgAdmin 可执行验证

**交付物**: DDLGenerator v2（7 种类型 + 索引）

**分支**: `s9-e4-ddl-extend`

---

### E4-S2: PRD 双格式输出（0.5d）

**执行步骤**:
1. 定位 `PRDGenerator` 实现
2. 修改输出结构: `{ markdown: string, jsonSchema: object }`
3. JSON Schema 生成逻辑（type inference from schema）
4. 写 `generators.test.ts` 测试 JSON Schema 结构

**交付物**: PRDGenerator v2（Markdown + JSON Schema）

**分支**: `s9-e4-prd-schema`

---

### E4-S3: PRD 预览面板（0.5d）

**执行步骤**:
1. 在 Generator 页面（`/dashboard/generators`）添加 `PRDPreviewPanel`
2. 两个 Tab: `tab-markdown` (react-markdown) / `tab-json` (pre + 语法高亮)
3. `data-testid="prd-preview-panel"`, `tab-markdown`, `tab-json`
4. Playwright 测试 Tab 切换

**交付物**: PRD 预览面板（含 Tab 切换）

**分支**: `s9-e4-prd-preview`

---

### E3-S1: 多用户 Presence（2d，条件执行）

**执行步骤**:
1. Sprint 8 P002 验证通过后启动
2. 新建 `src/components/canvas/PresenceIndicator.tsx`
3. 复用 `src/lib/firebase/presence.ts` REST API 方式
4. 5 用户并发测试（PresenceIndicator 数量 = 5）
5. 用户离开后 indicator 即时消失

**交付物**: PresenceIndicator + Firebase presence 逻辑

**分支**: `s9-e3-presence`

---

### E3-S2: Cursor 同步（1.5d，条件执行）

**执行步骤**:
1. 在 React Flow `onMove` 事件中广播 Cursor 位置到 RTDB
2. `onValue` 监听其他用户 Cursor
3. 新建 `RemoteCursor` SVG 组件（绝对定位）
4. 5 用户并发 Cursor 同步延迟测量 < 500ms

**交付物**: RemoteCursor + Firebase RTDB 同步

**分支**: `s9-e3-cursor`

---

### E3-S3: ConflictBubble 增强（0.5d，条件执行）

**执行步骤**:
1. 修改 `src/components/canvas/ConflictBubble.tsx`
2. 新增 `.node-id`（格式 `node-[a-z0-9]+`）
3. 新增 `.conflict-hint`（文案含"接受"/"拒绝"/"合并"）
4. "接受" 按钮点击后 Bubble 消失

**交付物**: ConflictBubble 增强版

**分支**: `s9-e3-conflict`

---

### E5-S1: 性能基线（0.5d，备选）

**执行步骤**:
1. `npx lighthouse https://vibex.top/canvas --output json --output-path reports/lighthouse-baseline.json`
2. 存档到 `reports/lighthouse-baseline.json`
3. 记录 Performance score 作为基线

**交付物**: Lighthouse 基线报告

**分支**: `s9-e5-baseline`

---

### E5-S2: 三树优化（1.5-2d，备选）

**执行步骤**:
1. React Profiler 定位重渲染节点
2. `React.memo` + `useMemo` 减少不必要渲染
3. 按需引入 `react-window` 虚拟化大节点集
4. FPS 测量 ≥ 30，三树切换 < 200ms
5. Lighthouse 回归验证

**交付物**: Canvas 性能优化

**分支**: `s9-e5-optimize`

---

### E6-S1: Canvas 搜索（1d，备选）

**执行步骤**:
1. 新建 `src/components/canvas/CanvasSearch.tsx`
2. `useMemo` 过滤节点，`data-testid="canvas-search-input"`
3. 结果 Popover，最多 10 条，含 `.search-highlight` 高亮
4. 无匹配时显示"未找到"
5. `search.test.ts` + 响应时间 < 200ms 断言

**交付物**: CanvasSearch 组件 + 测试

**分支**: `s9-e6-search`

---

### E6-S2: 键盘快捷键（0.5d，备选）

**执行步骤**:
1. `useEffect` 监听 `keydown`
2. `/` 键聚焦搜索框
3. Escape 关闭搜索（blur + 清空 query）
4. Playwright 测试快捷键

**交付物**: 键盘快捷键功能

**分支**: `s9-e6-hotkey`

---

## Sprint 9 总工时估算

| 批次 | Epic | 工时合计 |
|------|------|---------|
| 第一批次 | E1 + E2 | 3.5d |
| 第二批次 | E4 | 2d |
| 第三批次（条件） | E3 | 4d |
| 备选池 | E5 + E6 | 3.5-4d |

**Sprint 9 总容量**: 5.5d（第一 + 第二批次）+ 条件 4d

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: team-tasks 项目 ID 待 coord 补充
- **执行日期**: 2026-04-25
