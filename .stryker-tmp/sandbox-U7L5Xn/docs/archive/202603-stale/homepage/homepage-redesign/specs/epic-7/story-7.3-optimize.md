# Story 7.3: Optimize

## 基本信息
| 字段 | 值 |
|------|-----|
| Epic | Epic-7: AI对话助手 |
| Story | 7.3 |
| 优先级 | P2 |
| 预估工时 | 3h |

## 功能描述
实现AI优化建议功能，提供需求优化建议。

## Task列表

### FE-7.3.1: 优化建议入口
**类型**: 前端
**描述**: 显示优化建议按钮
**验收标准**:
```javascript
expect(screen.getByTestId('optimize-btn')).toBeVisible();
```
**CSS规范**: 
- 按钮样式: 次要按钮
- 图标: 灯泡

### FE-7.3.2: 优化内容生成
**类型**: 前端
**描述**: 生成优化建议
**验收标准**:
```javascript
fireEvent.click(screen.getByTestId('optimize-btn'));
expect(screen.getByTestId('optimize-suggestion')).toBeVisible();
```
**CSS规范**: 
- 建议内容: Markdown格式
- 分点列出

### FE-7.3.3: 一键应用
**类型**: 前端
**描述**: 一键应用优化建议
**验收标准**:
```javascript
fireEvent.click(screen.getByTestId('apply-optimize-btn'));
expect(screen.getByTestId('input')).toHaveValue(expect.stringContaining('优化后'));
```
**CSS规范**: 
- 应用按钮: 主按钮
- 取消按钮: 次要

### TEST-7.3.1: 优化功能测试
**类型**: 测试
**描述**: 验证优化功能
**验收标准**:
```javascript
fireEvent.click(screen.getByTestId('optimize-btn'));
expect(screen.getByTestId('optimize-suggestion')).toBeVisible();
```

## 依赖关系
- 前置Story: 7.1 (AI Ask)

## 注意事项
- 优化基于上下文
- 支持部分应用
