# Story 2.2: Nav Links

## 基本信息
| 字段 | 值 |
|------|-----|
| Epic | Epic-2: 导航栏组件 |
| Story | 2.2 |
| 优先级 | P0 |
| 预估工时 | 3h |

## 功能描述
实现导航栏链接组件，包含导航菜单项、当前状态高亮和移动端菜单。

## Task列表

### FE-2.2.1: 导航菜单项渲染
**类型**: 前端
**描述**: 渲染导航栏菜单项列表
**验收标准**:
```javascript
expect(screen.getAllByTestId(/^nav-link-/)).toHaveLength(4);
expect(screen.getByText('首页')).toBeVisible();
```
**CSS规范**: 
- 间距: `--spacing-lg` between items
- 字体大小: `--font-size-base`

### FE-2.2.2: 当前页面高亮
**类型**: 前端
**描述**: 当前页面链接高亮显示
**验收标准**:
```javascript
const activeLink = screen.getByTestId('nav-link-home');
expect(activeLink).toHaveClass(/active/);
expect(getComputedStyle(activeLink).color).toBe('rgb(59, 130, 246)');
```
**CSS规范**: 
- 激活态: `color: var(--color-primary)`
- 下划线: `border-bottom: 2px solid var(--color-primary)`

### FE-2.2.3: 链接悬停效果
**类型**: 前端
**描述**: 链接悬停时的视觉反馈
**验收标准**:
```javascript
fireEvent.mouseEnter(screen.getByTestId('nav-link-home'));
expect(screen.getByTestId('nav-link-home')).toHaveStyle({ color: 'var(--color-primary)' });
```
**CSS规范**: 
- hover: `color: var(--color-primary)`
- 过渡: `--transition-fast`

### FE-2.2.4: 链接点击跳转
**类型**: 前端
**描述**: 导航链接正确跳转
**验收标准**:
```javascript
fireEvent.click(screen.getByTestId('nav-link-domain'));
expect(window.location.pathname).toBe('/domain');
```
**CSS规范**: 
- `cursor: pointer`
- 禁用未登录用户的付费功能链接

### FE-2.2.5: 移动端导航菜单
**类型**: 前端
**描述**: 移动端显示汉堡菜单
**验收标准**:
```javascript
expect(screen.getByTestId('mobile-menu-btn')).toBeVisible();
expect(screen.getByTestId('mobile-nav')).toHaveClass(/hidden/);
```
**CSS规范**: 
- 断点: 768px
- 移动端菜单: 全屏覆盖

### TEST-2.2.1: 导航链接测试
**类型**: 测试
**描述**: 验证导航链接功能
**验收标准**:
```javascript
expect(screen.getByTestId('nav-link-home')).toBeInTheDocument();
expect(screen.getByTestId('mobile-menu-btn')).toBeInTheDocument();
```

## 依赖关系
- 前置Story: 2.1 (Logo)

## 注意事项
- 确保所有路由正确映射
- 无障碍: 键盘导航支持
