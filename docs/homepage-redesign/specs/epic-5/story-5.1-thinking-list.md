# Story 5.1: Thinking List

## 基本信息
| 字段 | 值 |
|------|-----|
| Epic | Epic-5: AI思考过程展示 |
| Story | 5.1 |
| 优先级 | P1 |
| 预估工时 | 3h |

## 功能描述
实现AI思考过程列表组件，展示思考步骤和内容。

## Task列表

### FE-5.1.1: 思考列表渲染
**类型**: 前端
**描述**: 渲染思考过程列表
**验收标准**:
```javascript
expect(screen.getByTestId('thinking-list')).toBeVisible();
expect(screen.getAllByTestId(/^thinking-item-/)).toHaveLength(3);
```
**CSS规范**: 
- 列表样式: 时间线布局
- 间距: `--spacing-md`

### FE-5.1.2: 思考项内容
**类型**: 前端
**描述**: 显示思考项的标题和内容
**验收标准**:
```javascript
expect(screen.getByTestId('thinking-title-1')).toHaveTextContent('分析需求');
expect(screen.getByTestId('thinking-content-1')).toBeVisible();
```
**CSS规范**: 
- 标题: `--font-weight-medium`
- 内容: `--font-size-sm`

### FE-5.1.3: 思考时间戳
**类型**: 前端
**描述**: 显示思考发生的时间
**验收标准**:
```javascript
expect(screen.getByTestId('thinking-time-1')).toContainText('2024-03-21');
```
**CSS规范**: 
- 时间格式: YYYY-MM-DD HH:mm
- 颜色: `var(--color-text-muted)`

### FE-5.1.4: 思考状态指示
**类型**: 前端
**描述**: 显示思考进行中/已完成
**验收标准**:
```javascript
expect(screen.getByTestId('thinking-item-1')).toHaveClass(/completed/);
expect(screen.getByTestId('thinking-item-2')).toHaveClass(/processing/);
```
**CSS规范**: 
- 进行中: 脉冲动画
- 已完成: 对勾图标

### TEST-5.1.1: 思考列表测试
**类型**: 测试
**描述**: 验证思考列表显示
**验收标准**:
```javascript
expect(screen.getByTestId('thinking-list')).toBeInTheDocument();
expect(screen.getAllByTestId(/^thinking-item-/)).toHaveLength(3);
```

## 依赖关系
- 前置Story: 4.3 (Mermaid Render)

## 注意事项
- 列表可滚动
- 支持动态更新
