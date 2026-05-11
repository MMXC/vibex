# VibeX Sprint 32 — PRD（QA 验证版）

**Agent**: PM
**日期**: 2026-05-09
**项目**: vibex-proposals-sprint32-qa
**上游**: `docs/vibex-proposals-sprint32-qa/analysis.md`（Analyst QA 验收报告）
**状态**: ✅ Final

---

## 执行摘要

### 背景

Sprint 32 共完成 6 个 Epic，分两个 Feature Group：
- **F1（功能增强）**: F1.1 缩略图导航、F1.2 AI 评审 CI Gate、F1.3 离线写入队列、F1.4 同步状态可视化
- **F2（测试基础设施）**: F2.1 Vitest Snapshot、F2.2 Playwright 视觉回归

所有代码文件已提交至 `origin/main`。Analyst 验收结论为"已采纳（有条件）"，发现 2 个 E2E 可测试性缺口和 1 个 baseline screenshots 缺失。本文档作为 QA 验证的完整基准。

### 目标

验证 6 个 Epic 实现符合验收标准，修复 3 个遗留问题（Q1/Q2/Q3），补充 1 个 CI 缺失项，使 QA 五层全部通过。

### 成功指标

| 指标 | 目标 | 当前 |
|------|------|------|
| TS 编译 errors | 0 | 待验证 |
| 单元测试通过率 | 100%（F2.1 已绿） | F1.3 单元测试缺失 |
| E2E 可测试性覆盖率 | 100% | F1.1 缺 data-testid |
| CI workflow 完整性 | 100% | F2.2 CI workflow 存在但 baseline 缺失 |
| coverage | ≥ 60% | 待验证 |
| Q1/Q2/Q3 修复率 | 100% | 0/3 已修复 |

---

## 1. Epic 拆分

### 1.1 Epic/Story 表格

| ID | Epic | Story | 描述 | 工时估算 | 验收标准数量 | 涉及页面 |
|----|------|-------|------|----------|-------------|----------|
| F1.1 | Canvas 缩略图导航 | F1.1-U1 | 画布节点数≥50时显示可交互缩略图，点击跳转 | 4h | 7 | CanvasPage |
| F1.2 | AI 评审 CI Gate | F1.2-U1 | PR 触发 AI 代码评审，结果以评论发布 | 3h | 6 | 无（CI） |
| F1.3 | 离线写入队列 | F1.3-U1 | 离线时写入请求入队，恢复后自动重放 | 6h | 7 | 无（lib） |
| F1.4 | 同步状态可视化 | F1.4-U1 | 实时显示待同步计数、进度条、错误消息 | 3h | 6 | CanvasPage |
| F2.1 | Vitest Snapshot | F2.1-U1 | ChapterPanel 和 DDSCanvasStore 的快照测试 | 3h | 3 | 无（测试） |
| F2.2 | Playwright 视觉回归 | F2.2-U1 | Playwright E2E + 视觉回归 CI pipeline | 4h | 5 | 无（测试） |

**总工时估算**: 23h

---

## 2. 本质需求穿透（神技1：剥洋葱）

### F1.1 — Canvas 缩略图导航

**用户底层动机**: 在大型流程图（节点数≥50）中快速定位当前视口位置，判断还有多少内容未覆盖，不需要手动滚动猜测。

**去掉现有方案后的理想解法**: 一个始终可见的小地图，实时反映当前视口在全局的位置，点击任意位置直接跳转。

**解决的本质问题**: 大型流程图中的导航迷失感（Orientation Lost in Large Canvas）。不是"加一个导航控件"，而是"让用户永远知道自己在哪"。

---

### F1.2 — AI 评审 CI Gate

**用户底层动机**: 在代码合并前获得客观的质量反馈，不需要人工 code review 等待，缩小评审视角盲区。

**去掉现有方案后的理想解法**: 每次 PR 自动触发 AI 评审，评分低于阈值则阻塞合并，评审结果直接附加在 PR 评论中。

**解决的本质问题**: Code Review 效率瓶颈与质量一致性。不是"加一个 AI 工具"，而是"让 AI 成为默认评审者"。

---

### F1.3 — 离线写入队列

**用户底层动机**: 在不稳定网络下继续工作，已操作的内容不会丢失，恢复网络后自动同步，不需要手动重试。

**去掉现有方案后的理想解法**: 所有写操作在离线时透明入队，恢复网络后无感知重放，用户感知不到离线这件事。

**解决的本质问题**: 离线写操作丢失（Offline Write Loss）。不是"加一个重试机制"，而是"让离线成为正常工作状态"。

---

### F1.4 — 同步状态可视化

**用户底层动机**: 在写入队列重放过程中，知道进度如何、还剩多少、有没有出错，不需要猜。

**去掉现有方案后的理想解法**: 状态 banner 清晰显示：数量、进度条、错误原因和重试次数。

**解决的本质问题**: 同步黑盒焦虑（Sync Black Box Anxiety）。不是"加一个 loading"，而是"让用户完全理解同步状态"。

---

### F2.1 — Vitest Snapshot

**用户底层动机**: 在重构时快速确认 UI 输出没有意外变化，不需要手动比对每个页面。

**去掉现有方案后的理想解法**: 快照测试覆盖核心组件，重构时运行测试即可知道哪些输出变了，变更是预期还是 bug 一目了然。

**解决的本质问题**: 重构信心不足（Refactoring Anxiety）。不是"加一个测试"，而是"给重构装上安全气囊"。

---

### F2.2 — Playwright 视觉回归

**用户底层动机**: 在发布前确认 UI 没有意外变化，尤其是样式调整后不会破坏已有页面。

**去掉现有方案后的理想解法**: 关键页面建立视觉 baseline，CI 自动比对，有差异则告警。

**解决的本质问题**: 视觉回归盲区（Visual Regression Blindspot）。不是"加一个截图对比"，而是"让视觉问题在发布前被发现"。

---

## 2b. 最小可行范围（神技2：极简主义）

### F1.1 — Canvas 缩略图导航

| 分类 | 内容 |
|------|------|
| **本期必做** | 缩略图显示、viewport 指示器、点击跳转、data-testid 补全、E2E 验证 |
| **本期不做** | 缩略图内节点点击高亮、minimap 自定义样式、缩放控制 |
| **暂缓** | 移动端缩略图手势交互、3D canvas 缩略图 |

---

### F1.2 — AI 评审 CI Gate

| 分类 | 内容 |
|------|------|
| **本期必做** | on:pull_request trigger、secrets 注入、降级 exit 0、JSON schema、阈值判断、PR 评论 |
| **本期不做** | GitHub App 方式集成、自定义阈值配置、评审结果持久化 |
| **暂缓** | 多文件差异化评审、支持私有部署 |

---

### F1.3 — 离线写入队列

| 分类 | 内容 |
|------|------|
| **本期必做** | IndexedDB enqueue/dequeue/replay/clear、feature flag、sw.js 拦截、重放次数限制、单元测试 |
| **本期不做** | 冲突解决策略（Last-Write-Wins）、队列可视化 UI、跨 Tab 同步 |
| **暂缓** | 后端增量同步、队列持久化策略优化 |

---

### F1.4 — 同步状态可视化

| 分类 | 内容 |
|------|------|
| **本期必做** | 待同步计数显示、进度条（data-sync-progress）、同步完成消失、错误消息包含 retryCount、data-testid |
| **本期不做** | 重试控制 UI（手动重试按钮）、队列内容详情展开、批量取消 |
| **暂缓** | 同步历史记录、SLA 倒计时显示 |

---

### F2.1 — Vitest Snapshot

| 分类 | 内容 |
|------|------|
| **本期必做** | ChapterPanel.test.tsx、DDSCanvasStore.test.ts、snapshot 签入 Git |
| **本期不做** | 其他组件的快照测试扩展 |
| **暂缓** | 快照测试的 CI 自动更新策略 |

---

### F2.2 — Playwright 视觉回归

| 分类 | 内容 |
|------|------|
| **本期必做** | visual-regression.spec.ts、visual-regression.yml CI workflow、baseline screenshots 签入 |
| **本期不做** | 全页面视觉回归（只覆盖核心 Canvas 页面）、视频录制 |
| **暂缓** | 跨浏览器视觉回归、响应式视觉回归 |

---

## 2c. 用户情绪地图（神技3：老妈测试）

### CanvasPage（涉及 F1.1 + F1.4）

**用户进入情绪**: 带着明确的操作意图（查看/编辑/导航流程图），期待快速看到自己关心的内容。

**导航迷失场景**:
- 用户打开一个有 200+ 节点的流程图
- 手动滚动了很久，不确定是否还有未覆盖的区域
- **→ F1.1 缩略图介入**: 右侧缩略图让用户立刻知道"我在这里"+"还有这些区域没看"
- **兜底**: 如果缩略图无法加载（threshold 未达），不显示缩略图，不打断用户

**离线焦虑场景**:
- 用户在地铁里做编辑操作，注意到 banner 出现
- 不知道离线操作有没有保存
- **→ F1.4 同步状态介入**: Banner 显示"3 项操作待同步"，进度条实时更新
- **兜底**: 如果同步失败，显示"同步失败（第 2 次），请检查网络"，包含 retryCount
- **引导文案**: "恢复网络后自动同步"（无网络时）、"正在同步 3 项操作"（同步中）、"✅ 已同步完成"（同步成功）

---

## 2d. UI 状态规范（神技4：状态机）

涉及页面的 Epic（F1.1、F1.4）在 `specs/` 目录中定义四态规格，详见：

- `specs/F1.1-canvas-thumbnail.md`
- `specs/F1.4-offline-banner.md`

---

## 3. 功能点详细规格

### F1.1 — Canvas 缩略图导航

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1-1 | 缩略图显示 | 节点数≥threshold（默认50）时在右侧 panel 渲染缩略图 | `expect(screen.queryByTestId('canvas-thumbnail')).toBeNull()`（节点数<50时）<br>`expect(screen.getByTestId('canvas-thumbnail')).toBeVisible()`（节点数≥50时） | CanvasPage |
| F1.1-2 | viewport 指示器 | 缩略图中实时反映当前视口范围 | `expect(container.querySelector('[class*="indicator"]')).toBeVisible()` | CanvasPage |
| F1.1-3 | 双向联动 | 拖拽/缩放画布后缩略图指示器同步更新 | `expect(screen.getByTestId('canvas-thumbnail')).toBeInTheDocument()` | CanvasPage |
| F1.1-4 | 点击跳转 | 点击缩略图任意位置，画布视口跳转到对应区域 | `expect(flowInstance.setViewport).toHaveBeenCalled()` | CanvasPage |
| F1.1-5 | threshold prop | 通过 prop 控制触发阈值，默认 50 | `expect(CanvasThumbnail).toHaveBeenCalledWith(expect.objectContaining({ threshold: 50 }), expect.anything())` | CanvasPage |
| F1.1-6 | 无障碍属性 | data-testid、aria-label、role 属性完整 | `expect(screen.getByTestId('canvas-thumbnail')).toHaveAttribute('role', 'img')` | CanvasPage |
| F1.1-7 | CSS Token | 所有颜色/间距使用 CSS 变量 | `expect(styles.container).toBeDefined()` 且 CSS 中使用 `var(--*)` | 无 |

---

### F1.2 — AI 评审 CI Gate

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.2-1 | PR trigger | workflow 在 `on: pull_request` 时触发 | `.github/workflows/ai-review.yml` 包含 `on: pull_request` | 无 |
| F1.2-2 | secrets 注入 | `OPENCLAW_API_KEY` 通过 `secrets.OPENCLAW_API_KEY` 注入 | workflow 中无硬编码 API key | 无 |
| F1.2-3 | 降级处理 | OpenClaw 不可用时 `exit 0`，不阻塞 PR | workflow 包含 `command -v openclaw` 检查和降级分支 | 无 |
| F1.2-4 | JSON schema | 评审结果符合 status/score/feedback/timestamp/pr_number schema | 输出 JSON 可被 `jq` 解析 | 无 |
| F1.2-5 | 阈值判断 | `score < 60` → `exit 1` 阻塞合并，否则 `exit 0` | CI log 包含阈值判断逻辑 | 无 |
| F1.2-6 | PR 评论 | 评审摘要以 GitHub PR 评论形式发布 | workflow 包含 `gh pr comment` 调用 | 无 |

---

### F1.3 — 离线写入队列

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.3-1 | enqueue | 离线写请求进入 IndexedDB 队列 | `expect(await offlineQueue.getQueuedRequests()).toHaveLength(n + 1)` | 无 |
| F1.3-2 | dequeue | 按 FIFO 顺序取出请求 | 队列顺序符合 timestamp 升序 | 无 |
| F1.3-3 | replay | 恢复网络后自动重放队列中的请求 | `expect(replayQueue()).resolves.not.toThrow()` | 无 |
| F1.3-4 | 重放次数限制 | 单个请求最多重放 3 次 | `expect(getAttemptCount(req)).toBeLessThanOrEqual(3)` | 无 |
| F1.3-5 | feature flag | `NEXT_PUBLIC_ENABLE_OFFLINE_QUEUE` 控制功能开关 | flag=false 时队列不生效 | 无 |
| F1.3-6 | sw 拦截 | Service Worker 拦截非 GET 请求，离线返回 202 | `expect(response.status).toBe(202)`（离线时） | 无 |
| F1.3-7 | 单元测试 | 覆盖率 > 80%，所有关键路径被测试 | `pnpm run test:unit offline-queue` → exit 0, coverage ≥ 80% | 无 |

---

### F1.4 — 同步状态可视化

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.4-1 | 待同步计数 | Banner 显示当前待同步操作数量 | `expect(screen.getByTestId('offline-banner')).toHaveTextContent(/\d+ 项操作待同步/)` | CanvasPage |
| F1.4-2 | 进度条 | 同步过程中显示进度条（data-sync-progress 属性） | `expect(screen.getByTestId('offline-banner').querySelector('[data-sync-progress]')).toBeVisible()` | CanvasPage |
| F1.4-3 | 进度条 aria | 进度条有 aria-valuenow/min/max 属性 | `expect(progressBar).toHaveAttribute('aria-valuenow')`<br>`expect(progressBar).toHaveAttribute('aria-valuemax')` | CanvasPage |
| F1.4-4 | 同步完成消失 | 同步完成后 banner 在 2s 内消失 | `expect(await screen.findByText(/✅/)).toBeInTheDocument()` → 2s后消失 | CanvasPage |
| F1.4-5 | 错误消息 | 同步失败时显示错误消息，包含 retryCount | `expect(screen.getByTestId('offline-banner')).toHaveTextContent(/第 \d+ 次失败/)` | CanvasPage |
| F1.4-6 | 无障碍 role | Banner 有 `role="alert"` 和 `aria-live="polite"` | `expect(banner).toHaveAttribute('role', 'alert')` | CanvasPage |

---

### F2.1 — Vitest Snapshot

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1-1 | ChapterPanel 测试 | ChapterPanel.test.tsx 包含 85 个测试，snapshot 匹配 | `pnpm run test:unit -- ChapterPanel` → exit 0 | 无 |
| F2.1-2 | DDSCanvasStore 测试 | DDSCanvasStore.test.ts 566 行，snapshot 匹配 | `pnpm run test:unit -- DDSCanvasStore` → exit 0 | 无 |
| F2.1-3 | snapshot 签入 | 2 个 .snap 文件已签入 Git | `git ls-files -- '*.snap'` 包含上述 2 个文件 | 无 |

---

### F2.2 — Playwright 视觉回归

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.2-1 | CI workflow | `.github/workflows/visual-regression.yml` 存在且语法正确 | `test -f .github/workflows/visual-regression.yml && echo OK` | 无 |
| F2.2-2 | Playwright 测试 | `visual-regression.spec.ts` 覆盖核心页面 | 文件行数 ≥ 100 | 无 |
| F2.2-3 | baseline screenshots | 首次运行生成 baseline，文件签入 Git | `git ls-files -- '**/reference/**.png'` 非空 | 无 |
| F2.2-4 | 测试可运行 | Playwright 测试在本地可执行（不依赖 CI） | `pnpm exec playwright test --reporter=line` → exit 0（忽略截图差异） | 无 |
| F2.2-5 | CI 不干扰主流程 | visual-regression.yml 是独立 workflow | workflow 不在 `push: main` 上触发，改为 `workflow_dispatch` 或单独 schedule | 无 |

---

## 4. 验收标准（expect() 断言）

### Layer 1 — 编译与单元测试

```bash
# TS 编译
cd vibex-fronted && pnpm run type-check
# expect: exit 0, 0 errors

# 单元测试
pnpm run test:unit
# expect: exit 0, ChapterPanel.test.tsx 全绿, DDSCanvasStore.test.ts 全绿

# F1.3 单元测试
pnpm run test:unit -- offline-queue
# expect: exit 0, coverage ≥ 80%

# 覆盖率
pnpm run test:unit:coverage
# expect: coverage ≥ 60%
```

### Layer 2 — 静态检查

```bash
# Q1: data-testid 修复验证
grep -n 'data-testid="canvas-thumbnail"' vibex-fronted/src/components/dds/canvas/CanvasThumbnail.tsx
# expect: ≥ 1 match

# Q2: data-sync-progress 属性修复验证
grep -rn 'data-sync-progress' vibex-fronted/src/components/canvas/OfflineBanner.tsx
# expect: ≥ 1 match

# Q3: retryCount 显示验证
grep -rn '第.*次失败' vibex-fronted/src/components/canvas/OfflineBanner.tsx
# expect: ≥ 1 match

# F2.2 CI workflow 存在
test -f .github/workflows/visual-regression.yml && test -f .github/workflows/ai-review.yml
# expect: exit 0

# snapshot 文件签入
git ls-files -- 'vibex-fronted/**/__snapshots__/*.snap'
# expect: ≥ 2 files
```

### Layer 3 — E2E / gstack browse 验证

**F1.1 验证脚本**:
```javascript
await goto('/canvas/test-project')
await page.evaluate(() => {
  // 模拟节点数≥50
  window.__MOCK_NODES__ = Array.from({length: 51}, (_, i) => ({
    id: `node-${i}`, position: {x: i * 100, y: 0}, data: {}
  }))
})
// expect: screen.getByTestId('canvas-thumbnail').toBeVisible()
// expect: SVG中存在indicator rect
```

**F1.4 验证脚本**:
```javascript
await goto('/canvas/test-project')
await context.setOffline(true)
await page.click('[data-action="add-node"]')
// expect: screen.getByTestId('offline-banner').toHaveText(/待同步/)
// expect: progressBar[data-sync-progress].toBeVisible()
// expect: progressBar.toHaveAttribute('aria-valuenow')
await context.setOffline(false)
// expect: banner在2s内消失
```

---

## 5. 必须修复项（Q1/Q2/Q3）

| ID | 问题 | 影响 | 修复方案 | 验证 |
|----|------|------|----------|------|
| Q1 | `data-testid="canvas-thumbnail"` 缺失 | E2E 无法定位元素 | 在 `CanvasThumbnail.tsx` 最外层容器 div 添加 `data-testid="canvas-thumbnail"` | `grep 'data-testid="canvas-thumbnail"' CanvasThumbnail.tsx` |
| Q2 | `data-sync-progress` 属性缺失 | 进度条 aria 验收标准无法自动化 | 在 `OfflineBanner.tsx` 进度条 div 添加 `data-sync-progress="true"` | `grep 'data-sync-progress' OfflineBanner.tsx` |
| Q3 | retryCount 未显示在错误消息中 | 用户无法知道重试了几次 | 在 `syncError` 消息中拼接 `第 ${retryCount} 次失败` | `grep '第.*次失败' OfflineBanner.tsx` |

---

## 6. Definition of Done

**QA 通过条件（全部满足）**:

- [ ] **Layer 1**: `tsc --noEmit` exit 0（0 errors）
- [ ] **Layer 1**: `pnpm run test:unit` exit 0（F2.1 85 tests 全绿 + F1.3 单元测试全绿）
- [ ] **Layer 1**: coverage ≥ 60%
- [ ] **Layer 2**: `.github/workflows/ai-review.yml` 存在且语法正确
- [ ] **Layer 2**: `.github/workflows/visual-regression.yml` 存在且语法正确
- [ ] **Layer 2**: 2 个 `.snap` 文件已签入 Git
- [ ] **Layer 2**: `data-testid="canvas-thumbnail"` 在 `CanvasThumbnail.tsx` 中存在
- [ ] **Layer 2**: `data-sync-progress` 在 `OfflineBanner.tsx` 进度条中存在
- [ ] **Layer 2**: retryCount 显示在同步失败错误消息中
- [ ] **Layer 3**: gstack browse 验证 F1.1（缩略图可见、指示器联动、点击跳转）
- [ ] **Layer 3**: gstack browse 验证 F1.4（待同步计数显示、进度条显示、错误消息完整）
- [ ] **F2.2**: baseline screenshots 文件已生成并签入 Git

---

## 7. 依赖关系图

```
Sprint 32 QA 验证
│
├── F1.1 Canvas 缩略图导航
│   ├── 前置: CanvasThumbnail.tsx 已提交 ✅
│   ├── 前置: CanvasPage 集成已确认 ✅
│   ├── 阻塞: Q1 data-testid 缺失 ⚠️
│   └── 验证: gstack browse + grep
│
├── F1.2 AI 评审 CI Gate
│   ├── 前置: ai-review.yml 已提交 ✅
│   └── 验证: workflow 语法 + secrets 配置
│
├── F1.3 离线写入队列
│   ├── 前置: offline-queue.ts 已提交 ✅
│   ├── 阻塞: Q2 单元测试缺失 ⚠️
│   └── 验证: test:unit + coverage
│
├── F1.4 同步状态可视化
│   ├── 前置: OfflineBanner.tsx 已扩展 ✅
│   ├── 阻塞: Q2 data-sync-progress 缺失 ⚠️
│   ├── 阻塞: Q3 retryCount 未显示 ⚠️
│   └── 验证: gstack browse 离线场景
│
├── F2.1 Vitest Snapshot
│   ├── 前置: .snap 文件已签入 ✅
│   └── 验证: 85 tests 全绿 ✅ DONE
│
└── F2.2 Playwright 视觉回归
    ├── 前置: visual-regression.spec.ts 已提交 ✅
    ├── 阻塞: baseline screenshots 未签入 ⚠️
    └── 验证: git ls-files + CI workflow 检查
```

---

## 8. 参考文件

| 文件 | 路径 |
|------|------|
| Analyst QA 验收报告 | `docs/vibex-proposals-sprint32-qa/analysis.md` |
| F1.1 四态规格 | `docs/vibex-proposals-sprint32-qa/specs/F1.1-canvas-thumbnail.md` |
| F1.4 四态规格 | `docs/vibex-proposals-sprint32-qa/specs/F1.4-offline-banner.md` |
| CanvasThumbnail 实现 | `vibex-fronted/src/components/dds/canvas/CanvasThumbnail.tsx` |
| OfflineBanner 实现 | `vibex-fronted/src/components/canvas/OfflineBanner.tsx` |
| 离线队列实现 | `vibex-fronted/src/lib/offline-queue.ts` |
| AI 评审 CI | `.github/workflows/ai-review.yml` |
| 视觉回归测试 | `vibex-fronted/tests/e2e/visual-regression.spec.ts` |
| 视觉回归 CI | `.github/workflows/visual-regression.yml` |

---

## 执行决策

- **决策**: 已采纳（有条件）
- **执行项目**: vibex-proposals-sprint32-qa
- **执行日期**: 2026-05-09

### 条件通过项（3 件事需在 QA 阶段补齐）
1. **Q1**: 在 `CanvasThumbnail.tsx` 补充 `data-testid="canvas-thumbnail"`（影响 E2E 可测试性）
2. **Q2**: 在 `OfflineBanner.tsx` 进度条元素补充 `data-sync-progress` 属性（影响 aria 验收标准自动化）
3. **Q3**: 在同步失败消息中拼接 `retryCount`（"第 N 次失败"）
