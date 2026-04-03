# VibeX Canvas API 标准化 PRD

**项目**: vibex-canvas-api-standardization  
**阶段**: Phase 1 — 产品需求  
**Agent**: pm  
**日期**: 2026-03-29  
**状态**: Draft

---

## 1. 背景与目标

### 1.1 背景

VibeX 是一个 AI 驱动的应用原型生成平台，Canvas 是其核心设计界面。当前 Canvas 功能存在两套并行的 API 路由体系：

- **旧路由**: `/api/canvas/*`（早期实现，未完全废弃）
- **新路由**: `/api/v1/canvas/*`（标准化版本）

7 个端点同时存在于两套路径下，功能高度重叠但维护成本翻倍。前端 API 封装分散在 `canvasApi.ts` 和 `dddApi.ts` 两个文件中。

### 1.2 目标

| 目标 | 描述 |
|------|------|
| **O1** | 统一 Canvas API 调用入口为 `/api/v1/canvas/*` |
| **O2** | 废弃旧路由 `/api/canvas/*`，消除重复维护负担 |
| **O3** | 规范化两步设计流程 API（Step1 业务流程 → Step2 组件树） |
| **O4** | SSE 流式端点纳入 Canvas 统一管理 |

### 1.3 非目标

- 不修改 API 业务逻辑（功能行为保持不变）
- 不引入新的 API 网关或代理层
- 不改变前端 UI/UX 交互流程

---

## 2. 功能范围

### 2.1 包含范围

| ID | 功能域 | 具体内容 |
|----|--------|----------|
| F1 | 前端路由标准化 | 审查清理 `api-config.ts`、`canvasApi.ts`，确保全部调用走 `/v1/canvas/*` |
| F2 | SSE 端点整合 | 将 `dddApi.ts` 移入 `src/lib/canvas/api/` 并重命名为 `canvasSseApi.ts` |
| F3 | 后端旧路由废弃 | 删除 `/app/api/canvas/` 目录（确认无外部依赖后） |
| F4 | 两步设计流程验证 | 确认 sessionId 在 `contexts → flows → components` 全链路传递 |
| F5 | E2E 测试覆盖 | Canvas 完整流程（contexts → flows → components）E2E 测试通过 |

### 2.2 不包含范围

- API 业务逻辑修改
- 新增 API 端点
- 前端 UI/UX 改动
- 数据库 schema 变更

---

## 3. 用户故事 & 功能点

### 3.1 Epic

> **EPIC: Canvas API 标准化**  
> 作为前端开发者，我希望所有 Canvas API 调用统一通过 `/api/v1/canvas/*`，这样我可以无需记忆两套路径，降低集成错误率。

---

### 3.2 用户故事

| # | 故事 | 角色 | 验收条件 |
|---|------|------|----------|
| US-1 | 统一 API 调用入口 | 前端开发者 | 所有 Canvas 端点均通过 `/v1/canvas/*` 调用，无硬编码 URL |
| US-2 | SSE 端点集中管理 | 前端开发者 | `dddApi.ts` 已移入 `src/lib/canvas/api/canvasSseApi.ts`，纳入 Canvas 模块 |
| US-3 | 旧路由安全废弃 | 运维/开发者 | `/app/api/canvas/` 旧路由目录已删除，外部无引用 |
| US-4 | 完整流程可追溯 | 平台使用者 | contexts → flows → components 的 sessionId 链路完整 |
| US-5 | 回归测试覆盖 | 测试工程师 | Canvas E2E 测试覆盖完整流程，通过率 100% |

---

### 3.3 功能点详情

#### F1: 前端路由标准化

**描述**: 审查并清理前端所有 Canvas API 调用，确保统一使用 `/api/v1/canvas/*` 前缀，无硬编码 URL。

| ID | 子功能 | 验收标准 | 页面集成 |
|----|--------|----------|----------|
| F1.1 | api-config.ts 端点审查 | `api-config.ts` 中所有 Canvas 端点均以 `/v1/canvas/` 开头 | 否 |
| F1.2 | canvasApi.ts 清理 | `canvasApi.ts` 中所有 `fetch` 调用均指向 `getApiUrl()`，无硬编码 URL | 否 |
| F1.3 | 死代码清理 | `canvasApi.ts` 中无调用 `/api/canvas/`（不含 v1）的代码路径 | 否 |

#### F2: SSE 端点整合

**描述**: 将分散的 SSE 流式端点封装移入 Canvas 模块统一管理。

| ID | 子功能 | 验收标准 | 页面集成 |
|----|--------|----------|----------|
| F2.1 | dddApi.ts 迁移 | `src/lib/api/dddApi.ts` 已迁移至 `src/lib/canvas/api/canvasSseApi.ts` | 否 |
| F2.2 | 导出路径更新 | 原引用 `dddApi.ts` 的所有文件已更新为 `canvasSseApi.ts` | 否 |
| F2.3 | SSE 命名空间统一 | `canvasSseApi.ts` 导出函数以 `canvasSse*` 为命名前缀 | 否 |

#### F3: 后端旧路由废弃

**描述**: 确认旧路由无外部依赖后，删除 `/app/api/canvas/` 目录。

| ID | 子功能 | 验收标准 | 页面集成 |
|----|--------|----------|----------|
| F3.1 | 依赖扫描 | 全库搜索 `/api/canvas/`（不含 v1）无任何引用 | 否 |
| F3.2 | 旧路由目录删除 | `/app/api/canvas/` 目录已删除或仅保留空占位文件 | 否 |
| F3.3 | v1 路由功能验证 | 所有 7 个 v1 端点（contexts, flows, components, generate, project, status, export）响应正常 | 否 |

#### F4: 两步设计流程 sessionId 链路验证

**描述**: 确认从 contexts 到 flows 到 components 的 sessionId 在各步骤间正确传递。

| ID | 子功能 | 验收标准 | 页面集成 |
|----|--------|----------|----------|
| F4.1 | sessionId 生成 | `generate-contexts` 返回的 sessionId 可被后续请求使用 | 否 |
| F4.2 | sessionId 传递 | `generate-flows` 和 `generate-components` 请求中包含正确 sessionId | 否 |
| F4.3 | sessionId 存储确认 | sessionId 存储介质明确（localStorage / 内存），无隐式丢失 | 否 |

#### F5: E2E 测试覆盖

**描述**: 补充 Canvas 完整流程的 E2E 测试，确保标准化后功能无回归。

| ID | 子功能 | 验收标准 | 页面集成 |
|----|--------|----------|----------|
| F5.1 | 完整流程 E2E | `npm run e2e` 中 Canvas 流程测试（contexts → flows → components）全部通过 | 是 |
| F5.2 | 主页无 404 | VibeX Canvas 页面加载正常，无资源 404 | 是 |

---

## 4. 验收标准汇总

| # | 验收标准 | 验证方法 | 负责角色 |
|---|----------|----------|----------|
| AC-1 | `api-config.ts` 中所有 Canvas 端点均以 `/v1/canvas/` 开头 | 代码审查 | reviewer |
| AC-2 | `canvasApi.ts` 中所有 `fetch` 调用均指向 `getApiUrl()`，无硬编码 URL | 代码审查 | reviewer |
| AC-3 | 全库无 `/api/canvas/`（不含 v1）引用 | `grep -r "/api/canvas" --include="*.ts" --include="*.tsx"` | dev |
| AC-4 | `/app/api/canvas/` 目录已删除 | `find . -path "*/app/api/canvas" -type d` | dev |
| AC-5 | `dddApi.ts` 已迁移至 `src/lib/canvas/api/canvasSseApi.ts` | 文件存在性检查 | dev |
| AC-6 | `canvasSseApi.ts` 中 SSE 函数以 `canvasSse*` 为前缀 | 代码审查 | reviewer |
| AC-7 | sessionId 在 contexts → flows → components 全链路传递正确 | 代码审查 + E2E 测试 | tester |
| AC-8 | Canvas E2E 测试（contexts → flows → components）100% 通过 | `npm run e2e` | tester |
| AC-9 | VibeX Canvas 页面加载正常，无 404 资源 | Playwright 截图验证 | tester |
| AC-10 | API 响应格式一致（所有端点返回 `{success, data, error?}` 结构） | 抽样检查各端点响应 | reviewer |

---

## 5. 优先级矩阵

| 功能点 | 业务价值 | 技术风险 | 优先级 | 工时估算 |
|--------|----------|----------|--------|----------|
| F1.1 api-config.ts 审查 | 高 | 低 | P0 | 0.25d |
| F1.2 canvasApi.ts 清理 | 高 | 低 | P0 | 0.25d |
| F3.1 依赖扫描 | 高 | 中 | P0 | 0.25d |
| F3.2 旧路由目录删除 | 高 | 中 | P0 | 0.25d |
| F2.1 dddApi.ts 迁移 | 中 | 低 | P1 | 0.25d |
| F2.2 导出路径更新 | 中 | 低 | P1 | 0.25d |
| F3.3 v1 路由功能验证 | 高 | 低 | P1 | 0.25d |
| F4.1-F4.3 sessionId 链路验证 | 中 | 低 | P1 | 0.25d |
| F5.1 E2E 测试 | 高 | 低 | P1 | 0.5d |
| F5.2 主页无 404 | 中 | 低 | P2 | 0.25d |
| F1.3 死代码清理 | 低 | 低 | P2 | 0.25d |
| F2.3 SSE 命名空间统一 | 低 | 低 | P2 | 0.25d |

**总工时估算**: ~3 人天

---

## 6. Definition of Done

每个功能点完成后必须满足：

1. **代码变更已完成** — 相关文件已修改并通过 ESLint / TypeScript 编译检查
2. **验收标准满足** — AC-1 ~ AC-10 对应标准均已通过
3. **无硬编码 URL** — 所有 API 调用通过 `getApiUrl()` 或 `api-config.ts` 配置获取
4. **无回归** — Canvas E2E 测试 100% 通过
5. **文档更新** — API 变更记录在 CHANGELOG 中（如有）

---

## 7. 风险与应对

| 风险 | 等级 | 应对措施 |
|------|------|----------|
| 外部系统调用旧路由 | 中 | 部署前全库搜索 `/api/canvas/`（不含 v1），确认无引用后再删除 |
| 旧路由被测试覆盖 | 中 | 迁移后更新/删除相关测试文件 |
| SSE 端点引用路径未全面更新 | 低 | 迁移后 grep 确认无残留 `dddApi.ts` 引用 |
| sessionId 丢失导致两步设计断裂 | 低 | 补充 sessionId 链路 E2E 测试 |

---

## 8. 下一步

| 角色 | 行动 |
|------|------|
| **architect** | 基于本 PRD 创建 `architecture.md`，确认技术方案（渐进式废弃 vs 网关代理） |
| **dev** | 按优先级实施功能点 |
| **tester** | 编写/补充 Canvas E2E 测试用例 |
| **reviewer** | 制定代码审查清单（重点：硬编码 URL 检测、旧路由引用检测） |

---

*撰写人: pm | 生成时间: 2026-03-29*
