# PRD: VibeX 三树并行卡片画布重构

**项目**: vibex-canvas-redesign-20260325
**版本**: v1.0
**PM**: PM Agent
**日期**: 2026-03-25
**依据**: analysis.md + vibex-fullstack-export-20260325.md
**方案**: 选项 B — 全新单页画布（推荐）

---

## 1. 执行摘要

### 背景
当前 VibeX 主流程分散在 `chat`、`design/*`、`domain`、`prototype` 等 6+ 页面，用户需要在多页面间跳转，阶段切换不透明，修改需重走全流程。

### 目标
重构为**单页三树并行卡片画布**，用户在一个页面内完成：需求录入 → 限界上下文树 → 业务流程树 → 组件树 → 原型生成队列 → 导出。

### 成功指标
- 用户在单页内完成 80%+ 的核心操作流程（无跨页面跳转）
- 任意阶段修改后，下游自动级联更新，无需重走全流程
- 原型导出成功率 ≥ 95%

### 范围决策
- ✅ MVP：单页三树并行画布 + 原型生成队列 + zip 导出
- ❌ 二期：GitHub 直接推送、SSE 实时推送、Canvas 状态后端持久化

---

## 2. 核心用户流程

```
[输入需求] 
    ↓
[AI 生成限界上下文树] → 用户逐个确认节点
    ↓
[AI 生成业务流程树] → 用户调整/确认流程步骤
    ↓
[AI 生成组件树] → 用户确认每个页面的卡片
    ↓
[创建项目] → 解锁原型生成队列
    ↓
[原型队列管理] → 各页面并行/串行生成
    ↓
[导出 zip] → 完整 Next.js 项目
```

---

## 3. 功能需求

### F1: 三树并行画布（Canvas）

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | 画布布局 | 三棵树横向并排显示，激活树高亮，非激活树暗淡 | `expect(canvas).toHaveStyle({ gridTemplateColumns: '1fr 1fr 1fr' })` | 【需页面集成】 |
| F1.2 | 阶段进度条 | 顶部显示 4 阶段进度条，当前阶段高亮，已完成绿色，进行中蓝色，待激活灰色 | `expect(progressBar.currentPhase).toBe('context')` | 【需页面集成】 |
| F1.3 | 树面板折叠 | 每个树面板可折叠/展开，折叠时显示节点摘要 | `expect(treePanel.collapsed).toBe(true)` | 【需页面集成】 |
| F1.4 | 节点确认状态 | 未确认节点显示黄色边框，确认后变为绿色 | `expect(node.confirmed).toBe(true) && expect(node.borderColor).toBe('green')` | 【需页面集成】 |
| F1.5 | 阶段激活联动 | 确认上游树后，下游树自动激活 | `expect(businessFlowTree.isActive).toBe(true)` after `boundedContextTree.allConfirmed` | 【需页面集成】 |

### F2: 限界上下文树（Bounded Context Tree）

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1 | AI 生成上下文 | 用户输入需求，AI 生成限界上下文树，节点数 ≥ 1 | `expect(contextNodes.length).toBeGreaterThanOrEqual(1)` | 【需页面集成】 |
| F2.2 | 节点确认 | 每个上下文节点可单独确认，确认后变绿 | `expect(contextNode.confirmed).toBe(true)` | 【需页面集成】 |
| F2.3 | 节点编辑 | 点击节点"编辑"可修改上下文描述，修改后标记为 pending | `expect(node.status).toBe('pending')` after edit | 【需页面集成】 |
| F2.4 | 节点删除 | 支持删除上下文节点，删除后级联标记下游为 pending | `expect(relatedFlowNodes).toBeMarkedPending()` | 【需页面集成】 |
| F2.5 | 新增节点 | 支持手动新增上下文节点 | `expect(newNode).toBeInTree()` | 【需页面集成】 |

### F3: 业务流程树（Business Flow Tree）

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.1 | 自动生成 | 上下文确认后，自动生成业务流程树 | `expect(flowNodes.length).toBeGreaterThanOrEqual(1)` | 【需页面集成】 |
| F3.2 | 流程步骤调整 | 用户可拖拽调整步骤顺序 | `expect(stepOrder).toBe(newOrder)` after drag | 【需页面集成】 |
| F3.3 | 步骤编辑 | 点击步骤可编辑描述和条件 | `expect(step.edited).toBe(true)` | 【需页面集成】 |
| F3.4 | 步骤确认 | 每个步骤可单独确认，确认后变绿 | `expect(step.confirmed).toBe(true)` | 【需页面集成】 |
| F3.5 | 上游联动 | 上下文节点修改后，相关流程步骤标记为 pending | `expect(flowStep.status).toBe('pending')` after context edit | 【需页面集成】 |

### F4: 组件树（Component Tree）

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F4.1 | 自动生成 | 流程确认后，自动生成组件树，每个页面一个根节点 | `expect(componentRoots.length).toBeGreaterThanOrEqual(1)` | 【需页面集成】 |
| F4.2 | 页面卡片预览 | 每个组件节点显示卡片预览缩略图 | `expect(card.preview).toBeVisible()` | 【需页面集成】 |
| F4.3 | 组件编辑 | 点击组件可编辑名称、描述、样式 | `expect(component.edited).toBe(true)` | 【需页面集成】 |
| F4.4 | 组件确认 | 每个组件可单独确认，确认后变绿 | `expect(component.confirmed).toBe(true)` | 【需页面集成】 |
| F4.5 | 组件删除/新增 | 支持删除或新增组件节点 | `expect(treeStructure).toMatchSnapshot()` | 【需页面集成】 |
| F4.6 | 上游联动 | 流程步骤修改后，相关组件标记为 pending | `expect(relatedComponents).toBeMarkedPending()` | 【需页面集成】 |

### F5: 原型生成队列（Prototype Queue）

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F5.1 | 队列入口 | 三树全确认后，"创建项目"按钮可用 | `expect(createProjectBtn.disabled).toBe(false)` | 【需页面集成】 |
| F5.2 | 项目创建 | 点击创建项目，解锁原型生成队列 | `expect(queue.status).toBe('unlocked')` | 【需页面集成】 |
| F5.3 | 队列状态显示 | 每个页面显示状态：等待中/生成中/完成/错误 | `expect(page.status).toBeOneOf(['queued','generating','done','error'])` | 【需页面集成】 |
| F5.4 | 单页重生成 | 单个页面可单独重生成，不影响其他页面 | `expect(otherPages.status).toBe('done')` after `targetPage.regenerate()` | 【需页面集成】 |
| F5.5 | 进度实时更新 | 5s 轮询更新生成进度 | `expect(lastPollTime).toBeLessThan(Date.now() - 5000)` | 【需页面集成】 |
| F5.6 | 错误重试 | 生成失败页面显示"重试"按钮 | `expect(retryBtn).toBeVisible()` when `page.status === 'error'` | 【需页面集成】 |

### F6: 导出功能（Export）

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F6.1 | 导出按钮 | 所有页面完成后，"导出"按钮可用 | `expect(exportBtn.disabled).toBe(false)` | 【需页面集成】 |
| F6.2 | zip 下载 | 点击导出，下载完整 Next.js 项目 zip 包 | `expect(downloadedFile.name).toMatch(/\.zip$/)` | 【需页面集成】 |
| F6.3 | 导出内容验证 | zip 解压后 `npm run dev` 可启动 | `expect(project.devServer).toStart()` after unzip | 【需页面集成】 |
| F6.4 | 导出进度 | 显示导出进度条 | `expect(progress).toBeGreaterThan(0)` during export | 【需页面集成】 |

---

## 4. Epic 拆分

### Epic 1: 画布基础框架（Canvas Foundation）⚡ P0

**目标**: 构建三树并行画布的基础设施

| Story ID | 描述 | 验收条件 |
|----------|------|---------|
| S1.1 | 画布三列布局 | `gridTemplateColumns: '1fr 1fr 1fr'`，响应式下折叠为 Tab |
| S1.2 | 阶段进度条 | 4 阶段显示，当前/完成/待激活样式正确 |
| S1.3 | 树面板组件 | 可折叠/展开，动画过渡 |
| S1.4 | 激活/暗淡状态联动 | 上游确认 → 下游激活，状态同步 |
| S1.5 | 节点确认状态样式 | 未确认黄框，确认后绿框 |

### Epic 2: 限界上下文树（Context Tree）⚡ P0

**目标**: 用户输入需求，AI 生成并确认限界上下文

| Story ID | 描述 | 验收条件 |
|----------|------|---------|
| S2.1 | 需求输入 + AI 生成 | 输入 → 树生成，节点数 ≥ 1 |
| S2.2 | 节点确认/编辑/删除/新增 | CRUD 操作正常，状态正确 |
| S2.3 | 级联标记下游 | 修改上下文 → 流程树标记 pending |

### Epic 3: 业务流程树（Flow Tree）⚡ P0

**目标**: 上下文确认后，生成并确认业务流程

| Story ID | 描述 | 验收条件 |
|----------|------|---------|
| S3.1 | 自动生成流程树 | 上下文确认 → 流程树生成 |
| S3.2 | 步骤拖拽排序 | 拖拽后顺序正确 |
| S3.3 | 步骤编辑 + 确认 | 编辑后 pending，确认后绿 |
| S3.4 | 上游联动标记 | 上下文修改 → 流程 pending |

### Epic 4: 组件树（Component Tree）⚡ P0

**目标**: 流程确认后，生成组件树，每个页面一个根节点

| Story ID | 描述 | 验收条件 |
|----------|------|---------|
| S4.1 | 自动生成组件树 | 流程确认 → 组件树生成 |
| S4.2 | 组件卡片预览 | 预览缩略图显示 |
| S4.3 | 组件 CRUD | 编辑/确认/删除/新增正常 |
| S4.4 | 上游联动标记 | 流程修改 → 组件 pending |

### Epic 5: 原型生成队列（Prototype Queue）⚡ P0

**目标**: 三树全确认后，创建项目并管理原型生成

| Story ID | 描述 | 验收条件 |
|----------|------|---------|
| S5.1 | 创建项目 + 解锁队列 | 点击 → 队列状态变为 unlocked |
| S5.2 | 队列状态显示 | 等待中/生成中/完成/错误 四种状态 |
| S5.3 | 单页重生成 | 点击重生成不影响其他页面 |
| S5.4 | 轮询进度更新 | 5s 轮询，不阻塞主流程 |
| S5.5 | 错误重试机制 | 失败 → 重试按钮可用 |

### Epic 6: 导出功能（Export）⚡ P0

**目标**: 所有页面完成后，导出 zip

| Story ID | 描述 | 验收条件 |
|----------|------|---------|
| S6.1 | 导出按钮状态 | 所有页面完成 → 按钮可用 |
| S6.2 | zip 下载 | 下载文件完整，无损坏 |
| S6.3 | 导出内容验证 | zip 解压后 `npm run dev` 成功启动 |

### Epic 7: 状态管理（State Management）⚡ P1

**目标**: Zustand 状态层，分片管理三树 + 阶段 + 队列状态

| Story ID | 描述 | 验收条件 |
|----------|------|---------|
| S7.1 | 三树状态分片 | `contextSlice` / `flowSlice` / `componentSlice` 独立 |
| S7.2 | 阶段状态 | `phaseSlice`，控制激活/暗淡联动 |
| S7.3 | 队列状态 | `queueSlice`，管理生成状态 |
| S7.4 | localStorage 持久化 | 刷新页面后状态恢复 | - |

---

## 5. 验收标准（优先级）

### P0 — 必须发布

| ID | 验收条件 | 测试方法 |
|----|---------|---------|
| AC-01 | 三树横向并排显示，响应式折叠正常 | 手动 + 截图 |
| AC-02 | 阶段进度条准确反映当前阶段 | 手动在各阶段截图 |
| AC-03 | 上下文树生成 + 确认/编辑/删除/新增正常 | 手动测试 |
| AC-04 | 流程树生成 + 拖拽排序 + 确认正常 | 手动测试 |
| AC-05 | 组件树生成 + 卡片预览 + CRUD 正常 | 手动测试 |
| AC-06 | 三树全确认后"创建项目"可用 | 手动测试 |
| AC-07 | 原型队列状态显示正确 | 手动测试 |
| AC-08 | 单页重生成不影响其他页面 | 手动测试 |
| AC-09 | 所有页面完成后可导出 zip | 手动测试 |
| AC-10 | zip 解压后 `npm run dev` 可启动 | 自动化脚本验证 |
| AC-11 | TypeScript 编译 0 error | `pnpm tsc --noEmit` |

### P1 — 发版后优化

| ID | 验收条件 |
|----|---------|
| AC-12 | 5s 轮询不阻塞主流程 |
| AC-13 | localStorage 持久化刷新后状态恢复 |
| AC-14 | 三树 ≤ 100 节点时响应 < 500ms |

---

## 6. 非功能需求

| 类型 | 要求 | 验收方法 |
|------|------|---------|
| 性能 | 三树 ≤ 100 节点时渲染 < 500ms | Performance tab |
| 性能 | 轮询间隔 5s，不阻塞主线程 | 触发生成后操作无卡顿 |
| 兼容性 | Chrome/Firefox/Safari 最新版 | 手动测试 |
| 可访问性 | 键盘可完成全流程 | 手动 Tab 测试 |
| 可访问性 | WCAG 2.1 AA 对比度 | axe 插件检测 |

---

## 7. 技术约束

1. **画布技术选型**: dagre 做布局计算 + SVG/D3 渲染（复用现有可视化能力）
2. **状态管理**: Zustand，按 slice 划分（context/flow/component/phase/queue）
3. **实时进度**: MVP 5s 轮询，二期升级 SSE
4. **导出格式**: zip 下载（MVP），二期 GitHub 推送
5. **持久化**: localStorage（MVP），二期后端同步
6. **CardTreeRenderer**: 核心渲染引擎保留，仅做数据适配
7. **保留组件**: `ui/*`、VisualizationPlatform、PrototypeTuner、PrototypeExporter
8. **废弃/折叠**: `app/chat/`、`app/design/*`、`app/domain/` 迁移到 canvas

---

## 8. DoD（Definition of Done）

每个 Story 的 DoD：
1. 代码实现完成，通过 `pnpm tsc --noEmit`
2. 单元测试覆盖核心逻辑（if any）
3. 手动测试通过验收标准
4. TypeScript 类型完备，无 `any` 泄漏
5. 组件样式符合设计稿（截图对比）

---

## 9. 依赖关系

| 依赖方 | 依赖项 | 说明 |
|--------|--------|------|
| Epic 3 | Epic 2 | 流程树依赖上下文树 |
| Epic 4 | Epic 3 | 组件树依赖流程树 |
| Epic 5 | Epic 1+2+3+4 | 队列依赖三树全确认 |
| Epic 6 | Epic 5 | 导出依赖所有页面完成 |

---

## 10. Out of Scope

- GitHub 直接推送
- SSE 实时推送
- Canvas 状态后端持久化
- 多用户协作
- 版本历史回滚
