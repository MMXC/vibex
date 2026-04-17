# Architecture — vibex-sprint4-spec-canvas-extend

**项目**: vibex-sprint4-spec-canvas-extend
**版本**: v1.0
**日期**: 2026-04-18
**角色**: Architect
**上游**: prd.md, specs/E1-E5, analysis.md

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-sprint4-spec-canvas-extend
- **执行日期**: 2026-04-18

---

## 1. Tech Stack

| 层 | 技术 | 版本 | 选型理由 |
|----|------|------|---------|
| 前端框架 | Next.js | 16 | 项目基准 |
| 语言 | TypeScript | 5.x | 类型安全 |
| 画布引擎 | React Flow | @xyflow/core | Sprint2 验证，可扩展自定义节点 |
| 状态管理 | Zustand | latest | Sprint2 DDSCanvasStore 已验证 |
| 测试 | Vitest + Testing Library | — | 项目基准 |
| 导出 | OpenAPIGenerator (719行) | 已有资产 | Sprint2 遗留，可直接复用 |
| 状态机 | flowMachine.ts (296行) | 已有资产 | Sprint2 遗留，可扩展 |

**无新增核心依赖** — 所有功能基于 Sprint2 基础设施 + 2 个新 exporter 模块。

---

## 2. Architecture Diagram

```mermaid
flowchart TB
    subgraph DDS["DDS Canvas (复用 Sprint2)"]
        TB[DDSToolbar<br/>5 章节按钮]
        CCP[DDSPanel<br/>左侧组件面板]
        SC[DDSScrollContainer<br/>3 栏滚动布局]
        AAP[DDSPanel<br/>右侧属性面板]
        DRAF[AIDraftDrawer]
    end

    subgraph Store["DDSCanvasStore (扩展)"]
        CS[chapters<br/>requirement/context/flow<br/>+ api + businessRules]
        CCE[crossChapterEdges<br/>DDSEdge[]]
    end

    subgraph Cards["Card Types (扩展)"]
        UC[UserStoryCard<br/>BoundedContextCard<br/>FlowStepCard]
        AC[APIEndpointCard<br/>StateMachineCard]
    end

    subgraph Exporters["导出层 (新增)"]
        AE[APICanvasExporter<br/>→ OpenAPIGenerator]
        SM[SMExporter<br/>→ StateMachineJSON]
    end

    subgraph Reuse["复用资产"]
        OAG[OpenAPIGenerator.ts<br/>719行]
        FM[flowMachine.ts<br/>296行]
    end

    TB -->|setActiveChapter| Store
    CCP -->|addCard| Store
    SC -->|cards/edges| Store
    AAP -->|updateCard| Store
    Store -->|chapters[api]| AC
    Store -->|chapters[businessRules]| AC
    AE --> OAG
    SM --> FM
    CS -->|getExportData| AE
    CS -->|getExportData| SM
```

**布局约束**: `DDSPanel` 左 240px | `DDSScrollContainer` 中自适应 | `DDSPanel` 右 280px | `DDSToolbar` 顶部固定

**章节布局** (扩展后):
```
[Requirement | Context | Flow | API | BusinessRules]
    ↑ 5 栏横向排列，DDSScrollContainer 管理滚动
```

---

## 3. Type System Extensions

### 3.1 ChapterType 扩展

```typescript
// src/types/dds/index.ts
// 扩展前: 'requirement' | 'context' | 'flow'
// 扩展后:
export type ChapterType = 'requirement' | 'context' | 'flow' | 'api' | 'businessRules';
```

### 3.2 CardType 扩展

```typescript
// src/types/dds/index.ts
// 扩展前: 'user-story' | 'bounded-context' | 'flow-step'
// 扩展后:
export type CardType = 'user-story' | 'bounded-context' | 'flow-step' | 'api-endpoint' | 'state-machine';
```

### 3.3 APIEndpointCard 定义

```typescript
// src/types/dds/api-endpoint.ts (新建)

export type HTTPMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

export interface APIEndpointCard extends BaseCard {
  type: 'api-endpoint';
  method: HTTPMethod;           // HTTP 方法
  path: string;                 // API 路径（如 /api/users）
  summary?: string;             // 端点描述
  description?: string;         // 详细描述
  parameters?: APIParameter[];  // 参数（P1 留空）
  requestBody?: string;         // JSON Schema（P1 留空）
  responses?: APIResponse[];   // 响应定义（P1 留空）
}

export interface APIParameter {
  name: string;
  in: 'query' | 'header' | 'path';
  required?: boolean;
  type: string;
  description?: string;
}

export interface APIResponse {
  statusCode: number;
  description: string;
}
```

**与 OpenAPIGenerator.EndpointDefinition 对齐**: `EndpointDefinition.path` ← `APIEndpointCard.path`, `EndpointDefinition.method` ← `APIEndpointCard.method`, `EndpointDefinition.summary` ← `APIEndpointCard.summary`

### 3.4 StateMachineCard 定义

```typescript
// src/types/dds/state-machine.ts (新建)

export type StateMachineStateType = 'initial' | 'final' | 'normal' | 'choice' | 'join' | 'fork';

export interface StateTransition {
  id: string;
  targetStateId: string;    // 目标状态
  guard?: string;           // 守卫条件
  action?: string;          // 副作用
  label?: string;           // 边上显示文本
}

export interface StateMachineCard extends BaseCard {
  type: 'state-machine';
  stateId: string;               // 状态标识（唯一）
  stateType: StateMachineStateType;
  events?: string[];             // 可触发事件列表
  description?: string;          // 状态描述
}

export interface SMExporterEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  guard?: string;
  action?: string;
}

export interface StateMachineJSON {
  initial?: string;
  states: Record<string, {
    type?: StateMachineStateType;
    description?: string;
    on?: Record<string, {
      target: string;
      guard?: string;
      actions?: string[];
    }>;
  }>;
}
```

### 3.5 DDSCanvasStore 扩展

```typescript
// src/stores/dds/DDSCanvasStore.ts — 扩展 initialChapters
const initialChapters: Record<ChapterType, ChapterData> = {
  requirement: createInitialChapterData('requirement'),
  context: createInitialChapterData('context'),
  flow: createInitialChapterData('flow'),
  api: createInitialChapterData('api'),           // + 新增
  businessRules: createInitialChapterData('businessRules'), // + 新增
};
```

---

## 4. Module Breakdown

### 4.1 新增文件

| 文件 | 职责 | 依赖 |
|------|------|------|
| `types/dds/api-endpoint.ts` | APIEndpointCard 类型定义 | BaseCard |
| `types/dds/state-machine.ts` | StateMachineCard + SMExporter 类型 | BaseCard |
| `components/dds/cards/APIEndpointCard.tsx` | 自定义 React Flow 节点（method badge + path） | types/dds |
| `components/dds/cards/StateMachineCard.tsx` | 自定义 React Flow 节点（状态图标 + stateId） | types/dds |
| `components/dds/cards/CardRenderer.tsx` | 扩展支持 5 种 cardType | 所有 Card |
| `lib/contract/APICanvasExporter.ts` | Canvas → OpenAPI JSON 导出 | OpenAPIGenerator |
| `lib/stateMachine/SMExporter.ts` | Canvas → StateMachine JSON 导出 | flowMachine |
| `components/dds/canvas/DDSPanel.tsx` | 扩展支持 API/StateMachine 组件面板 | APIEndpointCard, StateMachineCard |
| `components/dds/canvas/DDSPanel.module.css` | API 组件面板样式 | CSS Token |
| `components/dds/toolbar/DDSToolbar.tsx` | 扩展 5 章节按钮 | DDSCanvasStore |
| `components/dds/canvas/CrossChapterEdgesOverlay.tsx` | 扩展 5 栏布局计算 | DDSCanvasStore |

### 4.2 复用文件（只读扩展）

| 文件 | 扩展方式 |
|------|---------|
| `stores/dds/DDSCanvasStore.ts` | +2 chapters，+2 cardTypes |
| `types/dds/index.ts` | 扩展 ChapterType/CardType union |
| `components/dds/canvas/DDSScrollContainer.tsx` | 章节数扩展（5 栏）|
| `components/dds/canvas/DDSFlow.tsx` | 节点类型注册扩展 |

### 4.3 数据流

```
DDSPanel (拖拽 APIEndpointCard)
  → onDrop → DDSCanvasStore.addCard({ type: 'api-endpoint', ... })
    → chapters.api.cards 更新
      → DDSFlow 重渲染
        → APIEndpointCard 节点显示

API 章节导出:
  DDSToolbar Export 按钮
    → APICanvasExporter.exportToOpenAPI(chapters.api.cards)
      → OpenAPIGenerator.addEndpoints() → generate()
        → 返回 OpenAPISpec JSON

StateMachine 导出:
  DDSToolbar Export 按钮
    → SMExporter.exportToStateMachine(cards, edges)
      → 构建 StateMachineJSON
        → 返回 JSON

跨章节边:
  用户从 APIEndpointCard 画边到 UserStoryCard
    → DDSCanvasStore.addCrossChapterEdge({ sourceChapter: 'api', targetChapter: 'requirement' })
      → CrossChapterEdgesOverlay 渲染虚线
```

---

## 5. API Definitions

### 5.1 APICanvasExporter

```typescript
// src/lib/contract/APICanvasExporter.ts

import { OpenAPIGenerator, type OpenAPISpec } from './OpenAPIGenerator';
import type { APIEndpointCard } from '@/types/dds/api-endpoint';
import type { EndpointDefinition } from './OpenAPIGenerator';

/**
 * 将 Canvas 上的 APIEndpointCard 数组导出为 OpenAPI 3.0 JSON
 */
export function exportToOpenAPI(
  cards: APIEndpointCard[],
  options?: { title?: string; version?: string }
): OpenAPISpec {
  const generator = new OpenAPIGenerator({
    title: options?.title ?? 'VibeX API',
    version: options?.version ?? '1.0.0',
  });

  const endpoints: EndpointDefinition[] = cards.map((card) => ({
    path: card.path,
    method: card.method,
    summary: card.summary ?? card.description,
    description: card.description,
  }));

  generator.addEndpoints(endpoints);
  return generator.generate();
}

/**
 * 导出为 JSON 字符串（用于 Modal 预览）
 */
export function exportToOpenAPIJSON(cards: APIEndpointCard[]): string {
  return JSON.stringify(exportToOpenAPI(cards), null, 2);
}
```

### 5.2 SMExporter

```typescript
// src/lib/stateMachine/SMExporter.ts

import type {
  StateMachineCard,
  SMExporterEdge,
  StateMachineJSON,
} from '@/types/dds/state-machine';

/**
 * 将 Canvas 上的 StateMachineCard 和边导出为 StateMachineJSON
 */
export function exportToStateMachine(
  nodes: StateMachineCard[],
  edges: SMExporterEdge[]
): StateMachineJSON {
  const initial = nodes.find((n) => n.stateType === 'initial')?.stateId;
  const states: StateMachineJSON['states'] = {};

  nodes.forEach((node) => {
    const nodeEdges = edges.filter((e) => e.source === node.id);

    const on: Record<string, { target: string; guard?: string; actions?: string[] }> = {};
    nodeEdges.forEach((e) => {
      const event = e.label || '*';
      if (!on[event]) {
        on[event] = { target: e.targetStateId };
      }
      if (e.guard) on[event].guard = e.guard;
      if (e.action) on[event].actions = [e.action];
    });

    states[node.stateId] = {
      type: node.stateType,
      description: node.description,
      ...(Object.keys(on).length > 0 ? { on } : {}),
    };
  });

  return { initial, states };
}

/**
 * 导出为 JSON 字符串
 */
export function exportToStateMachineJSON(
  nodes: StateMachineCard[],
  edges: SMExporterEdge[]
): string {
  return JSON.stringify(exportToStateMachine(nodes, edges), null, 2);
}
```

### 5.3 CardRenderer 扩展

```typescript
// src/components/dds/cards/CardRenderer.tsx — 扩展
import { APIEndpointCard } from './APIEndpointCard';
import { StateMachineCard } from './StateMachineCard';

// 在 switch(card.type) 中新增:
case 'api-endpoint':
  return <APIEndpointCard {...(card as APIEndpointCard)} />;
case 'state-machine':
  return <StateMachineCard {...(card as StateMachineCard)} />;
```

---

## 6. Key Design Decisions

### 6.1 Store 扩展策略（方案A：扩展 DDSCanvasStore）

| 方案 | 描述 | 决策 |
|------|------|------|
| **A** | 在现有 store 增加 api/businessRules 两个 chapters | ✅ 已采纳 |
| B | 为每个新章节创建独立 store，通过 Provider 注入 | 过度设计 |

**理由**: MVP 优先，现有 store 架构清晰，新增 2 个 chapter 不会显著增加复杂度。

### 6.2 Schema 编辑方式（方案A：自由 JSON textarea）

| 方案 | 描述 | 决策 |
|------|------|------|
| **A** | 自由 JSON textarea（MVP） | ✅ 已采纳 |
| B | Schema 选择器（引用已有 DomainEntity） | P2 迭代 |

**理由**: MVP 聚焦核心功能，Schema 选择器复杂度高，留给后续迭代。

### 6.3 StateMachine 导出格式（方案A：JSON）

| 方案 | 描述 | 决策 |
|------|------|------|
| **A** | 结构化 JSON（MVP） | ✅ 已采纳 |
| B | XState JSON（后续迭代） | P2 |

**理由**: XState 格式生成复杂度高，MVP 只验证状态机可视化编辑 + JSON 导出。

### 6.4 CrossChapterEdgesOverlay 章节布局

**扩展 CHAPTER_ORDER / CHAPTER_OFFSETS**:

```typescript
// CrossChapterEdgesOverlay.tsx — 扩展
const CHAPTER_ORDER: ChapterType[] = ['requirement', 'context', 'flow', 'api', 'businessRules'];
const CHAPTER_OFFSETS: Record<ChapterType, number> = {
  requirement: 0,
  context: 0.2,
  flow: 0.4,
  api: 0.6,
  businessRules: 0.8,
};
```

---

## 7. Risk Assessment

| 风险 | 等级 | 描述 | 缓解 |
|------|------|------|------|
| DDSCanvasStore 膨胀 | 低 | +2 chapters，行数增加约 30% | 监控行数，超 500 行拆分 |
| CrossChapterEdgesOverlay 5 栏计算 | 中 | 章节宽度重新计算，布局可能移位 | 复用现有百分比布局算法 |
| OpenAPIGenerator method 大小写 | 低 | 需统一 toLowerCase() | APICanvasExporter 统一转换 |
| StateMachineCard stateId 重复 | 中 | 用户可能创建重复 stateId | 属性面板添加重复校验 |
| StateMachine 转移表达不完整 | 高 | MVP 只支持 guard/action 文本，复杂逻辑缺失 | 引导文案说明 MVP 范围 |
| 5 章节性能 | 中 | 大量节点时 5 栏布局渲染开销 | 章节内懒加载，仅渲染可见章节 |

---

## 8. Testing Strategy

### 8.1 测试框架

- **框架**: Vitest + Testing Library
- **覆盖率目标**: > 80%（新增代码）
- **测试位置**: `src/components/dds/cards/__tests__/`, `src/lib/contract/__tests__/`, `src/lib/stateMachine/__tests__/`

### 8.2 核心测试用例

#### APICanvasExporter（E4）
```typescript
// src/lib/contract/__tests__/APICanvasExporter.test.ts
test('E4-U1: 导出包含 openapi 版本', () => {
  const spec = exportToOpenAPI([]);
  expect(spec.openapi).toBe('3.0.3');
});

test('E4-U2: GET /api/users 映射到 paths["/api/users"].get', () => {
  const cards = [{ type: 'api-endpoint', id: '1', path: '/api/users', method: 'get', summary: 'List users' }] as APIEndpointCard[];
  const spec = exportToOpenAPI(cards);
  expect(spec.paths['/api/users'].get.summary).toBe('List users');
});

test('E4-U4: 空数组导出空 paths', () => {
  expect(exportToOpenAPI([]).paths).toEqual({});
});
```

#### SMExporter（E4）
```typescript
// src/lib/stateMachine/__tests__/SMExporter.test.ts
test('E4-U6: 有 initial 节点时导出包含 initial', () => {
  const nodes = [{ id: 's1', stateId: 'Idle', stateType: 'initial' }] as StateMachineCard[];
  const sm = exportToStateMachine(nodes, []);
  expect(sm.initial).toBe('Idle');
});

test('E4-U7: 边映射为 on 事件', () => {
  const nodes = [
    { id: 's1', stateId: 'Idle', stateType: 'initial' },
    { id: 's2', stateId: 'Active', stateType: 'normal' },
  ] as StateMachineCard[];
  const edges = [{ source: 's1', target: 's2', label: 'START' }];
  const sm = exportToStateMachine(nodes, edges);
  expect(sm.states['Idle'].on['START'].target).toBe('Active');
});
```

#### APIEndpointCard 组件
```typescript
// src/components/dds/cards/__tests__/APIEndpointCard.test.tsx
test('renders method badge with correct color', () => {
  render(<APIEndpointCard {...baseCard} method="get" path="/api/users" />);
  expect(screen.getByText('GET')).toBeInTheDocument();
});
test('renders path text', () => {
  render(<APIEndpointCard {...baseCard} method="post" path="/api/orders" />);
  expect(screen.getByText('/api/orders')).toBeInTheDocument();
});
```

#### StateMachineCard 组件
```typescript
// src/components/dds/cards/__tests__/StateMachineCard.test.tsx
test('renders initial state icon', () => {
  render(<StateMachineCard {...baseCard} stateId="Idle" stateType="initial" />);
  expect(screen.getByTestId('state-icon-initial')).toBeInTheDocument();
});
test('renders stateId text', () => {
  render(<StateMachineCard {...baseCard} stateId="Active" stateType="normal" />);
  expect(screen.getByText('Active')).toBeInTheDocument();
});
```

### 8.3 测试命令

```bash
# 单元测试
pnpm vitest run src/components/dds/cards/__tests__/APIEndpointCard.test.tsx
pnpm vitest run src/components/dds/cards/__tests__/StateMachineCard.test.tsx
pnpm vitest run src/lib/contract/__tests__/APICanvasExporter.test.ts
pnpm vitest run src/lib/stateMachine/__tests__/SMExporter.test.ts

# 覆盖率
pnpm vitest run --coverage
```

---

## 9. Known Decisions

| 决策 | 理由 | 影响 |
|------|------|------|
| 扩展 DDSCanvasStore（方案A） | MVP 快，store 膨胀可控 | 新 chapters 与旧 chapters 共存 |
| 自由 JSON Schema textarea（P1） | 减少 MVP 复杂度 | 用户需手动写 JSON |
| StateMachine JSON 导出（XState P2） | XState 格式复杂度高 | 需后续迭代补充 |
| CrossChapterEdgesOverlay 5 栏 | 复用百分比布局算法 | API ↔ Requirement, StateMachine ↔ Context |
| APICanvasExporter 作为中间层 | OpenAPIGenerator 需要 EndpointDefinition[]，Canvas 提供 APIEndpointCard[] | 中间转换层隔离依赖 |

---

## 10. Out of Scope

- Schema 选择器（引用已有 DomainEntity schema）
- XState 格式导出
- 参数配置（Query/Header/Path 参数 table）
- 请求体/响应体 Schema 编辑器
- 章节显示管理（toolbar 切换可见性）
- StateMachine 完整 action/guard 配置面板
