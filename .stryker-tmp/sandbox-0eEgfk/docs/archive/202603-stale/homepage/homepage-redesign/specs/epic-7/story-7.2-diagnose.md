# Story 7.2: Smart Diagnose

## 基本信息
| 字段 | 值 |
|------|-----|
| Epic | Epic-7: AI对话助手 |
| Story | 7.2 |
| 优先级 | P1 |
| 预估工时 | 4h |

## 功能描述
实现智能诊断功能，自动分析用户需求并指出潜在问题。

## Task列表

### FE-7.2.1: 诊断触发
**类型**: 前端
**描述**: 自动或手动触发诊断
**验收标准**:
```javascript
expect(screen.getByTestId('diagnose-btn')).toBeVisible();
fireEvent.click(screen.getByTestId('diagnose-btn'));
```
**CSS规范**: 
- 诊断按钮: 图标按钮
- 位置: AI回复下方

### FE-7.2.2: 诊断结果显示
**类型**: 前端
**描述**: 显示诊断结果
**验收标准**:
```javascript
expect(screen.getByTestId('diagnosis-panel')).toBeVisible();
expect(screen.getAllByTestId(/^issue-/)).toHaveLength(2);
```
**CSS规范**: 
- 问题卡片样式
- 严重程度颜色

### FE-7.2.3: 问题详情
**类型**: 前端
**描述**: 显示每个问题的详情
**验收标准**:
```javascript
expect(screen.getByTestId('issue-1-title')).toHaveTextContent('需求模糊');
expect(screen.getByTestId('issue-1-suggestion')).toHaveTextContent('建议补充');
```
**CSS规范**: 
- 问题标题: 粗体
- 建议: 斜体

### FE-7.2.4: 快速修复
**类型**: 前端
**描述**: 提供快速修复选项
**验收标准**:
```javascript
fireEvent.click(screen.getByTestId('quick-fix-1-btn'));
expect(screen.getByTestId('input-value')).toContainText('已修复的内容');
```
**CSS规范**: 
- 快速修复按钮: 链接样式
- 确认提示

### TEST-7.2.1: 智能诊断测试
**类型**: 测试
**描述**: 验证诊断功能
**验收标准**:
```javascript
fireEvent.click(screen.getByTestId('diagnose-btn'));
expect(screen.getByTestId('diagnosis-panel')).toBeVisible();
```

## 依赖关系
- 前置Story: 7.1 (AI Ask)

## 注意事项
- 诊断基于规则引擎
- 支持自定义规则
