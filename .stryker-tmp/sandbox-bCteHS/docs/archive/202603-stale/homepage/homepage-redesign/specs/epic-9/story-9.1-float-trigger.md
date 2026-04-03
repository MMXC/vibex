# Story 9.1: Float Trigger

## 基本信息
| 字段 | 值 |
|------|-----|
| Epic | Epic-9: 浮动工具栏 |
| Story | 9.1 |
| 优先级 | P1 |
| 预估工时 | 2h |

## 功能描述
实现浮动工具栏触发按钮。

## Task列表

### FE-9.1.1: 触发按钮显示
**类型**: 前端
**描述**: 显示浮动按钮
**验收标准**:
```javascript
expect(screen.getByTestId('float-trigger')).toBeVisible();
```
**CSS规范**: 
- 位置: 右下角
- 固定定位

### FE-9.1.2: 按钮样式
**类型**: 前端
**描述**: 按钮样式设计
**验收标准**:
```javascript
expect(screen.getByTestId('float-trigger')).toContainHTML('plus-icon');
```
**CSS规范**: 
- 圆形按钮
- 阴影: `--shadow-lg`

### FE-9.1.3: 按钮交互
**类型**: 前端
**描述**: 点击切换浮动栏
**验收标准**:
```javascript
fireEvent.click(screen.getByTestId('float-trigger'));
expect(screen.getByTestId('float-bar')).toBeVisible();
```
**CSS规范**: 
- 旋转动画
- 点击态效果

### TEST-9.1.1: 浮动触发测试
**类型**: 测试
**描述**: 验证触发功能
**验收标准**:
```javascript
expect(screen.getByTestId('float-trigger')).toBeInTheDocument();
```

## 依赖关系
- 前置Story: 8.1 (Three Columns)

## 注意事项
- 避免遮挡重要内容
- 支持拖拽位置
