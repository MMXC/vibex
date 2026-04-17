# Spec: E5 — 默认组件验证

**对应 Epic**: E5 默认组件验证
**文件**: `vibex-fronted/src/lib/prototypes/ui-schema.ts`
**相关**: `vibex-fronted/src/components/prototype/ComponentPanel.tsx`

---

## DEFAULT_COMPONENTS 规格

### 10 个组件列表

| 组件名 | name | 类型标识 | defaultProps 示例 |
|--------|------|---------|-----------------|
| Button | Button | button | `{ text: 'Button', variant: 'primary', color: 'blue' }` |
| Input | Input | input | `{ placeholder: 'Enter text...', type: 'text' }` |
| Card | Card | card | `{ title: 'Card Title', content: '' }` |
| Container | Container | container | `{ children: 'Container' }` |
| Header | Header | header | `{ title: 'Header', subtitle: '' }` |
| Navigation | Navigation | navigation | `{ links: [], type: 'horizontal' }` |
| Modal | Modal | modal | `{ title: 'Modal', children: '', open: false }` |
| Table | Table | table | `{ columns: [], rows: [] }` |
| Form | Form | form | `{ fields: [], submitLabel: 'Submit' }` |
| Image | Image | image | `{ src: '', alt: 'image', width: 200 }` |

### 字段完整性（每项必须包含）

```typescript
interface ComponentDefinition {
  id: string          // 唯一标识
  name: string        // 显示名称
  type: string       // 组件类型标识
  description: string // 简短描述
  render: (props: Record<string, unknown>) => JSX.Element  // 渲染函数
  defaultProps: Record<string, unknown>  // 默认属性
  alternatives: string[]  // 替代方案列表
  category: 'basic' | 'layout' | 'form' | 'data-display' | 'feedback'  // 分类
}
```

---

## 验收标准

```typescript
// E5-U1.1: 数量验证
expect(DEFAULT_COMPONENTS).toHaveLength(10)

// E5-U1.2: 名称完整性
const expectedNames = ['Button', 'Input', 'Card', 'Container', 'Header', 'Navigation', 'Modal', 'Table', 'Form', 'Image']
DEFAULT_COMPONENTS.forEach((comp, i) => {
  expect(comp.name).toBe(expectedNames[i])
  expect(comp.id).toBeTruthy()
  expect(comp.type).toBeTruthy()
  expect(comp.description).toBeTruthy()
  expect(typeof comp.render).toBe('function')
  expect(comp.defaultProps).toBeDefined()
  expect(Array.isArray(comp.alternatives)).toBe(true)
  expect(['basic', 'layout', 'form', 'data-display', 'feedback']).toContain(comp.category)
})

// E5-U1.3: render 函数可调用
DEFAULT_COMPONENTS.forEach(comp => {
  expect(() => comp.render(comp.defaultProps)).not.toThrow()
})

// E5-U1.4: ComponentPanel 对应关系
expect(ComponentPanel.COMPONENT_DEFS.map(c => c.name)).toEqual(expectedNames)
```

---

## UI 状态（ComponentPanel 组件卡片）

### 理想态（Ideal）
- 10 个卡片整齐排列
- 显示组件名称 + 分类 badge
- 拖拽时高亮

### 空状态（Empty）
- 不会发生（10 个默认组件固定存在）
- 防御：若为空显示错误引导

### 加载态（Loading）
- 骨架屏占位（10 个灰色块）

### 错误态（Error）
- 组件定义异常：显示错误卡片 + 文案

---

## 样式约束

- 间距：8 的倍数
- 颜色：使用 Token
- 禁止硬编码
- 卡片间距：`var(--space-2)`
