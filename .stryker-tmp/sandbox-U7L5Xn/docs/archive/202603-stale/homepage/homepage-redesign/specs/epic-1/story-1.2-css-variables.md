# Story 1.2: CSS Variables

## 基本信息
| 字段 | 值 |
|------|-----|
| Epic | Epic-1: 基础布局重构 |
| Story | 1.2 |
| 优先级 | P0 |
| 预估工时 | 3h |

## 功能描述
建立统一的CSS变量系统，定义颜色、间距、字体等设计Token，确保样式一致性和主题切换能力。

## Task列表

### FE-1.2.1: 颜色变量定义
**类型**: 前端
**描述**: 定义主色、辅色、中性色等颜色变量
**验收标准**:
```javascript
expect(getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim()).toBe('#3B82F6');
expect(getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim()).toBe('#0F172A');
```
**CSS规范**: 
- `--color-primary: #3B82F6`
- `--color-secondary: #6366F1`
- `--color-bg: #0F172A`
- `--color-surface: #1E293B`
- `--color-text: #F8FAFC`
- `--color-text-muted: #94A3B8`

### FE-1.2.2: 间距变量定义
**类型**: 前端
**描述**: 定义间距系统变量
**验收标准**:
```javascript
expect(getComputedStyle(document.documentElement).getPropertyValue('--spacing-xs').trim()).toBe('4px');
expect(getComputedStyle(document.documentElement).getPropertyValue('--spacing-md').trim()).toBe('16px');
```
**CSS规范**: 
- `--spacing-xs: 4px`
- `--spacing-sm: 8px`
- `--spacing-md: 16px`
- `--spacing-lg: 24px`
- `--spacing-xl: 32px`
- `--spacing-2xl: 48px`

### FE-1.2.3: 字体变量定义
**类型**: 前端
**描述**: 定义字体相关变量
**验收标准**:
```javascript
expect(getComputedStyle(document.documentElement).getPropertyValue('--font-sans').trim()).toContain('system-ui');
expect(getComputedStyle(document.documentElement).getPropertyValue('--font-size-base').trim()).toBe('16px');
```
**CSS规范**: 
- `--font-sans: system-ui, -apple-system, sans-serif`
- `--font-size-base: 16px`
- `--font-size-sm: 14px`
- `--font-size-lg: 18px`
- `--font-weight-normal: 400`
- `--font-weight-medium: 500`
- `--font-weight-bold: 700`

### FE-1.2.4: 圆角与阴影变量
**类型**: 前端
**描述**: 定义圆角和阴影变量
**验收标准**:
```javascript
expect(getComputedStyle(document.documentElement).getPropertyValue('--radius-md').trim()).toBe('8px');
expect(getComputedStyle(document.documentElement).getPropertyValue('--shadow-lg').trim()).toContain('0 10px');
```
**CSS规范**: 
- `--radius-sm: 4px`
- `--radius-md: 8px`
- `--radius-lg: 12px`
- `--radius-full: 9999px`
- `--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.3)`
- `--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.4)`

### FE-1.2.5: 过渡动画变量
**类型**: 前端
**描述**: 定义过渡和动画相关变量
**验收标准**:
```javascript
expect(getComputedStyle(document.documentElement).getPropertyValue('--transition-fast').trim()).toBe('150ms');
expect(getComputedStyle(document.documentElement).getPropertyValue('--ease-out').trim()).toContain('cubic-bezier');
```
**CSS规范**: 
- `--transition-fast: 150ms`
- `--transition-normal: 250ms`
- `--transition-slow: 350ms`
- `--ease-out: cubic-bezier(0, 0, 0.2, 1)`
- `--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)`

### TEST-1.2.1: CSS变量测试
**类型**: 测试
**描述**: 验证CSS变量是否正确定义和应用
**验收标准**:
```javascript
const rootStyles = getComputedStyle(document.documentElement);
expect(rootStyles.getPropertyValue('--color-primary')).toBeTruthy();
expect(rootStyles.getPropertyValue('--spacing-md')).toBeTruthy();
```

## 依赖关系
- 前置Story: 1.1 (Page Container)

## 注意事项
- 变量命名遵循语义化原则
- 确保变量覆盖所有组件
