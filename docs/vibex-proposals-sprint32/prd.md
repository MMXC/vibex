# VibeX Sprint 32 — PRD

**Agent**: PM
**日期**: 2026-05-08
**项目**: vibex-proposals-sprint32
**上游**: analyst review (analysis.md)
**状态**: Recommended（有条件采纳）

---

## 1. 执行摘要

### 背景

Sprint 31 代码审查发现：
- Sprint 30 遗留 3 个 Epic 断裂点（E01/E02/E05）→ Sprint 31 已安排修复
- Sprint 32 需要识别新一批高优先级功能增强

Analyst 审查发现：
- **P001 提案事实性错误**：声称使用 `estimateSize`/`overscan`，但当前 `FixedSizeList` 固定行高模式不存在这些参数；Group/Folder 层级抽象和缩略图导航均为不存在的能力
- **P002 缺少基础设施**：AI 评审无持久化路径、无 CI 集成
- **P003 技术风险高**：RTDB 数据模型变更影响已上线用户
- **P004/P005 低风险**：独立模块，基于已有基础设施扩展

### 目标

Sprint 32 聚焦 4 个低风险高价值提案（P001-A 修正 + P002 + P004 + P005），构建画布导航、AI 评审 CI 化、离线写入、测试覆盖升级四个能力。

### 成功指标

- [ ] Canvas 缩略图导航面板上线，解决 300+ 节点画布导航痛点
- [ ] PR 触发 AI 评审，评审结果写入 JSON 文件
- [ ] 离线状态可写入，联网后自动同步队列
- [ ] 同步状态可视化（进度条/计数）
- [ ] Vitest Snapshot + Playwright visual diff 覆盖核心组件
- [ ] 6 个功能点全部满足验收标准

---

## 2. Epic 拆分

### Epic 1: 画布导航 + AI 评审

| ID | Story | 描述 | 工时 | 验收标准数 | 依赖 |
|----|-------|------|------|-----------|------|
| F1.1 | Canvas 缩略图导航 | Canvas 右侧缩略图面板，点击跳转 viewport | 3d | 5 | 无 |
| F1.2 | AI 评审 CI Gate | GitHub Actions PR 触发 → AI 评审 → 结果写入 JSON | 2d | 5 | 无 |

### Epic 2: 离线增强 + 测试升级

| ID | Story | 描述 | 工时 | 验收标准数 | 依赖 |
|----|-------|------|------|-----------|------|
| F1.3 | 离线写入队列 | Service Worker 拦截非 GET 请求，写入 IndexedDB 队列 | 2d | 4 | 无 |
| F1.4 | 同步状态可视化 | OfflineBanner 显示待同步操作计数 + 进度 | 1d | 4 | F1.3 |
| F2.1 | Vitest Snapshot 测试 | 组件级 snapshot test 覆盖核心组件 | 1d | 4 | 无 |
| F2.2 | Playwright 视觉回归 | CI screenshot diff 防止 UI 退化 | 1d | 4 | 无 |

**总工期: 10d**

**拒绝提案**:
- P001-B (Group/Folder)：延后至 Sprint 33，数据模型变更需额外 review
- P003 (协作感知)：延后至 Sprint 33，RTDB 字段变更风险高

---

## 3. 验收标准（每条可写 expect() 断言）

### F1.1 — Canvas 缩略图导航 【需页面集成】

**涉及文件**: `vibex-fronted/src/components/dds/CanvasPage.tsx`, 新建 `CanvasThumbnail.tsx`

**用户故事**: 作为用户，我的画布有 300+ 节点，我希望有一个缩略图导航面板，这样我可以快速定位和跳转到任意节点区域。

```
// 缩略图面板显示
expect(screen.getByTestId('canvas-thumbnail')).toBeInTheDocument();

// Canvas 渲染区域与缩略图比例一致
const canvasRect = page.locator('[data-canvas-viewport]').boundingBox();
const thumbnailRect = page.locator('[data-canvas-thumbnail]').boundingBox();
expect(thumbnailRect.width / thumbnailRect.height).toBeCloseTo(canvasRect.width / canvasRect.height, 1);

// 点击缩略图区域 → viewport 跳转
await page.locator('[data-canvas-thumbnail]').click({ position: { x: thumbnailRect.width * 0.8, y: thumbnailRect.height * 0.2 } });
const viewport = await page.evaluate(() => window.__lastViewport);
expect(viewport.x).toBeGreaterThan(0);

// 当前视口区域高亮
expect(page.locator('[data-thumbnail-viewport-indicator]')).toBeVisible();

// 节点数量 > 50 时缩略图自动显示
expect(screen.getByTestId('canvas-thumbnail')).toBeVisible();
```

**验收标准明细**:
- [ ] Canvas 右侧缩略图面板可见（`data-canvas-thumbnail`）
- [ ] 缩略图中当前 viewport 区域有高亮指示器
- [ ] 点击缩略图任意位置 → Canvas viewport 跳转到对应坐标
- [ ] 节点数量 >= 50 时自动显示缩略图
- [ ] 缩略图与实际 Canvas 比例一致，无形变

---

### F1.2 — AI 评审 CI Gate 【需页面集成】

**涉及文件**: `.github/workflows/ai-review.yml`（新建）, `vibex-fronted/src/lib/mcp-bridge.ts`

**用户故事**: 作为开发者，我希望每次 PR 提交自动触发 AI 设计评审，这样我可以在合并前发现设计问题，而不需要手动调用 AI 工具。

```
// PR 触发 CI job
expect(github.context.payload.pull_request).toBeDefined();

// AI 评审调用
expect(spawnAgent).toHaveBeenCalledWith(expect.objectContaining({ type: 'design-review' }));

// 评审结果写入 JSON
const output = JSON.parse(fs.readFileSync('ai-review-result.json', 'utf-8'));
expect(output.status).toBe('complete');
expect(output.score).toBeGreaterThanOrEqual(0);
expect(output.feedback).toBeDefined();

// CI job 退出码
expect(github.context.exitCode).toBe(0);
```

**验收标准明细**:
- [ ] GitHub Actions workflow `ai-review.yml` 存在且配置 `on: [pull_request]`
- [ ] PR 打开/更新时 CI 自动触发 AI 评审 job
- [ ] AI 评审调用 `spawnAgent({ type: 'design-review' })`
- [ ] 评审结果（score + feedback + timestamp）写入 `ai-review-results/{pr_number}.json`
- [ ] CI job 退出码正确反映评审结果（通过/警告）

---

### F1.3 — 离线写入队列 【需页面集成】

**涉及文件**: `vibex-fronted/public/sw.js`, `vibex-fronted/src/lib/offline-queue.ts`（新建）

**用户故事**: 作为用户，我希望在离线时也能编辑，联网后自动同步，这样我不需要因为网络中断而丢失工作。

**当前状态**: `sw.js:37` — 所有非 GET 请求离线时直接返回 503，编辑行为被丢弃。

```
// 离线写入拦截
const req = new Request('/api/projects/123', { method: 'PUT', body: JSON.stringify({ name: 'test' }) });
await sw.handleRequest(req); // 离线环境
const queued = await idb.getAll('offline-queue');
expect(queued).toHaveLength(1);
expect(queued[0].url).toContain('/api/projects/123');
expect(queued[0].method).toBe('PUT');

// 联网后自动同步
await goOnline();
expect(fetch).toHaveBeenCalledWith(expect.objectContaining({ method: 'PUT' }), expect.anything());
expect(await idb.getAll('offline-queue')).toHaveLength(0);
```

**验收标准明细**:
- [ ] Service Worker 拦截所有非 GET 请求（PUT/POST/DELETE）
- [ ] 离线时请求写入 IndexedDB 队列（offline-queue store）
- [ ] 队列包含 url、method、body、timestamp、retryCount
- [ ] 网络恢复后自动重放队列，按 timestamp 顺序执行
- [ ] 重放成功后从队列删除，失败则 retryCount++

---

### F1.4 — 同步状态可视化 【需页面集成】

**涉及文件**: `vibex-fronted/src/components/dds/OfflineBanner.tsx`

**用户故事**: 作为用户，我希望看到离线写入队列的同步进度，这样我知道有多少操作正在等待同步。

```
// OfflineBanner 显示待同步计数
expect(screen.getByTestId('offline-banner')).toBeInTheDocument();
expect(screen.getByText(/3 项操作待同步/)).toBeInTheDocument();

// 同步进度条
const progressBar = page.locator('[data-sync-progress]');
expect(progressBar).toBeVisible();
expect(progressBar).toHaveAttribute('aria-valuenow', '1');
expect(progressBar).toHaveAttribute('aria-valuemax', '3');

// 全部同步完成 → banner 消失
await flushPromises();
expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument();
```

**验收标准明细**:
- [ ] OfflineBanner 显示"X 项操作待同步"计数
- [ ] 同步进度条可见（`data-sync-progress`），aria 属性正确
- [ ] 每项同步完成后计数递减
- [ ] 全部同步完成后 banner 在 2s 内消失
- [ ] 同步失败时显示错误状态，不阻塞 UI

---

### F2.1 — Vitest Snapshot 测试 【需页面集成】

**涉及文件**: `vibex-fronted/src/components/dds/__tests__/`（新建）

**用户故事**: 作为开发者，我希望组件有 snapshot 测试，这样当组件渲染结果变化时我能立即发现，而不需要手动对比截图。

```
// ChapterPanel snapshot
const { container } = render(<ChapterPanel />);
expect(container).toMatchSnapshot();

// DDSCanvasStore snapshot
const store = new DDSCanvasStore(initialState);
expect(store).toMatchSnapshot();

// snapshot 不匹配时输出清晰 diff
expect(() => expect(changed).toMatchSnapshot()).toThrow(/Snapshot.*failed| Received:.*Expected:/);
```

**验收标准明细**:
- [ ] `ChapterPanel.test.tsx` 存在且包含 snapshot 测试
- [ ] `DDSCanvasStore.test.ts` 存在且包含 snapshot 测试
- [ ] `npm run test:unit` 全部通过（exit 0）
- [ ] snapshot 文件（`.snap`）已签入 Git
- [ ] CI coverage gate 维持在 60% 以上

---

### F2.2 — Playwright 视觉回归 【需页面集成】

**涉及文件**: `vibex-fronted/tests/e2e/visual-regression.spec.ts`（新建）

**用户故事**: 作为开发者，我希望有视觉回归测试，这样 UI 改动不会意外破坏现有布局。

```
// CanvasPage 截图对比
await page.goto('/canvas/test-project');
await page.waitForLoadState('networkidle');
const screenshot = await page.screenshot({ fullPage: true });
expect(screenshot).toMatchSnapshot('canvas-page.png');

// Dashboard 截图对比
await page.goto('/dashboard');
await page.waitForLoadState('networkidle');
const dashShot = await page.screenshot({ fullPage: true });
expect(dashShot).toMatchSnapshot('dashboard.png');
```

**验收标准明细**:
- [ ] `tests/e2e/visual-regression.spec.ts` 存在
- [ ] 覆盖核心页面：CanvasPage、Dashboard
- [ ] `npm run test:e2e:visual` CI job 存在（`.github/workflows/visual-regression.yml`）
- [ ] 首次运行生成 baseline screenshots
- [ ] UI 变更时 CI 报告 screenshot diff

---

## 4. Definition of Done

### F1.1 DoD（Canvas 缩略图导航）
- [ ] `CanvasThumbnail.tsx` 组件存在
- [ ] 缩略图与 ReactFlow viewport 双向联动（拖拽缩略图 = 拖拽 viewport）
- [ ] 节点数量 >= 50 时自动显示，否则隐藏
- [ ] 当前视口区域在缩略图中有高亮指示器
- [ ] 缩略图加载时间 < 100ms（无性能退化）

### F1.2 DoD（AI 评审 CI Gate）
- [ ] `.github/workflows/ai-review.yml` 配置正确（`on: [pull_request]`）
- [ ] AI 评审结果写入 JSON 文件（`ai-review-results/{pr}.json`）
- [ ] 评审结果包含 score（0-100）、feedback（文本）、timestamp
- [ ] CI job 在 PR 评论中发布评审摘要
- [ ] 已有 PR 手动触发 re-run 正常

### F1.3 DoD（离线写入队列）
- [ ] Service Worker 拦截所有非 GET 请求
- [ ] IndexedDB `offline-queue` store 正确读写
- [ ] 网络恢复后自动重放队列（按 timestamp 顺序）
- [ ] 重试逻辑：失败重试最多 3 次，第 3 次失败后报错通知用户
- [ ] feature flag `ENABLE_OFFLINE_QUEUE` 控制降级

### F1.4 DoD（同步状态可视化）
- [ ] OfflineBanner 显示待同步计数
- [ ] 同步进度条（进度/总数）正确
- [ ] 同步完成后 banner 消失
- [ ] 同步失败时显示错误提示
- [ ] F1.3 DoD 全部满足后方可开始

### F2.1 DoD（Vitest Snapshot 测试）
- [ ] ChapterPanel snapshot 测试存在且通过
- [ ] DDSCanvasStore snapshot 测试存在且通过
- [ ] snapshot 文件签入 Git
- [ ] `npm run test:unit:ci` exit 0

### F2.2 DoD（Playwright 视觉回归）
- [ ] `visual-regression.spec.ts` 覆盖 CanvasPage + Dashboard
- [ ] baseline screenshots 签入 Git
- [ ] `.github/workflows/visual-regression.yml` CI job 存在
- [ ] `npm run test:e2e:visual` 正常运行

---

## 5. 优先级矩阵

| ID | 功能点 | RICE 分数 | 理由 |
|----|--------|-----------|------|
| F1.1 | Canvas 缩略图导航 | P0 | 核心导航痛点，300+ 节点找不到节点 |
| F1.2 | AI 评审 CI Gate | P0 | 质量保障自动化，减少人工评审成本 |
| F1.3 | 离线写入队列 | P1 | 用户体验提升，离线编辑能力 |
| F1.4 | 同步状态可视化 | P1 | F1.3 的必要配套 |
| F2.1 | Vitest Snapshot | P1 | 测试覆盖率提升，防止组件退化 |
| F2.2 | Playwright 视觉回归 | P1 | UI 质量保障，防止意外破坏 |

---

## 6. 执行顺序

```
F1.3 (2d) → F1.4 (1d)     ← 离线能力串行
F1.1 (3d) ────────────────── 并行
F1.2 (2d) ────────────────── 并行
F2.1 (1d) ────────────────── 并行
F2.2 (1d) ────────────────── 并行
```

**关键路径**: F1.3 → F1.4（离线能力串行，其他并行）

---

## 7. 相关文件

- PRD: `docs/vibex-proposals-sprint32/prd.md`
- Analysis: `docs/vibex-proposals-sprint32/analysis.md`
- Specs: `docs/vibex-proposals-sprint32/specs/`
- CanvasPage: `vibex-fronted/src/components/dds/CanvasPage.tsx`
- ServiceWorker: `vibex-fronted/public/sw.js`
- OfflineBanner: `vibex-fronted/src/components/dds/OfflineBanner.tsx`
- AI Bridge: `vibex-fronted/src/lib/mcp-bridge.ts`
