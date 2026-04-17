# QA 验证报告 — vibex-sprint4-qa / analyze-requirements

**项目**: vibex-sprint4-qa
**角色**: Analyst（QA 需求分析）
**日期**: 2026-04-18
**主题**: Sprint4 详设画布扩展规格文档验证
**状态**: ✅ Pass with Gap Found

---

## 执行摘要

Sprint4 规格文档（`vibex-sprint4-spec-canvas-extend/analysis.md`）**基本通过 QA 验证**。Epic 拆分合理（5 Epic / 43.5h），代码资产盘点准确，接口兼容性分析正确。

**发现 1 个关键 Gap**：OpenAPIGenerator 使用 `z.ZodType<unknown>` 作为 request/response schema 类型，但 APIEndpointCard 用户只能输入 JSON Schema 字符串（textarea）。`APICanvasExporter.ts` 适配器需要显式实现 JSON Schema → Zod 类型转换或直接注入 raw schema，这部分工作量和风险在分析报告中被低估。

**结论**: ✅ Recommended — 有条件通过，建议 PRD 阶段补充 Schema 适配层明确方案。

---

## 1. Research 结果

### 1.1 历史经验

| 经验 | 内容 | Sprint4 适用性 |
|------|------|--------------|
| `canvas-testing-strategy.md` | Mock Store 真实反映 Zustand 行为 | ✅ 扩展 store 需同样原则 |
| `vibex-e2e-test-fix.md` | Epic 粒度与实现匹配 | ✅ Sprint2 E4 跨章节 DAG 是好的粒度参考 |
| Sprint2 29/29 完成记录 | 6 Epic 完整实现路径 | ✅ 直接复用 DDPipe 流程 |

### 1.2 代码资产验证

以下为分析报告中声称的资产，实际验证结果：

| 资产 | 行数 | 报告声称 | 实际验证 | 状态 |
|------|------|---------|---------|------|
| `OpenAPIGenerator.ts` | 719 | addEndpoint/addEndpoints/generate/writeFile | ✅ 全部存在 | ✅ |
| `flowMachine.ts` | 296 | FlowNode with start/end/process/decision/subprocess | ✅ 全部存在 | ✅ |
| `types/dds/index.ts` | ~270 | ChapterType/CardType 系统可扩展 | ✅ Record<ChapterType, ChapterData> 架构良好 | ✅ |
| `DDSCanvasStore.ts` | 215 | 可扩展新章节 | ✅ 使用 Record<ChapterType, ChapterData> | ✅ |
| `DDSToolbar.tsx` | ~200 | 需扩展 5 章节 | ⚠️ 硬编码 CHAPTER_LABELS 3个 | ⚠️ |
| `CrossChapterEdgesOverlay.tsx` | ~200 | 跨章节边已有 | ✅ findCardChapter 已实现 | ✅ |
| `flowContainer/flowMachine.ts` | 296 | 可扩展为 StateMachineCard | ✅ FlowNode 类型可复用 | ✅ |

### 1.3 Git History 分析

| Commit | 描述 | Sprint4 关联 |
|--------|------|------------|
| `61fa241a` | Sprint3 E2 组件属性面板（styles/events tabs） | N/A（Prototype Canvas）|
| `d795e72e` | Epic4 AI 草图导入 | N/A（Prototype Canvas）|
| `46477b60` | Epic3 响应式断点 | N/A（Prototype Canvas）|
| `335590a3` | Epic6 测试覆盖 143 tests | ✅ 新章节需同等测试覆盖 |
| `676c1be9` | Epic5 E5-U1/U2/U3 状态与错误处理 | ✅ 新章节需同等错误处理 |

---

## 2. 规格完整性验证

### 2.1 APIEndpointCard 规格检查

分析报告未显式定义 APIEndpointCard 接口。**需要补充以下规格**：

```typescript
// 建议添加到 src/types/dds/index.ts
export interface APIEndpointCard extends BaseCard {
  type: 'api-endpoint';
  path: string;                          // e.g., '/api/projects'
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  summary?: string;
  description?: string;
  parameters?: APIParameter[];           // Query/Header/Path 参数
  requestBody?: {
    contentType: 'application/json' | 'multipart/form-data' | 'application/x-www-form-urlencoded';
    schema: Record<string, unknown>;      // JSON Schema object
  };
  responses?: APIResponse[];             // 2xx/4xx/5xx 响应
  tags?: string[];
  deprecated?: boolean;
}

export interface APIParameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  required?: boolean;
  description?: string;
  schema: Record<string, unknown>;       // JSON Schema
}

export interface APIResponse {
  statusCode: number;
  description: string;
  schema?: Record<string, unknown>;       // JSON Schema
}
```

**Gap**: 分析报告未明确 APIEndpointCard 的类型定义。PRD 阶段需要补充。

### 2.2 StateMachineCard 规格检查

分析报告未显式定义 StateMachineCard 接口。**需要补充以下规格**：

```typescript
// 建议添加到 src/types/dds/index.ts
export type StateType = 'initial' | 'final' | 'normal' | 'choice' | 'join' | 'fork' | 'entry' | 'exit';

export interface StateMachineCard extends BaseCard {
  type: 'state-machine';
  stateId: string;                       // 状态标识（唯一）
  stateType: StateType;
  description?: string;
  events?: string[];                     // 可触发事件列表
  // transitions 通过 DDSEdge 表达（guard 在 edge.label）
}

export interface SMTransition {
  event: string;                         // 触发事件
  guard?: string;                        // guard 条件（文本）
  action?: string;                       // action 描述
  target: string;                        // 目标 stateId
}
```

**Gap**: 分析报告未明确 StateMachineCard 的类型定义。PRD 阶段需要补充。

### 2.3 ChapterType 扩展验证

```typescript
// 当前 src/types/dds/index.ts
export type ChapterType = 'requirement' | 'context' | 'flow';

// Sprint4 需扩展为
export type ChapterType = 'requirement' | 'context' | 'flow' | 'api' | 'businessRules';
```

**验证结果**: ✅ 可扩展，ChapterType 联合类型天然支持新增成员。

---

## 3. 接口兼容性验证

### 3.1 与 Sprint2（DDS Canvas 基座）兼容性

| 接口 | Sprint2 实现 | Sprint4 扩展方式 | 兼容性 |
|------|------------|----------------|--------|
| `DDSCanvasStore` | `chapters: Record<ChapterType, ChapterData>` | 扩展 initialChapters 增加 api/businessRules | ✅ |
| `ChapterData` | `{ type, cards, edges, loading, error }` | 新章节复用相同结构 | ✅ |
| `ChapterType` | `'requirement' \| 'context' \| 'flow'` | 直接添加新成员 | ✅ |
| `DDSEdge` | 含 sourceChapter/targetChapter | 新章节自动支持 | ✅ |
| `addCard(chapter, card)` | 泛型支持任何 ChapterType | 新 CardType 天然通过 | ✅ |

**关键验证**: `initialChapters` 在 DDSCanvasStore 中硬编码 3 个章节：

```typescript
// src/stores/dds/DDSCanvasStore.ts:36
const initialChapters: Record<ChapterType, ChapterData> = {
  requirement: createInitialChapterData('requirement'),
  context: createInitialChapterData('context'),
  flow: createInitialChapterData('flow'),
};
```

**需要修改**: Sprint4 需要在此处添加 `api` 和 `businessRules` 两个初始章节。

### 3.2 与 Sprint3（Prototype Canvas）兼容性

Sprint3 是 Prototype Canvas 扩展（Sprint3-prototype-extend），与 Sprint4 Spec Canvas 扩展**无直接代码依赖**，但共享部分技术栈：

| 组件 | Sprint3 | Sprint4 | 兼容性 |
|------|---------|---------|--------|
| React Flow | ProtoFlowCanvas | DDSFlow | ✅ 独立实例 |
| Zustand Store | prototypeStore | DDSCanvasStore | ✅ 独立 store |
| ui-schema | 共享 | 共享 | ✅ |
| API 层 | 共享 | 共享 | ✅ |

**结论**: ✅ Sprint3 和 Sprint4 无相互依赖，可并行开发。

### 3.3 与 api-contract.yaml 兼容性

`api-contract.yaml`（v1.1.0, 90+ 端点）定义了 VibeX 现有 API 契约。Sprint4 API 章节需要能**引用**而非重复定义这些端点。

**分析报告遗漏项**: APIEndpointCard 应支持引用 `api-contract.yaml` 中已有的 DomainEntity schema，而非仅支持自由输入 JSON Schema。这涉及 Schema 选择器功能，工作量较高（方案B）。

---

## 4. 导出器方案可实现性验证

### 4.1 OpenAPI Generator 集成分析

分析报告的架构：

```typescript
// 报告声称: APICanvasExporter.ts
export function exportToOpenAPI(cards: APIEndpointCard[]): OpenAPISpec {
  generator.addEndpoint({
    path: card.path,
    method: card.method,
    summary: card.summary,
    requestSchema: ???,  // card.requestBody.schema 是 JSON object
    responseSchema: ???,
  });
}
```

**关键 Gap**: `EndpointDefinition.requestSchema` 要求 `z.ZodType<unknown>`，但 APIEndpointCard 存储的是 `Record<string, unknown>`（JSON Schema）。

**可行方案**：

| 方案 | 描述 | 工时 | 风险 |
|------|------|------|------|
| A: 扩展 OpenAPIGenerator | 增加 `addEndpointRaw()` 支持 JSON Schema | 1h | 低 |
| B: JSON Schema → Zod 转换 | 用 `json-schema-to-zod` 在导出时转换 | 2h | 中（schema 复杂度） |
| C: 直接写入 JSON Schema | 在 addEndpoint 后手动 patch OpenAPISpec | 1h | 低（推荐） |

**验证结果**: ⚠️ **可行但需要明确方案**。建议 PRD 阶段选择方案 C（MVP），方案 A 作为后续迭代。

### 4.2 StateMachine → XState 导出分析

```typescript
// 分析报告声称的 SMExporter.ts
export function exportToXState(nodes, edges): XStateConfig
```

**验证**: `xstate` 包已在依赖中（flowMachine.ts 使用）。

**可行方案**：

| 方案 | 描述 | 工时 | 风险 |
|------|------|------|------|
| A: 简单 JSON 导出 | nodes/edges → 结构化 JSON | 1h | 低 |
| B: XState JSON | 符合 XState 5.0 schema | 3h | 高（xstate 版本兼容性） |
| C: 分阶段 | MVP: JSON, 后续: XState | 1h | 低（推荐） |

**验证结果**: ✅ 分析报告建议与 QA 验证一致：MVP 降级为 JSON 导出。

---

## 5. DDSToolbar 兼容性检查

```typescript
// src/components/dds/toolbar/DDSToolbar.tsx:21
const CHAPTER_LABELS: Record<ChapterType, string> = {
  requirement: '需求',
  context: '上下文',
  flow: '流程',
};
```

**需要修改**: Sprint4 Epic C3 需要扩展为 5 个标签：

```typescript
const CHAPTER_LABELS: Record<ChapterType, string> = {
  requirement: '需求',
  context: '上下文',
  flow: '流程',
  api: 'API规格',
  businessRules: '业务规则',
};
```

**验证结果**: ✅ 简单修改，不影响现有功能。

---

## 6. 风险矩阵

| 风险 | 影响 | 可能性 | 缓解 |
|------|------|--------|------|
| APIEndpointCard Schema 类型未定义 | 高 | 高 | PRD 阶段显式定义 CardType 接口 |
| StateMachineCard 类型未定义 | 高 | 高 | PRD 阶段显式定义 CardType 接口 |
| JSON Schema → Zod 转换缺失 | 高 | 高 | Epic A 增加 Schema 适配层（方案 C） |
| DDSToolbar 硬编码 3 章节 | 中 | 确定 | Epic C3 修改 CHAPTER_LABELS |
| StateMachine guard/action 表达深度不足 | 中 | 中 | MVP 降级为边 label 文本 |
| XState 版本兼容性 | 中 | 低 | MVP 降级为 JSON 导出 |

---

## 7. 验收标准具体性

| Epic | 功能 | 验收标准 | 可测试性 | 状态 |
|------|------|---------|---------|------|
| A1 | API 组件面板 | 面板显示 5 种方法类型 | ✅ | ✅ |
| A3 | API 属性面板 | 修改 path → 节点标签立即更新 | ✅ | ✅ |
| A6 | OpenAPI 导出 | `swagger-cli validate` 通过 | ✅ | ✅（需补充 Schema 适配层测试）|
| B2 | StateMachineCard | 节点显示状态类型图标 | ✅ | ✅ |
| B4 | 转移配置面板 | 创建转移边 → guard 文本显示在边上 | ✅ | ✅ |
| C3 | 章节切换器扩展 | DDSToolbar 显示 5 个章节 | ✅ | ⚠️（需更新 CHAPTER_LABELS）|

---

## 8. 总体评估

| 维度 | 评分 | 说明 |
|------|------|------|
| 规格完整性 | ⚠️ 3/5 | APIEndpointCard 和 StateMachineCard 类型定义缺失 |
| 接口兼容性 | ✅ 5/5 | DDSCanvasStore/ChapterType 扩展性良好 |
| 导出器可行性 | ✅ 4/5 | OpenAPIGenerator 可用，需明确 Schema 适配方案 |
| Epic 拆分合理性 | ✅ 5/5 | 5 Epic 划分清晰，粒度与 Sprint2 一致 |
| 风险识别 | ✅ 5/5 | 分析报告风险识别到位 |

**综合**: ✅ Recommended（有条件）— 主要 Gap 是 CardType 显式定义和 Schema 适配层，建议 PRD 阶段补充。

---

## 执行决策

- **决策**: 已采纳（有条件）
- **执行项目**: vibex-sprint4-qa
- **执行日期**: 2026-04-18
- **条件**: PRD 阶段必须显式定义 APIEndpointCard 和 StateMachineCard 类型；明确 JSON Schema 适配方案

---

*产出时间: 2026-04-18 02:30 GMT+8*
