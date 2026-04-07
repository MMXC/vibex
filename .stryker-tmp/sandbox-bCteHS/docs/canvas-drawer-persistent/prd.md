# PRD: Canvas 双侧常驻抽屉面板 — 2026-03-31

> **任务**: canvas-drawer-persistent/create-prd
> **创建日期**: 2026-03-31
> **PM**: PM Agent
> **产出物**: /root/.openclaw/vibex/docs/canvas-drawer-persistent/prd.md
> **分析文档**: /root/.openclaw/vibex/docs/canvas-drawer-persistent/analysis.md

---

## 1. 执行摘要

| 项目 | 内容 |
|------|------|
| **背景** | Canvas 当前为纯居中三列面板，用户在 context/flow/component 阶段无法继续输入自然语言需求，AI 进度不可见，无法中止，布局宽度不可调 |
| **目标** | 左右两侧常驻抽屉面板：左抽屉持续输入需求，右抽屉展示 AI 进度/状态/中止 |
| **成功指标** | 任意阶段可在左抽屉输入需求；右抽屉显示 AI 状态；可中止 AI 请求；抽屉宽度可调 |

### 与 canvas-drawer-msg 的关系

| 项目 | 右抽屉定位 |
|------|-----------|
| canvas-drawer-msg | 消息列表 + 命令面板（/命令） |
| **本项目** | **AI 进度/状态/中止请求** |

**决策**: 本项目的右抽屉**替代** canvas-drawer-msg 的右抽屉，两个项目合并右抽屉功能（AI 进度优先，消息功能整合到本项目右抽屉底部）

---

## 2. Epic 拆分

### Epic 1: canvasStore 状态扩展（P0）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S1.1 | 新增 drawer 状态：`leftDrawerOpen/rightDrawerOpen/leftDrawerWidth/rightDrawerWidth` | 0.5h | `expect(canvasStore.leftDrawerOpen).toBe(false); expect(canvasStore.rightDrawerWidth).toBe(200);` |
| S1.2 | 新增 `abortGeneration()` 方法（调用 AbortController） | 0.5h | `expect(canvasStore.abortGeneration).toBeDefined(); expect(abort).toBeCallable();` |
| S1.3 | 新增 SSE 状态：`sseStatus: 'idle'|'connecting'|'connected'|'reconnecting'|'error'` | 0.5h | `expect(sseStatus).toBe('idle');` |

**DoD**: drawer 状态和 abort 方法已定义，可被左右抽屉组件订阅

---

### Epic 2: 左抽屉组件 — 自然语言持续输入（P0）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S2.1 | 左抽屉容器（200px 默认宽，可折叠/展开） | 1h | `expect(leftDrawerDefaultWidth).toBe(200); expect(leftDrawerCollapsedWidth).toBe(0);` |
| S2.2 | `requirementTextarea` 迁移到左抽屉（任意阶段可用） | 1.5h | `expect(textareaVisibleInPhase('context')).toBe(true); expect(textareaVisibleInPhase('component')).toBe(true);` |
| S2.3 | 发送按钮 → 调用 `generateContexts` | 0.5h | `expect(sendBtn).toTriggerGenerateContexts();` |
| S2.4 | 最近 3-5 条输入历史（sessionStorage） | 0.5h | `expect(historyItems).toHaveLength(3); expect(historyPersistedAfterRefresh).toBe(true);` |
| S2.5 | ProjectBar 添加左抽屉入口按钮 | 0.25h | `expect(leftDrawerToggle).toBeInTheDocument(); expect(accessibleLabel).toMatch(/需求输入\|左抽屉/);` |

**DoD**: 任意 phase 在左抽屉输入需求并触发 AI 生成，历史记录跨刷新保持

---

### Epic 3: 右抽屉组件 — AI 进度/状态/中止（P0）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S3.1 | 右抽屉容器（200px 默认宽，可折叠/展开） | 1h | `expect(rightDrawerDefaultWidth).toBe(200);` |
| S3.2 | AI 进度指示器（idle/generating/complete/error 四种状态） | 1h | `expect(statusIndicator).toMatchColor('idle', gray); expect(statusIndicator).toMatchColor('generating', blue);` |
| S3.3 | SSE 连接状态展示（connecting/connected/reconnecting/error） | 0.5h | `expect(sseStatus).toBeVisible(); expect(sseStatus).toShowState('idle'|'generating');` |
| S3.4 | 一键中止按钮（调用 `abortGeneration()`） | 0.5h | `expect(abortBtn).toBeVisible(); expect(abortBtn).toCallAbort();` |
| S3.5 | 错误信息展示（error 状态时显示具体错误） | 0.5h | `expect(errorMessage).toBeVisibleWhen(sseStatus === 'error');` |
| S3.6 | 与 canvas-drawer-msg 合并：消息功能整合到右抽屉底部 | 1h | `expect(messageList).toBeInRightDrawer(); expect(messageList).toBeBelow(statusIndicator);` |

**DoD**: 右抽屉显示 AI 状态，可中止请求，消息功能已整合

---

### Epic 4: 宽度拖拽交互（P1）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S4.1 | 拖拽调整左抽屉宽度（min 100px, max 400px） | 1h | `expect(dragToResize(50)).toBe(minWidth); expect(dragToResize(500)).toBe(maxWidth);` |
| S4.2 | 拖拽调整右抽屉宽度（min 100px, max 400px） | 1h | `expect(rightDrawerResizable).toBe(true);` |
| S4.3 | 宽度通过 CSS 变量 `var(--left-drawer-width)` 管理 | 0.25h | `expect(cssVar).toBe('--left-drawer-width');` |
| S4.4 | 折叠时抽屉宽度为 0，展开时恢复上次宽度 | 0.25h | `expect(widthAfterCollapse).toBe(0); expect(widthAfterExpand).toBe(previousWidth);` |

**DoD**: 拖拽流畅，边界限制生效，折叠/展开宽度记忆正确

---

### Epic 5: 布局改造（P0）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S5.1 | canvasContainer 改为 flex row 布局 | 0.5h | `expect(canvasContainer).toHaveStyle({ display: 'flex', flexDirection: 'row' });` |
| S5.2 | treePanelsGrid 改为 flex: 1 填充剩余空间 | 0.5h | `expect(treePanelsGrid).toHaveStyle({ flex: '1', minWidth: '0' });` |
| S5.3 | expandCol (24px) 移除，左右边缘由抽屉占据 | 0.25h | `expect(expandCol).toBeRemoved();` |
| S5.4 | 抽屉展开时画布最小宽度 400px 保护 | 0.25h | `expect(canvasMinWidth).toBe(400);` |

**DoD**: flex 布局改造不影响现有三列 grid，抽屉展开/折叠不影响画布核心功能

---

### Epic 6: E2E 测试覆盖（P1）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S6.1 | 左抽屉：展开/折叠/输入需求/触发生成 | 0.5h | `expect(e2e('leftDrawer open/close/input/generate')).toPass();` |
| S6.2 | 右抽屉：展开/显示状态/中止按钮 | 0.5h | `expect(e2e('rightDrawer status/abort')).toPass();` |
| S6.3 | 宽度拖拽：边界限制验证 | 0.5h | `expect(e2e('drawer resize limits')).toPass();` |
| S6.4 | 与 canvas-drawer-msg 合并后：消息列表在右抽屉 | 0.5h | `expect(e2e('messages in right drawer')).toPass();` |

**DoD**: 所有关键交互有 E2E 测试覆盖，Playwright CI blocking

---

## 3. 验收标准总表（expect() 断言）

| ID | 条件 | 断言 |
|----|------|------|
| AC-1 | 任意 phase 左抽屉可见 textarea | `expect(getByPlaceholder(/输入需求/)).toBeInTheDocument();` |
| AC-2 | 右抽屉显示 AI 状态 | `expect(statusIndicator).toBeInTheDocument();` |
| AC-3 | 右抽屉有中止按钮 | `expect(abortBtn).toBeInTheDocument();` |
| AC-4 | 拖拽宽度范围 100-400px | `expect(drawerWidth).toBeGreaterThanOrEqual(100); expect(drawerWidth).toBeLessThanOrEqual(400);` |
| AC-5 | 折叠后画布宽度恢复正常 | `expect(canvasWidthCollapsed).toBe(canvasWidthNormal);` |
| AC-6 | 左右抽屉同时展开互不干扰 | `expect(leftAndRightDrawerOpen).toBe(true); expect(panels).toBeIndependent();` |
| AC-7 | 消息列表在右抽屉底部 | `expect(messageListParent).toBe(rightDrawer);` |
| AC-8 | E2E 测试覆盖 | `expect(e2eCoverage).toContain('leftDrawer', 'rightDrawer', 'resize');` |

---

## 4. 非功能需求

| 类型 | 要求 |
|------|------|
| **性能** | 抽屉展开/折叠动画 300ms，不影响画布渲染性能 |
| **布局** | flex row 改造，不破坏现有三列 grid |
| **兼容性** | drawer 宽度通过 CSS 变量管理，不使用硬编码 |
| **可访问性** | 抽屉按钮键盘可聚焦，ARIA label 完整 |

---

## 5. 实施计划

| Epic | Story | 工时 | Sprint |
|------|-------|------|--------|
| Epic 1 | S1.1-S1.3 store 扩展 | 1.5h | Sprint 0 |
| Epic 5 | S5.1-S5.4 布局改造 | 1.5h | Sprint 0 |
| Epic 2 | S2.1-S2.5 左抽屉 | 3.75h | Sprint 0 |
| Epic 3 | S3.1-S3.6 右抽屉+合并 | 3.5h | Sprint 0 |
| Epic 4 | S4.1-S4.4 宽度拖拽 | 2.5h | Sprint 1 |
| Epic 6 | S6.1-S6.4 E2E 测试 | 2h | Sprint 1 |

**总工时**: ~15h

---

## 6. DoD（完成定义）

### 功能点 DoD
1. 代码实现完成
2. 每个 Story 验收标准通过
3. `npm run build` 通过，TypeScript 0 errors
4. ESLint 0 warnings
5. gstack screenshot 验证 UI

### Epic DoD
- **Epic 1**: drawer 状态可订阅，abort 方法可调用
- **Epic 2**: 任意 phase 可在左抽屉输入并触发生成
- **Epic 3**: 右抽屉显示 AI 状态，可中止，消息功能已整合
- **Epic 4**: 拖拽流畅，边界正确，折叠/展开记忆
- **Epic 5**: flex 布局改造成功，三列 grid 不受影响
- **Epic 6**: E2E 测试通过，Playwright CI blocking
