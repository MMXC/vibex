# VibeX Sprint 22 开发约束 — 5 Epic 并行实施

**项目**: vibex-proposals-20260502-sprint22
**版本**: 1.0
**日期**: 2026-05-02
**架构师**: ARCHITECT

---

## 角色与职责

| 角色 | 职责 | Epic 归属 |
|------|------|---------|
| Dev | E1, E3-S2, E4, E5 实现 | MCP bridge, RBAC hook, 模板库 |
| DevOps | E2, staging 环境维护 | CI 稳定性监控 |
| Tester | 所有 Epic E2E 验证 | E3 UI, E4, E5 E2E |
| Frontend Dev | E3-S1, E3-S3 | PresenceAvatars, Toolbar |
| Architect | PR 评审, 架构决策 | 全部 |

---

## 约束清单

### E1: Design Review MCP 约束

**C-E1-1: MCP Bridge 必须实现 graceful degradation**

```typescript
// route.ts 中必须包含降级逻辑
try {
  const result = await mcpBridge.callTool('review_design', req);
  return NextResponse.json({ ...result, mcp: { called: true } });
} catch (err) {
  // 降级到内联静态分析
  const fallback = await fallbackStaticAnalysis(req);
  return NextResponse.json({ ...fallback, mcp: { called: false, error: err.message, fallback: 'static-analysis' } });
}
```

**C-E1-2: MCP 调用超时上限 5 秒**

```typescript
const result = await mcpBridge.callTool('review_design', req, { timeout: 5000 });
```

**C-E1-3: 禁止在 Design Review API route 中引入新的 npm 依赖**

理由: 保持 bundle size 稳定，不增加前端加载时间。

---

### E2: E2E 稳定性约束

**C-E2-1: Flaky rate 监控必须集成到 CI**

```yaml
# .github/workflows/test.yml e2e job 末尾
- name: E2E flaky monitor
  if: always()
  run: pnpm run e2e:flaky:monitor
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

**C-E2-2: E2E 测试禁止使用 `page.waitForTimeout`**

使用 `page.waitForSelector` 或 `page.waitForResponse` 替代 hardcoded delay。

**C-E2-3: 新增 E2E spec 必须添加 `data-testid`**

所有交互元素必须有稳定的 `data-testid`，不使用 CSS 选择器或 XPath。

---

### E3: Teams 协作 UI 约束

**C-E3-1: 权限检查必须前后端双重实现**

| 位置 | 实现 | 目的 |
|------|------|------|
| 前端 | `useCanvasRBAC` hook → 按钮 disabled | UX |
| 后端 | `/v1/projects/:id` → permissions 字段 | 安全 |

**C-E3-2: PresenceAvatars 团队标识颜色规范**

```typescript
// 颜色定义（不可更改）
const TEAM_COLORS = {
  owner: '#10b981',    // 绿色边框
  member: '#10b981',    // 绿色边框
  viewer: '#10b981',    // 绿色边框
};
const GUEST_COLOR = '#d1d5db';  // 灰色边框
```

**C-E3-3: RBAC hook 必须缓存结果**

同一 `projectId` 的权限检查，5 分钟内不重复请求 API。

```typescript
// 错误实现: 每次 render 都请求
const rbac = useCanvasRBAC(projectId); // 每次请求

// 正确实现: 缓存 5 分钟
const rbac = useCanvasRBAC(projectId, { cacheMs: 300000 });
```

**C-E3-4: DDSToolbar 修改不得破坏现有功能**

RBAC 按钮改造时，保持现有 `onClick` 处理逻辑不变，只添加 `disabled` 和 `title` 属性。

---

### E4: 模板库约束

**C-E4-1: 模板数据必须懒加载**

```typescript
// 错误: 首屏同步加载
const templates = industryTemplates; // 同步加载，阻塞渲染

// 正确: 懒加载
const { templates } = useTemplates(); // 按需加载
```

**C-E4-2: localStorage 模板必须处理 QuotaExceededError**

```typescript
try {
  localStorage.setItem('vibex:customTemplates', JSON.stringify(templates));
} catch (e) {
  if (e.name === 'QuotaExceededError') {
    // 提示用户清理旧模板或使用默认模板
    console.warn('Custom template storage full');
  }
}
```

**C-E4-3: 模板 JSON 必须包含 schema 验证**

```typescript
// public/data/industry-templates.json 每条模板必须包含:
{
  "id": string,
  "name": string,
  "description": string,
  "chapters": {
    "requirement": string,  // required
    "architecture": string  // optional, defaults to ""
  }
}
```

---

### E5: Agent E2E 约束

**C-E5-1: Agent E2E 必须使用 mock 隔离后端依赖**

```typescript
// 错误: 直接依赖真实 /api/agent/sessions
await page.click('[data-testid="agent-new-session"]');

// 正确: 使用 playwright intercept/mock
await page.route('**/api/agent/sessions', async (route) => {
  await route.fulfill({ status: 200, body: JSON.stringify(sessions) });
});
```

**C-E5-2: Agent 会话测试必须独立**

每个 `it()` 块必须创建自己的测试数据，测试间无状态共享。

```typescript
// 每个 test 块独立创建 + 清理
test.beforeEach(async ({ request }) => {
  // 创建测试会话
});
test.afterEach(async ({ request }) => {
  // 清理测试会话
});
```

---

## 禁止事项（全局）

| 禁止项 | 理由 |
|--------|------|
| 禁止在 PR 中同时修改 3 个以上 Epic 的文件 | 难以 review，增加回归风险 |
| 禁止修改 `packages/mcp-server/src/tools/reviewDesign.ts` 内部逻辑 | 已有测试覆盖，改动需 PM 确认 |
| 禁止在 E3 组件中添加新的全局状态 | 应使用 local state 或 props drilling |
| 禁止在 Playwright config 中更改 `workers: 1` | E2E 稳定性依赖单 worker |
| 禁止跳过 flaky rate 检查直接合入 | C-E2-1 是强制 CI 步骤 |

---

## PR 合入要求

**必须满足以下所有条件才能合入**:

### E1 Design Review MCP
- [ ] MCP bridge 单测通过（`pnpm test --grep "mcp-bridge"`）
- [ ] `POST /api/mcp/review_design` 响应包含 `mcp.called` 字段
- [ ] MCP server 不可用时降级返回 200（不是 500）
- [ ] `pnpm run build` → 0 errors

### E2 E2E 稳定性
- [ ] `scripts/e2e-flaky-monitor.ts` 存在且 `tsc --noEmit` 通过
- [ ] CI e2e job 中包含 flaky monitor step
- [ ] 新增 E2E spec 有 `data-testid` 覆盖率报告

### E3 Teams 协作 UI
- [ ] PresenceAvatars 区分 team/guest 边框
- [ ] `useCanvasRBAC` hook 存在且缓存逻辑正确
- [ ] DDSToolbar 按钮在非 owner 时 disabled
- [ ] 403 拦截在 API 层面生效

### E4 模板库
- [ ] `public/data/industry-templates.json` 包含 3 个行业 + 1 个 blank
- [ ] `useTemplates` hook 存在且实现懒加载
- [ ] QuotaExceededError 处理已添加

### E5 Agent E2E
- [ ] `tests/e2e/agent-timeout.spec.ts` 存在且通过
- [ ] `tests/e2e/agent-sessions.spec.ts` 存在且通过
- [ ] 无新增 flaky 测试（连续 3 次 run 验证）

---

## 代码审查清单

### 全局审查（每个 PR 必须检查）

- [ ] `pnpm exec tsc --noEmit` → 0 errors
- [ ] `pnpm run build` → 0 errors
- [ ] 无新增 `as any` 类型断言
- [ ] 新增文件已添加到 `tsconfig.json` include
- [ ] E2E spec 中无 hardcoded `waitForTimeout`

### Epic 专项审查

**E1**:
- [ ] route.ts 不含内联 `checkDesignCompliance`/`checkA11yCompliance`（已移除）
- [ ] MCP call 有 try/catch 和降级路径
- [ ] timeout 设置为 5000ms

**E2**:
- [ ] `e2e-flaky-monitor.ts` 输出格式符合接口定义
- [ ] CI yaml 中 flaky monitor step 在 e2e job 内

**E3**:
- [ ] `useCanvasRBAC` 有缓存逻辑（5 分钟）
- [ ] `PresenceAvatars` props 包含 `showTeamBadge` 和 `teamMemberIds`
- [ ] CSS 颜色使用常量定义

**E4**:
- [ ] 模板 JSON schema 验证通过
- [ ] `useTemplates` 使用 lazy load
- [ ] localStorage 操作有 QuotaExceededError 处理

**E5**:
- [ ] API 使用 `page.route` mock
- [ ] `test.beforeEach`/`test.afterEach` 清理测试数据

---

## 文件清单（新增/修改）

### E1 新增/修改

| 文件 | 操作 |
|------|------|
| `vibex-fronted/src/lib/mcp-bridge.ts` | 新增 |
| `vibex-fronted/src/app/api/mcp/review_design/route.ts` | 重构 |
| `tests/e2e/design-review-mcp.spec.ts` | 新增 |

### E2 新增/修改

| 文件 | 操作 |
|------|------|
| `scripts/e2e-flaky-monitor.ts` | 新增 |
| `.github/workflows/test.yml` | 修改（e2e job 末尾添加 step）|
| `package.json` | 修改（添加 `e2e:flaky:monitor` script）|

### E3 新增/修改

| 文件 | 操作 |
|------|------|
| `vibex-fronted/src/components/canvas/Presence/PresenceAvatars.tsx` | 修改 |
| `vibex-fronted/src/components/dds/toolbar/DDSToolbar.tsx` | 修改 |
| `vibex-fronted/src/hooks/useCanvasRBAC.ts` | 新增 |
| `tests/e2e/teams-canvas-rbac.spec.ts` | 新增 |

### E4 新增/修改

| 文件 | 操作 |
|------|------|
| `public/data/industry-templates.json` | 新增 |
| `vibex-fronted/src/components/dashboard/NewProjectModal.tsx` | 修改 |
| `vibex-fronted/src/hooks/useTemplates.ts` | 新增 |
| `tests/e2e/template-library.spec.ts` | 新增 |

### E5 新增/修改

| 文件 | 操作 |
|------|------|
| `tests/e2e/agent-timeout.spec.ts` | 新增 |
| `tests/e2e/agent-sessions.spec.ts` | 新增 |