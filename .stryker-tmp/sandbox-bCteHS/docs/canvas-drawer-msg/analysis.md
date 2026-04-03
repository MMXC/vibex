# Canvas 画布页右侧消息抽屉 — 需求分析

**项目**: canvas-drawer-msg  
**阶段**: analyze-requirements  
**Analyst**: analyst  
**日期**: 2026-03-31  
**状态**: ✅ 完成（含 6 项已确认设计决策）

---

## 0. 已确认设计决策（小羊 2026-03-31 确认）

> 以下 6 项决策为约束条件，已确认不可更改，直接纳入分析。

| ID | 决策 | 说明 |
|----|------|------|
| **D1** | 抽屉交互模式 | Chat 模式（Slack 风格），风格与 canvas 整体一致（非复用 AIChatPanel） |
| **D2** | CLI 命令交互 | 输入框支持 `/命令`，映射 canvas 按钮事件：/submit、/gen-context、/gen-flow、/update-card、/gen-component；点击 → 控制台打印调用事件日志（**不展示 API 路由**） |
| **D3** | 抽屉宽度 | PC 设备默认 **200px**，可调整 |
| **D4** | 命令预览 | 直接在底部输入框展示 `/命令`，无独立命令预览卡片。鼠标左键点选画布卡片 → 过滤输入框中可用命令范围 |
| **D5** | Phase1 范围 | 先实现：需求录入命令接收 + 展示、卡片点选 → 命令过滤、控制台日志 |
| **D6** | API 路由 | **不展示 API 路由**，控制台输出调用事件即可（方便调试） |

---

## 1. 业务场景分析

### 1.1 背景

VibeX Canvas 当前是纯树形节点编辑器，用户操作无记录沉淀，命令入口分散。

| 缺口 | 现状 | 期望 |
|------|------|------|
| 无操作历史记录 | 操作后无法回溯 | 类 Slack 消息列显示每步操作 |
| 无快捷命令入口 | 需鼠标点击多个菜单 | `/` 唤起命令面板快速触发 |
| 命令与节点关联弱 | 点选卡片后不知道能做什么 | 点选卡片后命令范围自动过滤 |

### 1.2 目标用户

- **核心用户**: 产品经理、创业者（高频画布操作）
- **次级用户**: 开发团队（快速生成组件）

### 1.3 核心 Jobs-To-Be-Done (JTBD)

| # | JTBD | 用户故事 | 优先级 |
|---|------|----------|--------|
| JTBD-1 | **操作历史可追溯** | 作为用户，我希望看到每一步画布操作（新增/确认/删除节点）的记录，以便回溯设计过程 | P0 |
| JTBD-2 | **命令快速触发** | 作为用户，我希望能通过 `/` 命令快速触发画布操作，而不必点击多次菜单 | P0 |
| JTBD-3 | **节点关联命令** | 作为用户，我希望点选某个卡片后，只看到与该卡片相关的命令，减少认知负担 | P0 |
| JTBD-4 | **批量节点控制** | 作为用户，我希望选择一个或多个节点后执行批量操作（批量确认/批量删除） | P1 |

---

## 2. 现有代码审计

### 2.1 相关组件

| 组件 | 路径 | 功能 | 复用/参考 |
|------|------|------|-----------|
| `RightDrawer.tsx` | `src/components/homepage/RightDrawer/` | AI 思考过程（SSE 流式），320px | 可参考布局动画和样式变量 |
| `SearchDialog.tsx` | `src/components/canvas/features/` | 搜索弹窗，有命令面板雏形 | 参考 `/` 快捷键逻辑 |
| `ShortcutHintPanel.tsx` | `src/components/canvas/features/` | 快捷键提示面板 | 命令可合并展示 |
| `ProjectBar.tsx` | `src/components/canvas/` | 顶部工具栏 | 添加抽屉入口按钮 |
| `canvasStore` | `src/lib/canvas/canvasStore.ts` | 含 `selectedNodeIds` | 必须集成，订阅选择状态 |

### 2.2 canvasStore 选择状态

```typescript
// canvasStore.ts — 多树选择状态
selectedNodeIds: Record<TreeType, string[]> = {
  context: [],
  flow: [],
  component: [],
};
```

### 2.3 布局现状

- **三列布局**: `限界上下文树 | 业务流程树 | 组件树`
- **右侧空白**: 目前无固定右侧面板（RightDrawer 是浮层，非固定）
- **右侧面板入口**: 可在 ProjectBar 添加抽屉开关按钮

---

## 3. 技术方案

### 3.1 组件架构（基于 D1/D4）

> **Chat 模式（Slack 风格），无多标签页**，命令直接展示在输入框下方。

```
src/components/canvas/
└── MessageDrawer/
    ├── MessageDrawer.tsx           # 主容器：固定右侧 200px
    ├── MessageDrawer.module.css    # 样式（参考 RightDrawer）
    ├── MessageList.tsx             # 消息时间线（ScrollArea）
    ├── MessageItem.tsx             # 单条消息（用户/AI/System）
    ├── CommandInput.tsx            # 输入框 + /命令建议下拉
    ├── types.ts                    # Message, Command 类型定义
    └── hooks/
        └── useMessageDrawer.ts     # 抽屉开关状态
```

### 3.2 消息系统

```typescript
// types.ts
export interface MessageItem {
  id: string;
  type: 'user_action' | 'ai_suggestion' | 'system' | 'command_executed';
  content: string;           // 展示文本
  timestamp: Date;
  actor?: 'user' | 'ai' | 'system';
  command?: string;         // 如果是命令执行，记录命令名
}

export interface Command {
  id: string;                // /submit, /gen-context, ...
  label: string;             // 显示名称
  treeType?: TreeType;       // 该命令关联的树类型（用于过滤）
  nodeRequired: boolean;     // 是否需要先选卡片
  keywords: string[];        // 搜索关键词
  execute: () => void;       // 执行函数 → console.log
}
```

### 3.3 命令定义（基于 D2）

> **Phase1 仅实现命令接收 + 控制台日志**，不调用真实 API。

```typescript
// Phase1 命令列表
const COMMANDS: Command[] = [
  {
    id: '/submit',
    label: '提交需求',
    treeType: undefined,     // 全局命令，不需要选卡片
    nodeRequired: false,
    keywords: ['submit', '提交', '需求'],
    execute: () => console.log('[Command] /submit triggered — 提交需求'),
  },
  {
    id: '/gen-context',
    label: '生成限界上下文',
    treeType: 'context',    // 限界上下文树相关
    nodeRequired: false,
    keywords: ['gen-context', '生成', '限界上下文', 'context'],
    execute: () => console.log('[Command] /gen-context triggered — 生成限界上下文'),
  },
  {
    id: '/gen-flow',
    label: '生成流程树',
    treeType: 'flow',       // 流程树相关
    nodeRequired: false,
    keywords: ['gen-flow', '生成', '流程树', 'flow'],
    execute: () => console.log('[Command] /gen-flow triggered — 生成流程树'),
  },
  {
    id: '/update-card',
    label: '修改选中卡片',
    treeType: undefined,
    nodeRequired: true,     // 必须先选卡片
    keywords: ['update-card', '修改', '更新', '卡片', 'card'],
    execute: () => console.log('[Command] /update-card triggered — 修改选中卡片'),
  },
  {
    id: '/gen-component',
    label: '生成组件',
    treeType: 'component',  // 组件树相关
    nodeRequired: false,
    keywords: ['gen-component', '生成', '组件', 'component'],
    execute: () => console.log('[Command] /gen-component triggered — 生成组件'),
  },
];
```

### 3.4 命令过滤逻辑（基于 D4）

```typescript
// CommandInput.tsx — 命令过滤核心逻辑
function filterCommands(input: string, selectedNodeIds: Record<TreeType, string[]>) {
  const keyword = input.replace(/^\//, '').toLowerCase();
  
  return COMMANDS.filter(cmd => {
    // 1. 关键词匹配
    const matchKeyword = cmd.keywords.some(k => k.toLowerCase().includes(keyword));
    // 2. 节点依赖过滤（点选卡片后过滤掉 nodeRequired=true 的命令）
    const nodeSelected = Object.values(selectedNodeIds).some(ids => ids.length > 0);
    if (nodeSelected && !cmd.nodeRequired) return false; // 选了节点则只显示 nodeRequired=true 的命令
    if (!nodeSelected && cmd.nodeRequired) return false;  // 没选节点则过滤掉 nodeRequired=true 的命令
    return matchKeyword;
  });
}
```

> **D4 决策解读**: 无独立命令预览卡片，建议直接在输入框下方用下拉列表展示过滤后的命令（类 Slack `/` 命令体验）。

### 3.5 数据流

```
用户操作画布
    ↓
canvasStore 状态变更（addNode / confirmNode / deleteNode）
    ↓
messageStore.addMessage() 自动记录操作
    ↓
MessageList 渲染消息条目
    ↓
用户输入 / → CommandInput 展示过滤后的命令
    ↓
用户点击/回车执行 → console.log('[Command] /xxx triggered')
    ↓
消息列表追加一条 "command_executed" 类型消息
```

---

## 4. 技术风险识别

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| Phase1 无 API 调用，命令只打印日志，用户感知"点了没反应" | **高** | 在消息列表展示执行结果："✅ 命令已触发（Phase1 预览）" |
| 200px 宽度在移动端/窄屏显示拥挤 | 低 | 响应式：≤768px 时收起或使用 BottomSheet |
| 命令下拉列表遮挡消息历史 | 中 | 下拉列表 max-height 限制，滚动显示 |
| 消息过多导致性能问题 | 低 | 虚拟列表优化，限制最多 200 条 |
| 与 RightDrawer（AI 浮层）共存区域重叠 | 低 | 两者互斥：AI 面板是浮层，MessageDrawer 是固定面板，Z-index 分层 |

---

## 5. 验收标准（基于 D5 Phase1 范围）

| ID | 验收条件 | 测试方法 |
|----|----------|----------|
| AC-1 | 抽屉默认宽度 200px，与 canvas 三列布局共存 | 视觉检查 + 测量 |
| AC-2 | 输入 `/` 后，底部输入框下方出现命令建议下拉列表 | 在输入框输入 `/` → 验证下拉出现 |
| AC-3 | 输入 `/gen` 后，命令列表过滤显示 `/gen-context` 和 `/gen-flow` | 输入 `/gen` → 验证过滤结果 |
| AC-4 | 点选画布卡片后（selectedNodeIds 非空），命令列表只显示 `/update-card` | Ctrl+点击选一个节点 → 验证 `/update-card` 高亮，其他隐藏 |
| AC-5 | 取消选择后，命令列表恢复显示所有命令 | 取消选择 → 验证完整命令列表 |
| AC-6 | 点击 `/gen-context` 后，控制台打印 `[Command] /gen-context triggered` | 点击命令 → 检查浏览器控制台 |
| AC-7 | 消息列表追加命令执行记录，格式为 "command_executed" 类型 | 执行命令 → 检查消息列表新增条目 |
| AC-8 | 抽屉可通过 ProjectBar 按钮打开/关闭 | 点击抽屉按钮 → 验证显示/隐藏动画 |
| AC-9 | 抽屉风格与 canvas 整体一致（非 AIChatPanel 复用） | 视觉对比：字体、颜色、间距与 canvas 树节点一致 |

---

## 6. 实施计划

### Epic 1: 消息抽屉基础（3-4h）
- [ ] 创建 `messageDrawerStore.ts`（Zustand store，含 messages 列表 + addMessage）
- [ ] 创建 `MessageDrawer.tsx`（200px 固定右侧容器，动画展开/收起）
- [ ] 创建 `MessageList.tsx` + `MessageItem.tsx`（消息时间线）
- [ ] 集成到 CanvasPage（ProjectBar 添加抽屉入口按钮）
- [ ] 与 canvasStore 联动（节点操作 → 自动记录消息）

### Epic 2: 命令输入系统（3-4h）
- [ ] 创建 `CommandInput.tsx`（输入框 + `/` 触发下拉）
- [ ] 实现命令过滤逻辑（关键词 + 节点依赖）
- [ ] 实现 5 个命令的 `execute` 函数（console.log）
- [ ] 命令执行后追加消息记录

### Epic 3: Phase1 收尾（1-2h）
- [ ] 视觉风格与 canvas 一致化（非 AIChatPanel）
- [ ] E2E 测试覆盖（Playwright）

**总预估工时**: 7-10h

---

## 7. 与现有分析的差异说明

| 项目 | 原分析文档（错误） | 本文档（正确） | 来源 |
|------|-------------------|--------------|------|
| 交互模式 | 多标签页 [消息/命令/选择] | Chat 模式（Slack 风格） | **D1** |
| 命令列表 | Tab3 SelectionPanel 批量控制 | 取消 Tab3，批量控制延期 | **D5** |
| 命令内容 | 6 个通用命令（confirm_all 等） | 5 个特定命令（/submit 等） | **D2** |
| 命令预览 | 独立命令预览卡片 | 底部输入框下拉，无独立卡片 | **D4** |
| 宽度 | 320px（复用 RightDrawer） | 200px（PC 默认） | **D3** |
| API 调用 | 真实 API 调用 | Phase1 仅 console.log | **D6** |

---

*分析文档完毕。6 项设计决策已标注为"已确认"。等待 PM 阶段产出 PRD。*
