# vibex-canvas-history-projectid — 需求分析报告

**项目**: vibex-canvas-history-projectid
**任务**: analyze-requirements
**日期**: 2026-04-14
**作者**: Analyst Agent
**状态**: ✅ 完成

---

## 1. 业务场景分析

### 1.1 问题背景

Canvas 页面（`/canvas`）的"保存历史版本"和"获取历史版本"功能存在 projectId 传递问题。

两个受影响的入口：
1. **ProjectBar** 中的"历史"按钮（`E4-F11`）→ 打开 `VersionHistoryPanel`
2. **VersionHistoryPanel** 中的"保存当前版本"按钮 → 调用 `useVersionHistory.createSnapshot()`

### 1.2 根因定位

**数据流链路**：

```
CanvasPage
  └── ProjectBar (onOpenHistory={versionHistory.open})
  └── VersionHistoryPanel (open={versionHistory.isOpen})
        └── useVersionHistory hook
              ├── loadSnapshots() → canvasApi.listSnapshots(projectId ?? undefined)
              └── createSnapshot() → canvasApi.createSnapshot({ projectId: projectId ?? null, ... })

useSessionStore (projectId: string | null)
  ├── 初始值: null (skipHydration: true)
  ├── 何时设置: ProjectBar.handleCreateProject() → setProjectId(result.projectId)
  └── 何时读取: useVersionHistory 从 store 直接订阅
```

**三类失败场景**：

| 场景 | 触发条件 | 表现 | 根因 |
|------|----------|------|------|
| A | 直接打开 `/canvas`，未创建项目 | 点击"保存"→ 400: Missing required field: projectId | `sessionStore.projectId === null`，未经过创建流程 |
| B | CanvasPage 挂载后立即点击"历史"按钮 | 加载失败，无快照列表 | `skipHydration: true` + `useEffect` 延迟 rehydrate，`projectId` 在 useCallback 闭包中仍为 null |
| C | App Router API 层 | GET /api/canvas/snapshots?projectId=null → 400 | `listSnapshots(projectId ?? undefined)` → `undefined` → `null` → query param `projectId=null` |

**关键代码证据**：

```typescript
// useVersionHistory.ts — 从 sessionStore 直接订阅，无 prop 注入
const projectId = useSessionStore((s) => s.projectId);

// loadSnapshots: projectId ?? undefined → URL 无 projectId 时 API 400
const result = await canvasApi.listSnapshots(projectId ?? undefined);

// createSnapshot: projectId ?? null → API body 中 projectId=null → 400
await canvasApi.createSnapshot({
  projectId: projectId ?? null,  // ← null 触发后端校验失败
  ...
});
```

```typescript
// sessionStore.ts — 初始 null，skipHydration
projectId: null,           // 初始值
skipHydration: true,       // 服务端/SSR 无 projectId
setProjectId: (id) => set({ projectId: id }),  // 仅在创建项目时设置
clearQueue: () => set({ prototypeQueue: [], projectId: null, projectName: null }),
```

```typescript
// canvasApi.ts — 前后端不一致
listSnapshots: async (projectId?: string) => {
  const url = projectId
    ? `${getApiUrl(API_CONFIG.endpoints.canvas.snapshots)}?projectId=${encodeURIComponent(projectId)}`
    : getApiUrl(API_CONFIG.endpoints.canvas.snapshots);
  // 无 projectId → 不带 query param → 后端 400
}

createSnapshot: async (data: CreateSnapshotInput) => {
  body: JSON.stringify(data)
  // data.projectId === null → 发送 projectId: null → 后端 400
}
```

### 1.3 受影响范围

| 功能 | 入口组件 | 当前行为 | 期望行为 |
|------|----------|----------|----------|
| 保存版本 | VersionHistoryPanel → "保存当前版本" | projectId=null → 400 | 有 projectId → 成功保存；无 projectId → 提示"请先创建项目" |
| 获取版本列表 | VersionHistoryPanel → open | 无 projectId → 400 | 同上 |
| 恢复版本 | VersionHistoryPanel → 恢复按钮 | 依赖快照列表存在 | 不受影响（restoreSnapshot 用 snapshotId 而非 projectId） |

---

## 2. 历史经验

### 2.1 Git History 相关 Commit

| Commit | 描述 | 教训 |
|--------|------|------|
| `13f7c706` | add skipHydration to 5 canvas stores + CanvasPage rehydrate | `skipHydration: true` + `useEffect` rehydrate 组合是修复 hydration mismatch 的标准方案，但引入了 B 类问题（时序依赖） |
| `f1205745` | test(e2e): F11.4 version history panel E2E tests | 版本历史已有 E2E 测试，但未覆盖 projectId=null 场景 |
| `f49ff82e` | E2E 验收测试 - VersionHistoryPanel | 同上 |

### 2.2 来自 docs/learnings/

**canvas-api-completion (2026-04-05)**
- Route 顺序敏感：Hono 中 `GET /latest` 必须在 `GET /:id` 之前，否则被 `:id` 匹配为 `id=latest`
- 教训：边界路径需测试覆盖

**react-hydration-fix**
- `skipHydration: true` 是修复 SSR/CSR mismatch 的标准方案，但会在客户端引入初始化时序问题

---

## 3. 技术方案选项

### 方案 A — Hook 层兜底：projectId 未就绪时拦截（推荐）

**思路**：在 `useVersionHistory` 内部增加 projectId 缺失的防御逻辑：
1. `loadSnapshots` 在 projectId 为 null 时，展示引导 UI（"请先创建项目"）而非发 API
2. `createSnapshot` 在 projectId 为 null 时，reject 并提示明确错误信息
3. Hook 订阅 `projectId` 变化时自动重新加载快照列表

**实现位置**：`src/hooks/canvas/useVersionHistory.ts`

```typescript
// loadSnapshots 加防护
const loadSnapshots = useCallback(async () => {
  if (!projectId) {
    setError('请先创建项目后再保存历史版本');
    setLoading(false);
    return;
  }
  // ... 原有逻辑
}, [projectId]);

// 订阅 projectId 变化自动重载
useEffect(() => {
  if (projectId && isOpen) {
    loadSnapshots();
  }
}, [projectId, isOpen, loadSnapshots]);
```

**优点**：
- 改动范围小（仅改 hook，零组件改动）
- 用户体验明确：告知"先创建项目"而非 API 错误
- 兼容已有创建项目流程

**缺点**：
- 场景 B（快速点击）仍可能失败，需额外处理
- 未解决 projectId 时序问题

**工期**：0.5d
**风险**：低

---

### 方案 B — 通过 URL/路由注入 projectId（深度修复）

**思路**：Canvas 页面支持两种模式：
1. **有项目模式**：`/canvas?projectId=xxx` → projectId 从 URL 读取
2. **无项目模式**：`/canvas` → 仅本地草稿，无服务端历史

对于无项目模式，版本历史使用 localStorage 本地快照，不调用 API。

**实现位置**：
- `src/app/canvas/page.tsx` 或 layout：读取 URL searchParams 初始化 sessionStore
- `src/hooks/canvas/useVersionHistory.ts`：分离本地快照与远程快照

```typescript
// CanvasPage useEffect
useEffect(() => {
  const urlProjectId = searchParams.get('projectId');
  if (urlProjectId && urlProjectId !== projectId) {
    setProjectId(urlProjectId);
  }
}, [searchParams, projectId, setProjectId]);
```

**优点**：
- 彻底解决 projectId 缺失问题
- 支持直接访问有项目的画布
- 本地草稿模式不影响正常用户流程

**缺点**：
- 改动较大（涉及路由、store 初始化、hook 分离）
- 需处理 URL 注入的 projectId 合法性校验
- 工期较长

**工期**：2d
**风险**：中（路由改动有回归风险）

---

### 方案 C — CanvasPage 初始化时强制 projectId 校验（快速止血）

**思路**：在 CanvasPage 加载时，若 projectId 为 null 且用户有操作历史意图，则弹窗引导创建项目。

结合方案 A 作为底层防护，方案 C 作为 UX 增强。

```typescript
// useEffect on projectId change
useEffect(() => {
  if (!projectId) {
    // 检测到用户打开了历史面板但无 projectId
    // 可以用 toast 提示或弹窗引导
  }
}, [projectId, versionHistory.isOpen]);
```

**工期**：0.5d
**风险**：低

---

## 4. 可行性评估

| 维度 | 方案 A | 方案 B | 方案 C |
|------|--------|--------|--------|
| 技术难度 | ⭐ 低 | ⭐ 高 | ⭐ 低 |
| 改动范围 | 1 个 hook | 多文件（路由+store+hook） | 1 个 useEffect |
| 工期 | 0.5d | 2d | 0.5d |
| 风险 | 低 | 中 | 低 |
| 根治程度 | 缓解 | 根治 | 辅助 |

**推荐**：方案 A + 方案 C 组合。0.5d 止血 + 2d 深度修复分 two-phase。

---

## 5. 初步风险识别

### 风险 1 — 快速点击时序（高）
用户点击"历史"按钮时，`sessionStore` 可能还未完成 rehydrate（`skipHydration: true`）。即使加了 null 检查，快速点击场景 B 仍可能漏掉。

**缓解**：Hook 中 `useEffect` 监听 projectId 变化，在 projectId 就绪后自动刷新。

### 风险 2 — API 行为不一致（中）
`listSnapshots(undefined)` → 不带 query param → 后端 400
`createSnapshot({ projectId: null })` → body 包含 null → 后端 400
两处行为略有不同，但结果相同。

**缓解**：统一在 hook 层拦截，不依赖后端返回 400。

### 风险 3 — 多标签页/多实例（低）
用户可能同时打开多个 canvas tab，每个 tab 的 sessionStore 独立。若 projectId 变更，后续 tab 可能不同步。

**缓解**：这不是本次修复范围，属于 sessionStore 架构问题。

### 风险 4 — E2E 测试覆盖不足（低）
当前 F11.4 E2E 测试未覆盖 projectId=null 场景。

**缓解**：Phase 2 修复时补全测试用例。

---

## 6. 验收标准

### 6.1 错误处理（必须）
- [ ] projectId=null 时，"保存当前版本"按钮点击后展示明确错误消息（非 API 原始 400）
- [ ] projectId=null 时，打开"历史"面板展示引导 UI（"请先创建项目"而非空列表 + API 错误）
- [ ] projectId 从 null 变为有效值后，历史面板自动刷新列表

### 6.2 功能正常（必须）
- [ ] 已创建项目的用户能正常保存快照（projectId 就绪状态）
- [ ] 快照列表加载、快照恢复功能正常
- [ ] 无 projectId 时，API 不发送无效请求（被 hook 层拦截）

### 6.3 回归验证
- [ ] `pnpm build` 通过
- [ ] VersionHistoryPanel E2E 测试通过（`version-history-panel.spec.ts`）
- [ ] 修复前后 Playwright 截图对比无意外视觉变化

### 6.4 E2E 补充（Phase 2）
- [ ] 新增 E2E：用例 "无项目时点击历史按钮" → 预期引导 UI
- [ ] 新增 E2E：用例 "无项目时点击保存" → 预期明确错误提示

---

## 7. 执行决策

```markdown
## 执行决策
- **决策**: 有条件采纳
- **执行项目**: vibex-canvas-history-projectid (Phase 1: 方案A+方案C止血)
- **执行日期**: 2026-04-14
- **备注**: 方案 B（URL 注入）建议在 Phase 2 实施，根治 projectId 时序问题
```

---

*Analyst Agent — 2026-04-14*
