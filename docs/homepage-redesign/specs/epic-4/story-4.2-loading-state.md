# Story 4.2: Loading State

## 基本信息
| 字段 | 值 |
|------|-----|
| Epic | Epic-4: 图表区域 |
| Story | 4.2 |
| 优先级 | P1 |
| 预估工时 | 2h |

## 功能描述
实现图表加载状态，包含骨架屏和加载动画。

## Task列表

### FE-4.2.1: 骨架屏显示
**类型**: 前端
**描述**: 显示骨架屏占位
**验收标准**:
```javascript
expect(screen.getByTestId('chart-skeleton')).toBeVisible();
expect(screen.getByTestId('skeleton-line').length).toBeGreaterThan(0);
```
**CSS规范**: 
- 骨架色: `var(--color-surface)`
- 动画: 脉冲效果

### FE-4.2.2: 加载动画
**类型**: 前端
**描述**: 显示加载动画
**验收标准**:
```javascript
expect(screen.getByTestId('loading-spinner')).toBeVisible();
```
**CSS规范**: 
- 旋转动画: 1s一圈
- 颜色: `var(--color-primary)`

### FE-4.2.3: 加载文案
**类型**: 前端
**描述**: 显示加载状态文字
**验收标准**:
```javascript
expect(screen.getByTestId('loading-text')).toHaveTextContent('加载中...');
```
**CSS规范**: 
- 字体大小: `--font-size-sm`
- 颜色: `var(--color-text-muted)`

### FE-4.2.4: 加载进度
**类型**: 前端
**描述**: 显示加载进度（可选）
**验收标准**:
```javascript
expect(screen.getByTestId('progress-bar')).toBeVisible();
expect(screen.getByTestId('progress-text')).toHaveTextContent('50%');
```
**CSS规范**: 
- 进度条高度: 4px
- 颜色: `var(--color-primary)`

### TEST-4.2.1: 加载状态测试
**类型**: 测试
**描述**: 验证加载状态显示
**验收标准**:
```javascript
expect(screen.getByTestId('loading-state')).toBeInTheDocument();
expect(screen.getByTestId('skeleton-line')).toBeVisible();
```

## 依赖关系
- 前置Story: 4.1 (Empty State)

## 注意事项
- 加载超时处理（30s）
- 防止重复触发加载
