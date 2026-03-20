# Story 4.4: Chart Interaction

## 基本信息
| 字段 | 值 |
|------|-----|
| Epic | Epic-4: 图表区域 |
| Story | 4.4 |
| 优先级 | P1 |
| 预估工时 | 3h |

## 功能描述
实现图表交互功能，包括节点点击、缩放和平移。

## Task列表

### FE-4.4.1: 节点点击
**类型**: 前端
**描述**: 点击图表节点显示详情
**验收标准**:
```javascript
fireEvent.click(screen.getByTestId('chart-node-A'));
expect(screen.getByTestId('node-detail')).toBeVisible();
```
**CSS规范**: 
- 点击态: 边框高亮
- 详情面板: 右侧滑出

### FE-4.4.2: 图表缩放
**类型**: 前端
**描述**: 支持鼠标滚轮缩放
**验收标准**:
```javascript
const svg = screen.getByTestId('chart-svg');
const initialScale = getScale(svg);
fireEvent.wheel(svg, { deltaY: -100 });
expect(getScale(svg)).toBeGreaterThan(initialScale);
```
**CSS规范**: 
- 缩放范围: 0.5x - 3x
- 缩放步进: 0.1

### FE-4.4.3: 图表平移
**类型**: 前端
**描述**: 支持拖拽平移
**验收标准**:
```javascript
fireEvent.mouseDown(screen.getByTestId('chart-container'));
fireEvent.mouseMove(document, { clientX: 100, clientY: 100 });
fireEvent.mouseUp(document);
```
**CSS规范**: 
- 平移光标: grab/grabbing
- 平滑过渡

### FE-4.4.4: 重置视图
**类型**: 前端
**描述**: 一键重置缩放和平移
**验收标准**:
```javascript
fireEvent.click(screen.getByTestId('reset-view-btn'));
expect(getScale(svg)).toBe(1);
```
**CSS规范**: 
- 按钮位置: 右下角
- 图标: home/reset

### TEST-4.4.1: 图表交互测试
**类型**: 测试
**描述**: 验证图表交互功能
**验收标准**:
```javascript
fireEvent.click(screen.getByTestId('chart-node-A'));
expect(screen.getByTestId('node-detail')).toBeVisible();
```

## 依赖关系
- 前置Story: 4.3 (Mermaid Render)

## 注意事项
- 移动端触摸支持
- 性能优化大数据图表
