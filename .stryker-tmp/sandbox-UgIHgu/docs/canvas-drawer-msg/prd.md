# PRD: Canvas 消息抽屉 — 2026-03-31

> **任务**: canvas-drawer-msg/create-prd
> **创建日期**: 2026-03-31
> **PM**: PM Agent
> **产出物**: /root/.openclaw/vibex/docs/canvas-drawer-msg/prd.md
> **分析文档**: /root/.openclaw/vibex/docs/canvas-drawer-msg/analysis.md

---

## 1. 执行摘要

| 项目 | 内容 |
|------|------|
| **背景** | Canvas 缺少操作历史沉淀 + 无快捷命令入口，用户操作无记录，命令入口分散 |
| **目标** | 右侧 200px 消息抽屉，Chat 模式（Slack 风格），支持 /命令 + 卡片点选过滤 + 控制台日志 |
| **成功指标** | 抽屉可打开/关闭；5 个命令均可触发控制台日志；点选卡片后命令正确过滤 |

### 6 项已确认设计决策（约束）

| ID | 决策 |
|----|------|
| D1 | Chat 模式（Slack 风格），非复用 AIChatPanel |
| D2 | 5 个命令：/submit /gen-context /gen-flow /update-card /gen-component，console.log 控制台输出 |
| D3 | PC 默认 200px，可调整 |
| D4 | 底部输入框展示 /命令，无独立预览卡片；点选卡片 → 命令过滤 |
| D5 | Phase1：需求录入 + 卡片点选过滤 + 控制台日志 |
| D6 | **不展示 API 路由**，控制台输出调用事件 |

---

## 2. Epic 拆分

### Epic 1: 消息抽屉基础框架（P0）

**目标**: 抽屉容器 + 消息列表 + 与 canvasStore 联动

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | 抽屉容器 | 右侧固定 200px，动画展开/收起，与 canvas 三列共存 | `expect(drawerWidth).toBe(200); expect(isVisible).toBe(true);` | 【需页面集成】 |
| F1.2 | 抽屉入口按钮 | ProjectBar 添加抽屉开关按钮 | `expect(toggleBtn).toBeInTheDocument(); expect(toggleBtn).toHaveAccessibleName(/消息抽屉/);` | 【需页面集成】 |
| F1.3 | 消息列表 | MessageList + MessageItem，支持 user_action / ai_suggestion / system / command_executed 四种类型 | `expect(messageList).toBeVisible(); expect(messageTypes).toContain('command_executed');` | 【需页面集成】 |
| F1.4 | canvasStore 联动 | 节点操作（add/confirm/delete）自动追加消息记录 | `expect(addNodeEvent).toAddMessage(); expect(confirmEvent).toAddMessage();` | 【需页面集成】 |
| F1.5 | 消息存储 | messageDrawerStore（Zustand），消息持久化 | `expect(messages.length).toBeGreaterThan(0); expect(messages[0]).toHaveProperty('type');` | 【需页面集成】 |

**Epic 1 DoD**: 抽屉可打开/关闭，消息列表可见，节点操作自动追加消息

---

### Epic 2: 命令输入系统（P0）

**目标**: /命令 输入 + 下拉过滤 + 控制台执行

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1 | 命令输入框 | 底部固定输入框，支持 `/` 触发命令下拉 | `expect(inputBox).toBeVisible(); expect(inputPlaceholder).toMatch(/\\/|\\/命令/);` | 【需页面集成】 |
| F2.2 | 命令下拉列表 | 输入 `/` 后下方展示过滤后的命令列表 | `expect(commandList).toBeVisible(); expect(commandItems).toHaveLength(5);` | 【需页面集成】 |
| F2.3 | 关键词过滤 | 输入 `/gen` 只显示 /gen-context 和 /gen-flow | `expect(whenInput('/gen')).toShowCommands(['/gen-context', '/gen-flow']);` | 【需页面集成】 |
| F2.4 | 节点依赖过滤 | 点选卡片后（selectedNodeIds 非空），隐藏 nodeRequired=false 的命令 | `expect(whenNodeSelected).toShowCommands(['/update-card']);` | 【需页面集成】 |
| F2.5 | 取消选择恢复 | 取消卡片选择后，所有命令恢复显示 | `expect(whenNodeDeselected).toShowCommands(ALL_5_COMMANDS);` | 【需页面集成】 |
| F2.6 | 命令执行（console.log） | 点击命令 → console.log('[Command] /xxx triggered') | `expect(execute('/gen-context')).toLog('[Command] /gen-context triggered');` | 【需页面集成】 |
| F2.7 | 命令执行追加消息 | 命令执行后，消息列表追加 command_executed 类型记录 | `expect(executeCommand).toAddMessage({ type: 'command_executed' });` | 【需页面集成】 |

**Epic 2 DoD**: 5 个命令均可触发；关键词过滤正确；节点选择时过滤正确；执行后控制台有日志

---

### Epic 3: Phase1 收尾（P1）

**目标**: 视觉一致化 + 响应式 + E2E 测试

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.1 | 视觉风格一致 | 抽屉样式与 canvas 整体一致（非 AIChatPanel 复用） | `expect(drawerStyles).toMatch(.canvasTreeStyles);` | 【需页面集成】 |
| F3.2 | 移动端响应式 | ≤768px 时抽屉收起或使用 BottomSheet | `expect(mobileWidth).toHaveDrawer('hidden');` | 【需页面集成】 |
| F3.3 | E2E 测试覆盖 | Playwright 测试：打开抽屉/执行命令/节点过滤 | `expect(e2e('open drawer')).toPass(); expect(e2e('execute command')).toPass();` | 【需页面集成】 |

**Epic 3 DoD**: 视觉与 canvas 一致；移动端可用；E2E 测试覆盖

---

## 3. 命令定义（D2 约束）

| 命令 | 标签 | TreeType | nodeRequired | 控制台输出 |
|------|------|----------|-------------|------------|
| /submit | 提交需求 | - | false | `[Command] /submit triggered — 提交需求` |
| /gen-context | 生成限界上下文 | context | false | `[Command] /gen-context triggered — 生成限界上下文` |
| /gen-flow | 生成流程树 | flow | false | `[Command] /gen-flow triggered — 生成流程树` |
| /update-card | 修改选中卡片 | - | **true** | `[Command] /update-card triggered — 修改选中卡片` |
| /gen-component | 生成组件 | component | false | `[Command] /gen-component triggered — 生成组件` |

---

## 4. 验收标准总表（expect() 断言）

| ID | 条件 | 断言 |
|----|------|------|
| AC-1 | 抽屉默认宽度 200px | `expect(drawer.getBoundingClientRect().width).toBe(200);` |
| AC-2 | 输入 `/` 出现命令下拉 | `expect(commandDropdown).toBeVisible();` |
| AC-3 | 输入 `/gen` 过滤显示 2 个命令 | `expect(filteredCommands).toHaveLength(2); expect(filteredCommands).toContain('/gen-context');` |
| AC-4 | 点选卡片后只显示 /update-card | `expect(selectedNodeIds).toHaveLength(1); expect(visibleCommands).toHaveLength(1); expect(visibleCommands[0]).toBe('/update-card');` |
| AC-5 | 取消选择后恢复 5 个命令 | `expect(noSelectionVisibleCommands).toHaveLength(5);` |
| AC-6 | 点击 /gen-context 控制台输出正确 | `expect(console).toHaveLogged('[Command] /gen-context triggered — 生成限界上下文');` |
| AC-7 | 命令执行追加 command_executed 消息 | `expect(messages).toContainEqual(expect.objectContaining({ type: 'command_executed' }));` |
| AC-8 | 抽屉可通过按钮打开/关闭 | `expect(toggleDrawer).toToggleVisibility();` |
| AC-9 | 风格与 canvas 一致（非 AIChatPanel） | `expect(styles.fontFamily).toBe(canvasFontFamily); expect(styles.colors).toMatchObject(canvasColors);` |

---

## 5. 非功能需求

| 类型 | 要求 |
|------|------|
| **性能** | 消息列表 ≥ 200 条时使用虚拟列表 |
| **响应式** | ≤768px 收起或 BottomSheet |
| **可访问性** | 键盘可聚焦输入框，ARIA label 完整 |
| **兼容性** | 不依赖 AIChatPanel，独立实现 |

---

## 6. 实施计划

| Epic | Story | 工时 | Sprint |
|-------|--------|------|--------|
| Epic 1 | S1.1-S1.5 抽屉基础 | 4h | Sprint 0 |
| Epic 2 | S2.1-S2.7 命令系统 | 4h | Sprint 0 |
| Epic 3 | S3.1-S3.3 收尾 | 2h | Sprint 1 |

**总工时**: ~10h

---

## 7. DoD（完成定义）

### 功能点 DoD
1. 代码实现完成
2. 每个功能点验收标准通过
3. `npm run build` 通过，TypeScript 0 errors
4. ESLint 0 warnings
5. E2E 测试覆盖 Phase1 全部场景

### Epic DoD
- Epic 1：抽屉可打开/关闭，消息列表可见，节点操作自动追加消息
- Epic 2：5 个命令均可触发，关键词过滤 + 节点过滤均正确
- Epic 3：视觉一致，移动端可用，E2E 测试通过
