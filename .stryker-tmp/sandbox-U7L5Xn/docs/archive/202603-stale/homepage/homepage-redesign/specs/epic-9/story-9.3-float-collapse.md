# Story 9.3: Float Collapse

## 基本信息
| 字段 | 值 |
|------|-----|
| Epic | Epic-9: 浮动工具栏 |
| Story | 9.3 |
| 优先级 | P1 |
| 预估工时 | 2h |

## 功能描述
实现浮动工具栏折叠功能。

## Task列表

### FE-9.3.1: 折叠按钮
**类型**: 前端
**描述**: 显示折叠按钮
**验收标准**:
```javascript
expect(screen.getByTestId('collapse-bar-btn')).toBeVisible();
```
**CSS规范**: 
- 按钮样式: 图标按钮
- 图标: chevron-right

### FE-9.3.2: 折叠动画
**类型**: 前端
**描述**: 点击折叠工具栏
**验收标准**:
```javascript
fireEvent.click(screen.getByTestId('collapse-bar-btn'));
expect(screen.getByTestId('float-bar')).toHaveClass(/collapsed/);
```
**CSS规范**: 
- 动画: slideLeft
- 时长: `--transition-normal`

### FE-9.3.3: 恢复展开
**类型**: 前端
**描述**: 点击触发按钮恢复
**验收标准**:
```javascript
fireEvent.click(screen.getByTestId('float-trigger'));
expect(screen.getByTestId('float-bar')).not.toHaveClass(/collapsed/);
```
**CSS规范**: 
- 恢复动画

### TEST-9.3.1: 折叠功能测试
**类型**: 测试
**描述**: 验证折叠功能
**验收标准**:
```javascript
fireEvent.click(screen.getByTestId('collapse-bar-btn'));
expect(screen.getByTestId('float-bar')).toHaveClass(/collapsed/);
```

## 依赖关系
- 前置Story: 9.2 (Float Bar)

## 注意事项
- 折叠状态记忆
- 自动折叠超时
