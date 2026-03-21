# 实施计划: VibeX 首页重构 (homepage-redesign-analysis)

> **项目**: homepage-redesign-analysis  
> **版本**: v1.0  
> **架构师**: Architect Agent  
> **日期**: 2026-03-21  
> **依赖**: 架构文档 (`docs/homepage-redesign-analysis/architecture.md`)

---

## 1. 实施概览

### 1.1 工作量汇总

| 阶段 | Sprint | Epic | 功能点 | 工期 |
|------|--------|------|--------|------|
| **Phase 1** | Sprint 1 | Epic 1, 3, 9 | 布局框架 + 步骤导航 + 状态管理 | 14h |
| **Phase 2** | Sprint 2 | Epic 2, 4 | Header + 预览区 | 12h |
| **Phase 3** | Sprint 3 | Epic 6 | 底部面板核心功能 | 8h |
| **Phase 4** | Sprint 4 | Epic 5, 7 | SSE + AI展示区 | 8h |
| **Phase 5** | Sprint 5 | Epic 8 | 悬浮模式 + 测试优化 | 6h |
| **总计** | 5 Sprint | 9 Epic | 32 功能点 | **48h ≈ 6 人日** |

### 1.2 技术前提

| 前置条件 | 负责人 | 状态 | 说明 |
|----------|--------|------|------|
| 后端 SSE 接口就绪 | 后端 | 已实现 | `/api/v1/analyze/stream` |
| Mermaid.js v10+ | 前端 | 已引入 | - |
| Zustand 4.x | 前端 | 已使用 | - |
| TypeScript 5.x | 前端 | 已配置 | - |
| Playwright E2E 环境 | 前端 | 已就绪 | - |

---

## 2. Sprint 详细计划

### Sprint 1: 布局 + 状态 + 步骤导航（14h）

**目标**: 可运行的基础框架，步骤可切换，数据可持久化

#### Day 1（6h）

| 时间 | 任务 | 负责人 | 产出 |
|------|------|--------|------|
| 0-2h | 创建目录结构，创建类型定义 `types/homepage.ts` | dev | `src/types/homepage.ts` |
| 0-2h | 改造 `HomePageStore`，添加所有状态字段 + persist | dev | `src/stores/homePageStore.ts` |
| 2-4h | 实现 `GridContainer` 组件（1400px，3×3 Grid，响应式） | dev | `GridContainer.tsx + .module.css` |
| 4-6h | 实现 `StepNavigator` 组件（4 步，状态样式，点击切换） | dev | `StepNavigator.tsx + .module.css` |

**验收标准**:
```bash
# 布局验证
pnpm test -- --grep "ST-1.1|ST-1.2|ST-1.3"
# 步骤导航
pnpm test -- --grep "ST-3.1|ST-3.2|ST-3.3"
```

#### Day 2（8h）

| 时间 | 任务 | 负责人 | 产出 |
|------|------|--------|------|
| 0-3h | 实现快照功能（saveSnapshot + restoreSnapshot，最多 5 个） | dev | `src/hooks/useHomePageStore.ts` |
| 0-2h | 实现 localStorage 持久化（partialize 配置） | dev | 同上 |
| 2-4h | 实现草稿保存（saveDraft） | dev | `src/hooks/useDraft.ts` |
| 4-6h | 重构 `HomePage` 入口，集成 GridContainer + StepNavigator | dev | `HomePage.tsx` |
| 6-8h | 单元测试（Store 快照、持久化、步骤切换性能） | tester | `__tests__/stores/homePageStore.test.ts` |

**验收标准**:
```bash
# 状态管理测试
pnpm test -- --grep "ST-9.1|ST-9.2"
# 步骤切换性能
pnpm test -- --grep "ST-3.2"
# 覆盖率
pnpm test --coverage --coverageThreshold='{"global":{"lines":80}}'
```

---

### Sprint 2: Header + 预览区（12h）

**目标**: Header 导航完整，预览区可渲染 Mermaid 图，支持缩放导出

#### Day 3（6h）

| 时间 | 任务 | 负责人 | 产出 |
|------|------|--------|------|
| 0-2h | 实现 `Header` 组件（Logo、导航链接、登录按钮） | dev | `Header.tsx + .module.css` |
| 0-2h | 实现登录抽屉（未登录显示登录按钮，已登录显示头像） | dev | `LoginDrawer.tsx` |
| 2-4h | 实现 `PreviewArea` 组件（空状态、加载态、切换逻辑） | dev | `PreviewArea.tsx + .module.css` |
| 4-6h | 实现 `PreviewHeader`（缩放控制 50%-200%，导出按钮） | dev | `PreviewHeader.tsx` |

#### Day 4（6h）

| 时间 | 任务 | 负责人 | 产出 |
|------|------|--------|------|
| 0-3h | 改造 `MermaidRenderer`（支持 scale + drag + 4 种类型） | dev | `MermaidRenderer.tsx` |
| 0-2h | 实现导出功能（PNG via html2canvas，SVG 直接导出） | dev | `ExportControls.tsx` |
| 2-4h | 集成 Header + PreviewArea 到 HomePage | dev | `HomePage.tsx` 更新 |
| 4-6h | 组件测试 + E2E 测试 | tester | 测试文件 |

**验收标准**:
```bash
# Header 测试
pnpm test -- --grep "ST-2.1|ST-2.2|ST-2.3|ST-2.4"
# 预览区测试
pnpm test -- --grep "ST-4.1|ST-4.2|ST-4.3|ST-4.4|ST-4.5|ST-4.6"
# E2E
pnpm playwright test e2e/homepage-redesign-analysis.spec.ts --grep "ST-4|ST-2"
```

---

### Sprint 3: 底部面板（8h）

**目标**: 底部面板完整可用，需求输入、AI 交互、项目创建

#### Day 5（8h）

| 时间 | 任务 | 负责人 | 产出 |
|------|------|--------|------|
| 0-2h | 实现 `BottomPanel` 容器（手柄、展开/收起动画） | dev | `BottomPanel.tsx + .module.css` |
| 0-2h | 实现 `RequirementTextarea`（5000字、Ctrl+Enter 发送） | dev | `RequirementTextarea.tsx` |
| 0-2h | 实现 `QuickAskButtons`（5 个预设问题） | dev | `QuickAskButtons.tsx` |
| 2-4h | 实现 `DiagnosisButtons`（诊断/优化） | dev | `DiagnosisButtons.tsx` |
| 2-4h | 实现 `ChatHistory`（最近 10 条，可展开） | dev | `ChatHistory.tsx` |
| 4-6h | 实现保存草稿 + 重新生成按钮 | dev | `BottomPanel.tsx` |
| 6-8h | 实现 `CreateProjectButton` + API 集成 | dev | `projectApi.createProject()` |
| 8-8h | 测试 | tester | 测试文件 |

**验收标准**:
```bash
pnpm test -- --grep "ST-6.1|ST-6.2|ST-6.3|ST-6.4|ST-6.5|ST-6.6|ST-6.7|ST-6.8|ST-6.9|ST-6.10"
pnpm playwright test e2e/homepage-redesign-analysis.spec.ts --grep "ST-6"
```

---

### Sprint 4: SSE + AI展示区（8h）

**目标**: SSE 流式显示 AI 思考过程，三列卡片展示结果

#### Day 6（8h）

| 时间 | 任务 | 负责人 | 产出 |
|------|------|--------|------|
| 0-2h | 实现 `useSSEStream` Hook（SSE 连接、事件解析） | dev | `src/hooks/useSSEStream.ts` |
| 0-2h | 实现 SSE 重连逻辑（指数退避 1s→2s→4s，最多 3 次） | dev | 同上 |
| 0-2h | 实现 `RightDrawer` + `StreamingText`（逐步显示流式文本） | dev | `RightDrawer.tsx`, `StreamingText.tsx` |
| 2-4h | 实现 `AIResultCards` 三列布局 | dev | `AIResultCards.tsx + .module.css` |
| 2-4h | 实现 `AICard`（点击展开详情） | dev | `AICard.tsx + .module.css` |
| 4-6h | 集成 SSE 流式数据到 PreviewArea + AIResultCards | dev | `HomePage.tsx` 更新 |
| 6-8h | SSE 测试 + E2E 测试 | tester | 测试文件 |

**验收标准**:
```bash
pnpm test -- --grep "ST-5.1|ST-5.2|ST-5.3|ST-7.1|ST-7.2|ST-7.3"
pnpm playwright test e2e/homepage-redesign-analysis.spec.ts --grep "ST-5|ST-7"
```

---

### Sprint 5: 悬浮模式 + 测试优化（6h）

**目标**: 悬浮模式完成，全量 E2E 测试通过，验收覆盖完整

#### Day 7（6h）

| 时间 | 任务 | 负责人 | 产出 |
|------|------|--------|------|
| 0-2h | 实现 `FloatingMode`（IntersectionObserver 滚动检测） | dev | `FloatingMode.tsx` |
| 0-2h | 实现悬浮收起/恢复动画（200px 触发，1s 后恢复） | dev | `BottomPanel.module.css` 动画 |
| 0-2h | 优化性能（useDeferredValue、组件懒加载验证） | dev | 代码优化 |
| 2-4h | 全量 E2E 测试（Playwright） | tester | `e2e/homepage-redesign-analysis.spec.ts` |
| 4-6h | 覆盖率检查 + 补充测试 | tester | 测试文件 |
| 4-6h | 修复 Bug | dev | - |

**验收标准**:
```bash
# 悬浮模式
pnpm playwright test e2e/homepage-redesign-analysis.spec.ts --grep "ST-8"
# 全量 E2E
pnpm playwright test e2e/homepage-redesign-analysis.spec.ts
# 覆盖率
pnpm test --coverage --coverageThreshold='{"global":{"lines":80,"branches":75,"functions":80}}'
```

---

## 3. 开发约束

### 3.1 代码规范

```bash
# ESLint + TypeScript 严格模式
pnpm lint
pnpm type-check

# 提交前必须
pnpm test
pnpm playwright test
```

### 3.2 提交规范

```
feat(Epic-N): ST-X.X 描述
fix(Epic-N): ST-X.X 描述
test(Epic-N): ST-X.X 描述
refactor(Epic-N): 描述
```

### 3.3 审查要求

| 阶段 | 审查点 | 审查人 |
|------|--------|--------|
| Sprint 1 | GridContainer + StepNavigator | reviewer |
| Sprint 2 | Header + PreviewArea + Mermaid | reviewer |
| Sprint 3 | BottomPanel 完整功能 | reviewer |
| Sprint 4 | SSE + AIResultCards | reviewer |
| Sprint 5 | FloatingMode + 全量 E2E | reviewer |

### 3.4 验收流程

```
Dev 完成 Story → PR → Reviewer 审查 → 合并 → Tester E2E → 全部通过 → Sprint 完成
```

---

## 4. 进度追踪

| Sprint | 开始 | 结束 | 状态 | 备注 |
|--------|------|------|------|------|
| Sprint 1 | - | - | 🔲 待开始 | |
| Sprint 2 | - | - | 🔲 待开始 | |
| Sprint 3 | - | - | 🔲 待开始 | |
| Sprint 4 | - | - | 🔲 待开始 | |
| Sprint 5 | - | - | 🔲 待开始 | |

---

## 5. 关键路径

```
Sprint 1 (布局+状态)
    ↓
Sprint 2 (Header+预览)  ← 依赖 Sprint 1
    ↓
Sprint 3 (底部面板)     ← 依赖 Sprint 1 的状态层
    ↓
Sprint 4 (SSE+AI)      ← 依赖 Sprint 2 的预览区
    ↓
Sprint 5 (悬浮+测试)    ← 依赖 Sprint 3 的底部面板
```
