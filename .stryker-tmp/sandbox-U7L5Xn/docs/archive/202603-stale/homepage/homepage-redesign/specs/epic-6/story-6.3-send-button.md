# Story 6.3: Send Button

## 基本信息
| 字段 | 值 |
|------|-----|
| Epic | Epic-6: 需求输入区域 |
| Story | 6.3 |
| 优先级 | P0 |
| 预估工时 | 2h |

## 功能描述
实现发送按钮，包含状态控制和提交逻辑。

## Task列表

### FE-6.3.1: 发送按钮渲染
**类型**: 前端
**描述**: 渲染发送按钮
**验收标准**:
```javascript
expect(screen.getByTestId('send-btn')).toBeVisible();
expect(screen.getByTestId('send-btn')).toContainHTML('send-icon');
```
**CSS规范**: 
- 按钮样式: 圆形主按钮
- 图标: 发送箭头

### FE-6.3.2: 空内容禁用
**类型**: 前端
**描述**: 输入为空时禁用按钮
**验收标准**:
```javascript
expect(screen.getByTestId('send-btn')).toBeDisabled();
```
**CSS规范**: 
- 禁用态: `opacity: 0.5`
- 禁用态: `cursor: not-allowed`

### FE-6.3.3: 有内容启用
**类型**: 前端
**描述**: 输入内容后启用按钮
**验收标准**:
```javascript
fireEvent.input(screen.getByTestId('requirement-input'), { target: { value: '测试' } });
expect(screen.getByTestId('send-btn')).toBeEnabled();
```
**CSS规范**: 
- 启用态: `opacity: 1`

### FE-6.3.4: 发送中状态
**类型**: 前端
**描述**: 发送中显示加载状态
**验收标准**:
```javascript
fireEvent.click(screen.getByTestId('send-btn'));
expect(screen.getByTestId('send-btn')).toHaveClass(/loading/);
```
**CSS规范**: 
- 加载动画: 旋转图标
- 禁用其他交互

### FE-6.3.5: 发送完成重置
**类型**: 前端
**描述**: 发送完成后重置按钮
**验收标准**:
```javascript
await waitForLoadingComplete();
expect(screen.getByTestId('send-btn')).not.toHaveClass(/loading/);
```
**CSS规范**: 
- 重置动画: 恢复原状

### TEST-6.3.1: 发送按钮测试
**类型**: 测试
**描述**: 验证发送按钮功能
**验收标准**:
```javascript
expect(screen.getByTestId('send-btn')).toBeInTheDocument();
fireEvent.click(screen.getByTestId('send-btn'));
expect(screen.getByTestId('send-btn')).toHaveClass(/loading/);
```

## 依赖关系
- 前置Story: 6.2 (Requirement Input)

## 注意事项
- 支持 Enter 快捷键发送
- 支持 Shift+Enter 换行
