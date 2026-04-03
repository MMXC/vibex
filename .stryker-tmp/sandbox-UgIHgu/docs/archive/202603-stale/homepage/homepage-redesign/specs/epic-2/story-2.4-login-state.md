# Story 2.4: Login State

## 基本信息
| 字段 | 值 |
|------|-----|
| Epic | Epic-2: 导航栏组件 |
| Story | 2.4 |
| 优先级 | P0 |
| 预估工时 | 3h |

## 功能描述
实现登录后状态显示，包含用户头像、用户名和登出功能。

## Task列表

### FE-2.4.1: 登录状态显示
**类型**: 前端
**描述**: 显示用户头像和用户名
**验收标准**:
```javascript
expect(screen.getByTestId('user-avatar')).toBeVisible();
expect(screen.getByTestId('user-name')).toHaveTextContent('用户名');
```
**CSS规范**: 
- 头像: 32px圆形
- 用户名: `--font-size-sm`

### FE-2.4.2: 用户菜单
**类型**: 前端
**描述**: 点击头像展开用户菜单
**验收标准**:
```javascript
fireEvent.click(screen.getByTestId('user-avatar'));
expect(screen.getByTestId('user-menu')).toBeVisible();
```
**CSS规范**: 
- 菜单宽度: 180px
- 阴影: `--shadow-lg`

### FE-2.4.3: 登出功能
**类型**: 前端
**描述**: 用户菜单中的登出选项
**验收标准**:
```javascript
fireEvent.click(screen.getByTestId('logout-btn'));
expect(screen.getByTestId('login-btn')).toBeVisible();
```
**CSS规范**: 
- 登出按钮: 红色文字
- 确认对话框

### FE-2.4.4: 状态切换动画
**类型**: 前端
**描述**: 登录/登出状态切换动画
**验收标准**:
```javascript
expect(loginBtn).toHaveClass(/fade-enter/);
expect(userAvatar).toHaveClass(/fade-enter-active/);
```
**CSS规范**: 
- 动画时长: `--transition-normal`
- 淡入淡出效果

### TEST-2.4.1: 登录状态测试
**类型**: 测试
**描述**: 验证登录后状态
**验收标准**:
```javascript
expect(screen.getByTestId('user-avatar')).toBeInTheDocument();
expect(screen.getByTestId('user-menu')).not.toBeVisible();
```

## 依赖关系
- 前置Story: 2.3 (Login Button)

## 注意事项
- 用户信息从AuthContext获取
- 菜单关闭需点击外部区域
