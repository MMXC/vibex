# Spec: E1 — 拖拽布局编辑器

**对应 Epic**: E1 拖拽布局编辑器
**文件**: `vibex-fronted/src/components/prototype/ProtoEditor.tsx`, `ComponentPanel.tsx`, `ProtoFlowCanvas.tsx`, `ProtoNode.tsx`, `ProtoAttrPanel.tsx`
**样式目录**: `vibex-fronted/src/components/prototype/*.module.css`

---

## 1. ComponentPanel（组件面板）

### 理想态（Ideal）
- 展示 10 个组件卡片，排列整齐（2 列或网格）
- 每个卡片显示：组件图标/名称 + badge 显示数量
- 鼠标悬停时卡片微微上浮（`transform: translateY(-2px)`，使用 `var(--space-1)`）
- 拖拽开始时卡片半透明（`opacity: 0.5`）

### 空状态（Empty）
- 不可能出现：DEFAULT_COMPONENTS 永远有 10 个
- 防御性设计：若 DEFAULT_COMPONENTS 为空，显示插图 + 文案"暂无可用组件，请检查 ui-schema 定义"
- 禁止只留白

### 加载态（Loading）
- 初始渲染时使用骨架屏（灰色占位块，3 列布局）
- 禁止使用转圈（会抖动）
- 骨架屏使用 `var(--color-skeleton)` token

### 错误态（Error）
- 若 DEFAULT_COMPONENTS 加载异常，显示错误卡片
- 文案："组件列表加载失败"
- 附重试按钮

---

## 2. ProtoFlowCanvas（画布）

### 理想态（Ideal）
- React Flow 画布全屏
- 背景为点阵网格（`@xyflow/core` dot pattern）
- 已放置的节点显示在画布上
- 支持节点间连线（edges）

### 空状态（Empty）
- 画布为空时显示虚线矩形占位框
- 文案："从左侧拖拽组件到这里开始布局"
- 引导插图（简单 SVG）
- 禁止只留白

### 加载态（Loading）
- 使用骨架屏占位（矩形块）
- 禁止使用转圈

### 错误态（Error）
- 网络加载失败：显示错误 banner
- 至少覆盖：网络异常（`Failed to load`）/ 数据超长（截断 + 警告）

---

## 3. ProtoNode（节点）

### 理想态（Ideal）
- 节点显示对应组件渲染结果（Button/Input/Card 等）
- 选中时显示蓝色边框（`border: 2px solid var(--color-primary)`）
- 节点左上角显示类型标签（如 "Button" badge）

### 空状态（Empty）
- 无此状态（节点总有类型）

### 加载态（Loading）
- 节点内容区使用骨架屏
- 禁止使用转圈

### 错误态（Error）
- 渲染异常：显示灰色占位框 + "渲染失败" 文案
- 至少覆盖：网络异常/类型未知/属性非法

---

## 4. ProtoAttrPanel（属性面板）

### 理想态（Ideal）
- 右侧面板显示节点属性表单
- 显示属性键值对（label + input）
- "Props" Tab 和 "MockData" Tab 并列

### 空状态（Empty）
- 无节点选中时面板显示：
- 引导文案："双击画布上的节点以编辑属性"
- 引导插图（手型图标）
- 禁止只留白

### 加载态（Loading）
- 表单区域使用骨架屏
- 禁止使用转圈

### 错误态（Error）
- 保存失败：内联错误提示（红色边框 + 错误文案）
- 数据超长：input 显示字符数超限警告
- 禁止覆盖用户已输入内容

---

## 样式约束（神技5：原子化）

- 所有间距使用 8 的倍数：`var(--space-1)` = 8px, `var(--space-2)` = 16px, `var(--space-3)` = 24px
- 颜色使用 Token：`var(--color-primary)`, `var(--color-skeleton)`, `var(--color-error)`
- 禁止硬编码颜色值（如 `#fff`, `blue`）
- 组件边界：`ComponentPanel` 固定宽度（240px），`ProtoAttrPanel` 固定宽度（280px）
