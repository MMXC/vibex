# 需求分析报告 — vibex-sprint4-spec-canvas-extend / analyze-requirements

**项目**: vibex-sprint4-spec-canvas-extend
**角色**: Analyst
**日期**: 2026-04-18
**主题**: 详设画布扩展（API规格 + 业务规则章节）
**状态**: ✅ Recommended

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-sprint4-spec-canvas-extend
- **执行日期**: 2026-04-18
- **备注**: Sprint2（29/29完成）提供了完整的 DDS Canvas 架构基础，Sprint4 在其上扩展两个新章节

---

## 0. 与 Sprint2 的关系

Sprint2 构建了 DDS Canvas 基座（`DDSCanvasPage`），包含 3 个固定章节：

| Sprint | 章节 | CardType | 状态 |
|--------|------|----------|------|
| Sprint2 | requirement（需求） | UserStoryCard | ✅ 已完成 |
| Sprint2 | context（上下文） | BoundedContextCard | ✅ 已完成 |
| Sprint2 | flow（流程） | FlowStepCard | ✅ 已完成 |
| Sprint4 | api（API规格） | APIEndpointCard（新增） | ⬜ 待实现 |
| Sprint4 | businessRules（业务规则） | StateMachineCard（新增） | ⬜ 待实现 |

Sprint4 复用 Sprint2 的全部基础设施：DDSScrollContainer、DDSFlow、DDSPanel、DDSToolbar、CrossChapterEdgesOverlay、DDSCanvasStore、DDSAIDraftDrawer。

---

## 1. Research 结果

### 1.1 历史经验

| 经验 | 内容 | Sprint4 适用性 |
|------|------|--------------|
| `canvas-testing-strategy.md` | Mock Store 需真实反映 Zustand 行为 | ✅ 新章节 store 需同样原则 |
| `vibex-e2e-test-fix.md` | Epic 划分粒度要与实现匹配 | ✅ Sprint2 E4 跨章节 DAG 是好的粒度参考 |
| Sprint2 29/29 完成记录 | 完整的 6 Epic 实现路径 | ✅ 复用相同 DDPipe 流程 |

### 1.2 已有代码资产（关键发现）

| 资产 | 行数 | Sprint4 价值 |
|------|------|------------|
| `src/lib/contract/OpenAPIGenerator.ts` | 719 | ⭐ 直接复用！已有完整 OpenAPI 3.0 生成器（addEndpoint/addEndpoints/generate/writeFile） |
| `src/components/flow-container/flowMachine.ts` | 296 | ⭐ 直接复用！已有 FlowNode 类型（start/end/process/decision/subprocess）可扩展为 StateMachineCard |
| `src/types/dds/index.ts` | ~270 | ✅ ChapterType/CardType 系统，可扩展 api/businessRules |
| `DDSCanvasStore.ts` | ~200 | ✅ 新章节 store 复用相同架构模式 |
| `api-contract.yaml` | ~1000+ | ⚠️ 需迁移或重新生成 |
| `canvasApi.ts` | 501 | ✅ DDS API 模式可参考 |

### 1.3 Git History 分析

| Commit | 描述 | Sprint4 关联 |
|--------|------|------------|
| `676c1be9` | Epic5 E5-U1/U2/U3 状态与错误处理 | ✅ 新章节需同等状态/错误处理 |
| `2b3d69f4` | Epic4 跨章节DAG边实现 | ✅ 新章节同样需要跨章节边 |
| `aa966492` | Epic3 AI 草稿生成完成 | ✅ 新章节 AI 辅助生成可复用 AIDraftDrawer |
| `f18d48f4` | Epic1 拖拽布局编辑器 | ✅ 新章节组件面板复用相同拖拽模式 |
| `bde8f7a8` | Epic2 Mock数据绑定 | N/A（Spec Canvas 无 Mock 数据） |

---

## 2. 技术可行性评估

### 2.1 API 端点拖拽设计 → OpenAPI 导出

#### OpenAPIGenerator 能力分析

`OpenAPIGenerator.ts` 现有 API：

```typescript
class OpenAPIGenerator {
  addEndpoint(endpoint: EndpointDefinition): void
  addEndpoints(endpoints: EndpointDefinition[]): void
  generate(): OpenAPIGenerator
  writeFile(filePath?: string): Promise<void>
}
```

**接口已对齐**：Sprint4 只需构建 Canvas UI 层（拖拽组件 → 配置面板 → 调用 addEndpoint），Generator 无需修改。

#### 需要新增的组件

| 组件 | 职责 | 复杂度 |
|------|------|--------|
| APIEndpointCard | 自定义 React Flow 节点（method badge + path + summary） | 中 |
| APIComponentPanel | 左侧组件面板（GET/POST/PUT/DELETE/PATCH 5种端点卡片） | 低 |
| APIAttrPanel | 右侧属性面板（path/method/summary/params/reqBody/responses） | 高 |
| APIExporterModal | 调用 OpenAPIGenerator 生成并导出 JSON/YAML | 中 |

#### 挑战

1. **参数和请求体 Schema**：用户需要输入 JSON Schema 或引用已有 DomainEntity Schema。需要判断：
   - 方案A：自由 JSON 输入（简单但容易出错）
   - 方案B：Schema 选择器（引用 api-contract.yaml 中的已有 schema）
   - 方案C：Zod 代码编辑器（XState 模式，技术门槛高）
2. **Zod Schema 生成**：当前 OpenAPIGenerator 使用 Zod input，Canvas UI 需要能生成 Zod schema 对象。

**可行性结论**: ✅ 可行，但 Schema 编辑复杂度较高，建议 MVP 采用方案A（自由 JSON）。

### 2.2 状态机可视化编辑

#### 现有资产

`flowMachine.ts` 已有：

```typescript
type FlowNodeType = 'start' | 'end' | 'process' | 'decision' | 'subprocess';
interface FlowNode {
  id: string;
  type: FlowNodeType;
  label: string;
  position: { x: number; y: number };
  connections: string[];
  metadata?: Record<string, string>;
}
```

这用于项目创建向导，Sprint4 需要扩展为**状态机卡片**，包含：

| 字段 | 说明 | 新增 |
|------|------|------|
| stateId | 状态标识 | ✅ |
| stateType | initial/final/normal/choice/join/fork | ✅ 新增 |
| transitions | 状态转移列表（guard/action/target） | ✅ 新增 |
| events | 可触发事件列表 | ✅ 新增 |

#### 需要新增的组件

| 组件 | 职责 | 复杂度 |
|------|------|--------|
| StateMachineCard | 自定义 React Flow 节点（状态图标 + 转移连线） | 高 |
| SMComponentPanel | 左侧面板（state/transition/choice 组件） | 中 |
| SMAttrPanel | 右侧属性面板（状态属性 + 转移配置） | 高 |
| SMExporter | 导出为 XState JSON / 状态图 YAML | 中 |

#### 挑战

1. **XState 格式导出**：需要将 Canvas 上的状态机节点和边转换为 XState JSON 格式。有现成的 xstate 包可用。
2. **StateMachine 可视化**：需要处理复杂的状态转移渲染（guard 条件、分叉/汇合、并行区域）。
3. **与 Flow 章节区分**：StateMachine 和 Flow 是不同概念。Flow 是业务流程（跨角色），StateMachine 是单个对象的状态变迁（单角色/单实体）。

**可行性结论**: ⚠️ 可行但复杂。核心挑战是状态机表达的完整性（guard/action/transition）和 XState 格式生成。建议 MVP 聚焦于可视化编辑 + 简单 JSON 导出，XState 格式作为后续迭代。

---

## 3. 需求分析与 Epic 拆分

### Epic A: API 规格章节

| ID | 功能 | 工时估算 | 验收标准 |
|----|------|---------|---------|
| A1 | API 组件面板（GET/POST/PUT/DELETE/PATCH 5种） | 1h | 面板显示 5 种方法类型 |
| A2 | APIEndpointCard 自定义节点 | 2h | 节点显示 method badge + path + summary |
| A3 | API 属性面板（path/method/summary 配置） | 3h | 修改后节点标签实时更新 |
| A4 | 参数配置（Query/Header/Path 参数） | 2h | 参数以 table 形式增删改 |
| A5 | 请求体/响应体 Schema 编辑器 | 3h | JSON Editor（或 textarea）|
| A6 | OpenAPI JSON/YAML 导出 | 2h | 导出文件符合 OpenAPI 3.0 规范 |
| A7 | API 章节持久化（D1） | 2h | 刷新后数据保留 |

**Epic A 工时小计: 15h**

### Epic B: 业务规则章节

| ID | 功能 | 工时估算 | 验收标准 |
|----|------|---------|---------|
| B1 | 状态机组件面板（state/transition/choice） | 1h | 面板显示 3 种组件 |
| B2 | StateMachineCard 自定义节点 | 3h | 节点显示状态名 + 类型图标 |
| B3 | 状态属性面板（stateId/stateType/events） | 2h | 状态类型选择 + 事件列表编辑 |
| B4 | 转移配置面板（guard/action/target） | 3h | 转移连线选择 → 配置抽屉 |
| B5 | 状态机 JSON 导出 | 2h | 导出为结构化 JSON（含 states/initial/transitions）|
| B6 | XState 格式导出 | 3h | 生成合法的 XState machine config |
| B7 | 业务规则章节持久化（D1） | 2h | 刷新后数据保留 |

**Epic B 工时小计: 16h**

### Epic C: 跨章节集成

| ID | 功能 | 工时估算 | 验收标准 |
|----|------|---------|---------|
| C1 | API → Requirement 边 | 2h | 从 APIEndpointCard 画边到 UserStoryCard |
| C2 | StateMachine → Context 边 | 2h | 从 StateMachineCard 画边到 BoundedContextCard |
| C3 | 章节切换器扩展（5章节） | 1h | DDSToolbar 显示所有章节，URL 支持 |
| C4 | 章节重新排序/可见性 | 1h | 5章节但不一定全显示 |

**Epic C 工时小计: 6h**

### Epic D: 状态与错误处理

| ID | 功能 | 工时估算 | 验收标准 |
|----|------|---------|---------|
| D1 | API 章节骨架屏/空状态 | 1h | 与 Sprint2 E5 风格一致 |
| D2 | StateMachine 章节骨架屏/空状态 | 1h | 同上 |
| D3 | 导出失败 toast 提示 | 0.5h | 导出失败显示错误信息 |

**Epic D 工时小计: 2.5h**

### Epic E: 测试覆盖

| ID | 功能 | 工时估算 | 验收标准 |
|----|------|---------|---------|
| E1 | APIEndpointCard 单元测试 | 1h | 10+ 测试用例 |
| E2 | StateMachineCard 单元测试 | 1h | 10+ 测试用例 |
| E3 | OpenAPI Export 端到端测试 | 1h | 从拖拽到导出完整流程 |
| E4 | StateMachine Export 端到端测试 | 1h | 从拖拽到导出完整流程 |

**Epic E 工时小计: 4h**

### 总工时汇总

| Epic | 工时 |
|------|------|
| A: API 规格章节 | 15h |
| B: 业务规则章节 | 16h |
| C: 跨章节集成 | 6h |
| D: 状态与错误处理 | 2.5h |
| E: 测试覆盖 | 4h |
| **Total** | **43.5h** |

---

## 4. 架构决策

### 4.1 ChapterType 扩展

```typescript
// src/types/dds/index.ts
export type ChapterType = 'requirement' | 'context' | 'flow' | 'api' | 'businessRules';
```

### 4.2 新增 CardType

```typescript
// src/types/dds/index.ts
export type CardType = 'user-story' | 'bounded-context' | 'flow-step' | 'api-endpoint' | 'state-machine';
```

### 4.3 Store 扩展策略

两种方案：

| 方案 | 描述 | 优缺点 |
|------|------|--------|
| **方案A: 扩展 DDSCanvasStore** | 在现有 store 中增加 api/businessRules 两个 chapters | 快，但 store 会变大 |
| **方案B: 独立 store** | 为每个新章节创建独立 store，通过 Provider 注入 | 干净，但需要协调跨章节边 |

**建议**: 方案A（MVP 优先），后续如果 store 超过 500 行再拆分。

### 4.4 OpenAPIGenerator 集成

```typescript
// 新文件: src/lib/contract/APICanvasExporter.ts
import { OpenAPIGenerator } from '@/lib/contract/OpenAPIGenerator';
import type { APIEndpointCard } from '@/types/dds';

export function exportToOpenAPI(cards: APIEndpointCard[]): OpenAPISpec {
  const generator = new OpenAPIGenerator();
  cards.forEach(card => {
    generator.addEndpoint({
      path: card.path,
      method: card.method,
      summary: card.summary,
      // ...
    });
  });
  return generator.generate();
}
```

### 4.5 StateMachine → XState 导出

```typescript
// 新文件: src/lib/stateMachine/SMExporter.ts
export function exportToXState(nodes: StateMachineCard[], edges: DDSEdge[]): any {
  return {
    id: 'businessRules',
    initial: nodes.find(n => n.stateType === 'initial')?.stateId,
    states: Object.fromEntries(
      nodes.map(n => [n.stateId, {
        on: Object.fromEntries(
          edges.filter(e => e.source === n.id).map(e => [
            e.label || '*',  // event
            { target: e.target, guard: e.guard }
          ])
        )
      }])
    )
  };
}
```

---

## 5. 风险矩阵

| 风险 | 影响 | 可能性 | 缓解 |
|------|------|--------|------|
| OpenAPI Generator 不支持 YAML 导出 | 中 | 低 | Generator 已支持 JSON，YAML 可用 js-yaml 库 |
| StateMachine 与 Flow 章节混淆用户 | 高 | 中 | UI 上明确区分概念，提供引导文案 |
| Schema 编辑复杂度导致工时超标 | 高 | 高 | MVP 采用自由 JSON，减少 Schema 选择器复杂度 |
| DDSCanvasStore 膨胀导致性能问题 | 中 | 低 | 监控 store 行数，超 500 行则拆分 |
| 跨章节边在新章节断连 | 中 | 中 | C1/C2 Epic 专门测试跨章节边渲染 |
| XState 格式生成不合法 | 中 | 高 | E4 专门测试 XState 合法性，MVP 降级为 JSON |

---

## 6. 关键设计决策（待 PM/Architect 确认）

| 模糊项 | 方案A（推荐） | 方案B |
|--------|-------------|--------|
| API Schema 编辑方式 | 自由 JSON textarea | Schema 选择器（引用已有 DomainEntity） |
| StateMachine 导出格式 | JSON（MVP） | XState（后续迭代） |
| 新章节 Store 架构 | 扩展 DDSCanvasStore | 独立 store |
| 章节显示方式 | 5 章节全部显示 | 3+2 可选（通过 toolbar 切换） |
| StateMachine 转移表达 | 边 + guard 文本（MVP） | 完整 action/guard 配置面板 |

---

## 7. 验收标准具体性

| 功能 | 验收标准 | 可测试性 |
|------|---------|---------|
| A1 | ComponentPanel 显示 GET/POST/PUT/DELETE/PATCH 5 种组件 | ✅ 单元测试 |
| A3 | 修改 path → 节点标签立即更新 | ✅ 单元测试 |
| A6 | 导出 JSON 用 `npx swagger-cli validate` 通过 | ✅ E2E 测试 |
| B2 | StateMachineCard 显示状态类型图标 | ✅ 单元测试 |
| B4 | 创建转移边 → 选择 guard 文本 → 显示在边上 | ✅ E2E 测试 |
| B6 | 导出 XState JSON 可被 `xstate` 包解析 | ✅ 单元测试 |
| C1 | API → Requirement 跨章节边正确渲染 | ✅ E2E 测试 |
| C3 | DDSToolbar 显示 5 个章节，点击切换 | ✅ 单元测试 |

---

## 8. 总体评估

| 维度 | 评分 | 说明 |
|------|------|------|
| 技术可行性 | ✅ 5/5 | OpenAPIGenerator/flowMachine 已有完整资产 |
| 架构一致性 | ✅ 5/5 | 复用 DDS Canvas 全部基础设施 |
| 工时合理性 | ⚠️ 4/5 | 43.5h 较重，但 Epic 划分清晰 |
| 风险可控性 | ⚠️ 4/5 | 主要是 Schema 编辑复杂度和 StateMachine 表达完整性 |
| 复用资产价值 | ✅ 5/5 | 719行 OpenAPIGenerator + 296行 flowMachine 直接复用 |

**综合**: ✅ Recommended — Sprint2 基座完善，Sprint4 扩展有坚实基础，工时虽重但风险可控。

---

*产出时间: 2026-04-18 01:38 GMT+8*
