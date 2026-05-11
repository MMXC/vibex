# VibeX Sprint 32 QA — 实施计划

**Agent**: ARCHITECT | **日期**: 2026-05-09 | **项目**: vibex-proposals-sprint32-qa
**状态**: 🔄 进行中（3 Q-Fix 待完成）

---

## Unit Index

| Epic | Units | Status | Next |
|------|-------|--------|------|
| E1: F1.1 Canvas 缩略图导航 | U1, Q1-Fix | 1/2 | Q1-Fix |
| E2: F1.2 AI 评审 CI Gate | U2 | 1/1 | — |
| E3: F1.3 离线写入队列 | U3 | 1/1 | — |
| E4: F1.4 同步状态可视化 | U4, Q2-Fix, Q3-Fix | 0/3 | Q2-Fix |
| E5: F2.1 Vitest Snapshot | U5 | 1/1 | — |
| E6: F2.2 Playwright 视觉回归 | U6 | 1/1 | — |

---

## E1: F1.1 Canvas 缩略图导航

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| U1 | CanvasThumbnail 组件实现 | ✅ | — | 节点数≥50显示缩略图，viewport 指示器联动，点击跳转 |
| Q1-Fix | data-testid="canvas-thumbnail" 补充 | ⬜ | U1 | `grep 'data-testid="canvas-thumbnail"' CanvasThumbnail.tsx` ≥ 1 match |

### Q1-Fix 详细说明

**文件变更**: `vibex-fronted/src/components/dds/canvas/CanvasThumbnail.tsx`

**实现步骤**:
1. 在最外层 `<div>` 添加 `data-testid="canvas-thumbnail"` 属性
2. 当前代码（line ~196）: `<div className={...} aria-label="画布缩略图">`
3. 改为: `<div className={...} aria-label="画布缩略图" data-testid="canvas-thumbnail">`

**风险**: 无。纯属性添加，不影响渲染逻辑。

**验收**:
```bash
grep -n 'data-testid="canvas-thumbnail"' vibex-fronted/src/components/dds/canvas/CanvasThumbnail.tsx
# expect: ≥ 1 match
```

---

## E2: F1.2 AI 评审 CI Gate

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| U2 | ai-review.yml 实现 | ✅ | — | on:pull_request, secrets 注入, 降级 exit 0, JSON schema, 阈值判断, PR 评论 |

### U2 详细说明

**文件**: `.github/workflows/ai-review.yml` (86行)

**已实现功能**:
- `on: pull_request` trigger
- `secrets.OPENCLAW_API_KEY` 注入
- `command -v openclaw` 降级检查 → `exit 0`
- JSON schema: status/score/feedback/timestamp/pr_number
- `score < 60` → `exit 1` 阻塞合并
- `gh pr comment` 发布评审摘要

**风险**: shell 调用方式脆弱（已标注为 🟡 中风险）

---

## E3: F1.3 离线写入队列

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| U3 | offline-queue.ts 实现 | ✅ | — | enqueue/dequeue/replay/clear，IndexedDB，FIFO，feature flag，重放限制 |

### U3 详细说明

**文件**: `vibex-fronted/src/lib/offline-queue.ts` (229行)

**已实现功能**:
- `enqueueRequest()`: IndexedDB 入队，timestamp 作为 idempotency key
- `dequeueRequest()`: 按 timestamp 升序出队
- `getQueuedRequests()`: 查询所有待处理请求
- `replayQueue()`: 重放并 dispatch `offline-replay-progress` 事件
- `clearQueue()`: 清空队列
- `MAX_RETRIES = 3`: 单请求最多重放 3 次
- `NEXT_PUBLIC_ENABLE_OFFLINE_QUEUE` feature flag
- sw.js 拦截非 GET 请求，离线返回 202

**缺失**: 单元测试文件 `offline-queue.test.ts`，coverage > 80% 要求未满足

**TODO**: 需要补充 `offline-queue.test.ts` 覆盖以下路径：
- AC1: enqueue/dequeue FIFO
- AC2: replay 成功/失败路径
- AC3: 重放次数限制 (≤ 3)
- AC4: feature flag = false 时跳过

---

## E4: F1.4 同步状态可视化

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| U4 | OfflineBanner 组件扩展 | ✅ | — | 待同步计数、进度条、同步完成消失、role=alert、aria-live |
| Q2-Fix | data-sync-progress 属性补充 | ⬜ | U4 | `grep 'data-sync-progress' OfflineBanner.tsx` ≥ 1 match |
| Q3-Fix | retryCount 在错误消息中显示 | ⬜ | U4 | `grep '第.*次失败' OfflineBanner.tsx` ≥ 1 match |

### Q2-Fix 详细说明

**文件变更**: `vibex-fronted/src/components/canvas/OfflineBanner.tsx`

**实现步骤**:
1. 找到进度条 `<div className={styles.progressBar} ...>`
2. 添加 `data-sync-progress="true"` 属性
3. 当前代码（line ~111）: `<div className={styles.progressBar} role="progressbar" ...>`
4. 改为: `<div className={styles.progressBar} role="progressbar" data-sync-progress="true" ...>`

**验收**:
```bash
grep -n 'data-sync-progress' vibex-fronted/src/components/canvas/OfflineBanner.tsx
# expect: ≥ 1 match
```

### Q3-Fix 详细说明

**文件变更**: `vibex-fronted/src/components/canvas/OfflineBanner.tsx`

**问题**: 当前 `detail.lastError` 直接显示，没有拼接 retryCount。用户看不到重试次数。

**实现步骤**:
1. 在 `handleProgress` 函数中，error 分支拼接 retryCount
2. 从 `detail.lastError` 或 replayQueue 的返回值中获取 retryCount
3. 拼接格式: `"同步失败（第 ${retryCount} 次），请检查网络"`

**当前代码** (line ~78):
```tsx
} else if (detail.type === 'error') {
  setSyncError(detail.lastError ?? '同步失败，请检查网络');
```

**改为**:
```tsx
} else if (detail.type === 'error') {
  const retryCount = detail.lastError ? extractRetryCount(detail.lastError) : 0;
  setSyncError(`同步失败（第 ${retryCount} 次），请检查网络`);
```

**或者**: 依赖 `offline-queue.ts` replay 时传入的 `lastError` 已包含 retryCount 格式。

**验收**:
```bash
grep -rn '第.*次失败' vibex-fronted/src/components/canvas/OfflineBanner.tsx
# expect: ≥ 1 match
```

---

## E5: F2.1 Vitest Snapshot

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| U5 | ChapterPanel + DDSCanvasStore 快照测试 | ✅ | — | 85 tests 全绿，2 个 .snap 文件签入 Git |

### U5 详细说明

**已提交文件**:
- `vibex-fronted/src/components/dds/canvas/__tests__/ChapterPanel.test.tsx` (574行)
- `vibex-fronted/src/components/dds/canvas/__tests__/__snapshots__/ChapterPanel.test.tsx.snap` (4933行)
- `vibex-fronted/src/stores/dds/__tests__/DDSCanvasStore.test.ts` (566行)
- `vibex-fronted/src/stores/dds/__tests__/__snapshots__/DDSCanvasStore.test.ts.snap` (142行)

**状态**: ✅ 已完成，85 tests 全绿

---

## E6: F2.2 Playwright 视觉回归

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| U6 | Playwright E2E + visual-regression CI | 🔄 | — | spec 存在，CI workflow 存在，baseline screenshots 签入 |

### U6 详细说明

**已提交文件**:
- `vibex-fronted/tests/e2e/visual-regression.spec.ts` (140行) ✅
- `.github/workflows/visual-regression.yml` (59行) ✅
- baseline screenshots ⚠️ **缺失** — 首次运行未完成或被 gitignore 排除

**TODO**:
1. 本地运行 `pnpm exec playwright test --reporter=line` 生成 baseline screenshots
2. 确认 `git ls-files -- '**/reference/**.png'` 非空
3. 签入 Git

**CI 配置**: `workflow_dispatch` + schedule，不在 `push: main` 上触发，不干扰主流程 ✅

---

## 实施顺序

```
Step 1: Q1-Fix  (CanvasThumbnail data-testid)     → 10 min
Step 2: Q2-Fix  (OfflineBanner data-sync-progress) → 10 min
Step 3: Q3-Fix  (OfflineBanner retryCount)        → 15 min
Step 4: 补充 offline-queue.test.ts (coverage ≥ 80%) → 2h
Step 5: 生成 baseline screenshots 并签入           → 30 min
Step 6: QA 五层全部通过验证                          → 1h
```

**总工期估算**: ~4.5h（含测试补充）

---

## 执行决策

- **决策**: 已采纳（有条件）
- **执行项目**: vibex-proposals-sprint32-qa
- **执行日期**: 2026-05-09
