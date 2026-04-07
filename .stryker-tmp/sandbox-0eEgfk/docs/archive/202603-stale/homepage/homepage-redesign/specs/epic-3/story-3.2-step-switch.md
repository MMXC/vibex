# Story 3.2: Step Switch

## 基本信息
| 字段 | 值 |
|------|-----|
| Epic | Epic-3: Step步骤条组件 |
| Story | 3.2 |
| 优先级 | P1 |
| 预估工时 | 3h |

## 功能描述
实现步骤切换功能，支持点击切换和进度控制。

## Task列表

### FE-3.2.1: 点击切换步骤
**类型**: 前端
**描述**: 点击步骤项切换内容
**验收标准**:
```javascript
fireEvent.click(screen.getByTestId('step-item-2'));
expect(screen.getByTestId('step-content-2')).toBeVisible();
```
**CSS规范**: 
- 点击区域: 整个步骤项
- hover效果: 背景色变化

### FE-3.2.2: 前进后退切换
**类型**: 前端
**描述**: 支持下一步/上一步按钮
**验收标准**:
```javascript
fireEvent.click(screen.getByTestId('next-btn'));
expect(screen.getByTestId('step-item-2')).toHaveClass(/active/);
```
**CSS规范**: 
- 按钮样式: `--radius-md`
- 禁用态: `opacity: 0.5`

### FE-3.2.3: 步骤进度限制
**类型**: 前端
**描述**: 未完成步骤不可跳越
**验收标准**:
```javascript
// 当前在步骤1，步骤3应禁用
expect(screen.getByTestId('step-item-3')).toHaveClass(/disabled/);
```
**CSS规范**: 
- 禁用态: `cursor: not-allowed`
- 禁用态: `opacity: 0.5`

### FE-3.2.4: 切换动画
**类型**: 前端
**描述**: 步骤切换动画效果
**验收标准**:
```javascript
fireEvent.click(screen.getByTestId('next-btn'));
expect(screen.getByTestId('step-content-2')).toHaveClass(/slide-enter/);
```
**CSS规范**: 
- 动画: 滑动效果
- 时长: `--transition-normal`

### TEST-3.2.1: 步骤切换测试
**类型**: 测试
**描述**: 验证步骤切换功能
**验收标准**:
```javascript
fireEvent.click(screen.getByTestId('step-item-2'));
expect(screen.getByTestId('step-content-2')).toBeVisible();
```

## 依赖关系
- 前置Story: 3.1 (Step List)

## 注意事项
- 记录当前步骤索引
- 支持键盘导航
