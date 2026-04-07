# AGENTS.md — Canvas API 标准化开发约束

**项目**: vibex-canvas-api-standardization  
**Agent**: architect (设计) → dev (执行) → reviewer (审查) → tester (测试)  
**日期**: 2026-03-29

---

## ⛔⛔⛔ 执行前必读 ⛔⛔⛔

> **🔴 本项目为代码迁移/标准化项目，禁止修改 API 业务逻辑。**

---

## 1. 项目基础信息

| 属性 | 值 |
|------|-----|
| **工作目录** | `/root/.openclaw/vibex` |
| **前端代码** | `vibex-fronted/` |
| **后端代码** | `vibex-backend/` |
| **文档目录** | `docs/vibex-canvas-api-standardization/` |
| **API 版本** | `/api/v1/canvas/*` (唯一标准) |
| **SSE 端点** | `/api/v1/analyze/stream` |

---

## 2. 开发约束 (Red Lines)

### 🔴 绝对禁止

| # | 约束 | 原因 |
|---|------|------|
| R-01 | **禁止修改 API 业务逻辑** — 只能改路径、文件位置、命名空间，不能改函数内部实现 | 标准化不是重构，功能必须保持不变 |
| R-02 | **禁止硬编码 API URL** — 所有端点必须通过 `api-config.ts` 获取 | 违反者 → PR 驳回 |
| R-03 | **禁止删除 v1 路由** — `/app/api/v1/canvas/` 目录不得删除 | v1 是唯一标准路由 |
| R-04 | **禁止删除现有测试文件** — 只能更新路径引用，不能删除测试用例 | 测试覆盖是验收标准 |
| R-05 | **禁止在 canvasApi.ts 中引入新的异步状态管理库** — 如需状态管理，仅使用现有方案 | 范围锁定在标准化，不扩展功能 |

### 🟡 必须执行

| # | 约束 | 验证方法 |
|---|------|----------|
| M-01 | 废弃旧路由前，必须全库扫描确认无引用 | `grep -r "/api/canvas" --include="*.ts" --include="*.tsx" \| grep -v "v1/canvas"` |
| M-02 | dddApi.ts 迁移后，所有引用必须同步更新 | `grep -r "dddApi" --include="*.ts" --include="*.tsx"` |
| M-03 | 删除旧路由目录前，必须确认无测试文件依赖 | `find . -path "*/__tests__/*" \| xargs grep "/api/canvas" \| grep -v "v1"` |
| M-04 | canvasApi.ts 中所有 `fetch` 调用必须指向 `getApiUrl()` | 代码审查 + ESLint |
| M-05 | canvasSseApi.ts 函数命名必须以 `canvasSse*` 为前缀 | 代码审查 |
| M-06 | sessionId 存储必须使用 localStorage key `vibex_canvas_session` | 代码审查 |

---

## 3. 文件变更清单

### 3.1 后端变更 (vibex-backend)

| 操作 | 文件/目录 | 说明 |
|------|-----------|------|
| **删除** | `src/app/api/canvas/` | 旧路由目录（确认无引用后删除） |

> ⚠️ **先确认无引用再删除**。如果存在引用，需先更新引用再删除。

### 3.2 前端变更 (vibex-fronted)

| 操作 | 文件/目录 | 说明 |
|------|-----------|------|
| **审查** | `src/lib/api-config.ts` | 确认 canvas 端点均以 `/v1/canvas/` 开头 |
| **审查** | `src/lib/canvas/api/canvasApi.ts` | 确认无硬编码 URL，无 `/api/canvas/` 调用 |
| **迁移** | `src/lib/canvas/api/dddApi.ts` → `src/lib/canvas/api/canvasSseApi.ts` | 重命名 + 重构 SSE 封装 |
| **更新** | 所有引用 `dddApi.ts` 的文件 | 更新 import 路径 |
| **清理** | `src/lib/canvas/api/dddApi.ts` | 迁移完成后删除原文件 |
| **创建** | `src/lib/canvas/api/types.ts` | 共享类型定义（可选项，如有需要） |

---

## 4. API 端点清单（v1 唯一标准）

| 端点 | 方法 | 路径 | 状态 |
|------|------|------|------|
| generate-contexts | POST | `/api/v1/canvas/generate-contexts` | ✅ 保留 |
| generate-flows | POST | `/api/v1/canvas/generate-flows` | ✅ 保留 |
| generate-components | POST | `/api/v1/canvas/generate-components` | ✅ 保留 |
| generate | POST | `/api/v1/canvas/generate` | ✅ 保留 |
| project | POST | `/api/v1/canvas/project` | ✅ 保留 |
| status | GET | `/api/v1/canvas/status` | ✅ 保留 |
| export | POST | `/api/v1/canvas/export` | ✅ 保留 |
| analyze/stream | GET | `/api/v1/analyze/stream` | ✅ 保留（SSE） |

---

## 5. 代码审查清单 (Reviewer Checklist)

### 5.1 文件操作审查

- [ ] `canvasApi.ts` 中无 `fetch` 调用直接写 URL
- [ ] `canvasApi.ts` 中无对 `/api/canvas/`（不含 v1）的调用
- [ ] `dddApi.ts` 原文件已删除
- [ ] 所有引用 `dddApi.ts` 的文件已更新为 `canvasSseApi.ts`
- [ ] `canvasSseApi.ts` 中函数命名以 `canvasSse*` 为前缀
- [ ] `api-config.ts` 中 canvas 相关端点均以 `/v1/` 开头

### 5.2 后端审查

- [ ] 全库无 `/api/canvas/`（不含 v1）引用
- [ ] `/app/api/canvas/` 目录已删除
- [ ] `/app/api/v1/canvas/` 目录 7 个端点均存在
- [ ] v1 路由功能与旧路由完全一致（通过 E2E 验证）

### 5.3 测试审查

- [ ] Canvas E2E 测试（contexts → flows → components）100% 通过
- [ ] VibeX 主页加载正常，无 404
- [ ] 无因路由废弃导致的回归问题

---

## 6. 验收标准 (AC) 快速索引

| AC | 描述 | 验证方法 |
|----|------|----------|
| AC-1 | `api-config.ts` 中所有 Canvas 端点均以 `/v1/canvas/` 开头 | 代码审查 |
| AC-2 | `canvasApi.ts` 中所有 `fetch` 调用均指向 `getApiUrl()` | 代码审查 |
| AC-3 | 全库无 `/api/canvas/`（不含 v1）引用 | `grep` 扫描 |
| AC-4 | `/app/api/canvas/` 目录已删除 | `find` 检查 |
| AC-5 | `dddApi.ts` 已迁移至 `canvasSseApi.ts` | 文件存在性 |
| AC-6 | `canvasSseApi.ts` 中函数以 `canvasSse*` 为前缀 | 代码审查 |
| AC-7 | sessionId 在全链路正确传递 | 代码审查 + E2E |
| AC-8 | Canvas E2E 测试 100% 通过 | `npm run e2e` |
| AC-9 | VibeX 页面无 404 | Playwright 截图 |
| AC-10 | API 响应格式一致 | 抽样检查 |

---

## 7. 异常处理

| 场景 | 处理方式 |
|------|----------|
| 扫描发现旧路由有外部引用 | 停止删除操作，更新引用后重试 |
| E2E 测试失败（路由废弃后） | 回滚旧路由删除，确认原因后重新执行 |
| SSE 端点迁移后连接失败 | 检查 `/api/v1/analyze/stream` 是否可访问 |
| sessionId 链路断裂 | 审查 localStorage 读写逻辑，补充 E2E 用例 |

---

## 8. 命名规范

| 对象 | 规范 | 示例 |
|------|------|------|
| API 配置文件 | `camelCase` + `apiConfig` | `canvasGenerateContexts: '/v1/canvas/generate-contexts'` |
| SSE API 模块 | `camelCase` + `canvasSse*` | `canvasSseAnalyze()`, `canvasSseStream()` |
| API 封装函数 | `camelCase` + 动词前缀 | `createProject()`, `generateContexts()` |
| SessionId Key | snake_case | `vibex_canvas_session` |
| 类型定义 | `PascalCase` | `CanvasSession`, `GenerateContextsOutput` |

---

*约束制定人: architect | 审核: pm + reviewer | 日期: 2026-03-29*
