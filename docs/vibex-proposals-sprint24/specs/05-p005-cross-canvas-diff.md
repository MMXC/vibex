# P005: 跨 Canvas 版本对比规格文档

## UI 组件

- **组件名称**: 跨 Canvas diff 视图页面
- **主要文件路径**: `src/pages/CanvasDiffPage.tsx`、`src/components/DiffView.tsx`

## 四态定义

### 1. 理想态

用户选择两个 Canvas 项目进行对比，diff 区域显示：
- 新增内容：红色标识
- 移除内容：绿色标识
- 修改内容：黄色标识

报告可导出为 JSON/CSV 格式。

```
expect(selectedCanvases).toHaveLength(2)
expect(diffResults).toBeInstanceOf(Object)
expect(diffResults.added).toBeArray()
expect(diffResults.removed).toBeArray()
expect(diffResults.modified).toBeArray()
expect(addedNodes[0].highlightColor).toBe('#ef4444')  // 红
expect(removedNodes[0].highlightColor).toBe('#22c55e')  // 绿
expect(modifiedNodes[0].highlightColor).toBe('#eab308')  // 黄
expect(exportButtonVisible).toBe(true)
expect(exportFormat).toContain('json')
```

### 2. 空状态

用户未选择第二个 Canvas 项目，diff 区域显示引导文案 `"请选择要对比的第二个 Canvas 项目"`。

```
expect(selectedCanvases).toHaveLength(1)
expect(diffResults).toBeNull()
expect(diffAreaContent).toContain('请选择要对比的第二个 Canvas 项目')
expect(compareButton).toBeDisabled()
```

### 3. 加载态

diff 计算中，显示骨架屏，禁止使用 spinner。

```
expect(diffState).toBe('calculating')
expect(skeletonVisible).toBe(true)
expect(spinnerVisible).toBe(false)
expect(diffResults).toBeNull()
```

### 4. 错误态

**场景一：网络问题导致 diff 计算失败**
显示错误消息 `"对比失败，请检查网络后重试"` + 重试按钮。

**场景二：Canvas 数据格式不兼容**
显示错误消息 `"选中的项目无法对比，请检查数据格式"`。

```
// 场景一
expect(diffState).toBe('error')
expect(errorMessage).toBe('对比失败，请检查网络后重试')
expect(retryButtonVisible).toBe(true)

// 场景二
expect(errorMessage).toBe('选中的项目无法对比，请检查数据格式')
expect(retryButtonVisible).toBe(false)
```