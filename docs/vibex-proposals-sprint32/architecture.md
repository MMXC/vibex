# VibeX Sprint 32 Technical Architecture

> **项目**: vibex-proposals-sprint32
> **阶段**: design-architecture
> **Architect**: architect
> **日期**: 2026-05-09

---

## 1. 执行摘要

本 Sprint 包含 6 个 Epic，分为两组：**F1 功能增强组**（Canvas 缩略图导航、AI 评审 CI Gate、离线写入队列、同步状态可视化）和 **F2 质量保障组**（Vitest Snapshot 测试、Playwright 视觉回归）。F1 聚焦于离线可用性和 AI 辅助评审能力，F2 聚焦于测试覆盖率和视觉回归防护。所有 Epic 均基于现有技术栈实现，不引入新依赖——ReactFlow、Zustand、Vitest、Playwright 均为既有基础设施。离线队列基于原生 IndexedDB + Service Worker，无额外依赖；AI 评审基于 OpenClaw ACP runtime，复用现有 CI 环境。

整体架构遵循渐进增强原则：离线队列作为核心能力（F1.3）被同步状态可视化（F1.4）依赖，其他 Epic 可独立交付。测试策略分为单元级（Vitest，CI 门禁）和 E2E 级（Playwright，按需触发），视觉回归不阻塞 PR，仅在 workflow_dispatch 或定时触发时运行。

---

## 2. Tech Stack

| 层级 | 技术 | 版本 | 选择理由 |
|------|------|------|----------|
| 前端 | Next.js + React 19 | App Router | 现有架构兼容 |
| 状态管理 | Zustand | 4.5.x | 已有基础设施 |
| 画布 | ReactFlow | 12.x | 现有架构兼容 |
| Service Worker | 原生 ES + IndexedDB | — | 离线队列核心 |
| 测试前端 | Vitest | 4.x | 现有架构兼容 |
| E2E 测试 | Playwright | 1.x | 现有架构兼容 |
| CI/CD | GitHub Actions | — | OpenClaw 运行环境 |

**版本策略**: 不引入新依赖，优先复用现有版本。

---

## 3. Architecture Diagram

```mermaid
graph TB
    subgraph CanvasPage["F1.1 — Canvas 缩略图导航"]
        CP[CanvasPage]
        RF[ReactFlow]
        CT[CanvasThumbnail]
        CT -->|viewport 双向联动| RF
        CP -->|集成缩略图 panel| CT
    end

    subgraph CICD["F1.2 — AI 评审 CI Gate"]
        GHA[GitHub Actions Workflow]
        ACP[OpenClaw ACP Runtime]
        DR[design-review Agent]
        JSON[ai-review-results/{pr}.json]
        GHA -->|spawn| ACP
        ACP -->|run| DR
        DR -->|write| JSON
        GHA -->|exit code| RESULT[CI Pass/Warn]
    end

    subgraph Offline["F1.3 — 离线写入队列"]
        SW[Service Worker]
        IDB[(IndexedDB<br/>offline-queue)]
        SYNC[sync queue]
        REPLAY[replayQueue]
        SW -->|enqueueRequest| IDB
        SW -->|online event| REPLAY
        REPLAY -->|按 timestamp| IDB
        IDB -->|QueuedRequest| SYNC
    end

    subgraph SyncUI["F1.4 — 同步状态可视化"]
        OB[OfflineBanner]
        SS[offline-queue store]
        PB[Progress Bar<br/>aria-progressbar]
        OB -->|读取 pendingCount| SS
        OB -->|显示进度| PB
        SS -->|实时递减| OB
    end

    subgraph Vitest["F2.1 — Vitest Snapshot"]
        VT[Vitest]
        CP_TEST[ChapterPanel.test.tsx]
        DS_TEST[DDSCanvasStore.test.ts]
        SNAP[.snap files]
        VT -->|toMatchSnapshot| CP_TEST
        VT -->|toMatchSnapshot| DS_TEST
        CP_TEST --> SNAP
        DS_TEST --> SNAP
    end

    subgraph Playwright["F2.2 — Playwright 视觉回归"]
        PL[Playwright]
        VR[visual-regression.spec.ts]
        BASE[visual-baselines/]
        CI[Visual Regression CI]
        PL -->|截图对比| VR
        VR -->|baseline| BASE
        CI -->|workflow_dispatch| PL
    end

    Offline --> SyncUI
```

---

## 4. 模块设计

### F1.1 — Canvas 缩略图导航

**新增文件**:
- `vibex-fronted/src/components/dds/canvas/CanvasThumbnail.tsx` — 缩略图面板组件
- 复用 ReactFlow 的 viewport 状态，双向联动

**接口**:
```typescript
// CanvasThumbnail Props
interface CanvasThumbnailProps {
  viewport: Viewport;        // ReactFlow viewport { x, y, zoom }
  onViewportChange: (vp: Viewport) => void;
  nodes: Node[];              // ReactFlow nodes
  threshold?: number;         // 显示阈值，默认 50
}

// 与 CanvasPage 集成
// <CanvasThumbnail
//   viewport={viewport}
//   onViewportChange={setViewport}
//   nodes={nodes}
//   threshold={50}
// />
```

**数据流**:
- ReactFlow viewport 变化 → 缩略图高亮指示器同步更新
- 用户点击缩略图 → 计算相对坐标 → setViewport 跳转
- 节点数 < threshold 时自动隐藏（CSS display:none + 动画）

---

### F1.2 — AI 评审 CI Gate

**新增文件**:
- `.github/workflows/ai-review.yml` — GitHub Actions workflow
- CI 调用 OpenClaw ACP runtime，spawn `design-review` agent

**接口**:
```yaml
# ai-review.yml 核心结构
on: [pull_request]
jobs:
  ai-design-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run AI Design Review
        env:
          OPENCLAW_API_KEY: ${{ secrets.OPENCLAW_API_KEY }}
          PR_NUMBER: ${{ github.event.number }}
        run: |
          openclaw sessions spawn \
            --runtime acp \
            --task "review /tmp/canvas-review" \
            --result-file ai-review-results/$PR_NUMBER.json
```

**数据流**:
- PR 打开/更新 → GitHub Actions 触发
- ACP runtime spawn design-review agent
- 评审结果 JSON 写入 `ai-review-results/{pr_number}.json`
- CI 退出码反映结果（通过/警告）

---

### F1.3 — 离线写入队列

**新增文件**:
- `vibex-fronted/src/lib/offline-queue.ts` — IndexedDB 队列管理

**接口**:
```typescript
interface QueuedRequest {
  id: string;           // UUID
  url: string;          // 请求 URL
  method: 'PUT' | 'POST' | 'DELETE';
  body: string;         // JSON 字符串
  timestamp: number;   // 毫秒时间戳
  retryCount: number;  // 重试次数，默认 0
  headers?: Record<string, string>;
}

// offline-queue.ts 导出
export async function enqueueRequest(req: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount'>): Promise<void>
export async function dequeueRequest(id: string): Promise<void>
export async function getQueuedRequests(): Promise<QueuedRequest[]>
export async function replayQueue(): Promise<{ success: number; failed: number }>
export async function clearQueue(): Promise<void>
```

**Service Worker 修改**:
- `vibex-fronted/public/sw.js` 第 37 行逻辑替换
- 非 GET 请求 → 检测 navigator.onLine → 在线则正常请求，离线则 enqueueRequest

**数据流**:
- 离线 PUT/POST/DELETE → IndexedDB offline-queue store 写入
- 网络恢复（online 事件）→ replayQueue 按 timestamp 顺序重放
- 成功则 dequeueRequest，失败则 retryCount++，最多 3 次

---

### F1.4 — 同步状态可视化

**修改文件**:
- `vibex-fronted/src/components/dds/OfflineBanner.tsx` — 扩展现有组件

**接口**:
```typescript
// OfflineBanner 扩展 Props
interface OfflineBannerProps {
  pendingCount: number;           // 待同步操作数
  totalCount: number;            // 总操作数
  onSyncComplete?: () => void;   // 全部同步完成回调
  onSyncError?: (error: Error) => void;
}

// 同步进度条 aria 属性
// <div
//   data-sync-progress
//   role="progressbar"
//   aria-valuenow={syncedCount}
//   aria-valuemin={0}
//   aria-valuemax={totalCount}
// />
```

---

### F2.1 — Vitest Snapshot 测试

**新增文件**:
- `vibex-fronted/src/components/dds/__tests__/ChapterPanel.test.tsx`
- `vibex-fronted/src/lib/__tests__/DDSCanvasStore.test.ts`

**测试用例**:
```typescript
// ChapterPanel snapshot
describe('ChapterPanel', () => {
  it('renders correctly', () => {
    const { container } = render(<ChapterPanel />);
    expect(container).toMatchSnapshot();
  });
});

// DDSCanvasStore snapshot
describe('DDSCanvasStore', () => {
  it('matches initial state snapshot', () => {
    const store = createStore();
    expect(store.getState()).toMatchSnapshot();
  });
});
```

---

### F2.2 — Playwright 视觉回归

**新增文件**:
- `vibex-fronted/tests/e2e/visual-regression.spec.ts`
- `.github/workflows/visual-regression.yml`

**测试用例**:
```typescript
// visual-regression.spec.ts
test('CanvasPage visual regression', async ({ page }) => {
  await page.goto('/canvas/test-project');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveScreenshot('canvas-page.png', { fullPage: true });
});

test('Dashboard visual regression', async ({ page }) => {
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveScreenshot('dashboard.png', { fullPage: true });
});
```

---

## 5. API 定义

新增接口定义（补充到 api-contract.yaml 的相关 tag）：

### 同步状态相关（无新增后端 API）

F1.3/F1.4 纯前端离线队列，通过 IndexedDB 存储，无需后端接口变更。

### AI 评审相关（CI 环境变量）

```yaml
# 环境变量（CI 中注入）
OPENCLAW_API_KEY: string
PR_NUMBER: number
AI_REVIEW_OUTPUT_PATH: ai-review-results/{pr_number}.json
```

---

## 6. 数据模型

### IndexedDB Schema — offline-queue store

```typescript
// Database: vibex-offline
// Object Store: offline-queue (keyPath: id)
interface QueuedRequest {
  id: string;           // auto-generated UUID
  url: string;
  method: 'PUT' | 'POST' | 'DELETE';
  body: string;
  timestamp: number;
  retryCount: number;
  headers: Record<string, string>;
}
```

---

## 7. 性能评估

| Epic | 性能影响 | 评估 |
|------|---------|------|
| F1.1 | CanvasThumbnail | 缩略图仅渲染 SVG 轮廓，300 节点下 < 100ms；节点数 < 50 时隐藏，无影响 |
| F1.2 | CI 评审 | 仅在 PR 时运行，不影响线上性能 |
| F1.3 | 离线队列 | IndexedDB 写入 < 5ms/操作；队列重放批量执行，无 UX 阻塞 |
| F1.4 | OfflineBanner | 纯 UI 状态展示，无额外计算 |
| F2.1 | Vitest 覆盖 | CI 门禁，本地开发不影响；覆盖率需 > 60% |
| F2.2 | Playwright 截图 | CI 任务，不影响线上；但 baseline screenshots 需签入 Git（注意仓库体积） |

**风险点**: F2.2 baseline screenshots 每次 UI 变更需重新签入，建议控制在 5 个页面以内。

---

## 8. 技术风险与缓解

| 风险 | 级别 | 缓解方案 |
|------|------|----------|
| Service Worker 拦截范围过宽影响正常请求 | 中 | 限制拦截 `/api/*` 路径，白名单例外 |
| IndexedDB 队列数据丢失（浏览器清理） | 低 | 队列写入后即视为"已保存"，重放为幂等操作 |
| AI 评审 CI 超时 | 低 | 设置 5min timeout，降级为静态分析 |
| Vitest snapshot 频繁抖动 | 中 | 明确 snapshot 更新流程（review 后才更新） |

---

## 9. 执行决策

- **决策**: 已采纳
- **执行项目**: 无（VibeX 非 team-tasks 管理项目）
- **执行日期**: 2026-05-09
