# Story 8.2: Card Content

## 基本信息
| 字段 | 值 |
|------|-----|
| Epic | Epic-8: 结果展示区 |
| Story | 8.2 |
| 优先级 | P1 |
| 预估工时 | 3h |

## 功能描述
实现结果卡片内容展示。

## Task列表

### FE-8.2.1: 卡片标题
**类型**: 前端
**描述**: 显示卡片标题
**验收标准**:
```javascript
expect(screen.getByTestId('card-title-1')).toHaveTextContent('需求分析');
```
**CSS规范**: 
- 标题字体: `--font-weight-bold`
- 颜色: `var(--color-text)`

### FE-8.2.2: 卡片内容
**类型**: 前端
**描述**: 显示卡片内容
**验收标准**:
```javascript
expect(screen.getByTestId('card-content-1')).toBeVisible();
```
**CSS规范**: 
- 内容间距: `--spacing-md`
- 内容可滚动

### FE-8.2.3: 卡片图标
**类型**: 前端
**描述**: 显示卡片图标
**验收标准**:
```javascript
expect(screen.getByTestId('card-icon-1')).toContainHTML('document-icon');
```
**CSS规范**: 
- 图标大小: 24px
- 图标颜色: `var(--color-primary)`

### FE-8.2.4: 卡片状态
**类型**: 前端
**描述**: 显示卡片状态标识
**验收标准**:
```javascript
expect(screen.getByTestId('card-status-1')).toHaveClass(/success/);
```
**CSS规范**: 
- 状态颜色: 绿/黄/红
- 状态文字

### TEST-8.2.1: 卡片内容测试
**类型**: 测试
**描述**: 验证卡片内容
**验收标准**:
```javascript
expect(screen.getByTestId('card-title-1')).toBeInTheDocument();
```

## 依赖关系
- 前置Story: 8.1 (Three Columns)

## 注意事项
- 支持Markdown渲染
- 内容过长省略
