# 首页布局修复分析

## 设计文档
- 路径: `docs/homepage-v4-confirmed.html`
- 类型: 静态 HTML 设计稿
- 布局: Grid 布局 (`220px + 1fr + 260px`)
- 主题: 浅色主题

## 设计文档核心结构
```html
<div class="page">
  <div class="header">     <!-- 顶部导航 -->
  <div class="left-drawer"> <!-- 左侧步骤指示器 -->
  <div class="preview">    <!-- 中央预览区 -->
  <div class="right-drawer"><!-- 右侧AI思考列表 -->
  <div class="bottom-panel"> <!-- 底部面板 -->
</div>
```

## 设计文档详细规格

### 1. 布局规格
- Grid: `grid-template-rows: 50px 1fr 380px;`
- Columns: `grid-template-columns: 220px 1fr 260px;`
- Header: `grid-column: 1 / -1;` 占据整行

### 2. 左侧抽屉 (220px)
- 背景: `var(--color-bg-secondary)` = #f9fafb
- 步骤项: 圆角卡片，激活态有蓝色边框
- 4个步骤: 需求录入、需求澄清、业务流程、组件图

### 3. 中央预览区 (1fr)
- 背景: 渐变 `linear-gradient(135deg, ...)`
- 90%宽度容器，Mermaid图表占位

### 4. 右侧抽屉 (260px)
- AI思考列表组件
- 每项有蓝色左边框
- 新项目有脉冲动画

### 5. 底部面板 (380px固定高度)
包含:
- 收起手柄 (30px)
- 需求录入区 (80px)
- 操作按钮栏 (50px)
- AI展示区 (flex: 1，3列卡片布局)

## 实际实现对比

### 当前实现问题
| 项目 | 设计文档 | 实际实现 | 状态 |
|------|----------|----------|------|
| 布局 | Grid | Flex | ❌ |
| 主题 | 浅色 | 深色 | ❌ |
| 右侧抽屉 | AI思考列表 | 未使用 | ❌ |
| 底部面板 | 380px固定 | 无 | ❌ |
| AIPanel组件 | 存在 | 存在但未使用 | ❌ |
| thinkingMessages | 存在 | 未渲染 | ❌ |

### 已正确实现
- ✅ Navbar 组件
- ✅ Sidebar 组件 (5步流程)
- ✅ PreviewArea 组件
- ✅ InputArea 组件

## 待修复项

### F1: 右侧AI思考列表
- AIPanel 组件已存在但未集成
- thinkingMessages 数据存在但未渲染
- 需要在 HomePage 中正确使用 AIPanel

### F2: 底部面板组件
- 需要新增底部面板组件
- 包含: 操作按钮栏、AI展示卡片、需求录入

### F3: 布局调整
- 考虑是否需要切换到 Grid 布局
- 或保持 Flex 但实现等效的三栏+底部结构

## 参考文件
- 设计文档: `docs/homepage-v4-confirmed.html`
- 当前实现: `vibex-fronted/src/components/homepage/HomePage.tsx`
- AIPanel: `vibex-fronted/src/components/homepage/AIPanel/AIPanel.tsx`
