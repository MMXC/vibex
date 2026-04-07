# Story 4.5: Chart Export

## 基本信息
| 字段 | 值 |
|------|-----|
| Epic | Epic-4: 图表区域 |
| Story | 4.5 |
| 优先级 | P1 |
| 预估工时 | 3h |

## 功能描述
实现图表导出功能，支持PNG、SVG和Mermaid代码导出。

## Task列表

### FE-4.5.1: PNG导出
**类型**: 前端
**描述**: 导出图表为PNG图片
**验收标准**:
```javascript
fireEvent.click(screen.getByTestId('export-png-btn'));
expect(downloadSpy).toHaveBeenCalled();
expect(downloadSpy).toHaveBeenCalledWith(expect.stringContaining('.png'));
```
**CSS规范**: 
- 分辨率: 2x
- 背景透明或白色

### FE-4.5.2: SVG导出
**类型**: 前端
**描述**: 导出图表为SVG矢量图
**验收标准**:
```javascript
fireEvent.click(screen.getByTestId('export-svg-btn'));
expect(downloadSpy).toHaveBeenCalledWith(expect.stringContaining('.svg'));
```
**CSS规范**: 
- 保持矢量特性
- 样式内联

### FE-4.5.3: 代码导出
**类型**: 前端
**描述**: 导出Mermaid源代码
**验收标准**:
```javascript
fireEvent.click(screen.getByTestId('export-code-btn'));
expect(screen.getByTestId('code-modal')).toBeVisible();
```
**CSS规范**: 
- 代码高亮显示
- 复制按钮

### FE-4.5.4: 导出选项菜单
**类型**: 前端
**描述**: 显示导出选项下拉菜单
**验收标准**:
```javascript
fireEvent.click(screen.getByTestId('export-btn'));
expect(screen.getByTestId('export-menu')).toBeVisible();
```
**CSS规范**: 
- 下拉菜单样式
- 动画效果

### TEST-4.5.1: 图表导出测试
**类型**: 测试
**描述**: 验证导出功能
**验收标准**:
```javascript
fireEvent.click(screen.getByTestId('export-png-btn'));
expect(screen.getByTestId('download-trigger')).toHaveBeenCalled();
```

## 依赖关系
- 前置Story: 4.3 (Mermaid Render)

## 注意事项
- 文件名自动命名
- 支持自定义文件名
