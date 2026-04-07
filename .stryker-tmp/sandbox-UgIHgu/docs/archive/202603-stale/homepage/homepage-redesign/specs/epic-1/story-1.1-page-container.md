# Story 1.1: Page Container

## 基本信息
| 字段 | 值 |
|------|-----|
| Epic | Epic-1: 基础布局重构 |
| Story | 1.1 |
| 优先级 | P0 |
| 预估工时 | 4h |

## 功能描述
重构首页整体容器结构，建立统一的页面布局框架，包含最小宽度限制、高度管理和响应式容器定义。

## Task列表

### FE-1.1.1: 页面最小宽度设置
**类型**: 前端
**描述**: 为页面容器设置最小宽度限制，防止内容过度压缩
**验收标准**:
```javascript
expect(document.body.style.minWidth).toBe('320px');
expect(container.getBoundingClientRect().width).toBeGreaterThanOrEqual(320);
```
**CSS规范**: 
- `min-width: 320px` 应用于根容器
- 防止横向滚动条出现

### FE-1.1.2: 全屏高度管理
**类型**: 前端
**描述**: 确保页面容器占据完整视口高度
**验收标准**:
```javascript
expect(container.offsetHeight).toBe(window.innerHeight);
expect(container.getBoundingClientRect().top).toBe(0);
```
**CSS规范**: 
- `height: 100vh`
- `overflow: hidden` 防止意外滚动

### FE-1.1.3: 响应式容器
**类型**: 前端
**描述**: 定义不同断点下的容器宽度
**验收标准**:
```javascript
// 桌面端最大宽度
expect(container.style.maxWidth).toBe('1440px');
```
**CSS规范**: 
- `max-width: 1440px` 桌面端
- `padding: 0 24px` 移动端边距

### FE-1.1.4: 容器层级结构
**类型**: 前端
**描述**: 建立清晰的容器嵌套层级
**验收标准**:
```javascript
expect(container.querySelector('header')).not.toBeNull();
expect(container.querySelector('main')).not.toBeNull();
expect(container.querySelector('aside')).not.toBeNull();
```
**CSS规范**: 
- 语义化HTML结构
- Flexbox布局主轴

### TEST-1.1.1: 容器布局测试
**类型**: 测试
**描述**: 验证页面容器的尺寸和层级结构
**验收标准**:
```javascript
expect(screen.getByTestId('page-container')).toBeVisible();
expect(screen.getByTestId('page-container').tagName.toLowerCase()).toBe('div');
```

## 依赖关系
- 前置Story: 无

## 注意事项
- 需要兼容现有首页组件
- 保持向后兼容性
