# Story 6.1: Collapse Handle

## 基本信息
| 字段 | 值 |
|------|-----|
| Epic | Epic-6: 需求输入区域 |
| Story | 6.1 |
| 优先级 | P0 |
| 预估工时 | 2h |

## 功能描述
实现需求输入区域的折叠/展开手柄。

## Task列表

### FE-6.1.1: 手柄显示
**类型**: 前端
**描述**: 显示折叠/展开手柄
**验收标准**:
```javascript
expect(screen.getByTestId('collapse-handle')).toBeVisible();
```
**CSS规范**: 
- 手柄样式: 拖动条
- 颜色: `var(--color-text-muted)`

### FE-6.1.2: 折叠功能
**类型**: 前端
**描述**: 拖动手柄折叠区域
**验收标准**:
```javascript
const handle = screen.getByTestId('collapse-handle');
fireEvent.mouseDown(handle);
fireEvent.mouseMove(document, { clientY: 100 });
fireEvent.mouseUp(document);
expect(screen.getByTestId('input-area')).toHaveClass(/collapsed/);
```
**CSS规范**: 
- 最小高度: 100px
- 折叠高度: 48px

### FE-6.1.3: 展开功能
**类型**: 前端
**描述**: 向上拖动展开区域
**验收标准**:
```javascript
fireEvent.mouseMove(document, { clientY: 400 });
expect(screen.getByTestId('input-area')).toHaveClass(/expanded/);
```
**CSS规范**: 
- 最大高度: 60vh

### FE-6.1.4: 双击重置
**类型**: 前端
**描述**: 双击手柄重置到默认高度
**验收标准**:
```javascript
fireEvent.dblClick(screen.getByTestId('collapse-handle'));
expect(getComputedStyle(panel).height).toBe('200px');
```
**CSS规范**: 
- 默认高度: 200px

### TEST-6.1.1: 折叠手柄测试
**类型**: 测试
**描述**: 验证折叠功能
**验收标准**:
```javascript
expect(screen.getByTestId('collapse-handle')).toBeInTheDocument();
```

## 依赖关系
- 前置Story: 3.1 (Step List)

## 注意事项
- 拖动时显示高度指示
- 触摸设备支持
