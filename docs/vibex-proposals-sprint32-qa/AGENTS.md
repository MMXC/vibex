# VibeX Sprint 32 QA — 开发约束

**Agent**: ARCHITECT | **日期**: 2026-05-09 | **项目**: vibex-proposals-sprint32-qa

---

## 1. 文件归属

| 文件 | Owner Agent | 说明 |
|------|-------------|------|
| `vibex-fronted/src/components/dds/canvas/CanvasThumbnail.tsx` | coder | F1.1 缩略图导航 |
| `vibex-fronted/src/components/canvas/OfflineBanner.tsx` | coder | F1.4 同步状态可视化 |
| `vibex-fronted/src/lib/offline-queue.ts` | coder | F1.3 离线队列核心逻辑 |
| `vibex-fronted/public/sw.js` | coder | F1.3 Service Worker 拦截 |
| `vibex-fronted/src/components/dds/canvas/__tests__/ChapterPanel.test.tsx` | coder | F2.1 快照测试 |
| `vibex-fronted/src/stores/dds/__tests__/DDSCanvasStore.test.ts` | coder | F2.1 快照测试 |
| `.github/workflows/ai-review.yml` | coder | F1.2 AI 评审 CI |
| `.github/workflows/visual-regression.yml` | coder | F2.2 视觉回归 CI |
| `vibex-fronted/tests/e2e/visual-regression.spec.ts` | coder | F2.2 E2E + 视觉回归 |
| `vibex-fronted/src/lib/offline-queue.test.ts` | coder | **F1.3 单元测试（待补充）** |

---

## 2. 代码规范

### 2.1 TypeScript 约定

- **严格模式**: `strict: true`，无 `any` 逃逸
- **导出类型**: 所有公共接口必须有 `export type` 或 `export interface`
- **无副作用**: `'use client'` 标注客户端组件

### 2.2 CSS Token 使用

F1.1 CanvasThumbnail 使用 CSS 变量：

```css
/* ✅ 正确 */
background: var(--color-surface-subtle, #f9fafb);
border: 1px solid var(--color-border, #e5e7eb);

/* ❌ 禁止 */
background: #f9fafb;  /* 硬编码十六进制 */
```

F1.4 OfflineBanner 使用固定值（暗色主题专有）：

```css
/* ✅ 允许（暗色主题特定颜色）*/
background: #1c1c1c;
color: #e0e0e0;
error-color: #f87171;

/* 理由：这些是 banner 专用暗色，不适合放入全局设计系统 */
```

### 2.3 OfflineQueue Feature Flag

```typescript
// ✅ 正确：所有操作先检查 flag
if (process.env.NEXT_PUBLIC_ENABLE_OFFLINE_QUEUE !== 'true') {
  return;
}

// ❌ 禁止：flag 检查后立即执行入队，不等待
enqueueRequest(...); // 无条件入队
```

---

## 3. 测试要求

### 3.1 单元测试（Vitest）

**必须覆盖**：
- `offline-queue.ts`: enqueue / dequeue / replay / clear / retry limit
- Coverage 目标: F1.3 ≥ 80%

**运行命令**:
```bash
cd vibex-fronted && pnpm run test:unit -- offline-queue
# expect: exit 0, coverage ≥ 80%
```

**Snapshot 测试**：
- `ChapterPanel.test.tsx`: 85 tests
- `DDSCanvasStore.test.ts`: 566 lines
- 更新 snapshot: `pnpm run test:unit -- -u`

### 3.2 E2E 测试（Playwright）

**必须包含 data-testid**：
- F1.1: `data-testid="canvas-thumbnail"` (容器元素)
- F1.4: `data-testid="offline-banner"` (已存在)
- F1.4: `data-sync-progress="true"` (进度条元素)

**运行命令**:
```bash
cd vibex-fronted && pnpm exec playwright test --reporter=line
# expect: exit 0（忽略截图差异）
```

### 3.3 视觉回归

**Baseline 管理**：
- 首次运行后 `reference/` 目录下的 `.png` 文件必须签入 Git
- CI 仅在 `workflow_dispatch` / schedule 触发，不阻塞主流程
- 视觉差异告警，不 fail CI（只生成 diff 报告）

---

## 4. 集成约束

### 4.1 OfflineBanner ↔ offline-queue 事件契约

```typescript
// 必须遵循的事件格式
interface ReplayProgressEvent {
  type: 'progress' | 'complete' | 'error';
  total: number;
  completed: number;
  failed: number;
  lastError?: string;  // error 态必需
}

// event name: 'offline-replay-progress'
window.dispatchEvent(new CustomEvent('offline-replay-progress', { detail }))
```

**禁止**：
- 修改事件名（`offline-replay-progress` 是已定契约）
- `detail.lastError` 不包含 retryCount 信息（应由 OfflineBanner 或 replayQueue 拼接）

### 4.2 Service Worker 拦截规则

```javascript
// sw.js 拦截规则
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' && !navigator.onLine) {
    event.respondWith(
      new Response(JSON.stringify({ queued: true }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' }
      })
    );
  }
});
```

**禁止**：
- 拦截 GET 请求（只拦截写操作）
- 在 flag = false 时拦截（检查 `NEXT_PUBLIC_ENABLE_OFFLINE_QUEUE`）

---

## 5. CI/CD 约束

### 5.1 ai-review.yml 降级规则

```yaml
# ✅ 必须：任何 OpenClaw 调用前检查可用性
- name: Check OpenClaw availability
  run: |
    if ! command -v openclaw &> /dev/null; then
      echo "OpenClaw not available, skipping AI review"
      exit 0  # 降级，不阻塞 PR
    fi
```

**禁止**：
- 硬编码 API key（必须通过 `secrets.OPENCLAW_API_KEY` 注入）
- 无降级处理的 `exit 1`

### 5.2 视觉回归 CI 隔离

```yaml
# ✅ 正确：独立 workflow，不在 push: main 上触发
on:
  workflow_dispatch:
  schedule:
    - cron: '0 2 * * 0'  # 每周日凌晨 2 点
```

---

## 6. QA 验收检查单

| 检查项 | 验证方式 | 负责人 |
|--------|----------|--------|
| `data-testid="canvas-thumbnail"` 存在 | `grep` | coder |
| `data-sync-progress="true"` 存在 | `grep` | coder |
| retryCount 显示在错误消息中 | `grep` | coder |
| offline-queue.test.ts coverage ≥ 80% | `pnpm run test:unit -- offline-queue` | coder |
| baseline screenshots 签入 Git | `git ls-files -- '**/reference/**.png'` | coder |
| ChapterPanel 85 tests 全绿 | `pnpm run test:unit -- ChapterPanel` | coder |
| DDSCanvasStore snapshot 全绿 | `pnpm run test:unit -- DDSCanvasStore` | coder |
| TypeScript 0 errors | `pnpm run type-check` | coder |
| Playwright E2E 可执行 | `pnpm exec playwright test --reporter=line` | coder |

---

## 执行决策

- **决策**: 已采纳（有条件）
- **执行项目**: vibex-proposals-sprint32-qa
- **执行日期**: 2026-05-09
