# Spec: E3 — 跨章节集成

**对应 Epic**: E3 跨章节集成
**文件**: `vibex-fronted/src/components/dds/toolbar/DDSToolbar.tsx`, `vibex-fronted/src/components/dds/canvas/CrossChapterEdgesOverlay.tsx`
**相关**: `vibex-fronted/src/types/dds/index.ts`

---

## 1. DDSToolbar 章节切换器

### 理想态
- 5 个章节按钮横向排列
- 当前章节按钮高亮（primary 背景色）
- 非当前章节按钮：ghost 样式
- 按钮文案：Requirement / Context / Flow / API / Business Rules
- 支持键盘快捷键（1-5 切换章节）

### 空状态
- 不可能出现（永远 5 个章节）

### 加载态
- 按钮区域骨架屏

### 错误态
- 章节加载失败：按钮保持但显示加载中状态

---

## 2. CrossChapterEdgesOverlay 跨章节边

### 理想态
- 从 api 章节的 APIEndpointCard 到 requirement 章节的 UserStoryCard
- 边样式：虚线 + 特殊颜色（紫色）
- 边上可点击（显示关联信息）
- 跨章节边的起点和终点在各自章节内可见

### 空状态
- 无跨章节边时：无渲染

### 加载态
- 边加载时显示为灰色虚线

### 错误态
- 跨章节边无法渲染时（目标章节不可见）：降级为普通边，不崩溃
- 边关联的节点被删除：边自动消失

---

## 3. 章节 URL 参数

### 理想态
- URL：`/dds/canvas?chapter=api`
- 刷新页面后章节保持不变
- 非法 chapter 值：回退到 requirement

---

## 样式约束

- 当前章节按钮：`var(--color-primary)`
- 非当前章节按钮：ghost 样式（`var(--color-bg-secondary)` 背景 + 边框）
- 跨章节边：虚线 + `var(--color-cross-chapter-edge)`（紫色）
- 间距：8 的倍数
- 禁止硬编码颜色值
