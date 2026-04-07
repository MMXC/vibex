# Story 6.2: Requirement Input

## 基本信息
| 字段 | 值 |
|------|-----|
| Epic | Epic-6: 需求输入区域 |
| Story | 6.2 |
| 优先级 | P0 |
| 预估工时 | 3h |

## 功能描述
实现需求输入文本框，支持多行文本输入和字数限制。

## Task列表

### FE-6.2.1: 文本框渲染
**类型**: 前端
**描述**: 渲染需求输入框
**验收标准**:
```javascript
expect(screen.getByTestId('requirement-input')).toBeVisible();
expect(screen.getByTestId('requirement-input').tagName).toBe('TEXTAREA');
```
**CSS规范**: 
- 宽度: 100%
- 最小高度: 120px
- 自动增高

### FE-6.2.2: 占位符文字
**类型**: 前端
**描述**: 显示输入提示
**验收标准**:
```javascript
expect(screen.getByTestId('requirement-input')).toHaveAttribute('placeholder', '请输入您的需求...');
```
**CSS规范**: 
- 占位符颜色: `var(--color-text-muted)`

### FE-6.2.3: 字数限制
**类型**: 前端
**描述**: 显示字数统计
**验收标准**:
```javascript
expect(screen.getByTestId('char-count')).toHaveTextContent('0/2000');
```
**CSS规范**: 
- 超出限制: 红色文字
- 位置: 右下角

### FE-6.2.4: 实时字数更新
**类型**: 前端
**描述**: 输入时实时更新字数
**验收标准**:
```javascript
fireEvent.input(screen.getByTestId('requirement-input'), { target: { value: '测试' } });
expect(screen.getByTestId('char-count')).toHaveTextContent('2/2000');
```
**CSS规范**: 
- 更新延迟: 无

### TEST-6.2.1: 需求输入测试
**类型**: 测试
**描述**: 验证输入功能
**验收标准**:
```javascript
expect(screen.getByTestId('requirement-input')).toBeInTheDocument();
```

## 依赖关系
- 前置Story: 6.1 (Collapse Handle)

## 注意事项
- 支持粘贴图片
- 支持 Markdown 预览
