# Spec: E2 — 双向跳转规范

**对应 Epic**: E2 双向跳转
**目标文件**: 
- `vibex-fronted/src/components/prototype/ProtoNode.tsx`（右键菜单）
- `vibex-fronted/src/components/dds/cards/BoundedContextCard.tsx`（跳转按钮）
- `vibex-fronted/src/components/dds/toolbar/DDSToolbar.tsx`（导出入口）
- `vibex-fronted/src/components/prototype/ProtoEditor.tsx`（导出入口）
- `vibex-fronted/src/components/delivery/DeliveryTabs.tsx`（返回按钮）

---

## 1. ProtoNode 右键菜单

### 理想态
- 右键节点 → 显示上下文菜单
- 菜单选项：
  - "查看上下文" → 跳转到 DDS Canvas，高亮对应 BoundedContext
  - "复制组件 ID" → 复制到剪贴板

### 空状态
- 不可能发生（右键即显示菜单）

### 加载态
- 不适用（右键菜单是即时 UI）

### 错误态
- 跳转失败：toast "无法跳转，请检查 DDS Canvas 数据"
- 复制失败：toast "复制失败"

---

## 2. BoundedContextCard 查看原型按钮

### 理想态
- 卡片 hover 时显示 "查看原型" 按钮
- 按钮位于卡片右上角
- 点击后 router.push('/prototype/editor?projectId=...&highlight=...')

### 空状态
- 无对应原型时：按钮不显示

### 加载态
- 不适用

### 错误态
- 跳转失败：toast

---

## 3. Toolbar 导出按钮

### 理想态
- DDSToolbar 右侧显示导出按钮（图标 + "导出" 文案）
- ProtoEditor toolbar 右侧同样显示导出按钮
- 按钮样式：ghost 风格

### 空状态
- 不适用

### 加载态
- 按钮点击后显示 loading spinner（1 秒内完成则不显示）

### 错误态
- 按钮始终保持可用状态（不因其他操作报错而禁用）

---

## 4. Delivery Center 返回按钮

### 理想态
- 页面左上角显示返回按钮
- 点击后 router.back()
- 文案："返回编辑"

### 空状态
- 不适用

### 加载态
- 返回中显示短暂 loading 状态

### 错误态
- router.back() 失败时：降级为 router.push('/')

---

## 样式约束

- 间距：8 的倍数
- 颜色：使用 Token
- 禁止硬编码
- 按钮尺寸：32px 高度
- 图标 + 文案间距：8px
