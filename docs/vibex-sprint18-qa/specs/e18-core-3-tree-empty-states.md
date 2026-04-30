# Spec: E18-CORE-3 三树面板空状态

**Epic**: E18-CORE-3
**名称**: 三树面板空状态
**状态**: 已实现
**文件路径**: 
- `vibex-fronted/src/components/canvas/BoundedContextTree.tsx`
- `vibex-fronted/src/components/canvas/ComponentTree.tsx`
- `vibex-fronted/src/components/canvas/BusinessFlowTree.tsx`

---

## 四态定义

### 1. 理想态（Ideal State）

**定义**: 三树面板显示完整数据，用户可以浏览和操作限界上下文、组件、业务流程。

**视觉表现**:
- BoundedContextTree: 显示限界上下文节点树，可展开
- ComponentTree: 显示组件列表，对应上下文下的组件
- BusinessFlowTree: 显示业务流程节点，可展开
- 每个节点有操作按钮（展开/折叠/编辑）

**代码/组件**:
- `BoundedContextTree.tsx` — 渲染上下文树
- `ComponentTree.tsx` — 渲染组件树
- `BusinessFlowTree.tsx` — 渲染流程树

---

### 2. 空状态（Empty State）

**定义**: 用户首次使用，对应树无数据，需要引导用户创建。

**视觉表现**:

| 组件 | 引导文案 | 情绪 |
|------|----------|------|
| BoundedContextTree | "暂无限界上下文，请先添加" + 新增按钮 | 迷茫，不知所措 |
| ComponentTree | "暂无组件，请从限界上下文开始" | 等待，不知道是否有数据 |
| BusinessFlowTree | "暂无业务流程" + 引导文案 + 新增按钮 | 好奇，不知道要做什么 |

**禁止**:
- ❌ 只留白，什么都不显示
- ❌ 只显示"暂无数据"文字，无引导
- ❌ 空状态与加载态混淆

**实现要求**:
- 每个树组件必须有独立的空状态
- 空状态包含引导文案 + 可操作按钮
- 组件之间空状态文案不同，避免混淆

**示例**:
```tsx
// BoundedContextTree 空状态
<div className="empty-state">
  <EmptyIcon />
  <p>暂无限界上下文，请先添加</p>
  <Button onClick={onAddContext}>添加限界上下文</Button>
</div>

// ComponentTree 空状态
<div className="empty-state">
  <EmptyIcon />
  <p>暂无组件，请从限界上下文开始</p>
  <p className="hint">在左侧添加限界上下文后，组件将显示在这里</p>
</div>

// BusinessFlowTree 空状态
<div className="empty-state">
  <EmptyIcon />
  <p>暂无业务流程</p>
  <Button onClick={onAddFlow}>添加业务流程</Button>
</div>
```

---

### 3. 加载态（Loading State）

**定义**: 树数据正在加载中。

**视觉表现**:
- 使用骨架屏占位，禁止用转圈
- 骨架屏行数模拟真实数据行数
- 保持三栏布局一致

**禁止**:
- ❌ 使用转圈加载
- ❌ 骨架屏内容与实际数据布局不一致

---

### 4. 错误态（Error State）

**定义**: 树数据加载失败。

**覆盖场景**:
- **网络异常**: 无法获取树数据
- **权限不足**: 用户无权访问树数据
- **接口超时**: 请求超时

**视觉表现**:
- 错误图标 + "加载失败" 文案
- 重试按钮

**兜底机制**:
- 重试按钮点击重新请求
- 错误信息显示具体原因

**示例**:
```tsx
<div className="error-state">
  <ErrorIcon />
  <p>加载失败</p>
  <p className="error-message">{error?.message}</p>
  <Button onClick={onRetry}>重试</Button>
</div>
```

---

## 状态转换图

```
用户切换上下文/进入页面
    ↓
加载中 → [Loading State: 骨架屏]
    ↓
加载成功 + 有数据 → [Ideal State: 树正常显示]
加载成功 + 无数据 → [Empty State: 引导文案+新增按钮]
    ↓
加载失败 → [Error State: 错误+重试按钮]
    ↓
用户点击重试/新增 → 重新加载/新增 → [Loading State]
```

---

## 技术实现要求

### 组件结构
- 每个树组件独立管理自己的空状态
- 空状态组件可复用（EmptyState.tsx）
- 状态机管理：loading → data/error → empty

### 数据流
- `useBoundedContexts()` → BoundedContextTree
- `useComponents(contextId)` → ComponentTree
- `useBusinessFlows(contextId)` → BusinessFlowTree

### 禁止事项
- 空状态禁止只留白
- 加载态禁止用转圈
- 错误态必须有重试按钮

---

## 验收标准

| 组件 | 验证点 | 测试命令 |
|------|--------|----------|
| BoundedContextTree | 空状态文案存在 | `fs.readFileSync(...).includes('暂无限界上下文')` |
| ComponentTree | 空状态文案存在 | `fs.readFileSync(...).includes('暂无组件')` |
| BusinessFlowTree | 空状态文案存在 | `fs.readFileSync(...).includes('暂无业务流程')` |
| 新增按钮 | 空状态包含操作按钮 | 源码审查 |
| 状态转换 | 状态机逻辑正确 | 源码审查 |
