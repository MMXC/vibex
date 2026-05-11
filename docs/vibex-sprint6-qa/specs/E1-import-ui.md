# Spec: E1-import-ui — 设计稿导入 UI 四态规格

**对应 Epic**: E1 设计稿导入验证
**组件范围**: FigmaImport + ImageImport + ImportConfirmDialog
**版本**: 1.0.0

---

## 1. FigmaImport 组件四态

### 1.1 理想态 (ideal)

**触发条件**: 用户进入导入流程，URL 输入框可用

**UI 元素**:
- URL 输入框（label: "Figma URL"，placeholder: "https://figma.com/file/..."，aria-label: "Figma URL 输入框"）
- "获取组件" 按钮（enabled，aria-label: "获取 Figma 组件"）
- 组件选择区（当 API 返回组件列表后）
  - Checkbox（`role="checkbox"`）+ 组件名称 + 缩略图（`testId="figma-component-thumb"`）
  - 选中数量 badge（`testId="selected-count-badge"`）

**情绪引导文案**: "粘贴 Figma 文件链接，获取可导入的组件"

**间距规范（8倍数）**:
- 组件间距: `gap: 8px`
- 区域垂直间距: `padding: 16px`
- 按钮与输入框间距: `gap: 8px`

**颜色 Token**:
- 边框: `var(--color-border-default, #E5E7EB)`
- 按钮背景: `var(--color-primary, #4F46E5)`
- 按钮文字: `var(--color-on-primary, #FFFFFF)`

---

### 1.2 空状态 (empty)

**触发条件**: URL 输入框无内容时

**UI 元素**:
- URL 输入框（保持显示，value 为空）
- "获取组件" 按钮（disabled，aria-disabled: true）
- 组件选择区：显示 "该文件中没有可导入的组件"（`testId="no-components-hint"`）

**情绪引导文案**: "填入 Figma 文件链接即可开始"

**间距规范**: 同 ideal

**颜色 Token**: 同 ideal，按钮使用 `var(--color-disabled, #D1D5DB)` 背景

---

### 1.3 加载态 (loading)

**触发条件**: 用户提交 Figma URL，等待 API 响应期间

**UI 元素**:
- "获取组件" 按钮文字变为 "获取中..." + disabled
- 组件选择区：骨架屏替代（5个灰色占位块，testId: `figma-skeleton`，每个 `height: 48px`）
- loading spinner（`role="progressbar"`，`aria-label="加载中"`）

**情绪引导文案**: "正在读取 Figma 文件，请稍候..."

**间距规范**:
- 骨架屏间距: `gap: 8px`
- 骨架屏内边距: `padding: 8px`

**颜色 Token**:
- 骨架屏背景: `var(--color-skeleton, #F3F4F6)`
- 骨架屏动画: `@keyframes shimmer`，从 `var(--color-skeleton)` 到 `var(--color-skeleton-end, #E5E7EB)`

---

### 1.4 错误态 (error)

**触发条件**: Figma URL 无效或 API 返回错误

**UI 元素**:

*场景 A — URL 无效格式*:
- 输入框红色边框（`aria-invalid: true`）
- inline 错误文案（`testId="url-error-text"`）："链接格式不正确，请检查后重试"

*场景 B — Figma API 错误*:
- Toast 弹窗（`role="alert"`）："无法获取 Figma 文件，请检查链接是否公开"

*场景 C — 权限不足*:
- Toast 弹窗：`"需要 Figma 查看权限，请确认文件已开启共享"`

**情绪引导文案**: "出错了，但有办法解决 — " + 具体错误文案

**间距规范**:
- 错误文案与输入框间距: `margin-top: 8px`
- Toast 内边距: `padding: 16px`

**颜色 Token**:
- 输入框错误边框: `var(--color-error, #EF4444)`
- Toast 背景: `var(--color-error-bg, #FEF2F2)`
- Toast 文字: `var(--color-error, #EF4444)`

---

## 2. ImageImport 组件四态

### 2.1 理想态 (ideal)

**触发条件**: 页面初始化，无图片上传

**UI 元素**:
- 拖放区域（`testId="image-drop-zone"`，`role="region"`，`aria-label="拖放图片区域"`）
- 引导图标（SVG inline，`< 24px`）
- 引导文案: "拖拽设计图片到这里，或点击上传"
- 支持格式提示: "支持 PNG / JPG / SVG"
- 上传按钮（`testId="image-upload-trigger"`，显示 "选择文件"）

**上传后预览区**:
- 图片预览（`testId="image-preview"`，`max-height: var(--height-preview, 240px)`，保持比例）
- "识别组件" 按钮（`testId="recognize-btn"`）
- "移除图片" 按钮（文字链接样式，`testId="remove-image-btn"`）

**情绪引导文案**: "上传设计稿，AI 自动识别组件"

**间距规范（8倍数）**:
- 拖放区域内边距: `padding: 32px`
- 元素垂直间距: `gap: 16px`
- 引导图标与文案间距: `gap: 8px`

**颜色 Token**:
- 拖放区边框: `var(--color-border-default, #E5E7EB)`
- 拖放区边框（hover/dragover）: `var(--color-primary, #4F46E5)`
- 拖放区背景: `var(--color-surface, #FFFFFF)`
- 拖放区背景（dragover）: `var(--color-primary-bg, #EEF2FF)`

---

### 2.2 空状态 (empty)

**触发条件**: 拖放区域无内容

**UI 元素**: 同理想态初始状态

**情绪引导文案**: "拖拽设计图片到这里，或点击上传"

**间距规范**: 同 ideal

**颜色 Token**: 同 ideal

---

### 2.3 加载态 (loading)

**触发条件**: 文件已选择，图片上传中或 AI 识别中

**UI 元素**:

*场景 A — 上传中*:
- 拖放区域显示进度条（`testId="upload-progress"`，`role="progressbar"`）
- 百分比文案: "上传中 45%"

*场景 B — AI 识别中*:
- 拖放区域内容变为: "AI 正在识别中..."
- 骨架屏结果区（`testId="image-skeleton"`，`height: var(--height-skeleton-result, 96px)`，骨架屏动画）
- 识别进度文案: "正在分析布局... 30%"

**情绪引导文案**: "AI 正在分析你的设计，请稍候..."

**间距规范**:
- 进度条与内容间距: `gap: 16px`
- 骨架屏内边距: `padding: 16px`

**颜色 Token**:
- 进度条轨道: `var(--color-skeleton, #F3F4F6)`
- 进度条填充: `var(--color-primary, #4F46E5)`

---

### 2.4 错误态 (error)

**触发条件**: 文件格式不支持 / 文件过大 / AI 识别失败

**UI 元素**:

*场景 A — 格式不支持*:
- Toast: "不支持的图片格式，请上传 PNG / JPG / SVG"
- 文件选择框保持（可重新选择）

*场景 B — 文件过大（> 10MB）*:
- Toast: "图片超过 10MB，请压缩后重试"

*场景 C — AI 识别失败*:
- 错误区域（`testId="recognize-error"`）：显示 "识别失败"
- "重试" 按钮（`testId="retry-btn"`）
- **不丢失已上传图片**（预览仍显示）

**情绪引导文案**: "识别遇到问题，试试重新上传或换张图片"

**间距规范**:
- 错误区域内边距: `padding: 16px`
- 按钮间距: `gap: 8px`

**颜色 Token**:
- 错误区域背景: `var(--color-error-bg, #FEF2F2)`
- 重试按钮: `var(--color-primary, #4F46E5)`

---

## 3. ImportConfirmDialog 组件四态

### 3.1 理想态 (ideal)

**触发条件**: 用户勾选组件后点击导入，确认对话框打开

**UI 元素**:
- Dialog 容器（`role="dialog"`，`aria-label="确认导入组件"`，`testId="import-dialog"`）
- Dialog 标题: "确认导入"（`testId="dialog-title"`）
- 组件列表（`testId="confirm-component-list"`）：
  - 每个组件: 名称 + 缩略图（`max-height: 48px`）
  - 总数 badge（`testId="total-count-badge"`）
- 操作区（`testId="dialog-actions"`）：
  - "取消" 按钮（`testId="cancel-btn"`，secondary 样式）
  - "确认导入" 按钮（`testId="confirm-btn"`，primary 样式，enabled）

**情绪引导文案**: "即将导入 X 个组件到画布，确认后即可使用"

**间距规范（8倍数）**:
- Dialog 内边距: `padding: 24px`
- 标题与列表间距: `gap: 16px`
- 列表项间距: `gap: 8px`
- 操作区按钮间距: `gap: 8px`
- Dialog 与 backdrop 间距: `margin: auto`（居中）

**颜色 Token**:
- Dialog 背景: `var(--color-surface, #FFFFFF)`
- Dialog 阴影: `var(--shadow-lg, 0 10px 15px -3px rgba(0,0,0,0.1))` — shadow 允许硬编码（CSS 原生特性）
- 取消按钮: `var(--color-secondary-bg, #F3F4F6)`
- 确认按钮: `var(--color-primary, #4F46E5)`

---

### 3.2 加载态 (loading)

**触发条件**: 用户点击"确认导入"，导入进行中

**UI 元素**:
- Dialog 内容不变（保持组件列表显示）
- 进度条（`testId="import-progress"`，`role="progressbar"`）
- 进度文案: "正在导入组件... 3/5"
- "确认导入" 按钮（disabled，文字变为 "导入中..."）
- "取消" 按钮（disabled）

**情绪引导文案**: "正在导入，请勿关闭页面"

**间距规范**: 同 ideal

**颜色 Token**: 同 ideal，按钮 disabled 使用 `var(--color-disabled, #D1D5DB)`

---

### 3.3 错误态 (error)

**触发条件**: 导入过程中出错

**UI 元素**:
- Dialog 显示错误区域（`testId="import-error"`）
- 错误文案: "导入失败，请检查画布空间后重试"
- "重试" 按钮（`testId="retry-import-btn"`）
- "取消" 按钮（enabled，用户可放弃）
- **当前画布数据不受影响**（无数据覆盖警告）

**情绪引导文案**: "导入没成功，但你的画布数据没丢 — 可以重试"

**间距规范**: 同 ideal

**颜色 Token**:
- 错误区域背景: `var(--color-error-bg, #FEF2F2)`
- 重试按钮: `var(--color-primary, #4F46E5)`

---

### 3.4 空状态 (empty)

**触发条件**: 不可能触发（Dialog 只在有组件时打开）

**设计决策**: 不需要空状态

---

## 4. 验收标准

### QA 验证点映射

| 验证点 | 组件 | 态 | 测试断言 |
|--------|------|---|---------|
| F1.1 | FigmaImport | ideal | `expect(getByRole('textbox', { name: /Figma URL/i })).toBeVisible()` |
| F1.1 | FigmaImport | ideal | `expect(getByRole('button', { name: /获取组件/i })).toBeEnabled()` |
| F1.1 | FigmaImport | empty | `expect(getByRole('button', { name: /获取组件/i })).toBeDisabled()` |
| F1.1 | FigmaImport | loading | `expect(getByTestId('figma-skeleton')).toHaveLength(5)` |
| F1.1 | FigmaImport | error | `expect(getByTestId('url-error-text')).toBeVisible()` |
| F1.2 | ImageImport | ideal | `expect(getByTestId('image-drop-zone')).toBeVisible()` |
| F1.2 | ImageImport | loading | `expect(getByTestId('image-skeleton')).toBeVisible()` |
| F1.2 | ImageImport | error | `expect(getByRole('alert')).toHaveTextContent(/不支持的图片格式/i)` |
| F1.3 | ImportConfirmDialog | ideal | `expect(getByRole('dialog')).toBeVisible()` |
| F1.3 | ImportConfirmDialog | loading | `expect(getByTestId('import-progress')).toBeVisible()` |
| F1.3 | ImportConfirmDialog | error | `expect(getByTestId('import-error')).toBeVisible()` |

---

## 5. 设计约束

### 通用约束

- **间距**: 所有间距使用 8 倍数（`8px / 16px / 24px / 32px`），禁止硬编码 `10px / 12px / 14px`
- **颜色**: 所有颜色通过 CSS Custom Properties（Token）引用，禁止硬编码 hex 值（`#RRGGBB`）
- **字号**: 使用 `var(--text-sm, 14px)` / `var(--text-base, 16px)` / `var(--text-lg, 18px)`
- **圆角**: `var(--radius-sm, 4px)` / `var(--radius-md, 8px)` / `var(--radius-lg, 12px)`
- **动画时长**: `var(--duration-fast, 150ms)` / `var(--duration-base, 300ms)`

### 四态设计原则

- **ideal**: 引导用户完成核心任务，状态自明
- **empty**: 告诉用户"这里可以做什么"，禁止留白或无说明
- **loading**: 骨架屏优先，禁止纯 spinner；文案说明正在发生什么
- **error**: 给出明确错误原因 + 可行的重试路径，不丢用户已有输入
