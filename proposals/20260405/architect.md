# Architect 提案 — 2026-04-05

**Agent**: architect
**日期**: 2026-04-05
**项目**: vibex-proposals-20260405-final
**仓库**: /root/.openclaw/vibex
**分析视角**: Architect — 系统架构、模块边界、类型安全、技术债务

---

## 1. 提案列表

| ID | 类别 | 标题 | 影响范围 | 优先级 |
|----|------|------|----------|--------|
| A-P0-1 | architecture | Schema 一致性工程：Zod 统一前后端类型 | packages/types / 前端 / 后端 | P0 |
| A-P0-2 | tech-debt | SSR-Safe 编码规范标准化 | 全栈 React 组件 | P0 |
| A-P1-1 | scalability | API Surface 完整化追踪机制 | API 端点 | P1 |
| A-P1-2 | tech-debt | Mock/Real 边界可视化 | 前端组件 | P1 |

---

## 2. 提案详情

### A-P0-1: Schema 一致性工程 — Zod 统一前后端类型

**分析视角**: Architect — Schema drift 问题反复出现

**问题描述**:
近期连续出现 Schema 不一致导致的 bug：
1. `generate-contexts` JSDoc 使用 `sessionId`，代码使用 `generationId`
2. 测试 validator 使用 `sessionId`，Zod schema 使用 `generationId`
3. 前端 Zod schema 与后端 Interface 可能漂移

根本原因：**前后端类型各自维护，无单一真相来源**。

**根因分析**:
```
当前模式（不一致）:
  后端: TypeScript Interface → JSDoc 注释（手动同步）
  前端: Zod Schema（独立维护）
  测试: 手写 validator（又一套字段名）

问题: 三处修改不同步 → sessionId vs generationId 不匹配
```

**影响范围**:
- `packages/types/src/api/canvas.ts` — 无 package.json，无法被前端依赖
- `vibex-fronted/src/app/api/` — 后端 API route
- `vibex-fronted/src/lib/api/` — 前端 API 调用

**建议方案**:
1. 修复 `packages/types/package.json`（今日提案 P001），使其可被 workspace 依赖
2. 将 Zod schema 定义在 `packages/types/src/api/canvas.ts`
3. 前后端都从 `@vibex/types/api/canvas` 导入 schema
4. 测试使用 `@vibex/types` 的 schema 而非手写 validator

```typescript
// packages/types/src/api/canvas.ts
import { z } from 'zod';

export const GenerateContextsResponseSchema = z.object({
  success: z.boolean(),
  contexts: z.array(BoundedContextSchema),
  generationId: z.string(),  // ← 单一真相来源
  confidence: z.number(),
});

export type GenerateContextsResponse = z.infer<typeof GenerateContextsResponseSchema>;

// 后端 route.ts
import { GenerateContextsResponseSchema } from '@vibex/types/api/canvas';
const result = GenerateContextsResponseSchema.safeParse(response);
if (!result.success) return NextResponse.json({ success: false, error: 'Schema mismatch' });

// 前端 canvasApi.ts
import { GenerateContextsResponseSchema } from '@vibex/types/api/canvas';
const result = await res.json().then(r => GenerateContextsResponseSchema.parse(r));
```

**验收标准**:
- [ ] `packages/types/package.json` 存在且可被 pnpm workspace 依赖
- [ ] `GenerateContextsResponseSchema` 定义在 `packages/types`
- [ ] 后端 route 和前端 API client 都从 `@vibex/types` 导入 schema
- [ ] 手写 validator 从 codebase 移除

---

### A-P0-2: SSR-Safe 编码规范标准化

**分析视角**: Architect — Hydration 问题根因是 SSR 不安全代码

**问题描述**:
近期 4 个 hydration 问题（react-hydration-fix 分析）：
1. `setInterval` 在 SSR 无 timer API → 崩溃
2. `toLocaleDateString` 时区差异 → 渲染不一致
3. `dangerouslySetInnerHTML` SSR/CSR 差异 → mismatch
4. `persistQueryClient` 时机错误 → 读取脏数据

这些问题的根因是**没有 SSR-Safe 编码规范**，导致开发者在组件顶层调用浏览器 API。

**根因分析**:
```
SSR 运行时: 无 window/document/localStorage/setInterval
         ↓
组件顶层调用浏览器 API → SSR 时 undefined → hydration mismatch
         ↓
错误修复靠个人经验 → 同一问题反复出现（今天修复，明天重现）
```

**影响范围**:
- `vibex-fronted/src/components/` — 所有 React 组件
- `vibex-fronted/src/hooks/` — 自定义 hooks

**建议方案**:
在 `CLAUDE.md` / `AGENTS.md` 中增加 SSR-Safe 编码规范章节：

```markdown
## SSR-Safe 编码规范

### 禁止在组件顶层调用的 API
- window / document / localStorage / sessionStorage
- setInterval / setTimeout（同步版本）
- Math.random()（在组件顶层）
- Date.now()（在组件顶层，非 SSR-safe 的格式化）

### 正确做法
```typescript
// ✅ 正确：所有浏览器 API 在 useEffect 中
useEffect(() => {
  const interval = setInterval(() => { ... }, 100);
  return () => clearInterval(interval);
}, []);

// ✅ 正确：日期格式化用 toISOString（时区无关）
const date = new Date(ts).toISOString().split('T')[0];

// ✅ 正确：localStorage 在 useEffect 中
const [value, setValue] = useState(null);
useEffect(() => {
  setValue(localStorage.getItem('key'));
}, []);

// ❌ 错误：组件顶层调用
const token = localStorage.getItem('token'); // ← SSR 时 undefined
```

### suppressHydrationWarning 使用原则
- 仅在 SVG/Mermaid 等第三方渲染内容上使用
- 禁止在普通文本元素上使用（掩盖真正的 mismatch）
```

**验收标准**:
- [ ] `CLAUDE.md` 或 `AGENTS.md` 包含 SSR-Safe 规范章节
- [ ] 新增组件时 ESLint 检查浏览器 API 使用（`no-restricted-globals`）
- [ ] `suppressHydrationWarning` 仅在 SVG/富文本元素上使用

---

### A-P1-1: API Surface 完整化追踪机制

**分析视角**: Architect — API 覆盖度从未系统性盘点

**问题描述**:
frontend-mock-cleanup 分析发现 91.7% API 端点缺失，但这是偶然发现，不是主动追踪。当前没有机制持续监控 API 覆盖度，导致问题积累到影响用户时才发现。

**根因分析**:
```
前端期望 API 数量: 未知
后端实现 API 数量: 未知
覆盖度: 从未盘点

→ 用户反馈 "AI 生成不工作" 时才发现 API 缺失
```

**建议方案**:
在 `task_manager.py` 或 `proposals/` 中维护 API Surface 追踪：

```python
# proposals/api-surface-tracker.json
{
  "lastUpdated": "2026-04-05",
  "endpoints": {
    "generate-contexts": {
      "frontendCalls": 2,
      "backendImplemented": true,
      "backendWorking": false,  // canvas-api-500-fix 修复中
      "lastChecked": "2026-04-05"
    },
    "generate-flows": {
      "frontendCalls": 1,
      "backendImplemented": false,
      "backendWorking": null,
      "lastChecked": "2026-04-05"
    },
    "generate-components": {
      "frontendCalls": 1,
      "backendImplemented": false,
      "backendWorking": null,
      "lastChecked": "2026-04-05"
    }
  },
  "coverage": {
    "total": 3,
    "implemented": 1,
    "working": 0,
    "coveragePercent": 0
  }
}
```

**验收标准**:
- [ ] `proposals/api-surface-tracker.json` 存在
- [ ] 每次新提案涉及 API 时更新 tracker
- [ ] coveragePercent 可被查询

---

### A-P1-2: Mock/Real 边界可视化

**问题描述**:
frontend-mock-cleanup 发现多处 mock 遗留（`mockGenerateContexts`、`mockGenerateComponents`），但这些 mock 在代码中不明显，难以追踪哪些功能依赖真实 API、哪些依赖 mock。

**建议方案**:
建立 Mock 标记规范，在代码中明确标注：

```typescript
// ✅ 正确：MOCK_DATA 必须有显式注释
/**
 * @deprecated 生产环境使用 canvasStore.realData
 * TODO: canvas-api-500-fix 完成后移除此 mock
 */
const MOCK_DATA: CardTreeVisualizationRaw = { ... };

// ❌ 错误：mock 无标记，混入生产代码
const MOCK_DATA = { ... };  // ← 不知道是 mock
```

**验收标准**:
- [ ] 所有 mock 数据常量有 `@deprecated` + `TODO` 注释
- [ ] `cleanup-mocks.js` 检查 mock 标记存在性
- [ ] CI 检查无未标记 mock（`grep -r "MOCK_DATA\|mockGenerate" src/`）

---

## 3. 技术债务分析

| 债务项 | 紧急度 | 影响 | 建议 |
|--------|--------|------|------|
| packages/types 无 package.json | P0 | 类型共享体系失效 | A-P0-1 |
| SSR-Safe 无规范 | P0 | Hydration 问题反复出现 | A-P0-2 |
| API 覆盖度无追踪 | P1 | 问题积累到用户反馈才发现 | A-P1-1 |
| Mock 无标记 | P1 | mock 混入生产代码 | A-P1-2 |
| 手写 validator 残留 | P2 | Schema drift | A-P0-1 完成后移除 |

---

## 4. 做得好的

1. **近期架构工作高效**：今天完成的 6 个架构任务（canvas-api-500-fix / react-hydration-fix / frontend-mock-cleanup / tree-toolbar-consolidation / canvas-contexts-schema-fix / vibex-proposals-20260405）质量稳定，驳回率低
2. **Spec 模板化**：每个 Epic 有清晰的 spec 文件，具体到代码行号级别
3. **架构评审提前介入**：E1-F1~F3 等 Story 直接在 PRD 阶段定义接口变更

## 5. 需要改进的

| # | 问题 | 改进方向 |
|---|------|---------|
| 1 | Schema 无单一真相来源 | A-P0-1: Zod 统一 |
| 2 | SSR 不安全代码无规范 | A-P0-2: 编码规范 |
| 3 | 提案重复（vibex-proposals-20260405-2） | 提案提交前先检查是否与现有 Epic 重复 |
| 4 | 小项目无必要架构文档 | 0.3h 以下任务不强制要求完整 3 文档 |

---

*本文档由 Architect Agent 生成于 2026-04-05 02:55 GMT+8*
