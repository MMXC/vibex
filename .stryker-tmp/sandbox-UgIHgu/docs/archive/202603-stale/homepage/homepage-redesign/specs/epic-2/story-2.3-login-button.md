# Story 2.3: Login Button

## 基本信息
| 字段 | 值 |
|------|-----|
| Epic | Epic-2: 导航栏组件 |
| Story | 2.3 |
| 优先级 | P0 |
| 预估工时 | 2h |

## 功能描述
实现登录按钮组件，包含按钮样式、点击事件和加载状态。

## Task列表

### FE-2.3.1: 登录按钮渲染
**类型**: 前端
**描述**: 渲染登录按钮
**验收标准**:
```javascript
expect(screen.getByTestId('login-btn')).toBeVisible();
expect(screen.getByText('登录')).toBeInTheDocument();
```
**CSS规范**: 
- 背景色: `var(--color-primary)`
- 圆角: `--radius-md`
- padding: `8px 16px`

### FE-2.3.2: 按钮点击事件
**类型**: 前端
**描述**: 点击打开登录抽屉
**验收标准**:
```javascript
fireEvent.click(screen.getByTestId('login-btn'));
expect(screen.getByTestId('login-drawer')).toHaveClass(/open/);
```
**CSS规范**: 
- `cursor: pointer`
- hover: 背景色加深10%

### FE-2.3.3: 按钮禁用状态
**类型**: 前端
**描述**: 加载中禁用按钮
**验收标准**:
```javascript
fireEvent.click(screen.getByTestId('login-btn'));
expect(screen.getByTestId('login-btn')).toBeDisabled();
```
**CSS规范**: 
- 禁用: `opacity: 0.6`
- 禁用: `cursor: not-allowed`

### TEST-2.3.1: 登录按钮测试
**类型**: 测试
**描述**: 验证登录按钮功能
**验收标准**:
```javascript
expect(screen.getByTestId('login-btn')).toBeInTheDocument();
fireEvent.click(screen.getByTestId('login-btn'));
expect(screen.getByTestId('login-drawer')).toBeVisible();
```

## 依赖关系
- 前置Story: 2.2 (Nav Links)

## 注意事项
- 按钮文本可配置
- 保持与其他按钮样式一致
