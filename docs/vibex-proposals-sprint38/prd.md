**Agent**: hermes (coord self-implement)
**日期**: 2026-05-17
**项目**: vibex-proposals-sprint38
**触发**: PM agent ghost — 20+ 次任务通知无响应，coord 直接实现 prd.md
**依据**: analysis.md (5 proposals from analyst-review)

---

## 功能列表

| ID | 标题 | 类别 | 优先级 | 页面集成 |
|----|------|------|--------|----------|
| P001 | 多语言/国际化 (i18n) 系统 | improvement | P0 | Settings, 全局 DDSToolbar |
| P002 | 协作感知：实时多人编辑冲突可视化 | improvement | P0 | DDSCanvasPage, confirmationStore overlay |
| P003 | AI Coding 反馈回路增强 | improvement | P1 | DDSCanvasPage, useAIAgent hook |
| P004 | Playwright E2E 稳定性治理 | quality | P1 | CI 流水线, playwright-report/ |
| P005 | Canvas 性能：虚拟化 + 缩略图导航 | improvement | P1 | DDSCanvasPage, ProtoFlowCanvas |

---

## 功能详设

### P001: 多语言/国际化 (i18n) 系统

**关联提案**: analysis.md §P001

**DoD (Definition of Done)**:
- [ ] `next-intl` 或 `react-i18next` 已安装，版本锁定
- [ ] `i18n/messages/en.json` 和 `i18n/messages/zh.json` 存在，覆盖所有 DDSToolbar 按钮文本
- [ ] `/settings` 页面增加语言切换下拉框（英文/中文），复用 S37 theme 切换 UI 位置
- [ ] 语言偏好持久化到 `userPreferencesStore` 的 `locale` 字段
- [ ] `Accept-Language` header 存在时自动检测初始语言（劫持 `next/intl` init）
- [ ] 语言包动态导入（`await import(...)`），首屏 bundle 不增加 >10KB
- [ ] `DDSToolbar` 所有按钮文本使用 `useTranslations('toolbar')()` 而非硬编码英文
- [ ] `pnpm build` 成功，无 i18n key 缺失警告（CI 检查）

**页面集成**:
- 新文件: `vibex-fronted/src/i18n/index.ts`, `vibex-fronted/src/i18n/messages/en.json`, `vibex-fronted/src/i18n/messages/zh.json`
- 修改文件: `vibex-fronted/src/app/settings/page.tsx` (添加语言切换), `vibex-fronted/src/components/DDSToolbar/DDSToolbar.tsx` (i18n hook)
- 删除/重构: 无

**Epic 拆分**:
| Epic | 内容 | 预估 |
|------|------|------|
| E1 | i18n 框架安装 + 语言包脚手架 + DDSToolbar 试点 | 2h |
| E2 | Settings 语言切换 UI + userPreferencesStore locale 持久化 | 1h |
| E3 | 全局 UI 文本迁移（按钮/标签/错误提示） | 1h |

**实现文件**:
- Modified: `vibex-fronted/src/app/settings/page.tsx`, `vibex-fronted/src/components/DDSToolbar/DDSToolbar.tsx`
- New: `vibex-fronted/src/i18n/`, `vibex-fronted/src/hooks/useTranslations.ts`

---

### Epic E1: i18n 框架安装 + DDSToolbar 试点
### Epic E2: Settings 语言切换 UI + locale 持久化
### Epic E3: 全局 UI 文本迁移

---

### P002: 协作感知：实时多人编辑冲突可视化

**关联提案**: analysis.md §P002

**DoD**:
- [ ] `businessFlowStore` 增加 `oplog: OperationEntry[]` 字段（append-only）
- [ ] `oplog` entry 包含 `{ id, userId, nodeId, action, timestamp, type: 'ai'|'user' }`
- [ ] AI Agent 操作时写入 `oplog` entry，`type='ai'`
- [ ] DDSCanvasPage 右上角在 AI 操作期间显示 "🤖 AI Editing..." indicator（黄色徽章）
- [ ] 同一 `nodeId` 在 5s 内两次写入 → 节点边框变黄色 + Toast 提示"检测到冲突"
- [ ] `Ctrl+H` 快捷键打开 operation overlay（复用 S37-E3 KeyboardHelpOverlay 模式），展示 oplog 列表
- [ ] 冲突保留历史版本在 `confirmationStore`
- [ ] `pnpm test` 和 `pnpm test:e2e` 全部通过

**页面集成**:
- 新文件: `vibex-fronted/src/components/AIEditingIndicator/AIEditingIndicator.tsx`, `vibex-fronted/src/components/OperationOverlay/OperationOverlay.tsx`
- 修改文件: `vibex-fronted/src/stores/businessFlowStore.ts` (oplog), `vibex-fronted/src/stores/confirmationStore.ts` (历史版本), `vibex-fronted/src/app/[canvasId]/page.tsx` (indicator 挂载)

**Epic 拆分**:
| Epic | 内容 | 预估 |
|------|------|------|
| E1 | CanvasStore oplog + AI indicator | 2h |
| E2 | 冲突检测（5s 窗口警告）| 2h |
| E3 | Ctrl+H operation overlay | 2h |

**实现文件**:
- Modified: `vibex-fronted/src/stores/businessFlowStore.ts`, `vibex-fronted/src/stores/confirmationStore.ts`
- New: `vibex-fronted/src/components/AIEditingIndicator/`, `vibex-fronted/src/components/OperationOverlay/`

---

### Epic E1: CanvasStore oplog + AI indicator
### Epic E2: 冲突检测（5s 窗口警告）
### Epic E3: Ctrl+H operation overlay

---

### P003: AI Coding 反馈回路增强

**关联提案**: analysis.md §P003

**DoD**:
- [ ] AI 执行完成后，DDSCanvasPage 显示 diff overlay（绿色高亮=新增行，红色高亮=删除行）
- [ ] Diff overlay 有 Approve 按钮（执行变更 → 写入文件）和 Reject 按钮（关闭 overlay）
- [ ] Diff overlay 有评分卡：可读性/复杂度/覆盖率各 1-5 星
- [ ] AI 执行出错时，页面右上角显示红色 Toast（"AI 执行失败: {error}"），复用 S37-E7 ExportMenu Toast 模式
- [ ] 评分历史存储到 `userPreferencesStore.aiScores[]`
- [ ] `useAIAgent` hook 增加 `lastResult` 和 `lastError` 状态，导出给 UI 层
- [ ] `pnpm test:e2e` 覆盖 approve/reject 流程

**页面集成**:
- 新文件: `vibex-fronted/src/components/DiffOverlay/DiffOverlay.tsx`, `vibex-fronted/src/components/AIScoreCard/AIScoreCard.tsx`
- 修改文件: `vibex-fronted/src/hooks/useAIAgent.ts` (增加 lastResult/lastError), `vibex-fronted/src/app/[canvasId]/page.tsx` (挂载 DiffOverlay)

**Epic 拆分**:
| Epic | 内容 | 预估 |
|------|------|------|
| E1 | useAIAgent result 导出 + DiffOverlay UI | 2h |
| E2 | Approve/Reject 流程 + Toast 错误 | 1h |
| E3 | 评分卡 + userPreferencesStore.aiScores 持久化 | 1h |

**实现文件**:
- Modified: `vibex-fronted/src/hooks/useAIAgent.ts`
- New: `vibex-fronted/src/components/DiffOverlay/`, `vibex-fronted/src/components/AIScoreCard/`

---

### Epic E1: useAIAgent result 导出 + DiffOverlay UI
### Epic E2: Approve/Reject 流程 + Toast 错误
### Epic E3: 评分卡 + userPreferencesStore.aiScores 持久化

---

### P004: Playwright E2E 稳定性治理

**关联提案**: analysis.md §P004

**DoD**:
- [ ] 所有 `*.spec.ts` 文件中无 `page.waitForTimeout(`（替换为 `page.waitForSelector` 或 `page.waitForFunction`）
- [ ] `playwright.config.ts` 增加 `retries: 2`（CI 模式）
- [ ] `globalSetup` 文件存在，执行时清理 `localStorage` 和 `IndexedDB`
- [ ] `playwright-report/` 目录在 CI 中被收集（上传 artifact）
- [ ] 每个新 feature 至少有 1 个对应的 E2E spec
- [ ] `pnpm test:e2e` 在 CI 环境（慢 CPU）通过率 100%（0 flaky）

**页面集成**:
- 修改文件: `vibex-fronted/playwright.config.ts` (retries, globalSetup), `vibex-fronted/tests/global-setup.ts` (cleanup), `vibex-fronted/tests/**/*.spec.ts` (waitForTimeout 替换)

**Epic 拆分**:
| Epic | 内容 | 预估 |
|------|------|------|
| E1 | playwright.config.ts 改进（retries, globalSetup）| 0.5h |
| E2 | 全部 spec 文件 waitForTimeout 替换 | 1.5h |
| E3 | 新 feature E2E 覆盖（per feature）| 1h |

**实现文件**:
- Modified: `vibex-fronted/playwright.config.ts`, `vibex-fronted/tests/global-setup.ts`
- All E2E specs in: `vibex-fronted/tests/e2e/`

---

### Epic E1: playwright.config.ts 改进（retries, globalSetup）
### Epic E2: 全部 spec 文件 waitForTimeout 替换
### Epic E3: 新 feature E2E 覆盖（per feature）

---

### P005: Canvas 性能：虚拟化 + 缩略图导航

**关联提案**: analysis.md §P005

**DoD**:
- [ ] 500 节点项目缩放/平移帧率 ≥ 50fps（`performance.now()` 测量，DevTools Performance panel）
- [ ] 缩略图导航面板（MiniMap）存在于 DDSCanvasPage 左侧/底部
- [ ] MiniMap 显示当前视口边框（蓝色矩形），点击 MiniMap 跳转到对应位置
- [ ] Group 节点折叠/展开不影响周围节点位置（布局稳定）
- [ ] `react-window` 或 `@tanstack/react-virtual` 已安装
- [ ] `CanvasStore` 增加 `viewportBounds: {x,y,width,height}` 字段
- [ ] 节点只在视口内渲染（viewport culling），视口外节点不创建 DOM 节点
- [ ] `pnpm test` 和 `pnpm test:e2e` 全部通过

**页面集成**:
- 新文件: `vibex-fronted/src/components/MiniMap/MiniMap.tsx`, `vibex-fronted/src/hooks/useVirtualization.ts`, `vibex-fronted/src/hooks/useViewportBounds.ts`
- 修改文件: `vibex-fronted/src/components/ProtoFlowCanvas/ProtoFlowCanvas.tsx` (集成虚拟化), `vibex-fronted/src/stores/canvasStore.ts` (viewportBounds)

**Epic 拆分**:
| Epic | 内容 | 预估 |
|------|------|------|
| E1 | react-virtual 安装 + viewportBounds store | 1h |
| E2 | ProtoFlowCanvas 虚拟化集成 | 3h |
| E3 | MiniMap 组件 + 点击跳转 | 1h |

**实现文件**:
- Modified: `vibex-fronted/src/stores/canvasStore.ts`, `vibex-fronted/src/components/ProtoFlowCanvas/ProtoFlowCanvas.tsx`
- New: `vibex-fronted/src/components/MiniMap/`, `vibex-fronted/src/hooks/useVirtualization.ts`, `vibex-fronted/src/hooks/useViewportBounds.ts`

---

### Epic E1: react-virtual 安装 + viewportBounds store
### Epic E2: ProtoFlowCanvas 虚拟化集成
### Epic E3: MiniMap 组件 + 点击跳转

---

## Sprint 规划建议

| 优先级 | 功能 | Epic 数 | 预估工时 | 说明 |
|--------|------|---------|----------|------|
| P0 | P001 i18n | 3 | 4h | 全局基础能力 |
| P0 | P002 协作感知 | 3 | 6h | 核心差异化能力 |
| P1 | P003 AI 反馈回路 | 3 | 4h | S6 功能完善 |
| P1 | P004 E2E 治理 | 3 | 3h | CI 稳定性保障 |
| P1 | P005 性能/虚拟化 | 3 | 5h | 大型项目体验 |

**建议 Sprint 划分**:
- Sprint 38-Early: P001 (i18n E1+E2) + P004 (E2E 修复)
- Sprint 38-Mid: P001 E3 + P002 E1+E2
- Sprint 38-Late: P002 E3 + P003 + P005

---

## 验收测试策略

| 功能 | 单元测试 | 集成测试 | E2E | 视觉回归 |
|------|----------|----------|-----|----------|
| P001 i18n | `i18n/messages/*.json` key 覆盖完整性 | LanguageStore persist | 设置页面语言切换 spec | 截图对比 |
| P002 协作 | businessFlowStore oplog append | AI indicator 显示 | conflict warning spec | — |
| P003 AI | useAIAgent lastResult 状态 | DiffOverlay approve/reject | DiffOverlay flow spec | — |
| P004 E2E | — | — | 全部 specs 无 timeout | — |
| P005 性能 | — | 500 节点渲染测试 | 缩放 spec (帧率日志) | — |

**测试验证命令**:
```bash
cd /root/.openclaw/vibex/vibex-fronted
pnpm test           # 单元 + 集成
pnpm test:e2e       # E2E (CI 模式: retries=2)
```

---

## 风险与依赖

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| P001 i18n 遗漏硬编码文本 | P0 高 | 逐文件审查 + CI lint 规则（no hardcoded string）|
| P002 oplog 性能开销 | P1 中 | append-only 限制 1000 条，老条目标记归档 |
| P003 DiffOverlay 与 S6 useAIAgent 接口兼容性 | P1 中 | 先读 S6 architecture.md，确认 hook 返回值类型 |
| P004 waitForTimeout 替换遗漏 | P1 中 | grep 全量扫描 + E2E CI 强制执行 |
| P005 虚拟化与现有拖拽交互冲突 | P1 高 | 先在 ProtoFlowCanvas 做 feature flag，DevTools 验证帧率 |

---

## 依赖关系

- P001 依赖: S37 `userPreferencesStore`（已就绪 ✅）
- P002 依赖: S6 `useAIAgent` hook（已就绪 ✅）, S37 `confirmationStore`（已就绪 ✅）
- P003 依赖: S6 `useAIAgent` hook（已就绪 ✅）
- P005 依赖: S1 `useVirtualization`（未实现，从头建立）
- 无跨团队外部依赖
