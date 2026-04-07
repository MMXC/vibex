# Story 4.3: Mermaid Render

## 基本信息
| 字段 | 值 |
|------|-----|
| Epic | Epic-4: 图表区域 |
| Story | 4.3 |
| 优先级 | P0 |
| 预估工时 | 5h |

## 功能描述
实现Mermaid图表渲染，支持多种图表类型和主题配置。

## Task列表

### FE-4.3.1: Mermaid图表初始化
**类型**: 前端
**描述**: 初始化Mermaid渲染引擎
**验收标准**:
```javascript
expect(window.mermaid).toBeDefined();
expect(typeof window.mermaid.init).toBe('function');
```
**CSS规范**: 
- 主题: dark
- 字体: `--font-sans`

### FE-4.3.2: 图表代码解析
**类型**: 前端
**描述**: 解析Mermaid语法并渲染
**验收标准**:
```javascript
const svg = await mermaid.render('chart-id', 'graph TD\nA-->B');
expect(svg).toContain('<svg');
expect(svg).toContain('</svg>');
```
**CSS规范**: 
- SVG容器: 100%宽度
- 自动高度

### FE-4.3.3: 图表类型支持
**类型**: 前端
**描述**: 支持流程图、时序图等多种类型
**验收标准**:
```javascript
// 流程图
await mermaid.render('flow', 'graph TD\nA-->B');
// 时序图
await mermaid.render('sequence', 'sequenceDiagram\nA->>B: Hello');
```
**CSS规范**: 
- 支持: flowchart, sequenceDiagram, classDiagram, stateDiagram, erDiagram

### FE-4.3.4: 图表主题配置
**类型**: 前端
**描述**: 配置图表主题
**验收标准**:
```javascript
mermaid.initialize({ theme: 'dark', startOnLoad: false });
```
**CSS规范**: 
- 深色主题适配
- 与页面主题一致

### FE-4.3.5: 渲染错误处理
**类型**: 前端
**描述**: Mermaid语法错误时显示错误信息
**验收标准**:
```javascript
try {
  await mermaid.render('error', 'invalid syntax');
} catch (e) {
  expect(e.message).toContain('Parse error');
}
```
**CSS规范**: 
- 错误信息: 红色边框
- 显示原始代码

### TEST-4.3.1: Mermaid渲染测试
**类型**: 测试
**描述**: 验证Mermaid渲染功能
**验收标准**:
```javascript
const svg = await screen.getByTestId('mermaid-chart').innerHTML();
expect(svg).toContain('<svg');
```

### TEST-4.3.2: Mermaid错误测试
**类型**: 测试
**描述**: 验证Mermaid错误处理
**验收标准**:
```javascript
expect(screen.getByTestId('error-message')).toBeVisible();
```

## 依赖关系
- 前置Story: 4.2 (Loading State)

## 注意事项
- 大图表性能优化
- 支持图表缩放
