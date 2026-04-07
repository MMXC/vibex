# Vibex 流程简化提案 - 从 5 步到 3 步

> 版本：1.0 | 日期：2026-03-23 | 状态：✅ 已确认

---

## 📋 执行摘要

**目标**：简化 VibeX 的 DDD 建模流程，从 5 步压缩到 3 步，去除领域模型步骤，隐藏 DDD 专业术语，用业务语言面向用户。

**核心变化**：
- ❌ 删除：领域模型步骤
- ❌ 删除：DDD 专业术语暴露
- ✅ 新增：一步生成限界上下文 + 业务流程图
- ✅ 新增：按需展开支撑域/通用域
- ✅ 新增：页面组件卡片 + 关系连线

---

## 🔄 流程对比

### 现有流程（5 步）

```
Step 1: Requirements     → 需求输入
Step 2: Bounded Context  → 限界上下文识别（暴露术语）
Step 3: Domain Model     → 领域模型（技术型、复杂）
Step 4: Business Flow    → 业务流程
Step 5: Components       → 组件选择
```

### 新流程（3 步）

```
Step 1: 需求 + 限界上下文 + 业务流程图
Step 2: 用户确认/修改/勾选
Step 3: 页面组件图生成
```

---

## 📐 详细流程设计

### Step 1：需求输入 + AI 生成（一步完成）

```
用户输入需求文本
        ↓
┌───────────────────────────────────────┐
│  AI 并行生成：                         │
│  ├─ 限界上下文（核心域/支撑域/通用域）    │
│  └─ 业务流程图（JSON + 可视化）          │
└───────────────────────────────────────┘
        ↓
展示业务流程图（核心域）
        ↓
询问用户：「是否展示关联的支撑域/通用域？」
├─ 否 → 保持当前视图
└─ 是 → 展开完整业务流程图
```

**用户语言 vs 内部术语**：

| 内部术语 | 用户可见语言 |
|----------|--------------|
| 限界上下文 | 业务领域 |
| 核心域 | 核心业务 |
| 支撑域 | 辅助业务 |
| 通用域 | 基础服务 |
| 聚合根 | 核心实体 |

---

### Step 2：用户确认/修改/勾选

```
用户操作：
├─ 直接修改流程节点名称
├─ 勾选需要的功能点
├─ 拖拽调整节点位置
└─ 添加新需求（自然语言）
        ↓
一键提交 → 进入下一步
```

**交互能力**：
- ✅ 节点点击编辑
- ✅ checkbox 多选
- ✅ 批量选择
- ✅ 新增节点
- ✅ 删除节点

---

### Step 3：页面组件图生成

```
基于业务流程 → 自动生成页面组件图

每个页面 = 一个卡片
卡片内容：
├─ xx列表组件
├─ xx导航组件
├─ xx菜单树
└─ 布局组件勾选

页面之间：关系连线
```

**示例**：

```
┌─────────────────┐     ┌─────────────────┐
│   用户列表页     │────→│   用户详情页    │
├─────────────────┤     ├─────────────────┤
│ □ 用户列表       │     │ □ 用户信息卡片   │
│ □ 搜索栏        │     │ □ 操作按钮       │
│ □ 分页控件      │     │ □ 相关列表       │
│ □ 新增按钮      │     │ □ 返回列表链接   │
└─────────────────┘     └─────────────────┘
```

---

## 📦 数据结构设计

### 限界上下文

```typescript
interface BoundedContext {
  id: string;
  name: string;
  category: 'core' | 'supporting' | 'generic';
  description: string;
  color: string;  // 用于可视化区分
}
```

### 业务流程节点

```typescript
interface FlowNode {
  id: string;
  name: string;
  contextId: string;  // 关联到限界上下文
  type: 'start' | 'process' | 'decision' | 'end';
  description?: string;
  actions?: string[];  // 用户可执行的动作
  selected: boolean;   // 用户勾选状态
  position?: { x: number; y: number };
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}
```

### 页面组件

```typescript
interface PageComponent {
  id: string;
  name: string;
  route: string;
  flowNodeIds: string[];  // 关联到的业务流程节点
  components: {
    lists: string[];      // xx列表
    navigations: string[]; // xx导航
    menus: string[];       // xx菜单树
    layouts: string[];     // 布局组件
  };
  relationships: Array<{
    targetPageId: string;
    type: 'navigation' | 'detail' | 'list';
  }>;
}
```

---

## 🏗️ 技术架构

### 组件结构

```
src/
├─ components/
│  ├─ flow-canvas/           # 核心画布组件
│  │  ├─ FlowCanvas.tsx      # ReactFlow 包装
│  │  ├─ FlowNode.tsx        # 自定义节点（含 checkbox）
│  │  ├─ FlowEdge.tsx        # 自定义边
│  │  └─ SelectionToolbar.tsx # 选区工具栏
│  │
│  ├─ page-card/             # 页面卡片组件
│  │  ├─ PageCard.tsx        # 页面卡片
│  │  ├─ ComponentList.tsx   # 组件列表勾选
│  │  └─ PageConnector.tsx    # 页面连线
│  │
│  └─ context-selector/       # 领域选择器
│     └─ ContextSelector.tsx   # 核心域/支撑域/通用域切换
```

### 状态管理

```typescript
interface FlowState {
  // 限界上下文
  contexts: BoundedContext[];
  
  // 业务流程
  nodes: FlowNode[];
  edges: FlowEdge[];
  
  // 用户选择
  selectedNodeIds: Set<string>;
  
  // 页面组件
  pages: PageComponent[];
  
  // UI 状态
  showSupporting: boolean;
  showGeneric: boolean;
}
```

---

## 📊 API 设计

### 生成限界上下文 + 业务流程

```typescript
// Request
interface GenerateFlowRequest {
  requirementText: string;
  options?: {
    includeSupporting: boolean;
    includeGeneric: boolean;
  };
}

// Response (SSE 流式)
interface GenerateFlowResponse {
  // 逐步返回
  contexts: BoundedContext[];      // 限界上下文
  flowNodes: FlowNode[];           // 流程节点
  flowEdges: FlowEdge[];           // 流程边
  mermaidCode?: string;            // 可选：保留 Mermaid 导出
}
```

### 生成页面组件图

```typescript
// Request
interface GeneratePageComponentsRequest {
  flowNodes: FlowNode[];           // 用户选中的流程节点
  contexts: BoundedContext[];      // 上下文
}

// Response
interface GeneratePageComponentsResponse {
  pages: PageComponent[];
}
```

---

## ⏱️ 开发工作量估算

| 阶段 | 任务 | 前端 | 后端 | 设计 | 测试 | 合计 |
|------|------|------|------|------|------|------|
| **Phase 1** | **FlowCanvas 核心** | | | | | |
| | ReactFlow 画布封装 | 2d | - | - | 0.5d | 2.5d |
| | 自定义节点组件 | 1d | - | 0.5d | - | 1.5d |
| | 勾选/多选功能 | 1d | - | - | 0.5d | 1.5d |
| **Phase 2** | **限界上下文 UI** | | | | | |
| | 核心域/支撑域/通用域切换 | 1d | - | 0.5d | 0.5d | 2d |
| | 按需展开逻辑 | 1d | 1d | - | 0.5d | 2.5d |
| **Phase 3** | **页面组件图** | | | | | |
| | PageCard 组件 | 2d | - | 1d | 0.5d | 3.5d |
| | 页面连线 | 1d | - | - | 0.5d | 1.5d |
| | 组件勾选列表 | 1d | - | - | 0.5d | 1.5d |
| **Phase 4** | **API 集成** | | | | | |
| | SSE 流式生成 | 1d | 3d | - | 1d | 5d |
| | 状态持久化 | 1d | 1d | - | 0.5d | 2.5d |
| **总计** | | **12d** | **5d** | **2d** | **4.5d** | **23.5d** |

---

## ✅ 验收标准

### Phase 1
- [ ] 业务流程图正确渲染
- [ ] 节点支持点击、拖拽
- [ ] checkbox 勾选功能正常
- [ ] 多选批量操作

### Phase 2
- [ ] 限界上下文正确分类（核心/支撑/通用）
- [ ] 按需展开支撑域/通用域
- [ ] 术语正确转换为用户语言

### Phase 3
- [ ] 每个流程节点生成对应页面卡片
- [ ] 卡片内组件可勾选
- [ ] 页面之间连线正确

### Phase 4
- [ ] SSE 流式输出正常
- [ ] 状态正确持久化
- [ ] 错误处理完善

---

## ⚠️ 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| AI 生成准确性 | 高 | 限制生成范围，建立 Prompt 模板 |
| 性能问题 | 中 | 大图虚拟化，分页加载 |
| 用户习惯改变 | 低 | 提供引导和示例 |

---

## 📝 下一步

建议创建任务：`vibex-simplified-flow`

**Phase 1 目标**：
- FlowCanvas 核心组件开发
- 基础勾选功能

**预计工期**：5 人日
