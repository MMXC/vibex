# Story 10.4: Error Reconnect

## 基本信息
| 字段 | 值 |
|------|-----|
| Epic | Epic-10: 状态管理 |
| Story | 10.4 |
| 优先级 | P1 |
| 预估工时 | 3h |

## 功能描述
实现错误重连机制，保证连接稳定性。

## Task列表

### FE-10.4.1: 断开检测
**类型**: 前端
**描述**: 检测连接断开
**验收标准**:
```javascript
expect(screen.getByTestId('connection-status')).toHaveClass(/disconnected/);
```
**CSS规范**: 
- 断开提示
- 状态颜色: 红色

### FE-10.4.2: 自动重连
**类型**: 前端
**描述**: 自动尝试重连
**验收标准**:
```javascript
// 指数退避重连
expect(reconnectAttempts).toBe(3);
```
**CSS规范**: 
- 重连间隔: 1s, 2s, 4s, 8s...
- 最大重试: 10次

### FE-10.4.3: 手动重连
**类型**: 前端
**描述**: 提供手动重连按钮
**验收标准**:
```javascript
fireEvent.click(screen.getByTestId('reconnect-btn'));
expect(screen.getByTestId('connection-status')).toHaveClass(/connecting/);
```
**CSS规范**: 
- 按钮样式
- 加载状态

### FE-10.4.4: 重连失败
**类型**: 前端
**描述**: 显示重连失败提示
**验收标准**:
```javascript
expect(screen.getByTestId('error-toast')).toContainText('连接失败');
```
**CSS规范**: 
- 错误提示样式
- 重试建议

### TEST-10.4.1: 重连机制测试
**类型**: 测试
**描述**: 验证重连功能
**验收标准**:
```javascript
expect(screen.getByTestId('reconnect-btn')).toBeInTheDocument();
```

## 依赖关系
- 前置Story: 10.3 (SSE Connect)

## 注意事项
- 重连上限
- 用户通知
