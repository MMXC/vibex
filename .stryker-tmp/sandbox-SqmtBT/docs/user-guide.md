# VibeX 用户手册

> **@owner**: Frontend Team
> **@updated**: 2026-04-01
> **@version**: 1.0

---

## 目录

1. [画布基础操作](#1-画布基础操作)
2. [添加节点](#2-添加节点)
3. [连接边](#3-连接边)
4. [导出代码](#4-导出代码)
5. [快捷键](#5-快捷键)
6. [导出为 PNG/SVG](#6-导出为-pngsvg)
7. [批量导出 ZIP](#7-批量导出-zip)
8. [快捷生成（Ctrl+G）](#8-快捷生成ctrlg)
9. [Tab 切换（Alt+1/2/3）](#9-tab-切换alt123)
10. [撤销/重做](#10-撤销重做)
11. [搜索和筛选](#11-搜索和筛选)
12. [版本历史](#12-版本历史)

---

## 1. 画布基础操作

VibeX 画布（CanvasPage）是三树并行架构的可视化编辑界面，位于应用主视图中央区域。

### 界面布局

```
┌─────────────────────────────────────────────────────────────────┐
│  ProjectBar (顶部项目栏)                                          │
├─────────────────────────────────────────────────────────────────┤
│  TabBar [Context] [Flow] [Component]  ← 三列横向布局             │
├──────────────┬──────────────────┬──────────────────────────────┤
│  TreePanel   │   TreePanel      │   TreePanel                  │
│  (上下文树)   │   (流程树)        │   (组件树)                    │
│  Bounded     │   BusinessFlow   │   Component                  │
│  Context     │   Tree           │   Tree                       │
├──────────────┴──────────────────┴──────────────────────────────┤
│  PhaseProgressBar (阶段进度条)                                     │
└─────────────────────────────────────────────────────────────────┘
```

### 核心交互

| 操作 | 方式 |
|------|------|
| **缩放画布** | `+` / `-` 键，或 Ctrl+滚轮 |
| **重置缩放** | `0` 键 |
| **平移画布** | 鼠标拖拽空白区域 |
| **选中节点** | 单击节点 |
| **多选节点** | Ctrl+单击，或框选 |
| **清空选择** | `Esc` 键 |
| **展开/折叠节点** | 单击节点左侧三角箭头 |

### 状态栏

- **TreeStatus**: 显示当前选中树的节点数量、展开状态
- **ShortcutHintPanel**: 底部显示可用快捷键提示
- **UndoBar**: 撤销/重做操作提示栏
- **HoverHotzone**: 鼠标悬停在边缘区域时显示连接热点

---

## 2. 添加节点

### 在三树中添加节点

VibeX 支持在三棵树上分别添加节点：**Bounded Context**（上下文）、**Business Flow**（流程）、**Component**（组件）。

### 添加方式

**方式一：快捷键 N**

1. 确保焦点不在文本输入框
2. 按 `N` 键
3. 系统在当前激活树（Tab 激活的树）中插入新节点
4. 新节点默认为空节点，出现编辑态可直接输入名称

**方式二：右键菜单**

1. 右键点击树面板空白区域或节点
2. 选择 **"添加子节点"** 或 **"添加同级节点"**
3. 节点插入到对应位置

**方式三：工具栏按钮**

1. 找到 **TreePanel** 顶部的工具栏
2. 点击 `+` 按钮添加新节点
3. 可通过下拉选择节点类型（BC / Flow / Component）

### 节点编辑

- **双击节点**: 进入内联编辑模式
- **Enter**: 确认编辑
- **Esc**: 取消编辑
- **拖拽节点**: 可调整节点在树中的顺序（需通过 HoverHotzone 连接线）

### 节点类型说明

| 树 | 节点类型 | 说明 |
|----|---------|------|
| Bounded Context | `BoundedContext` | 限界上下文，顶级业务边界 |
| Business Flow | `BusinessFlow` | 业务流程，含 Step 子节点 |
| Component | `Component` | 组件，支持属性、状态、接口 |

---

## 3. 连接边

节点之间通过边（Edge）连接，表达三树之间的关联关系。

### 连接方式

**方式一：HoverHotzone 热点**

1. 鼠标悬停在节点边缘
2. 出现连接热点（上下左右四个方向）
3. 从热点拖拽出一条线
4. 连接到目标节点

**方式二：边层连接（EdgeLayer）**

- **BoundedEdgeLayer**: 渲染 BC 树之间的边（水平连接）
- **FlowEdgeLayer**: 渲染 Flow 树之间的边（垂直连接）

### 边的类型

| 边类型 | 连接关系 | 渲染层 |
|--------|---------|--------|
| Context→Flow | 上下文映射到流程 | BoundedEdgeLayer |
| Flow→Component | 流程映射到组件 | FlowEdgeLayer |
| 跨树连接 | BC↔Flow↔Component 级联 | Cascade edges |

### 编辑边

- **选中边**: 单击边
- **删除边**: 选中后按 `Del` / `Backspace`
- **边标签**: 可在边中点添加描述文字

---

## 4. 导出代码

VibeX 支持将画布结构导出为多种代码格式。

### 导出入口

**菜单位置**: 工具栏 → **导出菜单**（ExportMenu 组件）

**触发方式**: 点击工具栏中的 **"导出"** 按钮，打开导出下拉菜单。

### 导出格式

| 格式 | 说明 | 用途 |
|------|------|------|
| **JSON** | 完整画布数据 | 备份、迁移、API 集成 |
| **Markdown** | 结构化文档 | 文档生成、PRD 附录 |

### JSON 导出

1. 点击 **导出** → **JSON**
2. 选择导出范围（全图 / 上下文树 / 流程树 / 组件树）
3. 点击确认
4. 浏览器下载 `vibex-canvas-{projectId}.json` 文件

### Markdown 导出

1. 点击 **导出** → **Markdown**
2. 系统将三树结构生成为 Markdown 格式
3. 包含层级关系、节点属性、连接边的描述
4. 下载为 `.md` 文件

### 导出状态提示

导出操作会显示状态消息：
- `info`: "正在导出 {格式}..."
- `success`: "{格式} 导出成功 ✓"（2秒后自动消失）
- `error`: "导出失败: {原因}"（4秒后自动消失）

---

## 5. 快捷键

VibeX 提供完整的键盘快捷键支持。按键区分 macOS (Cmd) 和 Windows/Linux (Ctrl)。

### 画布操作

| 快捷键 | 功能 | 说明 |
|--------|------|------|
| `+` / `=` | 放大画布 | 仅在非输入框状态下生效 |
| `-` | 缩小画布 | 仅在非输入框状态下生效 |
| `0` | 重置缩放 | 恢复 100% 默认缩放 |

### 节点操作

| 快捷键 | 功能 | 说明 |
|--------|------|------|
| `N` | 新建节点 | 在当前激活树添加节点 |
| `Del` / `Backspace` | 删除选中节点 | 仅在非输入框状态下生效 |
| `Ctrl+A` / `Cmd+A` | 全选 | 选中当前树所有节点 |
| `Esc` | 清空选择 / 关闭对话框 | 焦点在输入框时不触 |

### 撤销与重做

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Z` / `Cmd+Z` | 撤销（Undo） |
| `Ctrl+Shift+Z` / `Cmd+Shift+Z` | 重做（Redo） |
| `Ctrl+Y` / `Cmd+Y` | 重做（Windows/Linux 专用） |

### 搜索与导航

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+K` / `Cmd+K` | 打开搜索对话框 |
| `/` | 打开搜索对话框（备选，非输入框状态） |

### 快捷生成与 Tab 切换

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+G` / `Cmd+G` | 快捷生成（级联 Context→Flow→Component） |
| `Alt+1` | 切换到 Context（上下文）Tab |
| `Alt+2` | 切换到 Flow（流程）Tab |
| `Alt+3` | 切换到 Component（组件）Tab |

### 快捷键约束

- 所有快捷键**在文本输入框中默认禁用**（除 `Esc` 关闭对话框、`Ctrl+K` 搜索外）
- 系统通过 `isInTextInput()` 检测焦点元素
- 支持 `INPUT`、`TEXTAREA`、`SELECT` 及 `contenteditable` 元素

---

## 6. 导出为 PNG/SVG

### PNG 导出

PNG 是位图格式，适合截图分享和报告嵌入。

1. 点击工具栏 **导出** → **PNG**
2. 选择导出范围（全图 / 上下文树 / 流程树 / 组件树）
3. 点击确认
4. 系统自动生成当前画布的 PNG 图片
5. 浏览器下载 `vibex-canvas-{projectId}.png`

**PNG 特点**：
- 固定分辨率，适合固定尺寸展示
- 无法无损缩放
- 包含完整视觉样式（颜色、阴影、字体）

### SVG 导出

SVG 是矢量格式，支持无损缩放。

1. 点击工具栏 **导出** → **SVG**
2. 选择导出范围
3. 点击确认
4. 下载 `vibex-canvas-{projectId}.svg`

**SVG 特点**：
- 矢量图形，可任意缩放
- 文件体积小
- 适合在设计工具中进一步编辑
- 保留节点和边的结构信息

### 导出范围选项

| 选项 | 说明 |
|------|------|
| **全图 (所有树)** | 导出三棵树及所有连接边 |
| **上下文树** | 仅导出 Bounded Context 树 |
| **流程树** | 仅导出 Business Flow 树 |
| **组件树** | 仅导出 Component 树 |

---

## 7. 批量导出 ZIP

VibeX 支持将原型队列（Prototype Queue）中的多个页面批量导出为 ZIP 文件。

### 原型队列面板

**入口**: 点击 **PrototypeQueuePanel** 展开按钮

**面板位置**: 画布右侧可展开面板

### 添加页面到队列

1. 在画布中完成一个页面的设计
2. 点击 **"加入队列"** 或自动保存
3. 页面进入原型队列等待导出

### 批量导出步骤

1. 在原型队列面板中，选择需要导出的页面（可多选）
2. 点击 **"📦 导出 Zip"** 按钮
3. 系统调用 `canvasApi.exportZip(projectId)` 生成 ZIP
4. 浏览器下载 `vibex-prototype-{projectId}.zip`

### ZIP 内容结构

```
vibex-prototype-{projectId}.zip
├── page-1.json
├── page-1.png
├── page-2.json
├── page-2.png
└── manifest.json    # 元数据清单
```

### 队列状态

每个队列项显示以下状态：
- `queued`: 等待处理
- `generating`: 生成中
- `completed`: 已完成
- `failed`: 生成失败

---

## 8. 快捷生成（Ctrl+G）

`Ctrl+G` / `Cmd+G` 是 VibeX 最强大的快捷操作——**级联快捷生成**。

### 功能说明

按 `Ctrl+G` 触发从 **Context → Flow → Component** 的级联生成流程：

```
Bounded Context (上下文)
    ↓ 选择/编辑 BC
Flow (流程)
    ↓ 根据 BC 生成 Flow
Component (组件)
    ↓ 根据 Flow 生成 Component
```

### 使用场景

**场景一：从上下文快速生成完整结构**

1. 已有 Bounded Context 定义
2. 按 `Ctrl+G`
3. 系统根据当前 Context 自动生成对应的 Business Flow
4. 再自动生成对应的 Component 树

**场景二：批量补全缺失层级**

1. 部分节点已有 Context 和 Flow，但缺少 Component
2. 按 `Ctrl+G`
3. 系统检测到缺失层级，自动补全

### 技术实现

`onQuickGenerate` 回调触发 `useCanvasStore` 中的级联生成逻辑：

1. `hasNodes()` 检查当前是否有节点
2. 根据 cascade 规则逐层生成
3. 生成结果通过 SSE 实时推送（`useCanvasSession`）

### 限制条件

- `Ctrl+G` 在文本输入框中**不会禁用**（因为是主动触发操作）
- 需要项目处于可写状态（未锁定）
- 网络断开时使用本地缓存数据生成

---

## 9. Tab 切换（Alt+1/2/3）

VibeX 三列画布支持通过 `Alt+数字键` 快速切换 Tab。

### Tab 布局

| 按键 | Tab 名称 | 内容 |
|------|---------|------|
| `Alt+1` | **Context** | Bounded Context 树（限界上下文） |
| `Alt+2` | **Flow** | Business Flow 树（业务流程） |
| `Alt+3` | **Component** | Component 树（组件结构） |

### TabBar 组件

`TabBar.tsx` 渲染三个可切换的 Tab 标签：

- **UI 样式**: Tab 激活态有下划线高亮
- **状态同步**: Tab 切换同步到 `useCanvasStore`
- **快捷键绑定**: `onSwitchToContext` / `onSwitchToFlow` / `onSwitchToComponent`

### 切换行为

1. 按 `Alt+1` → 激活 Context Tab，隐藏 Flow/Component 列
2. 按 `Alt+2` → 激活 Flow Tab
3. 按 `Alt+3` → 激活 Component Tab
4. 激活 Tab 的数据在 `TreePanel` 中展示

### 快捷键冲突注意

- `Alt+1/2/3` 是系统级快捷键，部分浏览器/系统可能占用
- 如遇冲突，可通过 TabBar 的 UI 点击切换，或在浏览器设置中禁用系统 Alt 快捷键

---

## 10. 撤销/重做

VibeX 内置完整的历史记录功能，支持无限撤销/重做。

### 快捷键

| 操作 | Windows/Linux | macOS |
|------|-------------|-------|
| 撤销 | `Ctrl+Z` | `Cmd+Z` |
| 重做 | `Ctrl+Shift+Z` 或 `Ctrl+Y` | `Cmd+Shift+Z` |

### 实现机制

**historySlice** (`/lib/canvas/historySlice.ts`) 提供撤销/重做能力：

```typescript
interface HistoryState {
  past: CanvasSnapshot[];    // 历史快照栈
  present: CanvasSnapshot;   // 当前状态
  future: CanvasSnapshot[];  // 未来（重做）栈
}
```

**操作记录**：
- 添加节点 → 记录快照
- 删除节点 → 记录快照
- 编辑节点 → 记录快照
- 连接边 → 记录快照
- 批量操作 → 合并为单次快照（防抖）

### UndoBar 提示

底部 **UndoBar** 组件显示当前可撤销/重做的次数：

```
↶ Undo (5)  |  ↷ Redo (3)
```

### 限制

- 历史记录存储在浏览器内存，刷新页面后清空
- 最大历史深度：100 条快照（超出时自动清理最旧记录）
- 只读模式（查看他人项目）不支持撤销/重做

---

## 11. 搜索和筛选

### 搜索对话框

**入口**：
- `Ctrl+K` / `Cmd+K`（全局）
- `/` 键（非输入框状态）
- 点击工具栏搜索图标

**SearchDialog** 组件提供以下功能：

### 搜索范围

| 搜索类型 | 说明 |
|---------|------|
| 节点名称 | 按名称模糊匹配三树中的所有节点 |
| 节点类型 | 按类型筛选（BC / Flow / Component） |
| 节点属性 | 按属性值搜索（如 `status: completed`） |

### 搜索结果

- 实时高亮匹配节点
- 左侧显示匹配列表，支持点击跳转
- 支持正则表达式搜索（以 `/` 开头）

### useCanvasSearch Hook

`useCanvasSearch` (`/hooks/canvas/useCanvasSearch.ts`) 提供：

- `query`: 搜索关键字
- `setQuery`: 设置搜索关键字
- `results`: 搜索结果数组
- `highlight`: 高亮配置
- `navigate`: 跳转到指定节点

### 筛选功能

- **按树筛选**: 仅在指定树中搜索
- **按状态筛选**: 仅显示特定状态的节点
- **按标签筛选**: 按节点标签过滤

### 快捷键导航

搜索结果中：
- `↑` / `↓`: 在结果列表中上下移动
- `Enter`: 跳转到当前选中结果
- `Esc`: 关闭搜索对话框

---

## 12. 版本历史

### VersionHistoryPanel

版本历史面板 (`VersionHistoryPanel.tsx`) 记录画布的所有快照版本。

**入口**: 点击工具栏的 **"版本历史"** 按钮，或快捷键 `Ctrl+H`

### 功能说明

| 功能 | 说明 |
|------|------|
| **查看版本列表** | 显示所有保存的历史版本，按时间倒序 |
| **预览版本** | 点击版本号预览该版本的内容（只读） |
| **恢复版本** | 将画布恢复到指定历史版本 |
| **版本对比** | 可选两个版本进行 diff 对比 |

### 版本数据

```typescript
interface VersionSnapshot {
  id: string;
  timestamp: number;
  author: string;
  message?: string;      // 版本描述（可选）
  snapshot: CanvasSnapshot; // 完整画布数据
}
```

### 使用场景

**场景一：误操作恢复**

1. 误删了重要节点
2. 打开版本历史
3. 找到删除前的版本
4. 点击恢复

**场景二：分支对比**

1. 探索性修改后想对比差异
2. 保存当前探索版本（带描述）
3. 恢复到主分支版本
4. 对比两个版本的节点结构差异

### 持久化

版本历史默认存储在浏览器 IndexedDB 中，支持：
- 页面刷新后保留
- 最多保留 50 个版本（超出自动清理）
- 可导出版本快照为 JSON 备份

### useVersionHistory Hook

`useVersionHistory` (`/hooks/canvas/useVersionHistory.ts`) 提供：
- `versions`: 版本列表
- `currentVersion`: 当前版本
- `saveVersion`: 保存新版本
- `restoreVersion`: 恢复指定版本
- `deleteVersion`: 删除版本

---

## 附录

### 文件结构参考

```
vibex-fronted/src/
├── components/canvas/
│   ├── CanvasPage.tsx          # 画布主容器
│   ├── TabBar.tsx               # 三列 Tab 切换
│   ├── TreePanel.tsx            # 树面板容器
│   ├── BoundedContextTree.tsx   # 上下文树
│   ├── BusinessFlowTree.tsx     # 流程树
│   ├── ComponentTree.tsx        # 组件树
│   ├── PhaseProgressBar.tsx     # 阶段进度条
│   ├── PrototypeQueuePanel.tsx  # 原型队列
│   ├── ProjectBar.tsx           # 项目栏
│   ├── HoverHotzone.tsx         # 连接热点
│   ├── TreeStatus.tsx           # 树状态显示
│   ├── edges/
│   │   ├── BoundedEdgeLayer.tsx # BC 边层
│   │   └── FlowEdgeLayer.tsx    # Flow 边层
│   ├── features/
│   │   ├── ExportMenu.tsx       # 导出菜单（PNG/SVG/JSON/MD）
│   │   ├── SearchDialog.tsx     # 搜索对话框
│   │   ├── ShortcutHintPanel.tsx# 快捷键提示面板
│   │   ├── VersionHistoryPanel.tsx# 版本历史面板
│   │   └── TemplateSelector.tsx # 模板选择器
│   └── messageDrawer/
│       └── MessageDrawer.tsx    # 消息抽屉
├── hooks/
│   ├── useKeyboardShortcuts.ts  # 全局快捷键
│   └── canvas/
│       ├── useCanvasSearch.ts   # 画布搜索
│       └── useVersionHistory.ts # 版本历史
└── lib/canvas/
    ├── canvasStore.ts           # 主状态存储
    ├── historySlice.ts          # 历史记录切片
    ├── cascade/                 # 级联生成逻辑
    └── api/canvasApi.ts         # API 封装
```

### 常见问题

| 问题 | 解决方案 |
|------|---------|
| `Ctrl+G` 不生效 | 确保焦点不在输入框；检查浏览器是否拦截 |
| `Alt+1/2/3` 被系统占用 | 在浏览器设置中禁用 Alt 快捷键，或使用鼠标点击 Tab |
| 撤销后无法重做 | 进行了新操作会清空重做栈 |
| 导出 PNG 是空白 | 检查画布是否有节点；尝试重置缩放后导出 |
| 版本历史丢失 | IndexedDB 可能被浏览器清理；建议定期导出 JSON 备份 |

---

*本文档由 VibeX Frontend Team 维护，最后更新于 2026-04-01*
