# json-render 集成分析文档

> **文档目标**: 为 VibeX Canvas 的 json-render 集成提供完整的用法索引、架构分析和改进建议
> **基于**: [json-render.dev](https://json-render.dev) 官方文档
> **版本**: 2026-04-14
> **前置条件**: 已安装 `@json-render/react`, `@json-render/core`

---

## 索引

1. [核心概念](#1-核心概念)
2. [三层架构速查](#2-三层架构速查)
3. [Catalog 定义](#3-catalog-定义)
4. [Registry 实现](#4-registry-实现)
5. [Spec 格式](#5-spec-格式)
6. [Renderer 使用](#6-renderer-使用)
7. [数据绑定与表达式](#7-数据绑定与表达式)
8. [Streaming 模式](#8-streaming-模式)
9. [VibeX 现状分析](#9-vibex-现状分析)
10. [当前问题与改进方向](#10-当前问题与改进方向)
11. [参考资料](#11-参考资料)

---

## 1. 核心概念

json-render 是一个**生成式 UI 框架**，核心思想是：

```
Catalog（词汇表）  →  定义 AI 可以生成什么组件
         ↓
Spec（规格说明）   →  AI 生成的 JSON 描述
         ↓
Registry（注册表） →  组件的 React 实现
         ↓
Renderer（渲染器） →  将 Spec 渲染为真实 UI
```

关键文档：
- [Introduction](https://json-render.dev/docs/introduction)
- [Quick Start](https://json-render.dev/docs/quick-start)

---

## 2. 三层架构速查

### 2.1 Catalog — 定义词汇表（Guardrail）

```typescript
import { defineCatalog } from '@json-render/core';
import { schema } from '@json-render/react/schema';
import { z } from 'zod';

const catalog = defineCatalog(schema, {
  components: {
    Card: {
      props: z.object({ title: z.string(), description: z.string().nullable() }),
      slots: ["default"],       // 可包含子组件
      description: "卡片容器",
    },
    Button: {
      props: z.object({ label: z.string(), action: z.string().nullable() }),
      description: "可点击按钮",
    },
  },
  actions: {
    submit: { params: z.object({ formId: z.string() }), description: "提交表单" },
  },
});
```

关键点：
- `slots` 数组声明组件可以接收哪些子组件（用于 children 验证）
- **不含 slots 声明的组件，children 将无法通过 schema 验证**
- Actions 定义 AI 可触发的操作
- `functions` 可定义自定义验证/转换函数

### 2.2 Registry — 定义实现

```typescript
import { defineRegistry } from '@json-render/react';

const { registry, handlers, executeAction } = defineRegistry(catalog, {
  components: {
    Card: ({ props, children }) => (
      <div className="card">{children}</div>
    ),
    Button: ({ props, emit }) => (
      <button onClick={() => emit("press")}>{props.label}</button>
    ),
  },
  actions: {
    submit: async (params, setState) => { /* ... */ },
  },
});
```

关键点：
- `defineRegistry` 返回 `registry`、`handlers`、`executeAction`
- 组件签名: `({ props, children, emit }) => ReactElement`
  - `props`: Zod schema 验证后的类型安全对象
  - `children`: 已渲染的 React 子节点
  - `emit`: 触发 action 的函数（AI 可监听）
- Action 签名: `(params, setState) => Promise<void>`
  - `params`: AI 传入的参数
  - `setState`: 更新 state model（用于 data binding 联动）

### 2.3 Spec — JSON 描述

```json
{
  "root": "card-1",
  "elements": {
    "card-1": {
      "type": "Card",
      "props": { "title": "Welcome" },
      "children": ["text-1"]
    },
    "text-1": {
      "type": "Text",
      "props": { "content": { "$state": "/user/greeting" } },
      "children": []
    }
  },
  "state": { "user": { "greeting": "Hello!" } }
}
```

关键点：
- **平面结构**: 所有元素在同一 `elements` 对象中，通过 `children: string[]`（elementId 数组）建立嵌套关系
- `root`: 根元素 ID
- Spec 可使用 `$state` 表达式引用 state model

### 2.4 Renderer — 渲染入口

```typescript
import { Renderer, StateProvider, VisibilityProvider, ActionProvider } from '@json-render/react';

<StateProvider>
  <VisibilityProvider>
    <ActionProvider handlers={handlers}>
      <Renderer spec={spec} registry={registry} />
    </ActionProvider>
  </VisibilityProvider>
</StateProvider>
```

- `StateProvider`: 提供数据状态上下文（可使用 `useStateStore()` 访问）
- `VisibilityProvider`: 控制条件渲染（`$visible` 表达式）
- `ActionProvider`: 处理组件触发的 action 事件

---

## 3. Catalog 定义

### 3.1 组件定义

```typescript
ComponentName: {
  props: z.object({ /* Zod schema */ }),
  slots: ["default"],           // 可选，声明可用的 slot 名称
  description: "组件描述",       // AI 生成时的参考
}
```

### 3.2 组件类型

| 属性 | 必需 | 说明 |
|------|------|------|
| `props` | ✅ | Zod schema，定义 props 结构 |
| `slots` | ❌ | 声明可用 slot，默认 `["default"]` |
| `description` | ❌ | 供 AI 理解的自然语言描述 |

### 3.3 Action 定义

```typescript
actions: {
  actionName: {
    params: z.object({ /* 参数 schema */ }),
    description: "操作描述",
  }
}
```

### 3.4 平台无关性

Catalog 本身是**框架无关**的 —— 定义中使用的是通用的 schema 对象，由 `@json-render/react/schema` 或 `@json-render/react-native/schema` 指定具体的 element 结构格式。

---

## 4. Registry 实现

### 4.1 组件实现签名

```typescript
type RegistryComponentProps<P> = { props: P; children?: React.ReactNode };

// 无子组件
const ButtonImpl = ({ props }: RegistryComponentProps<{ label: string; variant?: string }>) => { ... };

// 有子组件
const CardImpl = ({ props, children }: RegistryComponentProps<{ title: string }> & { children?: React.ReactNode }) => { ... };
```

### 4.2 emit / Action 触发

```typescript
Button: ({ props, emit }) => (
  <button onClick={() => emit("press", { label: props.label })}>
    {props.label}
  </button>
),
```

- `emit(actionName: string, data?: any)` 触发 catalog 中定义的 action
- AI 可在 `actions` 中定义响应逻辑

### 4.3 defineRegistry 返回值

| 返回值 | 用途 |
|--------|------|
| `registry` | 传给 `<Renderer registry={...} />` |
| `handlers` | 传给 `<ActionProvider handlers={...} />` |
| `executeAction` | 命令式触发 action（用于外部调用） |

---

## 5. Spec 格式

### 5.1 基本结构

```json
{
  "root": "element-id",
  "elements": {
    "element-id": {
      "type": "ComponentName",
      "props": { /* ... */ },
      "children": ["child-id-1", "child-id-2"]
    }
  }
}
```

### 5.2 完整结构（含 state）

```json
{
  "root": "root-id",
  "elements": { /* ... */ },
  "state": { /* 动态数据模型 */ }
}
```

### 5.3 children 的本质

**children 是 elementId 字符串数组**，不是 React 子节点。Renderer 内部根据 children 数组解析并渲染子节点。

---

## 6. Renderer 使用

### 6.1 React Renderer API

```typescript
import { Renderer } from '@json-render/react';

// 基础用法
<Renderer spec={spec} registry={registry} />

// 完整交互模式
<StateProvider initialState={initialState}>
  <VisibilityProvider>
    <ActionProvider handlers={handlers}>
      <Renderer spec={spec} registry={registry} />
    </ActionProvider>
  </VisibilityProvider>
</StateProvider>
```

### 6.2 Props

| Prop | 类型 | 说明 |
|------|------|------|
| `spec` | `Spec \| null` | 要渲染的 JSON Spec |
| `registry` | `Registry` | 组件注册表 |

### 6.3 React Schema 支持的特性

| 特性 | 说明 |
|------|------|
| 数据绑定 | `$state` 表达式 |
| 条件渲染 | `$visible` 表达式 |
| 计算值 | `$computed` 表达式 |
| 监听器 | `$watch` 表达式 |
| 表单验证 | `$validate` 表达式 |

---

## 7. 数据绑定与表达式

### 7.1 State Model

```json
{
  "state": {
    "user": { "name": "Alice", "email": "alice@example.com" }
  }
}
```

运行时可通过 `StateProvider` 注入：
```typescript
<StateProvider initialState={{ user: { name: "Alice" } }}>
```

### 7.2 表达式类型

| 表达式 | 语法 | 说明 |
|--------|------|------|
| `$state` | `{ "$state": "/path/to/value" }` | 读取 state 中的值 |
| `$computed` | `{ "$computed": { "expr": "..." } }` | 计算值 |
| `$visible` | `{ "$visible": "/condition" }` | 条件可见性 |
| `$watch` | `{ "$watch": "/path" }` | 监听变化 |
| `$validate` | `{ "$validate": "schema-id" }` | 表单验证 |

### 7.3 JSON Pointer 路径

路径遵循 RFC 6901：
```
/user/name         → "Alice"
/todos/0/title     → "Buy milk"
```

---

## 8. Streaming 模式

### 8.1 SpecStream 格式

基于 **JSONL（JSON Lines）** 的增量 patch 格式，每个 patch 是一条 RFC 6902 JSON Patch 操作：

```json
{"op":"add","path":"/root","value":"root"}
{"op":"add","path":"/elements/root","value":{"type":"Card","props":{"title":"Dashboard"},"children":["metric-1"]}}
{"op":"add","path":"/elements/metric-1","value":{"type":"Metric","props":{"label":"Revenue"}}}
```

### 8.2 Patch 操作

| 操作 | 说明 |
|------|------|
| `add` | 添加/替换值 |
| `remove` | 删除值 |
| `replace` | 替换现有值 |
| `move` | 移动值 |
| `copy` | 复制值 |
| `test` | 断言值相等 |

### 8.3 路径格式

```
/root                       → 根元素 ID
/elements/{id}              → 指定元素
/elements/{id}/props        → 元素的 props
/elements/{id}/children     → 元素的 children
```

---

## 9. VibeX 现状分析

### 9.1 已实现部分

| 文件 | 内容 | 状态 |
|------|------|------|
| `src/lib/canvas-renderer/catalog.ts` | 组件 catalog 定义 | ✅ 基础完成 |
| `src/lib/canvas-renderer/registry.tsx` | React 组件实现 | ✅ 基础完成 |
| `src/components/canvas/json-render/JsonRenderPreview.tsx` | Preview 渲染器 | ✅ 基础完成 |
| `src/components/canvas/json-render/CanvasPreviewModal.tsx` | 预览弹窗 | ✅ 基础完成 |
| `src/components/canvas/json-render/JsonRenderErrorBoundary.tsx` | 错误边界 | ✅ 基础完成 |

### 9.2 Catalog 当前内容

已定义组件：
- `Page` — 页面容器
- `Form` — 表单容器
- `DataTable` — 数据表格
- `DetailView` — 详情页
- `Modal` — 弹窗
- `Button` — 按钮
- `Card` — 卡片
- `Badge` — 徽章
- `StatCard` — 统计卡片
- `Empty` — 空状态

### 9.3 核心问题：children 未正确传递

**问题**: `JsonRenderPreview.tsx` 的 `nodesToSpec()` 函数中：

```typescript
// 当前实现（有问题）
const element: Spec['elements'][string] = {
  type: registryType,
  props: { ...node.props, title: node.name },
  children: node.children ?? [],  // ← 这里！
};
```

**问题根因**:
1. `ComponentNode.children` 是 `string[]`（子节点 ID 数组）
2. json-render 期望的 `children` 也是 `string[]`（elementId 数组）
3. **但 catalog 中所有组件都没有声明 `slots`**，所以 `children` 无法通过 schema 验证
4. json-render 的 `<Renderer />` 内部通过 `children` 数组渲染子组件，但如果 schema 验证失败，可能静默跳过

### 9.4 渲染路径分析

```
CanvasPreviewModal
    ↓ (componentNodes: ComponentNode[])
JsonRenderPreview
    ↓ (nodesToSpec() 转换)
Renderer(spec, registry)
    ↓ (内部解析 children[])
vibexCanvasRegistry 组件实现
```

---

## 10. 当前问题与改进方向

### 10.1 优先级 P0: Schema 验证导致 children 被忽略

**根因**: Catalog 组件没有声明 `slots`，但 `children` 数组始终被传入。

**修复方案**:
```typescript
// catalog.ts 中为需要嵌套的组件添加 slots
Page: {
  props: z.object({ title: z.string(), description: z.string().optional() }),
  slots: ["default"],
  description: "页面容器",
},
```

### 10.2 优先级 P1: Spec 根节点选择逻辑

**当前**: `nodesToSpec()` 优先选择 `type === 'page'` 的节点作为根，但多个 page 时行为不确定。

**改进**: 
- VibeX 是多页面系统，应该支持渲染**所有页面**或**指定页面**
- 考虑添加 `PageGrid` 容器组件，用于同时展示多页面预览

### 10.3 优先级 P1: 组件树与 json-render 结构对齐

**当前**: `ComponentTree` 组件树使用自己独立的结构，没有使用 json-render 的 Spec 格式。

**改进方向**:
- `ComponentNode` → `Spec` 的转换应该是 1:1 的（通过 `nodeId` 作为 elementId）
- 子组件通过 `parentId` 建立关系，而不是扁平 `children: string[]`
- 考虑统一数据模型：组件树同时作为 json-render Spec 的数据源

### 10.4 优先级 P2: 完善 Registry 组件

当前 Registry 组件基本但粗糙：
- `Page` 使用 `min-h-screen`，在 Modal 中会溢出
- 没有实现 `emit` 事件触发
- 没有 `ActionProvider` 逻辑
- 没有 `StateProvider` 数据绑定

### 10.5 优先级 P2: Streaming 支持

json-render 支持 **SpecStream** 增量渲染，但 VibeX 目前是全量一次性转换。

---

## 11. 参考资料

### 文档索引

| 文档 | 地址 |
|------|------|
| 官方首页 | https://json-render.dev |
| Quick Start | https://json-render.dev/docs/quick-start |
| Specs | https://json-render.dev/docs/specs |
| Schemas | https://json-render.dev/docs/schemas |
| Catalog | https://json-render.dev/docs/catalog |
| Data Binding | https://json-render.dev/docs/data-binding |
| Registry | https://json-render.dev/docs/registry |
| Renderers | https://json-render.dev/docs/renderers |
| Streaming | https://json-render.dev/docs/streaming |
| Generation Modes | https://json-render.dev/docs/generation-modes |
| Computed Values | https://json-render.dev/docs/computed-values |
| Visibility | https://json-render.dev/docs/visibility |
| Watchers | https://json-render.dev/docs/watchers |
| Validation | https://json-render.dev/docs/validation |
| AI SDK | https://json-render.dev/docs/ai-sdk |
| Custom Schema | https://json-render.dev/docs/custom-schema |
| Code Export | https://json-render.dev/docs/code-export |
| @json-render/core API | https://json-render.dev/docs/@json-render/core |
| @json-render/react API | https://json-render.dev/docs/@json-render/react |
| @json-render/next API | https://json-render.dev/docs/@json-render/next |

### 示例

| 示例 | 地址 |
|------|------|
| Browse All Examples | https://json-render.dev/docs/examples |
| Playground | https://json-render.dev/playground |

### 集成

| 集成 | 地址 |
|------|------|
| AI SDK | https://json-render.dev/docs/ai-sdk |
| A2UI | https://json-render.dev/docs/a2ui |
| Adaptive Cards | https://json-render.dev/docs/adaptive-cards |
| AG-UI | https://json-render.dev/docs/ag-ui |
| OpenAPI | https://json-render.dev/docs/openapi |

---

## 附录 A: 当前 VibeX catalog.ts 完整内容

> 位置: `src/lib/canvas-renderer/catalog.ts`

```typescript
import { defineCatalog } from '@json-render/core';
import { schema } from '@json-render/react/schema';
import { z } from 'zod';

const rawCatalog = defineCatalog(schema, {
  components: {
    Page: {
      props: z.object({ title: z.string(), description: z.string().optional() }),
      description: '页面容器 (Canvas ComponentType: page)',
    },
    Form: {
      props: z.object({
        title: z.string(),
        fields: z.array(z.object({ name: z.string(), label: z.string(), type: z.enum(['text', 'email', 'password', 'select', 'textarea', 'date', 'number']), placeholder: z.string().optional(), required: z.boolean().default(false) })),
        submitLabel: z.string().default('提交'),
      }),
      description: '表单容器 (Canvas ComponentType: form)',
    },
    DataTable: {
      props: z.object({ title: z.string(), columns: z.array(z.object({ key: z.string(), label: z.string(), sortable: z.boolean().default(false) })), rows: z.number().default(10), searchable: z.boolean().default(false) }),
      description: '数据表格 (Canvas ComponentType: list)',
    },
    DetailView: {
      props: z.object({ title: z.string(), fields: z.array(z.object({ label: z.string(), value: z.string() })), actions: z.array(z.object({ label: z.string(), variant: z.enum(['primary', 'secondary', 'danger']) })).optional() }),
      description: '详情页 (Canvas ComponentType: detail)',
    },
    Modal: {
      props: z.object({ title: z.string(), size: z.enum(['sm', 'md', 'lg']).default('md'), content: z.string().optional() }),
      description: '弹窗 (Canvas ComponentType: modal)',
    },
    Button: {
      props: z.object({ label: z.string(), variant: z.enum(['primary', 'secondary', 'danger', 'ghost']).default('primary'), size: z.enum(['sm', 'md', 'lg']).default('md'), disabled: z.boolean().default(false) }),
    },
    Card: {
      props: z.object({ title: z.string(), description: z.string().optional(), footer: z.string().optional() }),
    },
    Badge: {
      props: z.object({ text: z.string(), variant: z.enum(['default', 'success', 'warning', 'error', 'info']).default('default') }),
    },
    StatCard: {
      props: z.object({ label: z.string(), value: z.string(), trend: z.string().optional(), trendDirection: z.enum(['up', 'down', 'neutral']).optional() }),
    },
    Empty: {
      props: z.object({ title: z.string(), description: z.string().optional() }),
    },
  },
});

export const vibexCanvasCatalog = rawCatalog as any;
```

## 附录 B: 期望的改进后的 catalog.ts 关键变更

```typescript
// 关键变更1: 为容器组件添加 slots
Page: {
  props: z.object({ title: z.string(), description: z.string().optional() }),
  slots: ["default"],
  description: "页面容器",
},
Form: {
  props: z.object({ /* ... */ }),
  slots: ["default"],  // ← 表单内的字段/按钮
  description: "表单容器",
},

// 关键变更2: 可选添加 PageGrid 用于多页面预览
PageGrid: {
  props: z.object({ pages: z.array(z.string()) }),  // page elementId 数组
  description: "多页面预览网格容器",
},
```
