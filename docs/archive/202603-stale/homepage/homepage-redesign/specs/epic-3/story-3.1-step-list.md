# Story 3.1: Step List

## 基本信息
| 字段 | 值 |
|------|-----|
| Epic | Epic-3: Step步骤条组件 |
| Story | 3.1 |
| 优先级 | P1 |
| 预估工时 | 3h |

## 功能描述
实现Step步骤条组件，支持多步骤展示和步骤切换。

## Task列表

### FE-3.1.1: 步骤列表渲染
**类型**: 前端
**描述**: 渲染步骤列表
**验收标准**:
```javascript
expect(screen.getByTestId('step-list')).toBeVisible();
expect(screen.getAllByTestId(/^step-item-/)).toHaveLength(4);
```
**CSS规范**: 
- 水平布局
- 间距均匀分布

### FE-3.1.2: 步骤序号显示
**类型**: 前端
**描述**: 显示每个步骤的序号
**验收标准**:
```javascript
expect(screen.getByTestId('step-number-1')).toHaveTextContent('1');
expect(screen.getByTestId('step-number-2')).toHaveTextContent('2');
```
**CSS规范**: 
- 序号圆圈: 24px
- 字体: `--font-weight-bold`

### FE-3.1.3: 步骤标题显示
**类型**: 前端
**描述**: 显示每个步骤的标题
**验收标准**:
```javascript
expect(screen.getByTestId('step-title-1')).toHaveTextContent('需求描述');
```
**CSS规范**: 
- 标题字体: `--font-size-sm`
- 与序号间距: `--spacing-sm`

### FE-3.1.4: 连接线渲染
**类型**: 前端
**描述**: 步骤间的连接线
**验收标准**:
```javascript
expect(screen.getByTestId('step-connector-1')).toBeVisible();
```
**CSS规范**: 
- 线宽: 2px
- 颜色: `var(--color-text-muted)`

### FE-3.1.5: 步骤列表响应式
**类型**: 前端
**描述**: 移动端步骤列表自适应
**验收标准**:
```javascript
expect(screen.getByTestId('step-list')).toHaveClass(/horizontal/);
```
**CSS规范**: 
- 移动端: 可水平滚动
- 断点: 768px

### TEST-3.1.1: 步骤列表测试
**类型**: 测试
**描述**: 验证步骤列表渲染
**验收标准**:
```javascript
expect(screen.getByTestId('step-list')).toBeInTheDocument();
expect(screen.getAllByTestId(/^step-item-/)).toHaveLength(4);
```

## 依赖关系
- 前置Story: 1.1 (Page Container)

## 注意事项
- 步骤数量可配置
- 标题过长时省略
