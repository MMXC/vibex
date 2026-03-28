# Story 5.3: Detail Expand

## 基本信息
| 字段 | 值 |
|------|-----|
| Epic | Epic-5: AI思考过程展示 |
| Story | 5.3 |
| 优先级 | P1 |
| 预估工时 | 3h |

## 功能描述
实现思考项详情展开/收起功能。

## Task列表

### FE-5.3.1: 展开按钮
**类型**: 前端
**描述**: 点击展开查看详情
**验收标准**:
```javascript
fireEvent.click(screen.getByTestId('expand-btn-1'));
expect(screen.getByTestId('thinking-detail-1')).toBeVisible();
```
**CSS规范**: 
- 展开图标: chevron-down
- 展开图标旋转: 180deg

### FE-5.3.2: 收起功能
**类型**: 前端
**描述**: 点击收起详情
**验收标准**:
```javascript
fireEvent.click(screen.getByTestId('expand-btn-1'));
expect(screen.getByTestId('thinking-detail-1')).not.toBeVisible();
```
**CSS规范**: 
- 收起动画: slideUp

### FE-5.3.3: 详情内容渲染
**类型**: 前端
**描述**: 渲染思考详情内容
**验收标准**:
```javascript
expect(screen.getByTestId('thinking-detail-content-1')).toContainHTML('<pre>');
```
**CSS规范**: 
- 代码块: 等宽字体
- 语法高亮

### FE-5.3.4: 展开动画
**类型**: 前端
**描述**: 展开/收起动画效果
**验收标准**:
```javascript
expect(screen.getByTestId('thinking-detail-1')).toHaveClass(/slide-enter/);
```
**CSS规范**: 
- 动画: slideDown
- 时长: `--transition-normal`

### TEST-5.3.1: 详情展开测试
**类型**: 测试
**描述**: 验证展开功能
**验收标准**:
```javascript
fireEvent.click(screen.getByTestId('expand-btn-1'));
expect(screen.getByTestId('thinking-detail-1')).toBeVisible();
```

## 依赖关系
- 前置Story: 5.1 (Thinking List)

## 注意事项
- 同时只展开一个
- 支持键盘操作
