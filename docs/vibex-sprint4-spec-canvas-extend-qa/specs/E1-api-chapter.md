# Spec: E1 — API 章节

**对应 Epic**: E1 API 规格章节 + E4-D1 状态规范
**文件**: `vibex-fronted/src/components/dds/cards/APIEndpointCard.tsx`（新建）
**相关**: `vibex-fronted/src/components/dds/DDSCanvasPage.tsx`, `vibex-fronted/src/lib/contract/OpenAPIGenerator.ts`

---

## 1. DDSPanel API 组件面板

### 理想态
- 5 个端点卡片垂直排列（GET/POST/PUT/DELETE/PATCH）
- 每张卡片显示：HTTP 方法 badge（颜色区分）+ 简短描述
- GET 绿色 / POST 蓝色 / PUT 橙色 / DELETE 红色 / PATCH 紫色
- 拖拽开始时卡片半透明

### 空状态
- 不可能出现（永远 5 种方法固定存在）

### 加载态
- 骨架屏占位（5 个灰色块）

### 错误态
- 组件加载失败：显示错误卡片 + 重试按钮

---

## 2. APIEndpointCard 节点

### 理想态
- 宽度 180px，高度自适应
- 顶部：method badge（颜色 + 方法名）
- 中部：path 文案（如 /api/users）
- 底部：summary 摘要（超长截断）
- 选中时：蓝色边框高亮
- 节点类型通过 `var(--color-method-{method})` token 控制颜色

### 空状态
- 不会发生（拖入画布后即有数据）

### 加载态
- 内容区骨架屏占位

### 错误态
- 渲染异常：灰色占位框 + "API 端点渲染失败" 文案

---

## 3. DDSPanel API 属性面板

### 理想态
- 显示端点配置表单
- path input（必填，路径格式校验）
- method select（GET/POST/PUT/DELETE/PATCH）
- summary textarea
- 参数 tab（留空 P1）
- Schema tab（留空 P1）

### 空状态（无选中节点）
- 显示引导文案："双击 API 端点以编辑属性"
- 禁止只留白

### 加载态
- 表单区域骨架屏

### 错误态
- path 格式非法：红色边框 + inline 错误
- 保存失败：toast 提示，不丢失数据

---

## 4. API 章节空状态

### 场景：章节内无任何端点
- 引导插图（API 文档图标 SVG）
- 文案："从左侧拖拽 HTTP 方法到画布，开始设计你的 API"
- 禁止只留白

---

## 5. OpenAPI 导出 Modal

### 理想态
- 点击导出按钮 → Modal 弹出
- 显示 JSON 预览（语法高亮）
- 两个按钮："复制到剪贴板" + "下载 JSON"

### 空状态（无端点）
- Modal 显示空 JSON `{}`

### 加载态
- JSON 预览区骨架屏（大型文本块）

### 错误态
- 导出失败：Modal 显示错误文案 + 重试按钮
- 覆盖：网络异常/数据超长

---

## 样式约束（神技5：原子化）

- 方法 badge 颜色：`var(--color-method-get)` / `var(--color-method-post)` / `var(--color-method-put)` / `var(--color-method-delete)` / `var(--color-method-patch)`
- 间距：8 的倍数
- 禁止硬编码颜色值
- 节点宽度：180px（固定）
