# Analysis: 修复 2 个 Canvas Bug — chapters 404 崩溃 + Tab 刷新状态残留

**Project**: vibex-fix-canvas-bugs
**Date**: 2026-04-15
**Analyst**: analyst
**Task**: analyze-requirements

---

## 执行决策

- **决策**: Conditional — 有条件通过，需 Dev 先确认 Bug #1 根因
- **执行项目**: vibex-fix-canvas-bugs
- **执行日期**: 2026-04-15

---

## 1. Research：Git History 发现

| Commit | 内容 | 教训 |
|--------|------|------|
| `f926fb53` | `fix(canvas): F11.2 - differentiate 401 vs 404 user messages` | 404 已作为错误状态处理，但 DDS API 可能缺少同类处理 |
| `5d91ed06` / `f926fb53` | Canvas F11.2 error UI 修复 | 已知 404 需要区分 user-facing message，不能裸抛 |
| `afd5aa2e` | `feat(vibex-prd-canvas-dev): Epic4 — chapters API + apiFetch timeout` | chapters API 是 Epic4 的一部分，apiFetch 有 5s timeout |
| `d7ce4752` | `feat(canvas): E1 - TabBar prototype tab + E2 - PhaseIndicator prototype 选项` | prototype tab + phase 同步逻辑已实现 |
| `db7c944` | `fix(canvas): F11.2 - differentiate 401 vs 404 user messages` | 错误处理模式已有先例 |

---

## 2. Research：历史经验（docs/learnings/）

| 文件 | 关键教训 |
|------|---------|
| `canvas-cors-preflight-500.md` | CORS/OPTIONS 问题历史悠久，说明后端路由注册漏测 |
| `canvas-testing-strategy.md` | mockStore 过于简化导致假通过；必须用真实环境验证 |

---

## 3. Bug #1 分析：/api/v1/dds/chapters 404 导致页面崩溃

### 3.1 当前代码分析

**前端调用路径**（`useDDSAPI.ts`）：
```
GET /api/v1/dds/chapters?projectId=xxx
```

**后端注册**（`gateway.ts`）：
```
app.route('/api/v1', v1)           // index.ts
v1.route('/', protected_)           // gateway.ts:264
protected_.route('/dds', ddsChapters)  // gateway.ts:261
```
理论路径：`/api/v1/dds/chapters` ✅ 正确

**D1 数据库**（`005_dds_tables.sql`，2026-04-15 创建）：
- `dds_chapters` 表定义存在
- 但 **无证据表明已部署到生产 D1**

**前端错误处理**（`DDSCanvasPage.tsx:82-116`）：
```typescript
const chapterRes = await api.getChapters(pid);
if (!chapterRes.success) {
  // → 正确处理，显示 error UI
}
// Promise.all(loadCards) — 如果 chapters 为空，map([]) 不崩溃
```

### 3.2 根因分析

**404 的可能来源**（优先级排序）：

| # | 可能原因 | 证据 | 可能性 |
|---|---------|------|--------|
| 1 | Cloudflare Worker 未部署（含 dds 路由的版本） | gateway.ts 有路由但 worker 可能未发布 | **高** |
| 2 | D1 migration 未应用，queryDB 抛出未捕获异常 | `005_dds_tables.sql` 创建日期 2026-04-15，无 deploy 记录 | **中** |
| 3 | 请求未到达 Worker，被 Pages 中间层拦截 | Next.js App Router 无 `/api/v1/*` 路由 | **低** |
| 4 | API 路径不匹配 | gateway 挂载在 `/api/v1` 但 `protected_.route('/', protected_)` 重复添加 `/` | **低** |

**"页面崩溃"的原因**：

`apiFetch` 中 `response.ok` 为 false 时返回 `{ success: false, error: {...} }`（不抛异常）。`DDSCanvasPage` 有 try/catch 包裹。所以理论上 404 不会崩溃。

崩溃的可能原因：
1. `catch` 块中有代码在 `controller.signal.aborted` 检查之后又抛出了异常
2. React StrictMode 下的 double-invocation 导致的副作用
3. **Dev 需要先实际复现**，确认崩溃的具体调用栈

### 3.3 技术方案

#### 方案 A：先诊断再修复（推荐）

**Step 1：诊断（0.5h）**
```bash
# 验证 API 是否可达
curl -s -o /dev/null -w "%{http_code}" \
  "https://api.vibex.top/api/v1/dds/chapters?projectId=test" \
  -H "Authorization: Bearer <token>"

# 期望：401（非 404）；若返回 404 → Worker 未部署
```

**Step 2：根据诊断结果修复**
- 若 404 → 部署 Worker（含 dds 路由的版本）
- 若 500 → 确认 D1 migration 状态
- 若有崩溃栈 → 按栈修复

**工时**：0.5h（诊断）+ 视结果定

**优势**：不盲目修代码，先找根因

**劣势**：依赖 Dev 能复现环境

#### 方案 B：防御性修复（不做诊断）

在 `DDSCanvasPage.tsx` 添加额外的崩溃防护 + 完善 error UI。

**改动点**：
- `loadChapters` catch 块增加兜底：任何异常都显示 error state
- 添加 React Error Boundary 包裹 `DDSCanvasPage`
- 404 时代码路径确认不崩溃

**工时**：1.5h

**优势**：不依赖环境复现

**劣势**：可能修的不是真正的 bug

---

## 4. Bug #2 分析：Canvas Tab 刷新后状态残留

### 4.1 当前状态

**持久化配置**（`contextStore.ts:91`）：
```typescript
persist(
  (set, get) => ({
    phase: 'context',           // 默认值
    activeTree: null,           // 默认值
    setPhase: (phase) => set({ phase }),
    setActiveTree: (tree) => set({ activeTree: tree }),
    ...
  }),
  { name: 'vibex-context-store', skipHydration: true }
)
```

**TabBar 行为**（`TabBar.tsx`）：
- 点击 "原型" Tab → `setPhase('prototype')` → `setActiveTree(null)`
- 刷新页面 → Zustand `persist` 从 localStorage 恢复 `phase: 'prototype'`

**AdvancePhase**（`contextStore.ts:97-107`）：
```typescript
advancePhase: () => {
  const phases = ['input', 'context', 'flow', 'component', 'prototype'];
  const idx = phases.indexOf(get().phase);
  if (idx < phases.length - 1) {
    const next = phases[idx + 1] as Phase;
    set({ phase: next });
    // Sync activeTree: 仅正向同步
    if (next === 'flow') set({ activeTree: 'flow' });
    else if (next === 'component') set({ activeTree: 'component' });
    // ❌ 没有: else set({ activeTree: null }) // prototype 时
  }
}
```

### 4.2 根因

**Tab 刷新状态残留**： Zustand `persist` 正确保存了 `phase` 和 `activeTree`。刷新后状态恢复。这是**预期行为**（persistence 在工作），不是 bug。

**真正的 bug**：用户期望刷新后 Tab 状态**不残留**，而是回归默认值（context Tab）。

Sprint 2 analysis.md 原文：
> "E1: Tab State 残留修复 — Tab 切换时 phase state 残留（Prototype accordion 不关闭）"
> "根因：CanvasPage 中 setActiveTab 变更时未同步重置 currentPhase 和关闭 Prototype accordion"

但这与"刷新后"是两件事。Analyst 判断：
- **Bug #2 描述"刷新后"**：用户刷新页面后，Tab 仍停留在 Prototype tab（因为 persist 恢复了状态）
- **Sprint 2 E1 描述"切换时"**：用户从 Prototype Tab 切换到其他 Tab 后，Prototype accordion 未关闭

这是两个略有不同的症状，但根因相关：都是 `phase` 状态管理问题。

### 4.3 技术方案

#### 方案 A：URL 驱动 Tab 状态（推荐）

**原理**：Tab 状态不应该用 localStorage persistence，而应该用 URL query parameter（如 `?tab=prototype`）。

**改动点**：
1. `CanvasPage` 从 `useSearchParams()` 读取 `tab` 参数
2. Tab 点击时用 `router.push(?tab=prototype)` 更新 URL（不写 localStorage）
3. `phase` 仍然持久化（用于多session 恢复工作进度）

**工时**：2h

**优势**：
- 刷新后 URL 参数决定 Tab，符合 SPA 预期行为
- 可分享特定 Tab 状态的链接
- `phase` 的 localStorage persistence 保留（工作进度不丢失）

**劣势**：
- 需要改 `CanvasPage` + `TabBar` 交互逻辑
- 涉及 URL 变更的路由处理

#### 方案 B：刷新时强制回归默认值

**原理**：读取 URL 时，如果没有任何导航历史（`navigation.type === 'reload'`），强制 `phase = 'context'`。

**工时**：1h

**优势**：改动小，一行代码

**劣势**：用户刷新 Prototype tab 后丢失进度；无法通过 URL 分享 Tab 状态

#### 方案 C：移除 phase 的 localStorage persistence（保守）

**原理**：`contextStore` 的 `persist` 选项中添加 `partialize` 排除 `phase` 和 `activeTree`。

```typescript
{
  name: 'vibex-context-store',
  skipHydration: true,
  partialize: (state) => ({
    contextNodes: state.contextNodes,
    flowNodes: state.flowNodes,
    // 排除 phase 和 activeTree
  })
}
```

**工时**：0.5h

**劣势**：与方案 A 相比，丢失了更合理的 URL-driven 方法

---

## 5. 风险矩阵

| 风险 | 可能性 | 影响 | 等级 | 缓解 |
|------|--------|------|------|------|
| Bug #1 根因无法远程复现 | 中 | 高 | 🟡 中 | 先用 curl 诊断 API 可达性 |
| D1 migration 未应用导致 500 | 高 | 中 | 🟡 中 | 确认 `wrangler deploy` 后 D1 变更已 apply |
| Bug #2 方案选择错误（persistence vs URL-driven） | 低 | 高 | 🟡 中 | Coord 决策：用户更看重"刷新不丢进度"还是"刷新回归默认 Tab" |
| 修复 Bug #2 引入 Bug #1 回归 | 低 | 高 | 🟡 中 | 单元测试覆盖 TabBar 和 DDSCanvasPage |
| `advancePhase` 的 activeTree 同步不完整 | 低 | 中 | 🟢 低 | 补充 `else set({ activeTree: null })` |

---

## 6. 推荐方案

**Bug #1（chapters 404）**：方案 A（先诊断再修复）
- 理由：不做诊断的修复是盲修。先确认 API 是否可达、Worker 是否已部署、D1 migration 是否 applied。0.5h 诊断可以节省大量盲目调试时间。

**Bug #2（Tab 刷新状态残留）**：方案 A（URL 驱动）
- 理由：这是更符合用户预期的行为。`phase` 的 localStorage persistence 保留（工作进度），Tab 状态由 URL 决定（刷新/分享可预测）。工时 2h 可接受。
- **注意**：需要 Coord 确认：用户更看重"刷新保留 Prototype Tab"还是"刷新默认回 context Tab"。

---

## 7. 验收标准

### Bug #1（chapters 404）

| ID | 验收条件 | 测试方式 |
|----|---------|---------|
| AC-B1-1 | `curl https://api.vibex.top/api/v1/dds/chapters?projectId=test` 不返回 404 | API 手动验证 |
| AC-B1-2 | DDSCanvasPage 在 API 失败时显示 error UI（非崩溃） | gstack browse |
| AC-B1-3 | 404 和 500 有区分的用户提示（非 generic error） | gstack browse |

### Bug #2（Tab 刷新状态残留）

| ID | 验收条件 | 测试方式 |
|----|---------|---------|
| AC-B2-1 | 切换到 Prototype Tab → 刷新页面 → Tab 状态符合预期（URL-driven 方案下应为 URL 决定；排除 persistence 方案下应为 context） | gstack browse + 刷新 |
| AC-B2-2 | Tab 切换时 Prototype accordion 正确关闭（与 Sprint 2 E1 协同） | gstack browse |
| AC-B2-3 | `phase` 的 localStorage persistence 仍然工作（三树数据不因 Tab 切换丢失） | localStorage 检查 |

---

## 8. 工期估算

| Bug | 方案 | 工时 |
|-----|------|------|
| Bug #1 诊断 | curl + wrangler status | 0.5h |
| Bug #1 修复（视诊断结果） | TBD | 1-2h |
| Bug #2 方案 A | URL-driven Tab state | 2h |
| Bug #2 方案 B（备用） | 强制回归默认值 | 1h |
| 验收测试（gstack browse） | 两个 bug 回归验证 | 1h |
| **Total（含 Bug #1 诊断 + 方案 A for both）** | | **5h** |
| **Total（含 Bug #1 诊断 + 方案 B for Bug #2）** | | **4h** |

---

## 9. 驳回条件

1. **需求模糊** — Bug #1 的 404 崩溃无法远程复现，根因不明 → Dev 必须先完成诊断
2. **缺少验收标准** — 没有可测试的 AC → 本文档已包含
3. **未执行 Research** — 无 git history 分析记录 → 本文档已包含

---

## 10. 开放问题（需 Coord 决策）

> **Q1**：Bug #2 - 用户刷新页面后，期望 Tab 停留在"原型"还是回归"上下文"？
> - 停留原型 → 需要 localStorage persistence（当前行为，可能是 feature 不是 bug）
> - 回归上下文 → 需要 URL-driven 或移除 phase persistence
> - **建议**：URL-driven 是最合理的折中方案，Coord 可直接采纳

> **Q2**：Bug #1 - Dev 是否能复现 404？生产环境是否有 `dds_chapters` 表？

---

*Analysis by analyst | 2026-04-15*
