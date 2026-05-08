# VibeX Sprint 32 Implementation Plan

> **项目**: vibex-proposals-sprint32
> **日期**: 2026-05-09
> **Architect**: architect
> **总工期**: 10d

---

## Unit Index

| Epic | Units | Status | Next |
|------|-------|--------|------|
| F1.1 | Canvas 缩略图导航 | F1.1-U1 | ⬜ | F1.1-U1 |
| F1.2 | AI 评审 CI Gate | F1.2-U1 | ⬜ | F1.2-U1 |
| F1.3 | 离线写入队列 | F1.3-U1 | ⬜ | F1.3-U1 |
| F1.4 | 同步状态可视化 | F1.4-U1 | ⬜ | F1.4-U1 |
| F2.1 | Vitest Snapshot | F2.1-U1 | ✅ | - |
| F2.2 | Playwright 视觉回归 | F2.2-U1 | ✅ | - |

---

## F1.1 — Canvas 缩略图导航 (3d)

### F1.1-U1: CanvasThumbnail 组件开发

**文件变更**:
- 新建: `vibex-fronted/src/components/dds/canvas/CanvasThumbnail.tsx`
- 修改: `vibex-fronted/src/components/dds/CanvasPage.tsx` — 集成缩略图面板

**实现步骤**:
1. 创建 `CanvasThumbnail.tsx`，接收 `viewport`、`onViewportChange`、`nodes`、`threshold` props
2. 使用 `useReactFlow()` 获取当前 viewport 状态
3. 渲染 downscaled SVG 版本的 Canvas 节点（提取节点 bounds，只画 rect 轮廓）
4. 计算 viewport 区域在缩略图中的相对位置，渲染高亮指示器
5. 添加 click 事件：计算点击坐标 → 转换为 world coords → `onViewportChange`
6. 监听 nodes 长度：len < threshold 时 CSS `display: none`
7. 集成到 CanvasPage：右侧 panel，固定宽度 160px

**验收标准**:
- [ ] CanvasThumbnail 组件存在且 export
- [ ] 缩略图与 ReactFlow viewport 双向联动
- [ ] 节点数量 >= 50 时自动显示
- [ ] 当前视口区域有高亮指示器
- [ ] 缩略图加载时间 < 100ms

---

## F1.2 — AI 评审 CI Gate (2d)

### F1.2-U1: GitHub Actions workflow + OpenClaw 集成

**文件变更**:
- 新建: `.github/workflows/ai-review.yml`
- 新建: `vibex-fronted/ai-review-results/` (gitignore)

**实现步骤**:
1. 创建 `.github/workflows/ai-review.yml`，配置 `on: [pull_request]`
2. Workflow steps:
   - `actions/checkout@v4`
   - `openclaw sessions spawn --runtime acp --task "design-review --path ." --result-file ai-review-results/$PR_NUMBER.json`
3. 验证 PR trigger 正常工作（手动 re-run 测试）
4. 配置 `OPENCLAW_API_KEY` secret in GitHub repo settings
5. 添加 PR comment step：读取 JSON 结果，发布摘要到 PR 评论

**验收标准**:
- [ ] workflow 文件存在且语法正确
- [ ] PR 打开时 CI 自动触发
- [ ] 评审结果 JSON 包含 score + feedback + timestamp
- [ ] CI 退出码正确反映评审结果
- [ ] 手动 re-run 正常工作

---

## F1.3 — 离线写入队列 (2d)

### F1.3-U1: IndexedDB 队列 + Service Worker 拦截

**文件变更**:
- 新建: `vibex-fronted/src/lib/offline-queue.ts`
- 修改: `vibex-fronted/public/sw.js`

**实现步骤**:
1. 创建 `offline-queue.ts`，使用 `idb` 库（或原生 IndexedDB API）操作 `vibex-offline` 数据库
2. 实现 `enqueueRequest`/`dequeueRequest`/`getQueuedRequests`/`replayQueue`/`clearQueue`
3. 修改 `sw.js` fetch 监听器：非 GET 请求 → 检查 navigator.onLine → 离线则 enqueueRequest → 返回 202 Accepted
4. 添加 `online` 事件监听：触发 replayQueue
5. replayQueue：按 timestamp 顺序，fetch → 成功则 dequeue，失败则 retryCount++
6. 实现 feature flag：`ENABLE_OFFLINE_QUEUE` env var，默认 false

**验收标准**:
- [ ] Service Worker 拦截所有非 GET 请求
- [ ] 离线时请求写入 IndexedDB 队列
- [ ] 队列包含 url + method + body + timestamp + retryCount
- [ ] 网络恢复后自动重放（按 timestamp 顺序）
- [ ] 重放成功则删除，失败则 retryCount++（最多 3 次）

---

## F1.4 — 同步状态可视化 (1d)

### F1.4-U1: OfflineBanner 进度展示

**文件变更**:
- 修改: `vibex-fronted/src/components/dds/OfflineBanner.tsx`

**实现步骤**:
1. 扩展 OfflineBanner：读取 IndexedDB `offline-queue` 中的 pending 请求数
2. 添加"X 项操作待同步"文字（使用 i18n key `offline.pending_count`）
3. 渲染同步进度条（data-sync-progress），aria 属性正确
4. 监听 replayQueue 进度事件，递减计数
5. 全部同步完成后 2s 延迟隐藏 banner
6. 同步失败时显示错误状态（不阻塞 UI）

**验收标准**:
- [ ] OfflineBanner 显示待同步计数
- [ ] 进度条可见且 aria 正确
- [ ] 每项同步完成计数递减
- [ ] 全部同步完成后 banner 2s 内消失
- [ ] 同步失败显示错误提示

---

## F2.1 — Vitest Snapshot 测试 (1d)

### F2.1-U1: 核心组件 Snapshot 测试

**文件变更**:
- 新建: `vibex-fronted/src/components/dds/__tests__/ChapterPanel.test.tsx`
- 新建: `vibex-fronted/src/lib/__tests__/DDSCanvasStore.test.ts`

**实现步骤**:
1. 创建 `ChapterPanel.test.tsx`：
   - `render(<ChapterPanel />)` → `toMatchSnapshot()`
   - 测试不同 props 下的渲染状态
2. 创建 `DDSCanvasStore.test.ts`：
   - `createStore()` → `getState()` → `toMatchSnapshot()`
3. 运行 `npm run test:unit` 首次生成 `.snap` 文件
4. 验证 CI coverage gate >= 60%
5. 签入 `.snap` 文件到 Git

**验收标准**:
- [ ] ChapterPanel snapshot 测试存在且通过
- [ ] DDSCanvasStore snapshot 测试存在且通过
- [ ] snapshot 文件已签入 Git
- [ ] `npm run test:unit:ci` exit 0

---

## F2.2 — Playwright 视觉回归 (1d)

### F2.2-U1: 视觉回归测试套件

**文件变更**:
- 新建: `vibex-fronted/tests/e2e/visual-regression.spec.ts`
- 新建: `.github/workflows/visual-regression.yml`
- 新建: `vibex-fronted/test-results/visual-baselines/` (gitignore)

**实现步骤**:
1. 创建 `visual-regression.spec.ts`：
   - CanvasPage 截图对比
   - Dashboard 截图对比
2. 首次运行：`npx playwright test --update-snapshots` 生成 baseline
3. 创建 `.github/workflows/visual-regression.yml` CI job
4. CI 配置：只运行 visual regression，不做全量 E2E
5. 签入 baseline screenshots

**验收标准**:
- [ ] visual-regression.spec.ts 覆盖 CanvasPage + Dashboard
- [ ] baseline screenshots 签入 Git
- [ ] CI job 存在且配置正确
- [ ] `npm run test:e2e:visual` 正常运行

---

## 执行顺序

```
Week 1:
  Day 1-2: F1.3-U1 (离线队列) → F1.4-U1 (同步状态)
  Day 1-3: F1.1-U1 (Canvas 缩略图) [并行]
  Day 1-2: F1.2-U1 (AI 评审 CI) [并行]
  Day 1:   F2.1-U1 (Vitest Snapshot) [并行]
  Day 1:   F2.2-U1 (Playwright 视觉回归) [并行]

Week 2:
  Day 3-5: 集成测试 + DoD 验收 + 修复
```

**关键路径**: F1.3-U1 → F1.4-U1（离线能力串行，其他并行）
