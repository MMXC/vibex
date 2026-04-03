# Story 4.6: Error Handling

## 基本信息
| 字段 | 值 |
|------|-----|
| Epic | Epic-4: 图表区域 |
| Story | 4.6 |
| 优先级 | P1 |
| 预估工时 | 2h |

## 功能描述
实现图表区域的错误处理，包括网络错误、解析错误和超时错误。

## Task列表

### FE-4.6.1: 网络错误显示
**类型**: 前端
**描述**: 网络请求失败时显示错误
**验收标准**:
```javascript
expect(screen.getByTestId('error-state')).toBeVisible();
expect(screen.getByTestId('error-icon')).toContainHTML('error-icon');
```
**CSS规范**: 
- 错误图标: 红色
- 错误背景: 浅红色

### FE-4.6.2: 错误信息展示
**类型**: 前端
**描述**: 显示详细的错误信息
**验收标准**:
```javascript
expect(screen.getByTestId('error-message')).toHaveTextContent('网络连接失败');
```
**CSS规范**: 
- 错误文字: 红色
- 详细说明: 灰色

### FE-4.6.3: 重试按钮
**类型**: 前端
**描述**: 提供重试选项
**验收标准**:
```javascript
fireEvent.click(screen.getByTestId('retry-btn'));
expect(screen.getByTestId('loading-state')).toBeVisible();
```
**CSS规范**: 
- 重试按钮: 主按钮样式
- 位置: 错误区域底部

### FE-4.6.4: 超时错误处理
**类型**: 前端
**描述**: 请求超时时显示错误
**验收标准**:
```javascript
// 30秒超时
await waitForTimeout(31000);
expect(screen.getByTestId('error-message')).toContainText('超时');
```
**CSS规范**: 
- 超时提示: 友好文案
- 超时时间: 可配置

### TEST-4.6.1: 错误处理测试
**类型**: 测试
**描述**: 验证错误处理
**验收标准**:
```javascript
expect(screen.getByTestId('error-state')).toBeVisible();
expect(screen.getByTestId('retry-btn')).toBeInTheDocument();
```

## 依赖关系
- 前置Story: 4.3 (Mermaid Render)

## 注意事项
- 区分错误类型
- 错误日志上报
