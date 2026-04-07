# Story 6.4: Save Draft

## 基本信息
| 字段 | 值 |
|------|-----|
| Epic | Epic-6: 需求输入区域 |
| Story | 6.4 |
| 优先级 | P2 |
| 预估工时 | 3h |

## 功能描述
实现草稿自动保存功能，防止输入内容丢失。

## Task列表

### FE-6.4.1: 自动保存触发
**类型**: 前端
**描述**: 输入停止后自动保存
**验收标准**:
```javascript
await waitForTimeout(2000);
expect(localStorage.setItem).toHaveBeenCalledWith('draft', expect.any(String));
```
**CSS规范**: 
- 保存延迟: 2s
- 防抖处理

### FE-6.4.2: 草稿恢复
**类型**: 前端
**描述**: 页面加载时恢复草稿
**验收标准**:
```javascript
expect(screen.getByTestId('requirement-input')).toHaveValue('已恢复的草稿内容');
```
**CSS规范**: 
- 恢复提示: 顶部toast

### FE-6.4.3: 草稿清除
**类型**: 前端
**描述**: 提交成功后清除草稿
**验收标准**:
```javascript
fireEvent.click(screen.getByTestId('send-btn'));
await waitForSuccess();
expect(localStorage.removeItem).toHaveBeenCalledWith('draft');
```
**CSS规范**: 
- 清除时机: 提交成功

### TEST-6.4.1: 草稿保存测试
**类型**: 测试
**描述**: 验证草稿保存功能
**验收标准**:
```javascript
expect(localStorage.setItem).toHaveBeenCalledWith('draft', expect.any(String));
```

## 依赖关系
- 前置Story: 6.3 (Send Button)

## 注意事项
- 使用防抖优化性能
- 本地存储容量限制
