# Story 5.2: New Animation

## 基本信息
| 字段 | 值 |
|------|-----|
| Epic | Epic-5: AI思考过程展示 |
| Story | 5.2 |
| 优先级 | P1 |
| 预估工时 | 2h |

## 功能描述
实现新思考项出现时的动画效果。

## Task列表

### FE-5.2.1: 新项入场动画
**类型**: 前端
**描述**: 新思考项以动画方式入场
**验收标准**:
```javascript
fireEvent.click(screen.getByTestId('add-thought-btn'));
expect(screen.getByTestId('thinking-item-new')).toHaveClass(/fade-in/);
```
**CSS规范**: 
- 动画: fadeIn + slideDown
- 时长: `--transition-normal`

### FE-5.2.2: 高亮效果
**类型**: 前端
**描述**: 新思考项短暂高亮
**验收标准**:
```javascript
expect(screen.getByTestId('thinking-item-new')).toHaveClass(/highlight/);
```
**CSS规范**: 
- 高亮色: `var(--color-primary)` 半透明
- 持续: 1s

### FE-5.2.3: 自动移除高亮
**类型**: 前端
**描述**: 高亮效果自动消失
**验收标准**:
```javascript
await waitForTimeout(1500);
expect(screen.getByTestId('thinking-item-new')).not.toHaveClass(/highlight/);
```
**CSS规范**: 
- 自动消失动画

### TEST-5.2.1: 新项动画测试
**类型**: 测试
**描述**: 验证新项动画
**验收标准**:
```javascript
fireEvent.click(screen.getByTestId('add-thought-btn'));
expect(screen.getByTestId('thinking-item-new')).toHaveClass(/fade-in/);
```

## 依赖关系
- 前置Story: 5.1 (Thinking List)

## 注意事项
- 动画流畅不卡顿
- 兼容低端设备
