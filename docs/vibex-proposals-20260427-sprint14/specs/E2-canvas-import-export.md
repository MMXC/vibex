# S14-E2 Spec: Canvas 导入/导出系统

## Epic 概述

用户可将 Canvas 设计导出为 JSON 文件备份或分享；也可从 JSON 文件导入设计。解决跨设备/跨浏览器工作连续性问题。

## 推荐方案

**方案 A：JSON 文件导入导出**
- Export: `exportCanvas()` → JSON，含 schemaVersion + chapters + crossChapterEdges + metadata
- Import: `useCanvasImport` hook，JSON schema 校验，merge 策略选择

## 用户故事

### US-E2.1: 导出 Canvas 为 JSON 文件
**作为**用户，**我希望**点击导出按钮下载 Canvas 的完整设计 JSON 文件，**这样**即使换设备也能继续工作。

**验收标准**:
- expect(DDSCanvasPage).toHaveButton('Export Canvas')
- 点击后触发 `exportCanvas()` 返回非空 JSON 对象
- 导出的 JSON 包含 `schemaVersion`, `chapters`, `crossChapterEdges`, `metadata`
- expect(JSON.parse(downloadedFile)).not.toThrow()
- schemaVersion 字段存在且为非空字符串

### US-E2.2: 从 JSON 文件导入 Canvas
**作为**用户，**我希望**通过导入按钮读取 JSON 文件并还原 Canvas 设计，**这样**可以复用他人分享的设计文件。

**验收标准**:
- expect(DDSCanvasPage).toHaveButton('Import Canvas')
- 导入有效 JSON 后 chapters 数量与文件一致
- 导入后 `useCanvasStore.getState().chapters.length > 0`

### US-E2.3: 导入不兼容 JSON 时的降级处理
**作为**系统，**我希望**当用户导入不兼容版本的 JSON 时给出友好提示而不是崩溃，**这样**用户体验稳定。

**验收标准**:
- Given 不兼容 JSON（含未知字段或缺失 chapters），when 导入触发, then expect(console.warn).toHaveBeenCalled()
- UI 显示错误提示，不阻塞页面
- 控制台无 error 级别日志（warn 不算 error）

### US-E2.4: Canvas 导入覆盖确认
**作为**用户，**我希望**导入前被询问是否覆盖当前设计，**这样**不会意外丢失已有的工作。

**验收标准**:
- Given 当前 Canvas 有内容，when 导入触发, then expect(confirmDialog).toBeVisible()
- 确认后原内容被替换，取消后原内容保留

## 技术规格

### JSON Schema
```json
{
  "schemaVersion": "1.0.0",
  "metadata": {
    "exportedAt": "ISO-timestamp",
    "canvasId": "uuid",
    "nodeCount": 0
  },
  "chapters": [...],
  "crossChapterEdges": [...]
}
```

### Forward Compatibility
- 忽略未知字段，不抛出异常
- schemaVersion 不匹配时 warn 并尝试兼容（graceful degradation）

## Definition of Done

- [ ] DDSCanvasPage 导出按钮 data-testid="canvas-export-btn"
- [ ] DDSCanvasPage 导入按钮 data-testid="canvas-import-btn"
- [ ] 导出 JSON 可被 `JSON.parse()` 成功解析且含必需字段
- [ ] 导入不兼容 JSON 时控制台无 error，UI 显示友好错误提示
- [ ] 导入覆盖前有确认对话框
- [ ] `useCanvasImport` hook 单元测试覆盖（valid/invalid/schema mismatch）
- [ ] schemaVersion 存在于每个导出文件
