# Story 7.1: AI Ask

## 基本信息
| 字段 | 值 |
|------|-----|
| Epic | Epic-7: AI对话助手 |
| Story | 7.1 |
| 优先级 | P1 |
| 预估工时 | 3h |

## 功能描述
实现AI问答功能，支持用户提问和AI回复。

## Task列表

### FE-7.1.1: 问答输入框
**类型**: 前端
**描述**: 渲染AI问答输入框
**验收标准**:
```javascript
expect(screen.getByTestId('ai-question-input')).toBeVisible();
```
**CSS规范**: 
- 输入框样式: 圆角矩形
- 发送按钮: 右侧

### FE-7.1.2: 提问发送
**类型**: 前端
**描述**: 发送问题给AI
**验收标准**:
```javascript
fireEvent.input(screen.getByTestId('ai-question-input'), { target: { value: '什么是DDD?' } });
fireEvent.click(screen.getByTestId('ai-send-btn'));
expect(screen.getByTestId('question-bubble')).toHaveTextContent('什么是DDD?');
```
**CSS规范**: 
- 问题气泡: 右侧蓝色
- 回答气泡: 左侧灰色

### FE-7.1.3: AI回复显示
**类型**: 前端
**描述**: 显示AI回复内容
**验收标准**:
```javascript
await waitForResponse();
expect(screen.getByTestId('answer-bubble')).toBeVisible();
```
**CSS规范**: 
- 回复气泡: 左侧
- 打字机效果

### FE-7.1.4: 流式响应
**类型**: 前端
**描述**: 支持流式AI响应
**验收标准**:
```javascript
const answer = screen.getByTestId('answer-text');
expect(answer).toHaveTextContent(/正在思考/);
```
**CSS规范**: 
- 流式更新动画
- 加载指示

### TEST-7.1.1: AI问答测试
**类型**: 测试
**描述**: 验证AI问答功能
**验收标准**:
```javascript
fireEvent.click(screen.getByTestId('ai-send-btn'));
expect(screen.getByTestId('question-bubble')).toBeVisible();
```

## 依赖关系
- 前置Story: 6.3 (Send Button)

## 注意事项
- 支持Markdown渲染
- 消息长度限制
