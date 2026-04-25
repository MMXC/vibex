# Spec: E1 — 设计稿导入 UI 四态 QA 规格

**对应 Epic**: E1 设计稿导入 QA 验证
**目标验证**: FigmaImport / ImageImport / ImportConfirmDialog 组件四态
**验证点**: F1.1 + F1.2 + F1.3

---

## 1. FigmaImport 组件四态

### 理想态
- Figma URL 输入框存在（label: "Figma URL"）
- placeholder: "https://figma.com/file/..."
- "获取组件" 按钮（enabled）
- 组件列表存在时：checkbox + 组件名称 + 缩略图

### 空状态
- URL 未输入时：按钮禁用
- 组件列表为空时：显示 "该文件中没有可导入的组件"

### 加载态
- 获取组件中：按钮文字变为 "获取中..." + 按钮禁用
- 组件列表区域：骨架屏替代内容

### 错误态
- URL 无效：input 红色边框（aria-invalid=true）+ inline 错误文案
- Figma API 错误：toast "无法获取 Figma 文件，请检查链接是否公开"
- 权限不足：toast "需要 Figma 查看权限，请确认文件已开启共享"

---

## 2. ImageImport 组件四态

### 理想态
- 拖放区域存在（testId: `image-drop-zone`）
- 文案 "拖拽设计图片到这里，或点击上传"
- 支持文件类型提示：PNG / JPG / SVG
- 上传后预览区显示图片

### 空状态
- 无上传图片时：拖放区域显示引导文案

### 加载态
- 图片上传中：拖放区域显示进度
- AI 识别中：显示 "AI 正在识别中..." + 骨架屏结果区（testId: `image-skeleton`）

### 错误态
- 文件格式不支持：toast "不支持的图片格式，请上传 PNG/JPG/SVG"
- 文件过大（> 10MB）：toast "图片超过 10MB，请压缩后重试"
- AI 识别失败：显示 "识别失败" + 重试按钮，不丢失已上传图片

---

## 3. ImportConfirmDialog 组件四态

### 理想态
- Dialog 显示（role: dialog）
- 组件列表（名称 + 数量 badge）
- "确认导入" 按钮（enabled）
- "取消" 按钮

### 空状态
- 不可能出现（Dialog 只在有内容时打开）

### 加载态
- 导入中：Dialog 显示进度条（testId: `import-progress`）
- "确认导入" 按钮禁用

### 错误态
- 导入失败：Dialog 显示错误信息 + 重试按钮
- 当前画布数据不受影响

---

## 4. 验证场景汇总

| 场景 | 组件 | 测试 ID / 选择器 | 预期行为 |
|------|------|-----------------|---------|
| 理想态-URL输入 | FigmaImport | `getByLabelText('Figma URL')` | 输入框存在 |
| 理想态-按钮启用 | FigmaImport | `getByRole('button', { name: /获取组件/i })` | 按钮 enabled |
| 加载态-API调用中 | FigmaImport | `getByRole('button', { name: /获取中/i })` | 按钮 disabled + loading |
| 错误态-URL无效 | FigmaImport | `getByLabelText('Figma URL')` | aria-invalid=true + 错误文案 |
| 理想态-拖放区 | ImageImport | `getByTestId('image-drop-zone')` | 拖放区可见 |
| 理想态-引导文案 | ImageImport | `getByText(/拖拽设计图片/i)` | 文案存在 |
| 加载态-AI识别 | ImageImport | `getByTestId('image-skeleton')` | 骨架屏可见 |
| 错误态-格式不支持 | ImageImport | `getByText(/不支持的图片格式/i)` | toast 出现 |
| 理想态-Dialog | ImportConfirmDialog | `getByRole('dialog')` | Dialog 存在 |
| 加载态-导入中 | ImportConfirmDialog | `getByTestId('import-progress')` | 进度条可见 |
