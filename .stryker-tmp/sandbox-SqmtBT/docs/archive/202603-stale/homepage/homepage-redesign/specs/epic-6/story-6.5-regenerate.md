# Story 6.5: Regenerate

## 基本信息
| 字段 | 值 |
|------|-----|
| Epic | Epic-6: 需求输入区域 |
| Story | 6.5 |
| 优先级 | P1 |
| 预估工时 | 2h |

## 功能描述
实现重新生成功能，基于相同输入重新生成结果。

## Task列表

### FE-6.5.1: 重新生成按钮
**类型**: 前端
**描述**: 显示重新生成按钮
**验收标准**:
```javascript
expect(screen.getByTestId('regenerate-btn')).toBeVisible();
```
**CSS规范**: 
- 按钮样式: 次要按钮
- 位置: 结果区域

### FE-6.5.2: 重新生成逻辑
**类型**: 前端
**描述**: 点击重新生成结果
**验收标准**:
```javascript
fireEvent.click(screen.getByTestId('regenerate-btn'));
expect(screen.getByTestId('loading-state')).toBeVisible();
```
**CSS规范**: 
- 使用相同输入
- 清空当前结果

### FE-6.5.3: 生成历史记录
**类型**: 前端
**描述**: 保存生成历史
**验收标准**```javascript
expect(screen.getByTestId('history-indicator')).toHaveTextContent('已生成 3 次');
```
**CSS规范**: 
- 历史计数显示
- 历史列表入口

### TEST-6.5.1: 重新生成测试
**类型**: 测试
**描述**: 验证重新生成功能
**验收标准**:
```javascript
fireEvent.click(screen.getByTestId('regenerate-btn'));
expect(screen.getByTestId('loading-state')).toBeVisible();
```

## 依赖关系
- 前置Story: 6.3 (Send Button)

## 注意事项
- 限制重新生成次数
- 显示剩余次数
