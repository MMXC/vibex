# Canvas 原型预览接入 json-render — 需求分析

**项目**: canvas-jsonrender-preview  
**分析日期**: 2026-04-05  
**分析师**: Analyst Agent  
**状态**: ✅ 完成

---

## 一、当前状态分析

### 1.1 Canvas 原型预览现状

Canvas 有两套预览机制，需分别处理：

#### A. 原型编辑器预览 (`/prototype/editor`)

- **工作流程**: AI 生成 UIPage JSON → `InteractiveRenderer` 渲染 → 实时预览
- **数据结构**: `UIPage.components: UIComponent[]`，组件类型包括：`navigation`、`text`、`button`、`input`、`textarea`、`toggle`、`card`、`list`、`divider`、`avatar`、`badge`、`progress`、`image`
- **渲染引擎**: `/src/lib/prototypes/renderer.ts` — 自研 `createRenderer()`，基于 `UIComponent` 类型派发到对应渲染器
- **状态管理**: 组件级 state（`ComponentState`），通过 `useState` 管理交互状态
- **代码生成**: `/src/app/api/v1/canvas/generate/route.ts` — AI 生成 `codeJson`（含完整 React 源码字符串），存储到 `prisma.CanvasPage.codeJson`

**当前痛点**:
- AI 生成的是**完整 React 源码字符串**，不可编辑、不可替换组件
- UIComponent 类型有限（17种），扩展需要改 renderer.ts
- 预览状态与 Canvas store 隔离，无法联动
- 导出只能导出代码字符串，无法生成可维护的项目结构

#### B. Canvas 主画布 (`/canvas`)

- 三树并行架构：限界上下文树 / 业务流程树 / 组件树
- 当前**无原型预览功能**，仅用于建模
- 组件类型定义在 `ComponentNode.type: 'page' | 'form' | 'list' | 'detail' | 'modal'`
- 生成流程：用户点击"生成原型" → POST `/api/canvas/generate` → AI 生成代码 → 存入 `CanvasPage.codeJson`

### 1.2 AI 代码生成链路

```
用户触发生成
    ↓
POST /api/canvas/generate { projectId, pageIds }
    ↓
triggerGeneration() → buildComponentPrompt() → generateWithAI()
    ↓
MiniMax API (abab6.5s-chat)
    ↓
AI 返回 {"code": "完整 React TSX 源码"}
    ↓
存入 prisma.CanvasPage.codeJson = JSON.stringify({ code, componentId })
    ↓
前端读取 codeJson，在 iframe 或编辑器中渲染
```

**当前问题**: `codeJson` 存的是**非结构化源码字符串**，无法在 Canvas 内做组件级别的编辑和替换。

### 1.3 现有组件注册机制

| 文件 | 作用 | 类型 |
|------|------|------|
| `/src/lib/componentRegistry.ts` | 组件状态追踪（`integrated`/`pending`/`deprecated`） | 状态管理，非渲染 |
| `/src/lib/prototypes/renderer.ts` | UIComponent → React 组件渲染 | 自研渲染引擎 |
| `/src/lib/prototypes/ui-schema.ts` | UIComponent 类型定义 + UISchema 结构 | 类型定义 |

**关键发现**: 现有 `componentRegistry.ts` **不是** json-render 的 Catalog/Registry，只是用于 CI 验证的组件状态表。真正的渲染逻辑在 `renderer.ts` 中硬编码了 17 种组件类型。

---

## 二、json-render 核心能力

### 2.1 什么是 json-render

`@json-render` 是 Vercel Labs 维护的 JSON DSL 渲染框架（周下载 ~20万，Apache-2.0），核心思想：

```
JSON Spec (结构化中间表示)
    ↓ json-render runtime
React 组件树
```

**关键优势 vs 当前方案**:

| 维度 | 当前 renderer.ts | json-render |
|------|-----------------|-------------|
| 组件扩展 | 改 renderer.ts + 重新部署 | 改 Catalog JSON，无部署 |
| AI 输出 | 完整源码字符串（不可控） | 结构化 spec（可校验） |
| 状态管理 | 组件内 useState（隔离） | StateProvider + Zustand 适配 |
| 组件替换 | 不支持 | spec 层面替换，实时预览 |
| 导出 | 源码字符串 | 从 spec 生成项目代码 |

### 2.2 Spec 格式

```typescript
interface Spec {
  root: string;                              // 根元素 key
  elements: Record<string, UIElement>;       // 扁平元素 map
  state?: Record<string, unknown>;           // 可选初始状态
}

interface UIElement {
  type: string;          // Catalog 中定义的组件名
  props: Record<string, unknown>;
  children?: string[];   // 子元素 key 列表
  visible?: VisibilityCondition;  // 条件可见
}
```

### 2.3 能力矩阵

| json-render 能力 | Canvas 原型需求 | 当前覆盖 |
|-----------------|---------------|---------|
| **Catalog** — Zod 定义组件 props schema | Canvas 5种 ComponentType | ❌ 硬编码类型 |
| **Registry** — Catalog 的 React 实现 | 需要为 page/form/list/detail/modal 写渲染器 | ❌ 17种固定组件 |
| **Spec** — 扁平 JSON 描述页面结构 | 替代 `codeJson`（源码字符串） | ⚠️ `UIPage.components` 近似但非扁平 |
| **StateProvider** — JSON Pointer 状态管理 | 原型页面需要表单状态、列表数据 | ⚠️ 组件级 useState，跨组件隔离 |
| **$bindState** — 数据绑定 | 表单输入绑定到状态路径 | ❌ 不支持 |
| **visible** — 条件可见 | 不同角色看到不同 UI | ❌ 不支持 |
| **ActionProvider** — 事件处理 | 按钮点击、表单提交 | ⚠️ 有限支持 |
| **Zustand 适配** | Canvas 已用 Zustand | ❌ 不支持 |
| **Guardrails** — AI 只能生成 Catalog 中的组件 | 防止 AI 幻觉 | ❌ AI 生成完整源码，无约束 |

---

## 三、Catalog 与 Registry 设计

### 3.1 Catalog — 组件物料定义

Catalog 定义组件的 props schema（Zod），AI 只能生成 Catalog 中定义的组件：

```typescript
// vibex-fronted/src/lib/canvas-renderer/catalog.ts
import { defineCatalog } from '@json-render/core';
import { z } from 'zod';

export const vibexCatalog = defineCatalog({
  components: {
    // === Canvas ComponentType 映射 ===
    Page: {
      props: z.object({
        title: z.string(),
        layout: z.enum(['sidebar', 'topnav', 'fullscreen']).default('topnav'),
        theme: z.enum(['light', 'dark']).default('light'),
      }),
      description: '页面容器，定义整体布局',
    },
    Form: {
      props: z.object({
        fields: z.array(z.object({
          name: z.string(),
          label: z.string(),
          type: z.enum(['text', 'email', 'password', 'select', 'textarea', 'date', 'number']),
          required: z.boolean().default(false),
        })),
        submitLabel: z.string().default('提交'),
      }),
      description: '表单容器（对应 Canvas ComponentType: form）',
    },
    DataTable: {
      props: z.object({
        columns: z.array(z.object({ key: z.string(), label: z.string(), sortable: z.boolean() })),
        pagination: z.boolean().default(true),
        searchable: z.boolean().default(false),
      }),
      description: '数据表格（对应 Canvas ComponentType: list）',
    },
    DetailView: {
      props: z.object({
        title: z.string(),
        fields: z.array(z.object({ label: z.string(), value: z.string() })),
        actions: z.array(z.object({ label: z.string(), variant: z.string() })),
      }),
      description: '详情页（对应 Canvas ComponentType: detail）',
    },
    Modal: {
      props: z.object({
        title: z.string(),
        size: z.enum(['sm', 'md', 'lg']).default('md'),
      }),
      description: '弹窗（对应 Canvas ComponentType: modal）',
    },

    // === 通用 UI 组件 ===
    Button: {
      props: z.object({
        label: z.string(),
        variant: z.enum(['primary', 'secondary', 'danger', 'ghost']).default('primary'),
        size: z.enum(['sm', 'md', 'lg']).default('md'),
      }),
    },
    Input: { props: z.object({ label: z.string(), placeholder: z.string().optional(), type: z.string() }) },
    Select: { props: z.object({ label: z.string(), options: z.array(z.object({ label: z.string(), value: z.string() })) }) },
    Card: { props: z.object({ title: z.string(), description: z.string().optional() }) },
    StatCard: { props: z.object({ label: z.string(), value: z.string(), trend: z.string().optional() }) },
    Chart: { props: z.object({ type: z.enum(['bar', 'line', 'pie', 'area']), data: z.array(z.record(z.unknown())) }) },
    Badge: { props: z.object({ text: z.string(), variant: z.enum(['default', 'success', 'warning', 'error']) }) },
    Tabs: { props: z.object({ items: z.array(z.object({ label: z.string(), key: z.string() })) }) },
    Empty: { props: z.object({ title: z.string(), description: z.string().optional() }) },
  },
});
```

### 3.2 Registry — 组件 React 实现

Registry 提供 Catalog 定义的每个组件的 React 实现：

```typescript
// vibex-fronted/src/lib/canvas-renderer/registry.ts
import { createRegistry } from '@json-render/react';

export const vibexRegistry = createRegistry({
  Page: ({ title, layout, theme, children }) => (
    <div className={`page page-${layout} theme-${theme}`}>
      <header>{title}</header>
      <main>{children}</main>
    </div>
  ),
  Form: ({ fields, submitLabel }) => (
    <form>{fields.map(f => <FormField key={f.name} {...f} />)}<button>{submitLabel}</button></form>
  ),
  // ... 其他组件实现
});
```

---

## 四、解决方案对比

### Option A：完整 json-render 集成

**核心理念**: AI 生成 json-render Spec → Catalog → Registry → Preview  
完全替换当前 `renderer.ts` + `codeJson` 模式

#### 架构

```
用户点击"生成原型"
    ↓
AI prompt 改为输出 json-render Spec
    ↓
CanvasPage.specJson = JSON.stringify(spec)  [替代 codeJson]
    ↓
<Renderer spec={spec} registry={vibexRegistry} />
    ↓
用户可选：组件替换 / Spec 编辑 / 导出
```

#### AI Prompt 改造

```markdown
# 当前 prompt（生成完整源码）
"Generate a React + TypeScript page component...
- Use 'use client' directive
- Export as default"

# 新 prompt（生成 json-render spec）
"You are VibeX UI Spec Generator. Generate a json-render spec.

Available components (from Catalog):
- Page: { title, layout: sidebar|topnav|fullscreen }
- DataTable: { columns, pagination, searchable }
- Form: { fields: [{name, label, type}] }
- Card, Button, Modal, Tabs, StatCard...

Output format (JSON only):
{
  "root": "page-1",
  "elements": {
    "page-1": { "type": "Page", "props": {...}, "children": [...] }
  }
}
Context: {component.name}, type: {component.type}"
```

#### 优点
- Spec 是结构化中间表示：可编辑、可替换、可版本控制
- Catalog 是设计系统 Guardrail：AI 只能组合已有组件
- 组件替换在 spec 层面，用户可以改组件不改逻辑
- 从 spec 导出代码质量可控

#### 缺点
- 需要全新实现 Catalog + Registry（~15个组件）
- AI prompt 大改，生成质量需要调优
- json-render 包引入（~30KB gzip），增加 bundle size
- 需要迁移现有 `codeJson` 数据

#### 依赖
- `@json-render/core` + `@json-render/react`
- 新建 `catalog.ts` + `registry.ts`
- 改造 `generate/route.ts` 的 prompt 和解析逻辑
- 数据库迁移：`CanvasPage.codeJson` → `specJson`

---

### Option B：混合方案（推荐）

**核心理念**: 保留现有 AI 源码生成，新增 json-render 作为**并行预览模式**

#### 架构

```
用户点击"生成原型"
    ↓
┌─────────────────────────────────────────────┐
│  AI 生成两条输出:                            │
│  1. codeJson: 完整 React 源码（用于导出）     │
│  2. specJson: json-render spec（用于预览）   │
└─────────────────────────────────────────────┘
    ↓
预览模式选择:
├─ "AI 源码预览" → iframe 渲染 codeJson（当前方式）
└─ "Spec 预览" → json-render 渲染 specJson（新增）
    ↓
用户可切换，两种预览并存
```

#### 优点
- **零破坏性**：不改动现有生成链路
- 增量价值：新增 json-render 预览模式
- specJson 可以由 AI **从 codeJson 提取**，无需改 AI prompt
- 渐进迁移：先跑通预览，再改 prompt 生成 spec

#### 缺点
- AI 源码和 spec 可能不一致（双重维护）
- 需要写 codeJson → specJson 转换器
- 组件替换只能替换 specJson 部分

#### 依赖
- `@json-render/core` + `@json-render/react`
- 新建 `catalog.ts` + `registry.ts`
- 新建 `PreviewModeSelector`（切换 AI 源码 / Spec 预览）
- 新建 `codeJsonToSpec.ts`（源码 → Spec 转换器）

---

### Option C：最小化接入

**核心理念**: 不替换 AI 生成逻辑，在现有渲染器上**增强 json-render 组件**

#### 架构

```
保留现有 renderer.ts
    ↓
新增 vibexCatalog（Zod schema）作为组件定义
    ↓
新增 vibexRegistry（React 实现）作为扩展组件
    ↓
renderer.ts 增加 registry 模式：
  if (component.__registry__) {
    return registry.render(component.type, component.props);
  }
    ↓
Canvas ComponentType → vibexCatalog 组件映射
```

#### 优点
- **最小改动**：不新建 PreviewPanel，不改生成链路
- 复用现有 InteractiveRenderer 交互逻辑
- Catalog 作为类型安全的组件定义层

#### 缺点
- 只是给现有 renderer 加了个扩展口，未真正发挥 json-render 优势
- Spec 编辑、组件替换等核心能力无法实现

---

## 五、工时估算

| 方案 | Phase | 任务 | 工时 |
|------|-------|------|------|
| **B（混合）** | P1 | 安装 @json-render，定义 vibexCatalog（15组件） | 1d |
| | P1 | 实现 vibexRegistry（15个 Tailwind 组件） | 1.5d |
| | P1 | 新建 PreviewPanel + PreviewModeSelector | 0.5d |
| | P2 | 改造 generate/route.ts：prompt 输出 specJson | 0.5d |
| | P2 | codeJson → specJson 转换器 | 0.5d |
| | P2 | 集成测试 + bug 修复 | 0.5d |
| | | **小计** | **4.5d** |
| **A（全量）** | P1 | 安装 + Catalog + Registry（同 B P1） | 2.5d |
| | P1 | 迁移现有 InteractiveRenderer 逻辑到 Registry | 1d |
| | P2 | AI prompt 完全改造（不再生成 codeJson） | 1d |
| | P2 | 数据迁移：codeJson → specJson | 0.5d |
| | P3 | Spec 编辑器 + 组件替换 UI | 1.5d |
| | P3 | 物料导出器（从 spec 生成项目代码） | 1d |
| | | **小计** | **7.5d** |
| **C（最小化）** | P1 | 定义 vibexCatalog（Zod schema） | 0.5d |
| | P1 | 实现 vibexRegistry（组件渲染函数） | 1d |
| | P1 | renderer.ts 增加 registry 模式 | 0.5d |
| | P1 | ComponentType → Catalog 组件映射 | 0.5d |
| | | **小计** | **2.5d** |

---

## 六、推荐方案

### 推 荐: **Option B（混合方案）**

理由：

1. **风险最低**：不破坏现有生成链路，codeJson 继续作为导出用
2. **价值最大**：新增 Spec 预览模式后，用户可以体验组件替换能力
3. **渐进迁移**：等 Spec 预览稳定后，再改为 Option A（全量）
4. **可验证**：P1 完成后即可验证 json-render 在 Canvas 的实际效果

### 执行顺序

```
Phase 1 (4.5d): 搭建 json-render 基础设施
  └─ Catalog + Registry + 基础 PreviewPanel

Phase 2 (1.5d): 集成到 Canvas 生成链路
  └─ generate/route.ts 改造 + codeJson→specJson 转换

Phase 3 (2d): Spec 编辑 + 组件替换（如果 P1+P2 验证通过）
  └─ 升级为 Option A
```

---

## 七、验收标准

### 功能验收

- [ ] AI 生成的原型页面可以同时以"AI 源码"和"Spec"两种模式预览
- [ ] Spec 预览模式下，点击组件可高亮选中
- [ ] 选中组件后，右键/属性面板可选择"替换组件"
- [ ] 替换后页面实时刷新，显示新组件
- [ ] Spec JSON 可在 Monaco Editor 中直接编辑，修改实时生效
- [ ] 导出功能不受影响（继续导出 AI 生成的完整源码）
- [ ] Zustand Store 中的 Canvas 数据可通过 Zustand adapter 传入 Spec 预览

### 技术验收

- [ ] `@json-render/core` + `@json-render/react` 已安装，bundle size < 50KB
- [ ] `vibexCatalog` 覆盖 Canvas 5 种 ComponentType（page/form/list/detail/modal）+ 10 种通用组件
- [ ] `vibexRegistry` 所有组件使用 Tailwind CSS，视觉风格与现有设计系统一致
- [ ] `CanvasPage.specJson` 字段已添加到 Prisma schema
- [ ] AI prompt 改造成果：生成 specJson 而非 codeJson（Phase 2 完成）
- [ ] TypeScript 类型覆盖：Catalog 组件类型与 Registry 实现一一对应
- [ ] 单元测试：Catalog schema 校验、Registry 组件渲染、codeJson→specJson 转换

### 性能验收

- [ ] Spec 预览渲染性能 < 100ms（500 节点以内）
- [ ] 组件替换后重新渲染 < 50ms
- [ ] AI 生成 specJson < 3s（单个页面）

---

## 八、已知风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| json-render 包不稳定 | 低 | 高 | v0.16.0 周下载 20 万，Vercel Labs 维护，Apache-2.0 |
| AI 生成的 spec 不符合 Catalog schema | 高 | 中 | Zod 校验自动拒绝；prompt 中明确列出可用组件 |
| Catalog 组件覆盖不了复杂业务场景 | 中 | 中 | `CustomHTML` 兜底；渐进扩展 Catalog |
| AI 源码和 spec 不一致 | 高 | 中 | Phase 2 改为 prompt 直接输出 specJson，不再双重生成 |
| Zustand adapter 实现复杂度 | 中 | 中 | 已有官方适配方案，参考 json-render 文档 |
