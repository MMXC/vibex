# AGENTS.md — VibeX Sprint 32 开发约束

> **项目**: vibex-proposals-sprint32
> **日期**: 2026-05-09
> **适用范围**: 所有开发 Agent

---

## 开发规范速查

### 必读文档

| 文档 | 位置 | 说明 |
|------|------|------|
| CLAUDE.md | `/root/.openclaw/vibex/CLAUDE.md` | 技术栈、命令、设计规范 |
| DESIGN.md | `/root/.openclaw/vibex/DESIGN.md` | 设计系统 |
| architecture.md | `docs/vibex-proposals-sprint32/architecture.md` | 本 Sprint 技术架构 |
| IMPLEMENTATION_PLAN.md | `docs/vibex-proposals-sprint32/IMPLEMENTATION_PLAN.md` | Unit 派发队列 |

---

## Sprint 32 专项约束

### F1.1: Canvas 缩略图导航红线

- **仅**修改 `CanvasThumbnail.tsx`（新建）和 `CanvasPage.tsx`（集成）
- **禁止**在 ReactFlow viewport 状态更新循环中引入 render 阻塞（用 `requestAnimationFrame` 节流）
- 缩略图只渲染节点 bounding box 轮廓（**不**渲染节点内容文本），避免性能问题
- 节点坐标使用 ReactFlow 提供的 `getNodesBounds` 计算，**不要**手动遍历 nodes

### F1.2: AI 评审 CI Gate 红线

- **禁止**将 OpenClaw API key 硬编码在 workflow 文件中（使用 `secrets.OPENCLAW_API_KEY`）
- workflow 输出 JSON 文件到 `ai-review-results/` 目录（该目录需加入 `.gitignore`）
- CI 降级处理：若 OpenClaw 不可用，workflow 退出码应为 0（警告模式），不阻塞 PR
- 评审结果 JSON schema 固定：
  ```json
  {
    "status": "complete" | "error" | "timeout",
    "score": 0-100,
    "feedback": "string",
    "timestamp": "ISO8601",
    "pr_number": number
  }
  ```

### F1.3: 离线写入队列红线

- **禁止**在 Service Worker 中直接修改 `fetch` 请求的 URL 或 method
- IndexedDB 操作**必须**在 `window.indexedDB` 可用时执行（Service Worker 环境中可用）
- 队列重放时使用 `fetch` 的 `Duplex` 流模式（Node.js 环境），或在浏览器中使用 `Request`/`Response` 对象
- **必须**实现幂等重放：同一请求重复发送服务端需能正确处理（使用 `timestamp` 作为幂等 key）
- feature flag `ENABLE_OFFLINE_QUEUE`：开发环境默认 true，生产环境默认 false（通过 `NEXT_PUBLIC_ENABLE_OFFLINE_QUEUE` 注入）

### F1.4: 同步状态可视化红线

- **禁止**在 OfflineBanner 中直接读取 IndexedDB（通过 `offline-queue.ts` 的导出函数）
- 进度条动画使用 CSS transition，**不要**用 JS setInterval
- 同步失败时只显示 toast 提示，**不要**弹窗阻断用户操作
- 错误消息必须包含 retryCount，方便调试

### F2.1: Vitest Snapshot 红线

- **禁止**在 snapshot 测试中使用 `Math.random()` 或 `Date.now()` 等非确定性值
- snapshot 文件（`.snap`）**必须**签入 Git，且需在 PR 中 review
- snapshot 更新流程：开发者本地运行 `npm run test:unit -- -u` → commit → PR review 时检查 diff
- CI 覆盖率 gate：`statements >= 60%`

### F2.2: Playwright 视觉回归红线

- baseline screenshots **必须**签入 Git（在 `test-results/visual-baselines/` 目录）
- 每次 UI 变更后需手动 re-run visual test 并 commit 更新的 baseline
- 视觉差异 > 5% 自动 fail CI（使用 Playwright 的 `pixelMatch` 配置）
- 视觉回归测试**不**运行在每次 PR，只在 `workflow_dispatch` 或定时触发（如 weekly）

---

## 测试策略

### 单元测试（Vitest）

| 文件 | 测试类型 | 覆盖率目标 |
|------|---------|-----------|
| `src/components/dds/canvas/CanvasThumbnail.tsx` | component + interaction | > 70% |
| `src/lib/offline-queue.ts` | unit (enqueue/replay/clear) | > 80% |
| `src/components/dds/OfflineBanner.tsx` | component + state | > 70% |

### E2E 测试（Playwright）

| 测试文件 | 覆盖页面 | 触发方式 |
|---------|---------|----------|
| `tests/e2e/visual-regression.spec.ts` | CanvasPage, Dashboard | workflow_dispatch |

### CI 门禁

- `pnpm run test:unit:ci` exit 0（Vitest，覆盖率 >= 60%）
- `pnpm run test:e2e` exit 0（Playwright，可选，visual regression 按需触发）

---

## 性能门禁

| 指标 | 阈值 | 测量方法 |
|------|------|----------|
| 缩略图渲染时间 | < 100ms | Performance.mark() |
| IndexedDB 写入延迟 | < 10ms | console.time() |
| 队列重放总时间 | < 5s (50 项) | Performance.now() |
| CI AI 评审 | < 5min | GitHub Actions logs |

---

## 命名约定

| 类型 | 约定 | 示例 |
|------|------|------|
| 缩略图组件 | CanvasThumbnail | `CanvasThumbnail.tsx` |
| 离线队列模块 | offline-queue | `offline-queue.ts` |
| 同步状态 banner | OfflineBanner | `OfflineBanner.tsx` |
| 视觉回归测试 | visual-regression | `visual-regression.spec.ts` |
| AI 评审 CI | ai-review | `ai-review.yml` |
| 评审结果目录 | ai-review-results | `ai-review-results/{pr}.json` |

---

## 文件清单

### 新建文件
- `vibex-fronted/src/components/dds/canvas/CanvasThumbnail.tsx`
- `vibex-fronted/src/lib/offline-queue.ts`
- `vibex-fronted/src/components/dds/__tests__/ChapterPanel.test.tsx`
- `vibex-fronted/src/lib/__tests__/DDSCanvasStore.test.ts`
- `vibex-fronted/tests/e2e/visual-regression.spec.ts`
- `.github/workflows/ai-review.yml`
- `.github/workflows/visual-regression.yml`

### 修改文件
- `vibex-fronted/src/components/dds/CanvasPage.tsx`
- `vibex-fronted/public/sw.js`
- `vibex-fronted/src/components/dds/OfflineBanner.tsx`

### 忽略文件（gitignore）
- `vibex-fronted/ai-review-results/`
- `vibex-fronted/test-results/`
- `vibex-fronted/test-results/visual-baselines/`
