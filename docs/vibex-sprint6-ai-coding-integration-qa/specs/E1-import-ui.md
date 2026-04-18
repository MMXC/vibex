# Spec: E1 — 设计稿导入 UI 规格

**对应 Epic**: E1 Figma/设计稿导入完善
**目标文件**: 
- `vibex-fronted/src/components/figma-import/FigmaImport.tsx`
- `vibex-fronted/src/components/image-import/ImageImport.tsx`（新建目录）
**相关**: `vibex-fronted/src/services/figma/figma-import.ts`, `vibex-fronted/src/lib/ai/image-import.ts`

---

## 1. FigmaImport 组件规格

### 理想态
- Figma URL 输入框（label: "Figma URL"）
- 输入框 placeholder: "https://figma.com/file/..."
- "获取组件" 按钮
- 组件列表（checkbox + 名称 + 预览缩略图）
- "导入选中" 按钮

### 空状态
- URL 未输入时：按钮禁用
- 组件列表为空时：显示 "该文件中没有可导入的组件"

### 加载态
- 获取组件中：按钮显示 loading spinner + 文案变为 "获取中..."
- 禁止使用纯转圈

### 错误态
- URL 无效：input 红色边框 + inline 错误 "无效的 Figma URL，请检查后重试"
- Figma API 错误：toast "无法获取 Figma 文件，请检查链接是否公开"
- 权限不足：toast "需要 Figma 查看权限，请确认文件已开启共享"

---

## 2. ImageImport 组件规格

### 理想态
- 拖放区域（虚线边框 + 上传图标 + 文案 "拖拽设计图片到这里，或点击上传"）
- 支持 PNG / JPG / SVG
- 点击可打开文件选择器
- 预览识别结果区域

### 空状态
- 无上传图片时：拖放区域显示引导文案

### 加载态
- 图片上传中：拖放区域显示进度
- AI 识别中：显示 "AI 正在识别中..." + 骨架屏结果区
- 禁止使用纯转圈

### 错误态
- 文件格式不支持：toast "不支持的图片格式，请上传 PNG/JPG/SVG"
- 文件过大（> 10MB）：toast "图片超过 10MB，请压缩后重试"
- AI 识别失败：显示 "识别失败" + 重试按钮 + 不丢失图片

---

## 3. 导入确认 Dialog

### 理想态
- Dialog 显示将导入的组件列表
- 显示组件数量 badge
- "确认导入" / "取消" 两个按钮

### 空状态
- 不可能出现

### 加载态
- 导入中：Dialog 显示进度条

### 错误态
- 导入失败：Dialog 显示错误 + 重试按钮

---

## 样式约束

- 间距：8 的倍数
- 颜色：使用 Token
- 禁止硬编码
- 拖放区域：虚线边框 2px dashed `var(--color-border)`
- 按钮尺寸：32px 高度
