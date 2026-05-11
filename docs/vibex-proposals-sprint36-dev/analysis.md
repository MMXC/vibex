# VibeX Sprint 36 Dev — 需求分析报告

**Agent**: analyst
**日期**: 2026-05-11
**项目**: vibex-proposals-sprint36-dev
**仓库**: /root/.openclaw/vibex
**分析视角**: 需求分析 — 分析 E1-E5 技术实现路径与风险，基于历史经验 + 代码审查验证

---

## Research 结论

### 1. 历史经验搜索

**搜索关键词**: Firebase presence, RemoteCursor, toolbar buttons, E2E degradation path, MCP integration

**扫描文件**: docs/solutions/（integration-issues / best-practices / patterns）

**关键匹配**:

#### Sprint 19 Design Review Mock 修复（critical severity）
- **文件**: `docs/solutions/integration-issues/design-review-mock-integration-gap-2026-04-30.md`
- **问题**: 前端 useDesignReview hook 用 setTimeout(1500) + mockReport 占位，MCP tool 完整但前端连接层断裂
- **根因**: `missing_tooling` — MCP stdio transport 无法从浏览器直调
- **解决方案**: 新增 Next.js API Route `/api/mcp/review_design` 内联 checker 函数，绕过 stdio transport
- **关联**: E5 Design Review E2E 补全中，降级路径设计直接复用此模式——MCP 503 时显示降级文案而非白屏

#### Mock-Driven Dev Pattern
- **文件**: `docs/solutions/integration-issues/vibex-sprint16-mock-driven-dev-patterns-20260428.md`
- **关键**: Firebase mock 模式下 E2E 测试策略——当 Firebase 未配置时 mock subscribers fallback，`isAvailable` guard 保护组件不崩溃
- **关联**: E1 Presence E2E 测试（presence-mvp.spec.ts）遵循此模式

### 2. Git History 分析

**Firebase presence 集成历史**:
```
5430f7394 feat(E3-U1/U2/U3): Firebase cursor sync, RemoteCursor and useCursorSync
  → 实现了 RemoteCursor.tsx + IntentionBubble.tsx + useCursorSync hook

7a54204f2 feat(E01): useRealtimeSync 实时节点同步
  → 实现了 useRealtimeSync hook（订阅远程节点变更 + 写 RTDB）

1a2eb7358 feat(Epic3): 协作者意图气泡功能 (U1-E3 ~ U3-E3)
  → IntentionBubble 与 RemoteCursor 联动

3c092e142 feat(E2): EpicE2 Firebase Presence 真实接入
  → usePresence hook + PresenceAvatars 组件
```

**关键发现**: Firebase presence 基础设施（S27-S30）经历了从初始接入 → cursor sync → realtime sync → 意图气泡的渐进式建设。当前 E1 的工作（挂载 RemoteCursor + 调用 useRealtimeSync）是这整个体系的最后一环——之前每一步都完成了实现，但都未在 DDSCanvasPage 中串联起来。

**DDSToolbar RBAC 集成历史**:
```
c5d6f5952 feat(E5): Teams × Canvas 共享权限实现
  → DDSToolbar 添加 export 按钮 + RBAC guard（disabled + tooltip pattern）
```

**撤销重做历史**:
```
6452d2f1c feat(S35-P001): 补充 DDSCanvasPage localStorage 持久化调用
c2e4942d0 fix(P001): 实现 U3-P001 Middleware 包装撤销重做
0a02febcf feat(P001-U1-U5): 实现 DDS Canvas 撤销重做系统
```

**快捷键历史**:
```
557fac1d5 feat(P003): 实现快捷键动态集成 useKeyboardShortcuts + shortcutStore
  → useKeyboardShortcuts 连接 shortcutStore（动态读取 custom shortcuts）
```

### 3. 关键架构结论

| 模式 | 来源 | 适用 Epic |
|------|------|-----------|
| API Route 直调 MCP logic（绕过 stdio）| Sprint 19 critical fix | E5 降级路径 |
| Firebase mock mode + isAvailable guard | Sprint 16 mock pattern | E1 presence E2E |
| DDSToolbar RBAC disabled + tooltip | Sprint 25 E5 | E4 Undo/Redo 按钮 |
| Zustand store.getState() 隔离调用 | 多个 store 实现 | E4 快捷键回调 |
| E2E page.route() mock 503 | E5 PRD 规格 | E5 degradation test |

---

## Epic E1: 多人协作 MVP — 技术实现路径分析

### 现状确认

| 组件 | 状态 | 代码位置 |
|------|------|----------|
| RemoteCursor.tsx | 已实现（未挂载）| `vibex-fronted/src/components/presence/RemoteCursor.tsx` |
| IntentionBubble.tsx | 已实现（未联动）| `vibex-fronted/src/components/presence/IntentionBubble.tsx` |
| usePresence hook | 已集成到 DDSCanvasPage | 第 260 行 |
| updateCursor 广播 | 已实现（100ms debounce）| 第 269-280 行 |
| PresenceAvatars | 已挂载（条件渲染）| 第 673 行 |
| useRealtimeSync hook | 已实现（未调用）| `vibex-fronted/src/hooks/useRealtimeSync.ts` |
| subscribeToNodes | 已实现（RTDB SSE）| `vibex-fronted/src/lib/firebase/firebaseRTDB.ts` |

### 实现路径

**S1.1 RemoteCursor 挂载**

需要修改 `DDSCanvasPage.tsx`：
1. 导入 `RemoteCursor` 和 `IntentionBubble`
2. 获取 `remoteCursors` 状态（订阅 Firebase RTDB 其他用户 cursor）
3. 在 Canvas overlay 层渲染 `<RemoteCursor />`（`position: fixed`，z-index 覆盖画布）
4. 条件守卫：`isFirebaseConfigured()` 才渲染

实现方案参考 git history `5430f7394`（E3-U1/U2/U3）：
- RemoteCursor 接收 `position`（x, y）+ `userName` + `color` props
- IntentionBubble 渲染在 RemoteCursor 上方 32px
- `data-testid="remote-cursor"` 用于 E2E 断言

**S1.2 useRealtimeSync 集成**

DDSCanvasPage 中引入 `useRealtimeSync` hook：
```typescript
// 获取 remote cursors（订阅其他用户的光标位置）
const { remoteCursors } = useRealtimeSync({ projectId, userId });
// remoteCursors: Array<{ userId, userName, position: {x,y}, intention? }>
```

**S1.3 E2E 测试**

参考 `vibex-fronted/tests/e2e/presence-mvp.spec.ts`（已存在）：
- 双 browser context 打开同一 canvas
- Firebase mock mode（`isFirebaseConfigured()` 返回 false）
- 验证 `data-testid="remote-cursor"` 可见（5s timeout）
- 验证 `data-testid="presence-avatars"` 包含用户名

### 技术风险

| 风险 | 影响 | 概率 | 缓解 |
|------|------|------|------|
| RemoteCursor position 与 Canvas viewport 不对齐 | 高 | 中 | 使用 Canvas 容器 ref 计算 offset，RemoteCursor 已是 CSS absolute positioning |
| Firebase RTDB 20 并发上限 | 高 | 低 | 监控并发数，超限时 PresenceAvatars 显示提示 |
| 多 RemoteCursor 同时渲染性能 | 低 | 低 | RemoteCursor 是 DOM overlay（GPU 加速），无需干预 |
| useRealtimeSync 与现有 cursor broadcast 冲突 | 低 | 低 | 两者独立：updateCursor 处理 cursor broadcast，subscribeToNodes 处理节点同步 |

### 验收标准（具体可测试）

- [ ] `DDSCanvasPage.tsx` render tree 包含 `<RemoteCursor />` JSX
- [ ] E2E: `page.locator('[data-testid="remote-cursor"]').first().isVisible({ timeout: 5000 })`
- [ ] E2E: `page.locator('[data-testid="presence-avatars"]').innerText()` 包含其他用户名
- [ ] Firebase mock 模式下 RemoteCursor 不渲染（条件守卫验证）
- [ ] `tsc --noEmit` 退出 0

---

## Epic E2: 模板市场 MVP — 技术实现路径分析

### 现状确认

| 组件 | 状态 | 代码位置 |
|------|------|----------|
| `/dashboard/templates` 页面 | 已存在 | `vibex-fronted/src/app/dashboard/templates/page.tsx` |
| templateApi.getTemplates() | 已实现 | `vibex-fronted/src/services/api/modules/template.ts` |
| industry field 存在 | 已确认（IndustryTemplate）| `page.tsx` 第 10-11 行 |
| /api/templates/marketplace | **不存在** | — |
| industry filter UI | **不存在** | — |

### 实现路径

**S2.1 Marketplace API**

新建 `vibex-backend/src/app/api/templates/marketplace/route.ts`：
```typescript
// GET /api/templates/marketplace
// Returns static JSON from /public/data/marketplace-templates.json
// Cache-Control: public, max-age=3600

// Response shape:
{
  "templates": [
    { "id": "tpl_mkt_001", "name": "SaaS Dashboard", "industry": "saas", ... },
    { "id": "tpl_mkt_002", "name": "Mobile App", "industry": "mobile", ... },
    { "id": "tpl_mkt_003", "name": "E-Commerce", "industry": "ecommerce", ... }
  ],
  "meta": { "total": 3, "lastUpdated": "2026-05-11" }
}
```

新建 `vibex-backend/public/data/marketplace-templates.json`（静态数据）:
- ≥ 3 个模板
- 每个含 `id`/`name`/`industry`/`description`/`tags`/`icon` 字段
- `icon` 字段必须是 emoji 字符（不得为空）

**S2.2 Dashboard 模板页 Industry Filter**

修改 `/dashboard/templates/page.tsx`：
1. 添加 industry filter tab bar（saas / mobile / ecommerce 三个 tab）
2. 调用 `GET /api/templates/marketplace` 获取数据
3. 按 `industry` 字段过滤展示
4. Tab 切换后更新 `filteredTemplates` 状态

参考 S25-E1 的场景化推荐模式（`SCENARIO_OPTIONS` + `filterByScenario()`）：
```typescript
const industries = ['saas', 'mobile', 'ecommerce'];
const [selectedIndustry, setSelectedIndustry] = useState('saas');
const filteredTemplates = marketplaceTemplates.filter(t => t.industry === selectedIndustry);
```

### 技术风险

| 风险 | 影响 | 概率 | 缓解 |
|------|------|------|------|
| Static JSON 数据过期 | 低 | 低 | MVP 阶段手动更新；生产后可扩展为数据库查询 |
| `/api/templates/marketplace` 404 | 中 | 低 | 前端添加 loading/error 状态，fallback 到 CRUD API |
| industry filter tab 无数据 | 低 | 低 | 显示"暂无可用模板"文案，不崩溃 |

### 验收标准（具体可测试）

- [ ] `GET /api/templates/marketplace` 返回 HTTP 200，body 含 `templates` 数组（length ≥ 3）
- [ ] 每个模板对象含 `id`/`industry`/`icon` 字段，`icon` 为 emoji（非空）
- [ ] `screen.getByRole('tab', { name: /saas/i })` 存在且可点击
- [ ] 点击 saas tab 后，`screen.getAllByTestId('template-card').length` > 0
- [ ] `pnpm test:e2e -- tests/e2e/templates-market.spec.ts` 通过

---

## Epic E3: MCP DoD CI Gate — 技术实现路径分析

### 现状确认

| 组件 | 状态 |
|------|------|
| generate-tool-index.ts | 已存在（`scripts/generate-tool-index.ts`） |
| docs/mcp-tools/INDEX.md | 已存在（7 tools，auto-generated） |
| .github/workflows/test.yml | 已存在（需修改添加 job） |
| health endpoint in index.ts | 已集成（第 64-66 行） |

### 实现路径

修改 `.github/workflows/test.yml`，添加 `generate-tool-index` job：

```yaml
generate-tool-index:
  name: Tool Index Sync
  runs-on: ubuntu-latest
  if: github.event_name == 'pull_request'
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
    - run: node scripts/generate-tool-index.ts
    - name: Check for Index.md changes
      run: |
        if ! git diff --exit-code docs/mcp-tools/INDEX.md; then
          echo "ERROR: docs/mcp-tools/INDEX.md is out of sync with tools/list.ts"
          echo "Please run 'node scripts/generate-tool-index.ts' and commit the changes."
          exit 1
        fi
  paths:
    - 'packages/mcp-server/src/tools/**/*.ts'
    - 'scripts/generate-tool-index.ts'
```

参考 S23-E1 CI 闭环模式（`e2e:summary:slack` job 在 test.yml 中）。

### 技术风险

| 风险 | 影响 | 概率 | 缓解 |
|------|------|------|------|
| CI job 破坏现有 workflow | 高 | 低 | 仅为额外 job，paths filter 确保仅在 tool 文件变更时触发 |
| generate-tool-index.ts 脚本失败 | 低 | 低 | 脚本 exit 0/1 明确，CI job 中添加错误信息输出 |

### 验收标准（具体可测试）

- [ ] `.github/workflows/test.yml` 包含 job name `generate-tool-index`
- [ ] job 使用 `paths` filter 配置（仅在 tool 文件变更时触发）
- [ ] 模拟 tool 文件变更 → 运行 CI → INDEX.md 不同步时 exit code = 1

---

## Epic E4: 撤销重做 Toolbar 补全 — 技术实现路径分析

### 现状确认

| 组件 | 状态 |
|------|------|
| useKeyboardShortcuts 连接 canvasHistoryStore | ✅ 已完成（第 405-416 行）|
| DDSToolbar.tsx | 存在（无 undo/redo 按钮）|
| DDSToolbar RBAC disabled + tooltip 模式 | ✅ 已有（Sprint 25 E5 模式）|

### 实现路径

修改 `DDSToolbar.tsx`，添加 Undo/Redo 按钮：

参考 Sprint 25 E5 的 RBAC disabled + tooltip pattern：
```typescript
import { useCanvasHistoryStore } from '@/stores/dds/canvasHistoryStore';

const canUndo = useCanvasHistoryStore((s) => s.canUndo);
const canRedo = useCanvasHistoryStore((s) => s.canRedo);

<button
  data-testid="undo-btn"
  disabled={!canUndo}
  onClick={() => useCanvasHistoryStore.getState().undo()}
  aria-label="撤销 (Ctrl+Z)"
>
  ↶ Undo
</button>

<button
  data-testid="redo-btn"
  disabled={!canRedo}
  onClick={() => useCanvasHistoryStore.getState().redo()}
  aria-label="重做 (Ctrl+Y)"
>
  ↷ Redo
</button>
```

### 技术风险

| 风险 | 影响 | 概率 | 缓解 |
|------|------|------|------|
| Toolbar 按钮与 useKeyboardShortcuts 冲突 | 低 | 低 | 两者独立工作：快捷键通过 useEffect 监听，Toolbar 通过 onClick |
| canUndo/canRedo 状态更新触发 Toolbar re-render | 低 | 低 | Zustand selector 仅订阅这两个字段，影响极小 |
| 按钮 disabled 状态与 store 不一致 | 低 | 中 | 需要 unit test 验证 disabled 状态逻辑 |

### 验收标准（具体可测试）

- [ ] `DDSToolbar.tsx` 中存在 `data-testid="undo-btn"` 的 button 元素
- [ ] `DDSToolbar.tsx` 中存在 `data-testid="redo-btn"` 的 button 元素
- [ ] E2E: 点击 undo 按钮调用 `useCanvasHistoryStore.getState().undo()`
- [ ] E2E: 当 `canUndo === false` 时，undo 按钮 `disabled={true}`
- [ ] `Ctrl+Z` 快捷键在 Toolbar 上线后仍正常工作（不冲突）
- [ ] `tsc --noEmit` 退出 0

---

## Epic E5: Design Review E2E 补全 — 技术实现路径分析

### 现状确认

| 组件 | 状态 |
|------|------|
| design-review-mcp.spec.ts | 已存在（POST /api/mcp/review_design → 200）|
| design-review.spec.ts | 已存在（UI interaction + mock review_design）|
| ReviewReportPanel 降级 error state | 存在（需确认触发路径）|

### 实现路径

**S5.1 降级路径 E2E 测试**

参考 Sprint 19 critical fix 的解决方案模式（API Route 直调 MCP logic）：

新建 `vibex-fronted/tests/e2e/design-review-degradation.spec.ts`：
```typescript
test('shows degradation message when MCP server returns 503', async ({ page }) => {
  // Mock MCP server returning 503
  await page.route('**/api/mcp/review_design', async (route) => {
    await route.fulfill({
      status: 503,
      body: JSON.stringify({ error: 'Service Unavailable' }),
    });
  });

  await page.goto('/canvas/test-canvas-001');
  await page.keyboard.press('Control+Shift+R');

  // Degradation message visible (NOT 500 white screen)
  await expect(page.getByText(/AI 评审暂时不可用/i))
    .toBeInTheDocument({ timeout: 5000 });

  // Canvas still functional
  await expect(page.locator('[data-testid="canvas-container"]'))
    .toBeInTheDocument();
});
```

**S5.2 评审结果三 Tab E2E 验证**

新建 `vibex-fronted/tests/e2e/design-review-tabs.spec.ts`：
- Mock `/api/mcp/review_design` 返回 `{compliance, accessibility, reuse}` 结构
- 验证 compliance tab 存在且可点击
- 验证 reuse tab 切换后 `data-testid="reuse-score"` 存在
- 验证 tab 切换不触发页面刷新（navigation counter = 0）

### 技术风险

| 风险 | 影响 | 概率 | 缓解 |
|------|------|------|------|
| E2E 测试不稳定（时序依赖） | 中 | 中 | 设置合理 timeout（5s），避免 flaky |
| 降级路径 ReviewReportPanel 未实现 | 中 | 低 | 先验证现有 error state 是否覆盖 503 场景 |

### 验收标准（具体可测试）

- [ ] `design-review-degradation.spec.ts` 文件存在
- [ ] E2E: MCP 503 → 页面显示"AI 评审暂时不可用"（非 500 白屏）
- [ ] E2E: compliance / accessibility / reuse 三个 tab 均可切换
- [ ] E2E: tab 切换后 `data-testid="reuse-score"` 元素存在
- [ ] E2E: tab 切换不触发 `navigation` 事件（page.on('navigation') counter = 0）
- [ ] `pnpm test:e2e -- tests/e2e/design-review-tabs.spec.ts` 通过

---

## 风险矩阵（更新版）

| Epic | 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|------|----------|
| E1 | Firebase RTDB 20 并发上限 | 高 | 低 | 监控并发数，超限时 PresenceAvatars 显示上限提示 |
| E1 | RemoteCursor viewport 不对齐 | 高 | 中 | 使用 container ref 计算 offset，参考 E3-U3 已有 offset 计算逻辑 |
| E1 | useRealtimeSync 与 cursor broadcast 冲突 | 低 | 低 | 两者独立：cursor broadcast 写 cursor 位置，realtime sync 订阅节点数据 |
| E2 | 模板市场静态数据过期 | 低 | 低 | MVP 手动更新，生产后可扩展数据库 |
| E2 | /api/templates/marketplace 404 断裂 | 中 | 低 | 前端 error state + fallback 到 CRUD API |
| E3 | CI job 破坏现有 workflow | 高 | 低 | paths filter 仅在 tool 文件变更时触发，job 为独立额外检查 |
| E4 | 按钮 disabled 状态与 store 不一致 | 低 | 中 | 添加 unit test 覆盖 disabled 状态逻辑 |
| E5 | 降级路径 ReviewReportPanel 未实现 | 中 | 低 | 先验证现有 error state 是否覆盖 503，再决定是否修改组件 |
| E5 | E2E 测试 flaky（时序依赖） | 中 | 中 | 设置 5s timeout + retry 机制 |

---

## 工期估算（修正版）

| Epic | Story | 修正后工时 | 修正原因 |
|------|--------|------------|----------|
| E1 | S1.1 RemoteCursor 挂载 | 1.5 人天 | 组件已存在，仅需挂载 + 条件守卫 |
| E1 | S1.2 useRealtimeSync 集成 | 1 人天 | hook 已存在，仅需调用 + 获取 remoteCursors |
| E1 | S1.3 E2E 测试 | 1 人天 | 测试文件已存在，补充多用户场景 |
| E2 | S2.1 Marketplace API | 1 人天 | 静态 JSON + Next.js API route |
| E2 | S2.2 Dashboard filter | 1 人天 | 页面已存在，仅添加 filter tab |
| E3 | S3.1 CI Gate | 0.5 人天 | 仅修改 test.yml |
| E4 | S4.1 Toolbar 按钮 | 0.5 人天 | 已验证快捷键完成，仅添按钮 |
| E5 | S5.1 降级路径测试 | 0.5 人天 | 新增 2 个测试用例 |
| E5 | S5.2 Tab 测试 | 0.5 人天 | 新增 4 个测试用例 |
| **合计** | **8 Stories** | **7 人天** | 修正原因：E1 李明 3.5 人天（3→3.5），E4 维持 0.5 |

---

## 依赖关系图

```
E1 (多人协作 MVP)
├── Firebase RTDB 已配置（已验证）
├── RemoteCursor.tsx 组件存在（S5430f7394）
├── useRealtimeSync hook 存在（S7a54204f2）
├── DDSCanvasPage.tsx 已集成 usePresence（S3c092e142）
└── E2E test file 存在（presence-mvp.spec.ts）

E2 (模板市场 MVP)
├── S35-P004 调研结论（静态 JSON 安全）
├── /dashboard/templates 页面存在
├── templateApi.getTemplates() 存在
└── 无其他依赖

E3 (MCP DoD CI Gate)
├── generate-tool-index.ts 已存在（S17-E1-U4）
├── docs/mcp-tools/INDEX.md 已存在
└── .github/workflows/test.yml 存在（需修改）

E4 (撤销重做 Toolbar)
├── useKeyboardShortcuts 已连接 canvasHistoryStore（S557fac1d5）
├── DDSToolbar.tsx 存在
├── Sprint 25 E5 RBAC disabled pattern 已建立
└── 无其他依赖

E5 (Design Review E2E)
├── design-review-mcp.spec.ts 已存在（S16-P2-2）
├── design-review.spec.ts 已存在（S24-P003）
├── ReviewReportPanel 存在于 DDSCanvasPage（S16-P0-1）
└── Sprint 19 critical fix 降级模式可复用
```

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-proposals-sprint36-dev
- **执行日期**: 2026-05-11
- **更新项**:
  - E1 工时修正：3 人天 → 3.5 人天（useRealtimeSync 集成需要额外订阅 remoteCursors 状态）
  - E3 描述修正：DoD gaps 已补全，仅需 CI gate job
  - E5 技术路径复用 Sprint 19 critical fix 模式（API Route 降级路径）

---

*本文档由 analyst agent 编写，基于 git history + docs/solutions/ + 代码审查。*
*Research 关键词: Firebase presence, RemoteCursor, toolbar RBAC, design-review mock, E2E degradation*
*生成时间: 2026-05-11 20:50 GMT+8*