# VibeX Sprint 48 架构设计

> **Date**: 2026-05-31
> **Author**: coord (heartbeat self-implement)
> **PRD**: `docs/vibex-proposals-sprint48/prd.md`

---

## 架构决策 1: Canvas List 持久化方案

### 问题
Sprint47 E4 的 `canvasListStore` 使用 Zustand 内存 store，刷新页面后数据丢失。缩略图每次渲染时重新生成，无缓存。

### 候选方案

| 方案 | 描述 | 优点 | 缺点 |
|------|------|------|------|
| A: Zustand persist (localStorage) | Zustand `persist` middleware 将整个 store 序列化到 localStorage | 零代码改造，改动最小 | localStorage 5MB 限制；缩略图 base64 占用空间大 |
| B: Zustand persist (IndexedDB) | 使用 `zustand/middleware` 的 IndexedDB adapter | 容量大（无限制）；结构化查询 | 需要额外库；复杂度略高 |
| C: 仅缓存缩略图 | store 保持内存，缩略图单独缓存到 IndexedDB | 平衡策略 | 两套持久化机制 |

### 决策
**方案 A + 缩略图优化**：Zustand `persist` middleware (localStorage) 足够，因为：
- 画布列表本身很小（每条记录 ~100 bytes）
- 缩略图 `canvas.toDataURL()` 生成 ~50KB per 画布
- 假设 50 个画布 → 2.5MB，在 localStorage 5MB 限制内
- 若超限，裁剪最旧缩略图（LRU cache）

### 风险
- localStorage 满 → 添加 try/catch，降级为无缩略图模式
- 多标签页并发写 localStorage → Zustand persist 已有 merge 策略

---

## 架构决策 2: PDF 导出技术选型

### 问题
需要将 Canvas DOM 导出为 PDF，支持多分辨率和批量导出。

### 候选方案

| 方案 | 描述 | 优点 | 缺点 |
|------|------|------|------|
| A: html2canvas + jsPDF | 将 Canvas DOM 转为图片，嵌入 jsPDF | 已有 jsPDF (Sprint43) 和 html2canvas 依赖 | Canvas 尺寸大时图片质量下降 |
| B: 原生 Canvas + jsPDF drawImage | 直接从 Canvas context 读取像素数据 | 精确控制分辨率 | 需要手动处理多页分页 |
| C: 第三方服务 (html2pdf.js) | 封装前两者的库 | 简单 | 引入新依赖 |

### 决策
**方案 A（html2canvas + jsPDF）**：现有依赖已安装，Sprint43 已使用 jsPDF 实现 PDF API route。实现步骤：
1. `html2canvas(canvasElement, { scale: 2 })` → canvas image
2. `canvas.toDataURL('image/png')` → base64 string
3. `new jsPDF({ orientation, unit: 'px', format: [width, height] })` → PDF document
4. `doc.addImage(imgData, 'PNG', 0, 0)` → 嵌入图片

### 风险
- Canvas 内容包含外部资源（图片）时，html2canvas 可能跨域限制 → 使用 `useCORS: true` 选项
- 大画布 PDF 文件体积大 → 限制最大分辨率 4096px，超限时等比缩放

---

## 架构决策 3: 快捷键可配置化数据模型

### 问题
Sprint47 E2 使用硬编码快捷键常量。需要可配置的 key binding 存储。

### 现有实现
`userPreferencesStore.ts` 已有 `shortcutCustomization: ShortcutCustomization[]`：
```typescript
export interface ShortcutCustomization {
  action: string
  keys: string[] // e.g., ['Meta', 'S']
}
```

### 决策
复用现有 `userPreferencesStore.shortcutCustomization`，无需新增 store 字段。

数据流向：
```
userPreferencesStore.shortcutCustomization[]
        ↓
useKeyboardShortcuts hook（读取 customizations，合并 defaults）
        ↓
ShortcutPanel UI（展示 + 编辑 bindings）
```

冲突检测：`shortcutCustomization` 内 key 重复 → 冲突警告

### 风险
- 快捷键优先级：自定义 > 默认值
- 冲突时保留旧绑定，显示警告，不自动解决

---

## 架构决策 4: AI Session 标签 + 收藏数据模型

### 问题
`agentStore` session schema 需扩展 `tags` 和 `isFavorite` 字段。

### 决策
直接扩展 `agentStore` 的 Session interface：
```typescript
interface AISession {
  id: string
  name: string
  searchableText: string
  tags: string[]         // 新增
  isFavorite: boolean    // 新增
  createdAt: number
  // ...existing fields
}
```

新增 actions：`toggleFavorite(sessionId)`, `addTag(sessionId, tag)`, `removeTag(sessionId, tag)`

### 风险
- IndexedDB session 存储：新增字段需迁移（IndexedDB 支持新增字段，Vibex 使用 D1/Cloudflare，不受影响）
- 标签去重：`addTag` 前检查 `includes`

---

## 架构决策 5: 剪贴板跨画布粘贴数据流

### 问题
`clipboardStore` 的 `pasteCards` 只作用于当前 canvas。需要支持指定目标 canvas。

### 决策
新增 `clipboardStore.crossCanvasPaste(targetCanvasId)`：
```typescript
crossCanvasPaste: (targetCanvasId) => {
  const cards = get().copiedCards
  // 获取目标 canvas store
  const targetStore = canvasStores[targetCanvasId] // Map<canvasId, canvasStore>
  targetStore.getState().addCards(cards)
}
```

跨 store 调用需通过 `canvasStores` registry map 注册各 canvas store 实例。

### 风险
- 循环依赖：clipboardStore ↔ canvasStore → 通过 registry map 解耦
- 目标 canvas 不存在 → 抛出 error，不静默失败

---

## 技术风险表

| ID | 风险 | 可能性 | 影响 | 缓解策略 |
|----|------|--------|------|---------|
| R1 | localStorage 满（缩略图缓存） | 低 | 中 | try/catch + LRU 降级 |
| R2 | html2canvas 跨域图片 | 中 | 低 | useCORS: true + fallback |
| R3 | 快捷键冲突覆盖 | 低 | 中 | 显示警告，保留旧绑定 |
| R4 | clipboard 跨 canvas store 引用 | 中 | 中 | registry map + 存在性检查 |
