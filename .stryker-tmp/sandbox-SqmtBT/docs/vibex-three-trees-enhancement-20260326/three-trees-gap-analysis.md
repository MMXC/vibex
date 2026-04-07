# VibeX 三树分析报告
**时间**: 2026-03-26 03:02 GMT+8
**验证工具**: gstack browse + 代码分析
**截图**: `/tmp/canvas-empty.png`, `/tmp/canvas-init.png`

---

## 一、当前状态快照

```
限界上下文树: 0/0
业务流程树: 0/0
组件树: 0/0
启动画布: [disabled]
```

**根因确认**：
- "启动画布" 按钮：onClick 只调 `setPhase('context')`，无 API 调用
- "导入示例" 按钮：onClick 只调 `setPhase('context')`，无 mock 数据加载
- BoundedContextTree.tsx 有 `mockGenerateContexts()` 函数，但从未被调用

---

## 二、现有数据模型分析

### BoundedContextNode（限界上下文节点）
```ts
{
  nodeId: string
  name: string           // 上下文名称
  description: string
  type: 'core' | 'supporting' | 'generic' | 'external'  // ✅ 支持 DDD 分类
  confirmed: boolean
  status: NodeStatus
  parentId?: string     // ✅ 有父子关系
  children: string[]     // ✅ 子域列表（存 ID）
}
```
**现状**: 数据模型 ✅ 有父子关系和 DDD 类型，但 **没有领域关系连线字段**

### BusinessFlowNode（业务流程节点）
```ts
{
  nodeId: string
  contextId: string
  name: string           // 流程名称
  steps: FlowStep[]      // 步骤列表（有序）
  confirmed: boolean
  status: NodeStatus
  parentId?: string
  children: string[]
}
```
**FlowStep**:
```ts
{
  stepId: string
  name: string           // 步骤名称
  actor: string          // 参与者
  description?: string
  order: number         // ✅ 有顺序
  confirmed: boolean
  status: NodeStatus
  // ❌ 没有分支类型（exclusive/parallel/inclusive）
  // ❌ 没有循环标识
  // ❌ 没有条件表达式
}
```
**现状**: 模型只有线性步骤，**完全没有分支/循环建模能力**

### ComponentNode（UI 组件节点）
```ts
{
  nodeId: string
  flowId: string
  name: string
  type: 'page'|'form'|'list'|'detail'|'modal'  // ✅ 支持类型分类
  props: Record<string, unknown>
  api: ComponentApi
  children: string[]     // ✅ 有层级
  confirmed: boolean
  status: NodeStatus
  previewUrl?: string
}
```
**现状**: 数据模型 ✅ 有层级和类型，但 **组件不可交互（无展开/折叠/跳转）**

---

## 三、三树差距详解

### 差距1：限界上下文树 — 无领域关系

**期望**（Alex 示例）：
```
□ 商品上下文 [核心域]
  ├─ 商品管理
  └─ 分类管理
□ 订单上下文 [核心域]
  ├─ 下单管理
  └─ 支付管理
```

**差距**：节点有 DDD 类型（core/generic/supporting），但**没有视觉连线表达领域间关系**

需要补充的关系类型：
- 依赖关系（DDD 的 `requires`）
- 组合关系（DDD 的 `composed-of`）
- 上下游关系（防腐层 `anticorruption`）

**建议**：在 BoundedContextNode 中增加 `relationships: Array<{targetId: string, type: 'depends-on'|'上游'|'下游'|'组合'}>`

### 差距2：业务流程树 — 无分支循环

**期望**（Alex 示例）：
```
购买商品流程：
  → 搜索 → 添加购物车 → 下单 → 支付

售后流程（分支网关）：
  ├─ 物流查询
  ├─ 评价
  ├─ 售后
  └─ 退款
```

**现状**：FlowStep 只有线性 `order` 字段，**没有分支网关概念**

需要补充的 BPMN 元素：
- 排他网关（XOR Gateway）— 条件分支
- 并行网关（AND Gateway）— 并行执行
-包容网关（OR Gateway）— 混合条件
- 循环标识 — 步骤重复

**建议**：FlowStep 增加 `stepType: 'normal'|'gateway'|'loop'` 和 `gatewayType: 'xor'|'and'|'or'`

### 差距3：组件树 — 无交互

**期望**：
```
首页卡片（page）
  ├─ 搜索输入框（form）
  ├─ 查询条件标签（list）
  ├─ 结果展示列表（list）
  └─ 促销活动区域（component）

商品详情页卡片（page）
  ├─ 商品图片
  ├─ 价格信息
  └─ 购买按钮（可点击跳转）
```

**现状**：ComponentNode 有 `children` 和 `type`，但 **TreePanel 只渲染列表，不支持展开/折叠/交互**

---

## 四、修复优先级

| 优先级 | 差距 | 依赖 |
|--------|------|------|
| P0 | Canvas "启动画布" 对接 API | 有了数据才能验证其他问题 |
| P1 | 业务流程树增加分支/循环建模 | 扩展 FlowStep 数据模型 |
| P1 | 限界上下文树增加关系连线 | 增加 relationships 字段 |
| P2 | 组件树增加展开/折叠交互 | TreePanel 支持节点交互 |
| P2 | "导入示例" 加载 mock 数据 | 让用户看到预期效果 |

---

## 五、验证证据

gstack 截图：
- 空状态（启动画布 disabled）: `/tmp/canvas-init.png`
- 三树均为 0/0，无节点数据

代码证据：
- `CanvasPage.tsx:303-305` — 启动画布只调 `setPhase()`
- `CanvasPage.tsx:329-331` — 导入示例只调 `setPhase()`
- `BoundedContextTree.tsx:31-40` — `mockGenerateContexts()` 定义但从未调用
- `types.ts` — FlowStep 无分支/循环字段

---

## 交互设计补充（Alex UX 建议）

**原则**：三树节点用 checkbox 选择，移除显式确认/删除按钮

**原因**：用户可能回头勾选之前觉得不需要的节点

**方案**：
- 每张卡片左侧加 checkbox（替代 ❌/✅ 按钮）
- `confirmed` 字段保持，作为 checkbox toggle 的状态
- 子节点独立 checkbox，支持部分勾选
- 不需要"确认"操作 — 用户勾完直接进下一步

