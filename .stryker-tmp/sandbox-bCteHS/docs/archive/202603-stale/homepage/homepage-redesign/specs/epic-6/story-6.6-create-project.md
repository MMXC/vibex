# Story 6.6: Create Project

## 基本信息
| 字段 | 值 |
|------|-----|
| Epic | Epic-6: 需求输入区域 |
| Story | 6.6 |
| 优先级 | P0 |
| 预估工时 | 4h |

## 功能描述
实现创建项目功能，将AI生成结果保存为项目。

## Task列表

### FE-6.6.1: 创建按钮
**类型**: 前端
**描述**: 显示创建项目按钮
**验收标准**:
```javascript
expect(screen.getByTestId('create-project-btn')).toBeVisible();
```
**CSS规范**: 
- 按钮样式: 主按钮
- 文字: "创建项目"

### FE-6.6.2: 项目名称输入
**类型**: 前端
**描述**: 弹出项目名称输入框
**验收标准**:
```javascript
fireEvent.click(screen.getByTestId('create-project-btn'));
expect(screen.getByTestId('project-name-input')).toBeVisible();
```
**CSS规范**: 
- 模态框样式
- 默认名称: "新项目"

### FE-6.6.3: 项目创建提交
**类型**: 前端
**描述**: 提交创建项目
**验收标准**:
```javascript
fireEvent.click(screen.getByTestId('confirm-create-btn'));
expect(screen.getByTestId('success-toast')).toBeVisible();
```
**CSS规范**: 
- 成功提示样式
- 自动跳转项目页

### FE-6.6.4: 错误处理
**类型**: 前端
**描述**: 创建失败时显示错误
**验收标准**:
```javascript
expect(screen.getByTestId('error-message')).toHaveTextContent('创建失败');
```
**CSS规范**: 
- 错误提示样式
- 重试按钮

### TEST-6.6.1: 创建项目测试
**类型**: 测试
**描述**: 验证创建项目功能
**验收标准**:
```javascript
fireEvent.click(screen.getByTestId('create-project-btn'));
expect(screen.getByTestId('project-name-input')).toBeVisible();
```

## 依赖关系
- 前置Story: 6.5 (Regenerate)

## 注意事项
- 项目名称唯一性校验
- 防止重复提交
