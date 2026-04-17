# Spec: E4 — 导出与 Round-trip

**对应 Epic**: E4 导出与 Round-trip
**文件**: `vibex-fronted/src/stores/prototypeStore.ts`
**相关**: `vibex-fronted/src/components/prototype/ProtoEditor.tsx` (inline Export Modal)

---

## Export Modal（ProtoEditor 内置）

### 理想态（Ideal）
- 点击 Export 按钮 → 弹出 Modal
- Modal 显示导出 JSON 预览（语法高亮）
- 有 "复制到剪贴板" 和 "下载 JSON" 两个操作按钮
- 复制成功显示 toast "已复制到剪贴板"

### 空状态（Empty）
- 画布为空时仍可导出（空数组）
- Modal 显示空 JSON `{}` 预览

### 加载态（Loading）
- 导出大文件时显示骨架屏 JSON
- 禁止使用转圈

### 错误态（Error）
- 导出失败：Modal 显示错误文案 + 重试按钮
- 至少覆盖：网络异常/数据超长/浏览器限制

---

## Round-trip 测试规格（prototypeStore.test.ts）

### 测试场景

```typescript
// E4-U2.1: 正常 round-trip
test('E4-U2.1: export → loadFromExport → re-export → nodes 全等', () => {
  const store = create()
  // 添加节点
  store.getState().addNode(mockNode)
  const exported = store.getState().getExportData()
  
  const freshStore = create()
  freshStore.getState().loadFromExport(exported)
  const reExported = freshStore.getState().getExportData()
  
  expect(reExported.nodes).toEqual(exported.nodes)
})

// E4-U2.2: round-trip → pages 全等
test('E4-U2.2: export → loadFromExport → re-export → pages 全等', () => {
  // 同上，验证 pages 数组
  expect(reExported.pages).toEqual(exported.pages)
})

// E4-U2.3: round-trip → mockDataBindings 全等
test('E4-U2.3: export → loadFromExport → re-export → mockDataBindings 全等', () => {
  // 绑定 mock 数据后验证
  expect(reExported.mockDataBindings).toEqual(exported.mockDataBindings)
})

// E4-U2.4: 无效 version 忽略
test('E4-U2.4: loadFromExport 忽略无效 version', () => {
  const freshStore = create()
  freshStore.getState().loadFromExport({ version: '99.0', nodes: [], edges: [], pages: [], mockDataBindings: [] })
  // store 状态不变
  expect(freshStore.getState().nodes).toHaveLength(0)
})

// E4-U2.5: 空数据 round-trip
test('E4-U2.5: 空数组 round-trip', () => {
  const emptyExport = { version: '2.0', nodes: [], edges: [], pages: [], mockDataBindings: [] }
  const freshStore = create()
  freshStore.getState().loadFromExport(emptyExport)
  const reExported = freshStore.getState().getExportData()
  expect(reExported.nodes).toEqual([])
  expect(reExported.pages).toEqual([])
})
```

---

## PrototypeExportV2 接口

```typescript
interface PrototypeExportV2 {
  version: '2.0'          // 必须为 '2.0'
  nodes: ProtoNode[]      // 节点数组
  edges: Edge[]          // 连线数组
  pages: ProtoPage[]     // 页面数组
  mockDataBindings: Array<{
    nodeId: string
    data: Record<string, unknown>
  }>
}
```

---

## PrototypeExporter.tsx（废弃标记）

- 文件存在于 `vibex-fronted/src/components/prototype/PrototypeExporter.tsx`（575行）
- **未在 ProtoEditor 中被引用**（ProtoEditor 使用 inline Export Modal）
- 决策：标记为废弃，不接入本期，记录在 changelog
- 如后续需要原型预览页，可考虑复用此组件
