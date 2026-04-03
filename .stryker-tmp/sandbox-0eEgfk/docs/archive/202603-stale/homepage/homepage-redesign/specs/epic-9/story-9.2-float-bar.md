# Story 9.2: Float Bar

## 基本信息
| 字段 | 值 |
|------|-----|
| Epic | Epic-9: 浮动工具栏 |
| Story | 9.2 |
| 优先级 | P1 |
| 预估工时 | 3h |

## 功能描述
实现浮动工具栏内容。

## Task列表

### FE-9.2.1: 工具栏显示
**类型**: 前端
**描述**: 显示浮动工具栏
**验收标准**:
```javascript
expect(screen.getByTestId('float-bar')).toBeVisible();
```
**CSS规范**: 
- 背景: `var(--color-surface)`
- 圆角: `--radius-lg`

### FE-9.2.2: 工具按钮
**类型**: 前端
**描述**: 显示工具按钮
**验收标准**:
```javascript
expect(screen.getAllByTestId(/^tool-btn-/)).toHaveLength(4);
```
**CSS规范**: 
- 按钮样式: 图标按钮
- 间距均匀

### FE-9.2.3: 工具提示
**类型**: 前端
**描述**: 悬停显示提示
**验收标准**:
```javascript
fireEvent.mouseEnter(screen.getByTestId('tool-btn-save'));
expect(screen.getByTestId('tooltip')).toBeVisible();
```
**CSS规范**: 
- 提示样式
- 延迟显示

### FE-9.2.4: 按钮点击
**类型**: 前端
**描述**: 工具按钮点击事件
**验收标准**:
```javascript
fireEvent.click(screen.getByTestId('tool-btn-save'));
expect(screen.getByTestId('success-toast')).toBeVisible();
```
**CSS规范**: 
- 点击反馈动画

### TEST-9.2.1: 浮动栏测试
**类型**: 测试
**描述**: 验证工具栏
**验收标准**:
```javascript
expect(screen.getByTestId('float-bar')).toBeInTheDocument();
```

## 依赖关系
- 前置Story: 9.1 (Float Trigger)

## 注意事项
- 工具按钮可配置
- 权限控制显示
