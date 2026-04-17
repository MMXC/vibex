# Spec: E3 — 页面路由管理

**对应 Epic**: E3 页面路由管理
**文件**: `vibex-fronted/src/components/prototype/RoutingDrawer.tsx`
**相关**: `vibex-fronted/src/stores/prototypeStore.ts`

---

## RoutingDrawer

### 理想态（Ideal）
- 左侧抽屉显示页面列表
- 每行显示：页面名称 + 删除按钮（hover 显示）
- 当前选中页面高亮（`background: var(--color-primary-light)`）
- 顶部有 "添加页面" 按钮
- 底部显示页面数量 badge

### 空状态（Empty）
- 初始只有 1 个默认页面时：保留该页面
- 若页面列表为空（异常），显示：
- 文案："暂无页面"
- "添加页面" 按钮
- 引导插图
- 禁止只留白

### 加载态（Loading）
- 页面列表区域使用骨架屏（3 行占位块）
- 禁止使用转圈

### 错误态（Error）
- 删除失败：toast 提示 + 保留页面
- 添加失败：toast 提示 + 不自动重试
- 至少覆盖：网络异常/权限不足/页面名重复

---

## 页面 Tab（ProtoEditor 顶部）

### 理想态（Ideal）
- Tab 栏显示所有页面名称
- 当前页面 Tab 高亮
- 支持横向滚动（页面过多时）

### 空状态（Empty）
- 不可能出现（至少 1 个页面）

### 加载态（Loading）
- Tab 区域使用骨架屏

### 错误态（Error）
- 切换失败：保持原 Tab 高亮 + 错误提示

---

## 样式约束

- 间距：8 的倍数
- 颜色：使用 Token
- 禁止硬编码
- 抽屉宽度：固定 240px
