# Spec — E4: AI 草图/图片导入

**文件**: `specs/E4-export.md`
**Epic**: E4 AI 草图/图片导入
**基于**: PRD vibex-sprint3-qa § Epic/Story 表格 E4
**状态**: Draft

---

## 组件描述

ImportPanel「上传图片」Tab。用户在原型编辑器中打开导入面板，切换到图片 Tab，拖拽或选择 PNG/JPG/JPEG 图片上传，AI Vision API 解析（≤30s）返回识别到的组件列表，用户确认后批量导入画布。

---

## 四态定义

### 1. 理想态（Ideal）

**触发条件**: 用户已上传图片，AI 解析完成，显示识别结果列表

**视觉表现**:
- 上传区域显示图片预览缩略图（最大宽度 `200px`，`var(--radius-md)` 圆角，阴影 `var(--shadow-sm)`）
- 识别结果列表：每个组件一行（图标 + 文字标签 + 置信度 indicator）
- 组件行 padding: `var(--space-8) var(--space-12)`，间距 `var(--space-4)`
- 列表顶部显示统计文字：「成功识别 N 个组件」（`var(--font-size-sm)`, `var(--color-text-secondary)`）
- 右下角「确认导入」按钮（背景 `var(--color-accent-primary)`，文字 `var(--color-on-accent)`，`var(--space-8) var(--space-16)` padding）
- 组件行可选中/取消选中（checkbox 行为，默认全选）

**交互行为**:
- 点击「确认导入」→ `store.addNodes()` 批量入画布 → 成功后显示 toast「✨ 已导入 N 个组件」（`var(--color-success)` 背景，emoji 增强愉悦感）
- 可取消勾选部分组件后再导入

**情绪引导**: 😆 超预期 — AI 识别到 10+ 组件时，批量入画布的成就感极强。确认导入时 toast 用「✨」emoji 强化正向反馈，让用户感受到「AI 帮我做了很多事」。

---

### 2. 空状态（Empty）

**触发条件**: 用户打开「上传图片」Tab，尚未上传任何图片

**视觉表现**:
- 上传区域：虚线边框（`2px dashed var(--color-border)`，`var(--radius-lg)` 圆角），背景 `var(--color-surface-primary)`
- 区域内居中显示上传 icon（`var(--icon-upload)`, `48px`，`var(--color-text-tertiary)`）+ 文字「拖拽图片或点击上传」（`var(--font-size-sm)`, `var(--color-text-tertiary)`）
- 区域下方显示支持格式：「支持 PNG / JPG / JPEG」（`var(--font-size-xs)`, `var(--color-text-tertiary)`）
- 上传区域 min-height: `200px`，padding: `var(--space-24)`
- 支持点击触发 `<input type="file" accept=".png,.jpg,.jpeg">`

**交互行为**:
- 拖拽文件进入区域 → 边框颜色变为 `var(--color-accent-primary)`（`drag-over` 态）
- 拖拽离开 → 边框恢复虚线
- 点击区域 → 打开文件选择器

**情绪引导**: 无负面 — 空状态明确告知操作方式（拖拽/点击），支持格式说明减少「不知道能不能用」的焦虑。

---

### 3. 加载态（Loading）

**触发条件**: 图片上传成功，AI Vision API 正在解析（≤30s）

**视觉表现**:
- 上传区域被解析状态覆盖：图片缩略图（半透明 `opacity: 0.6`）+ 居中进度指示器
- 进度指示器：圆环形进度条（`width: 48px; height: 48px`，`var(--color-accent-primary)` 轨道，`var(--color-accent-subtle)` 背景）
- 进度指示器中心显示百分比文字（`var(--font-size-sm)`，`var(--color-text-primary)`）
- 进度条下方文字：「正在识别组件...」（`var(--font-size-sm)`，`var(--color-text-secondary)`）
- 「确认导入」按钮 `disabled`（`opacity: 0.5; pointer-events: none`）

**交互行为**:
- 加载期间不可点击确认导入
- 不可重新上传（需等待当前请求结束或取消）
- 进度从 0% 到 100% 实时更新（或模拟 steps 更新：0→30→60→90→100）

**情绪引导**: 中性等待 — 进度条比 spinner 更友好（告知进度），「正在识别组件...」文案让用户知道系统在做什么，减少「卡住了吗」的焦虑。

---

### 4. 错误态（Error）

**触发条件**: AI 识别失败（API 返回 500/timeout）或网络错误

**触发条件细分**:
- **识别失败**（API error）：显示「识别失败，请检查图片后重试」（红色错误 icon + 文字）
- **网络错误**：显示「网络错误，请检查网络连接」

**视觉表现**:
- 上传区域显示错误态：红色错误 icon（`var(--icon-error)`, `48px`，居中，`var(--color-error)`）
- icon 下方错误文案（`var(--font-size-sm)`, `var(--color-error)`）
- 区域下方显示「重试」按钮（`var(--space-8) var(--space-16)` padding，边框 `var(--color-error)`，文字 `var(--color-error)`，`var(--radius-md)`）
- 若有网络错误，显示网络状态提示

**交互行为**:
- 点击「重试」→ 清空当前图片，重新触发文件选择器
- 出错状态下可重新上传新图片

**情绪引导**: ➖ 挫败缓解 — 错误类型区分（识别失败 vs 网络错误）让用户知道「是我的图片问题还是网络问题」，「重试」按钮提供明确行动路径，避免「出错后不知道怎么办」的卡死感。

---

## 验收标准（expect() 断言）

```typescript
// E4-AC1: 上传图片 Tab 入口 + 文件类型限制
test('E4-AC1: ImportPanel 显示上传图片按钮，文件 input 接受 png/jpg/jpeg', () => {
  expect(screen.getByRole('button', { name: /上传图片/ })).toBeInTheDocument();
  const input = screen.getByLabelText(/图片文件/);
  expect(input).toHaveAttribute('accept', '.png,.jpg,.jpeg');
});

// E4-AC2: 上传后显示 loading
test('E4-AC2: 上传图片文件后，显示正在识别 loading', async () => {
  const mockFile = new File(['(image)'], 'mock.png', { type: 'image/png' });
  fireEvent.change(screen.getByLabelText(/图片文件/), { target: { files: [mockFile] } });
  expect(screen.getByText(/正在识别组件/)).toBeInTheDocument();
});

// E4-AC2 success: 识别成功显示组件列表
test('E4-AC2: 识别成功后，显示组件列表 + 统计文字', async () => {
  await waitFor(() => {
    expect(screen.getByText(/Button/)).toBeInTheDocument();
  });
  expect(screen.getByText(/成功识别 \d+ 个组件/)).toBeInTheDocument();
});

// E4-AC2 error: 识别失败显示错误提示 + 重试按钮
test('E4-AC2 error: AI 服务返回 500 时，显示识别失败提示 + 重试按钮', async () => {
  server.use(
    rest.post(apiUrl, (_req, _res, ctx) => ctx.status(500))
  );
  await waitFor(() => {
    expect(screen.getByText(/识别失败/)).toBeInTheDocument();
  });
  expect(screen.getByRole('button', { name: /重试/ })).toBeInTheDocument();
});

// E4-AC3: 确认导入后节点入画布
test('E4-AC3: 点击确认导入，store.nodes 数量增加，显示成功 toast', async () => {
  const previousCount = store.nodes.length;
  fireEvent.click(screen.getByRole('button', { name: /确认导入/ }));
  await waitFor(() => {
    expect(store.nodes.length).toBeGreaterThan(previousCount);
  });
  expect(screen.getByText(/✨ 已导入 \d+ 个组件/)).toBeInTheDocument();
});
```

---

## AI 识别规格

| 项目 | 值 |
|------|-----|
| 支持格式 | PNG / JPG / JPEG |
| 最大文件大小 | 10MB |
| API 超时 | 30s |
| 最小识别宽度 | 50px |
| 返回字段 | component_type, label, bounding_box, confidence |

---

## 相关组件

- `ImportPanel` — 导入面板主容器
- `ImageUploadTab` — 图片上传 Tab
- `ImageDropzone` — 拖拽上传区域
- `AIPreviewList` — AI 识别结果列表
- `ImageImportService` — AI Vision API 调用层
- `prototypeStore.addNodes()` — 批量节点导入

---

## 依赖关系

```
E4 依赖:
  └── figma-import service (AI Vision API)
  └── prototypeStore.addNodes()
上游: PRD E4 Epic
关联: E3 prototypeStore.breakpoint（新增节点断点标记）
```
