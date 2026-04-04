# 前端 Mock 清理分析报告

**项目**: frontend-mock-cleanup
**角色**: analyst
**日期**: 2026-04-04
**状态**: ✅ 分析完成

---

## 执行摘要

扫描前端代码库中的 `jest.mock` / `vi.mock` 调用，识别需要后端 API 支持的功能。

**发现**: 前端期望 12 个 Canvas API 端点，但后端仅有 **1 个** (`/canvas/snapshots`) 实际实现。

**缺失率**: 91.7% (11/12 端点缺失)

---

## 1. Mock 使用统计

### 1.1 按类别分类

| 类别 | Mock 数量 | 说明 |
|------|-----------|------|
| Next.js 框架 | 12 | `next/navigation`, `next/link`, `next/dynamic` |
| 第三方库 | 15 | `axios`, `zustand`, `mermaid`, `framer-motion` 等 |
| API 服务层 | 8 | `@/services/api/*` |
| Canvas 模块 | 6 | `canvasApi`, `canvasStore` 各模块 |
| 内部组件 | 20+ | `FlowEditor`, `FlowRenderer`, `CardTreeView` 等 |

### 1.2 Mock 文件分布

```
src/
├── services/api/              # 5 test files
│   ├── __tests__/            # client, retry tests
│   └── modules/__tests__/    # requirement, flow, ddd tests
├── app/                      # 8 page test files
│   ├── __tests__/           # accessibility
│   ├── auth/, chat/, flow/   # page tests
│   └── domain/, project/     # page tests
├── components/               # 15+ test files
│   ├── canvas/              # CanvasToolbar, trees
│   ├── visualization/       # FlowRenderer, MermaidRenderer
│   └── homepage/            # CardTree, Navbar
└── hooks/                   # 5 hook test files
    └── canvas/             # useCanvasEvents, useAutoSave
```

---

## 2. Canvas API 端点分析

### 2.1 前端期望的 API 端点

| 端点 | 方法 | 功能 | 测试文件数 | 状态 |
|------|------|------|-----------|------|
| `/v1/canvas/generate-contexts` | POST | 生成限界上下文树 | 2 | ❌ 缺失 |
| `/v1/canvas/generate-flows` | POST | 生成业务流程树 | 2 | ❌ 缺失 |
| `/v1/canvas/generate-components` | POST | 生成组件树 | 2 | ❌ 缺失 |
| `/v1/canvas/status` | GET | 轮询生成状态 | 3 | ❌ 缺失 |
| `/v1/canvas/project` | POST | 创建项目 | 1 | ❌ 缺失 |
| `/v1/canvas/generate` | POST | 触发生成队列 | 1 | ❌ 缺失 |
| `/v1/canvas/export` | GET | 导出项目 Zip | 1 | ❌ 缺失 |
| `/v1/canvas/stream` | GET | SSE 流式响应 | 1 | ❌ 缺失 |
| `/canvas/snapshots` | GET | 快照列表 | 2 | ✅ 存在 |
| `/v1/canvas/snapshots/:id` | GET | 获取快照 | 1 | ❌ 缺失 |
| `/v1/canvas/snapshots/:id/restore` | POST | 恢复快照 | 1 | ❌ 缺失 |
| `/v1/canvas/snapshots/latest` | GET | 最新快照 | 1 | ❌ 缺失 |

### 2.2 后端实际实现

```
vibex-backend/src/app/api/
├── canvas/
│   └── snapshots/
│       └── route.ts    # ✅ 仅此一个端点实现
```

---

## 3. 缺失 API 优先级评估

### P0 — 必须实现（阻塞核心功能）

| API | 功能 | 影响 |
|-----|------|------|
| `POST /v1/canvas/generate-contexts` | AI 生成限界上下文 | 无法使用 AI 辅助建模 |
| `POST /v1/canvas/generate-flows` | AI 生成业务流程 | 无法使用 AI 辅助建模 |
| `POST /v1/canvas/generate-components` | AI 生成组件树 | 无法使用 AI 辅助建模 |
| `GET /v1/canvas/status` | 轮询生成状态 | 无法知道生成进度 |

### P1 — 应该实现（提升体验）

| API | 功能 | 影响 |
|-----|------|------|
| `POST /v1/canvas/project` | 项目持久化 | 数据不保存 |
| `GET /v1/canvas/export` | 导出 Zip | 无法导出项目 |

### P2 — 可选实现

| API | 功能 | 影响 |
|-----|------|------|
| `GET /v1/canvas/stream` | SSE 流式 | 可用轮询替代 |
| `GET /v1/canvas/snapshots/:id` | 获取指定快照 | 快照功能受限 |
| `POST /v1/canvas/snapshots/:id/restore` | 恢复快照 | 快照功能受限 |
| `GET /v1/canvas/snapshots/latest` | 最新快照 | 快照功能受限 |

---

## 4. 技术方案

### 方案 A: 实现所有 Canvas API（推荐）

**改动范围**:
- 新增 `src/app/api/canvas/generate-contexts/route.ts`
- 新增 `src/app/api/canvas/generate-flows/route.ts`
- 新增 `src/app/api/canvas/generate-components/route.ts`
- 新增 `src/app/api/canvas/status/route.ts`
- 完善 `src/app/api/canvas/snapshots/route.ts`

**工时**: 8-12h
**风险**: 低

**验收标准**:
```typescript
// 移除 mock 后测试仍然通过
const response = await fetch('/api/v1/canvas/generate-contexts', {
  method: 'POST',
  body: JSON.stringify({ requirementText: '用户登录流程' }),
});
expect(response.ok).toBe(true);
const data = await response.json();
expect(data.contexts).toBeDefined();
```

---

### 方案 B: 保留 Mock，分阶段实现

**改动范围**:
- 保留当前 mock 测试
- 按优先级逐步实现 API

**工时**: 2-4h/P0 API
**风险**: 中（mock 与真实实现可能不一致）

---

## 5. Mock 清理建议

### 5.1 可立即移除的 Mock

| Mock | 原因 | 风险 |
|------|------|------|
| `jest.mock('axios')` | axios 是真实 HTTP 库，应测试真实请求 | 低 |
| `jest.mock('next/navigation')` | 应使用 Next.js 提供的 Testing Library | 低 |

### 5.2 应保留的 Mock

| Mock | 原因 |
|------|------|
| 第三方 UI 库 | `mermaid`, `framer-motion` 不需要在单元测试渲染 |
| 重量级组件 | `FlowEditor`, `CardTreeView` 应在 E2E 测试 |
| Store mocks | Zustand store 在单元测试中用 mock isolated |

### 5.3 需替换为真实 API 的 Mock

| Mock | 替换方案 |
|------|----------|
| `canvasApi.generateContexts` | 实现 `POST /v1/canvas/generate-contexts` |
| `canvasApi.generateFlows` | 实现 `POST /v1/canvas/generate-flows` |
| `canvasApi.generateComponents` | 实现 `POST /v1/canvas/generate-components` |
| `canvasApi.getStatus` | 实现 `GET /v1/canvas/status` |

---

## 6. 工时估算

| 任务 | 工时 | 优先级 |
|------|------|--------|
| 实现 P0 API（4个） | 8-10h | P0 |
| 实现 P1 API（2个） | 3-4h | P1 |
| 实现 P2 API（4个） | 4-6h | P2 |
| 清理可移除的 Mock | 2h | P1 |
| E2E 测试覆盖 | 6h | P1 |
| **总计** | **23-28h** | - |

---

## 7. 下一步行动

1. **create-prd**: PM 细化 API 实现计划
2. **design-architecture**: 确定 API 架构
3. **coord-decision**: 决策实现范围

---

## 附录: Mock 详细清单

### A. API Service Mocks

```
@/services/api/client         # 5 tests
@/services/api/cache          # 3 tests  
@/services/api/modules/*      # 4 tests
@/services/api/diagnosis      # 1 test
```

### B. Canvas Store Mocks

```
@/lib/canvas/canvasStore      # 3 tests
@/lib/canvas/stores/*        # 8 tests
@/lib/canvas/api/canvasApi   # 2 tests
```

### C. Component Mocks

```
@/components/ui/FlowEditor    # 4 tests
@/components/ui/FlowPropertiesPanel # 2 tests
@/components/visualization/*   # 6 tests
@/components/homepage/*       # 5 tests
```

---

**分析完成时间**: 2026-04-04 18:45 GMT+8
**分析时长**: ~15min
