# Story 2.1: Logo Component

## 基本信息
| 字段 | 值 |
|------|-----|
| Epic | Epic-2: 导航栏组件 |
| Story | 2.1 |
| 优先级 | P0 |
| 预估工时 | 2h |

## 功能描述
实现导航栏Logo组件，包含Logo显示和点击跳转功能。

## Task列表

### FE-2.1.1: Logo显示
**类型**: 前端
**描述**: 渲染Logo图片或SVG
**验收标准**:
```javascript
expect(screen.getByTestId('logo')).toBeVisible();
expect(screen.getByTestId('logo').tagName.toLowerCase()).toBe('a');
```
**CSS规范**: 
- 高度: 32px
- 宽度: auto
- 保持比例

### FE-2.1.2: Logo点击跳转
**类型**: 前端
**描述**: Logo点击跳转到首页
**验收标准**:
```javascript
const logoLink = screen.getByTestId('logo');
fireEvent.click(logoLink);
expect(window.location.pathname).toBe('/');
```
**CSS规范**: 
- `cursor: pointer`
- hover状态: opacity 0.8

### FE-2.1.3: Logo响应式
**类型**: 前端
**描述**: 移动端Logo自适应
**验收标准**:
```javascript
// 移动端隐藏文字，仅显示图标
expect(getComputedStyle(mobileLogo).display).toBe('block');
```
**CSS规范**: 
- 移动端: `height: 28px`
- 桌面端: `height: 32px`

### TEST-2.1.1: Logo组件测试
**类型**: 测试
**描述**: 验证Logo组件功能
**验收标准**:
```javascript
expect(screen.getByTestId('logo')).toBeInTheDocument();
expect(screen.getByTestId('logo')).toHaveAttribute('href', '/');
```

## 依赖关系
- 前置Story: 1.1 (Page Container)

## 注意事项
- Logo需支持深色/浅色主题
- 确保高对比度可访问性
