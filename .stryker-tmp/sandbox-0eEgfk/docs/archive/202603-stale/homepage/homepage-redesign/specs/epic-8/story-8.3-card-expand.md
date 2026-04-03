# Story 8.3: Card Expand

## 基本信息
| 字段 | 值 |
|------|-----|
| Epic | Epic-8: 结果展示区 |
| Story | 8.3 |
| 优先级 | P1 |
| 预估工时 | 2h |

## 功能描述
实现卡片展开/收起功能。

## Task列表

### FE-8.3.1: 展开按钮
**类型**: 前端
**描述**: 显示展开按钮
**验收标准**:
```javascript
expect(screen.getByTestId('expand-card-btn-1')).toBeVisible();
```
**CSS规范**: 
- 按钮样式: 图标按钮
- 图标: chevron-down

### FE-8.3.2: 展开内容
**类型**: 前端
**描述**: 点击展开详细视图
**验收标准**:
```javascript
fireEvent.click(screen.getByTestId('expand-card-btn-1'));
expect(screen.getByTestId('card-detail-1')).toBeVisible();
```
**CSS规范**: 
- 展开动画: slideDown
- 全宽显示

### FE-8.3.3: 收起功能
**类型**: 前端
**描述**: 点击收起详情
**验收标准**:
```javascript
fireEvent.click(screen.getByTestId('collapse-card-btn-1'));
expect(screen.getByTestId('card-detail-1')).not.toBeVisible();
```
**CSS规范**: 
- 收起动画: slideUp

### TEST-8.3.1: 卡片展开测试
**类型**: 测试
**描述**: 验证展开功能
**验收标准**:
```javascript
fireEvent.click(screen.getByTestId('expand-card-btn-1'));
expect(screen.getByTestId('card-detail-1')).toBeVisible();
```

## 依赖关系
- 前置Story: 8.2 (Card Content)

## 注意事项
- 同时只展开一个
- 展开后滚动到视口
