# VibeX Sprint 83 — 架构设计

> **Date**: 2026-06-09
> **Sprint**: 83

---

## 一、整体架构

Sprint 83 保持现有架构不变，新增功能以内联方式集成到现有模块中。

---

## 二、P001 画布版本历史时间轴

### 2.1 新增文件

| 文件 | 描述 |
|------|------|
| `vibex-fronted/src/components/canvas/VersionTimeline.tsx` | 时间轴主组件 |
| `vibex-fronted/src/components/canvas/VersionTimeline.module.css` | 样式 |
| `vibex-fronted/src/hooks/useCanvasTimeline.ts` | 时间轴数据 hook |
| `vibex-fronted/src/stores/canvasTimelineStore.ts` | 时间轴状态 store |

### 2.2 接口

```typescript
interface TimelineNode {
  id: string
  type: 'create' | 'merge' | 'commit'
  branchId: string
  timestamp: number
  label: string
}
```

### 2.3 数据源
使用 `canvasHistoryStore.ts` 现有数据，无需新 API。

---

## 三、P002 导入链接画布

### 3.1 路由变更

```typescript
// app/canvas/[id]/page.tsx
// 检测 searchParams.importToken:
//   - 有 token → 调用 /api/canvas/import-from-share
//   - 无 token → 正常加载画布
```

### 3.2 新增 API

| Method | Endpoint | 描述 |
|--------|----------|------|
| GET | `/api/canvas/import-from-share?token=<shareToken>` | 获取分享画布数据 |

---

## 四、P003 协作者冲突确认反馈

### 4.1 变更文件

| 文件 | 变更 |
|------|------|
| `wsCollabHandler.ts` | resolveConflict 后 dispatch 事件 |
| `DDSCanvasPage.tsx` | 监听事件 → Toast 通知 |

### 4.2 事件类型

```typescript
interface AutoResolveEvent {
  type: 'auto-resolve'
  branchId: string
  strategy: 'keep-mine' | 'keep-theirs' | 'auto-merge'
  resolvedAt: number
}
```

---

## 五、P004 模板标签系统

### 5.1 数据模型

```typescript
// canvasTemplate 类型扩展
interface CanvasTemplate {
  tags?: string[]
  category?: string
}
```

### 5.2 新增文件

| 文件 | 描述 |
|------|------|
| `vibex-fronted/src/components/template/TagFilter.tsx` | 标签筛选组件 |
| `vibex-fronted/src/stores/templateFilterStore.ts` | 筛选状态 |

---

## 六、P005 批量导出 ZIP

### 6.1 新增 API

| Method | Endpoint | 描述 |
|--------|----------|------|
| POST | `/api/canvas/export-batch` | 批量导出（返回 ZIP URL） |

### 6.2 请求/响应

```typescript
// Request
{ canvasIds: string[] }

// Response
{ downloadUrl: string, expiresAt: number }
```

---

## 七、性能影响

| 功能 | 性能影响 | 评估 |
|------|----------|------|
| P001 时间轴 | 渲染 100+ 节点 | 虚拟滚动，低影响 |
| P002 导入链接 | 一次额外 API 调用 | 低 |
| P003 冲突反馈 | WS 事件 → Toast | 极低 |
| P004 标签筛选 | 本地 filter | 极低 |
| P005 批量导出 | 后端 ZIP 生成 | 中（异步） |
