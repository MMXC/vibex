# Story 1.3: Drawer Z-Index

## 基本信息
| 字段 | 值 |
|------|-----|
| Epic | Epic-1: 基础布局重构 |
| Story | 1.3 |
| 优先级 | P1 |
| 预估工时 | 2h |

## 功能描述
建立z-index层级系统，确保抽屉组件、浮层、弹窗等元素的正确层叠顺序，避免视觉遮挡问题。

## Task列表

### FE-1.3.1: Z-Index层级定义
**类型**: 前端
**描述**: 定义各层级的z-index值
**验收标准**:
```javascript
expect(getComputedStyle(document.documentElement).getPropertyValue('--z-base').trim()).toBe('1');
expect(getComputedStyle(document.documentElement).getPropertyValue('--z-dropdown').trim()).toBe('100');
```
**CSS规范**: 
- `--z-base: 1`
- `--z-dropdown: 100`
- `--z-sticky: 200`
- `--z-drawer: 300`
- `--z-modal: 400`
- `--z-popover: 500`
- `--z-tooltip: 600`
- `--z-toast: 700`

### FE-1.3.2: 抽屉组件z-index
**类型**: 前端
**描述**: 为抽屉组件设置正确的z-index
**验收标准**:
```javascript
expect(drawer.style.zIndex).toBe('300');
expect(drawer.getComputedZIndex()).toBeGreaterThanOrEqual(300);
```
**CSS规范**: 
- 登录抽屉: `z-index: 300`
- 使用 `--z-drawer` 变量

### FE-1.3.3: 浮层元素z-index
**类型**: 前端
**描述**: 为浮层类组件设置正确的z-index
**验收标准**:
```javascript
expect(tooltip.style.zIndex).toBe('600');
expect(popover.style.zIndex).toBe('500');
```
**CSS规范**: 
- Tooltip: `z-index: 600`
- Popover: `z-index: 500`

### FE-1.3.4: 遮罩层管理
**类型**: 前端
**描述**: 抽屉打开时的遮罩层管理
**验收标准**:
```javascript
expect(overlay.style.zIndex).toBe('299');
expect(overlay.style.opacity).toBe('0.5');
```
**CSS规范**: 
- 遮罩层z-index: `--z-drawer - 1`
- 背景色: `rgba(0, 0, 0, 0.5)`

### TEST-1.3.1: Z-Index层级测试
**类型**: 测试
**描述**: 验证各组件的z-index值
**验收标准**:
```javascript
expect(screen.getByTestId('drawer').style.zIndex).toBe('300');
expect(screen.getByTestId('overlay').style.zIndex).toBe('299');
```

## 依赖关系
- 前置Story: 1.2 (CSS Variables)

## 注意事项
- 确保层级不会相互冲突
- 预留扩展空间
