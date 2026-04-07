# Story 4.1: Empty State

## 基本信息
| 字段 | 值 |
|------|-----|
| Epic | Epic-4: 图表区域 |
| Story | 4.1 |
| 优先级 | P1 |
| 预估工时 | 2h |

## 功能描述
实现图表区域的空状态展示，当无数据时显示友好提示。

## Task列表

### FE-4.1.1: 空状态图标
**类型**: 前端
**描述**: 显示空状态图标
**验收标准**:
```javascript
expect(screen.getByTestId('empty-icon')).toBeVisible();
expect(screen.getByTestId('empty-icon')).toContainHTML('empty-icon');
```
**CSS规范**: 
- 图标大小: 64px
- 颜色: `var(--color-text-muted)`

### FE-4.1.2: 空状态文字
**类型**: 前端
**描述**: 显示空状态提示文字
**验收标准**:
```javascript
expect(screen.getByTestId('empty-text')).toHaveTextContent('暂无图表数据');
```
**CSS规范**: 
- 字体大小: `--font-size-base`
- 颜色: `var(--color-text-muted)`

### FE-4.1.3: 空状态引导
**类型**: 前端
**描述**: 显示引导用户操作的提示
**验收标准**```javascript
expect(screen.getByTestId('empty-action')).toHaveTextContent('开始创建');
```
**CSS规范**: 
- 按钮样式: 主按钮
- 位置: 居中显示

### TEST-4.1.1: 空状态测试
**类型**: 测试
**描述**: 验证空状态显示
**验收标准**:
```javascript
expect(screen.getByTestId('empty-state')).toBeInTheDocument();
expect(screen.getByTestId('empty-icon')).toBeVisible();
```

## 依赖关系
- 前置Story: 3.1 (Step List)

## 注意事项
- 空状态文案可配置
- 引导按钮指向正确操作
