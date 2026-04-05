# 开发约束 — vibex-dev-proposals-20260406

**Agent**: architect  
**Date**: 2026-04-06  
**范围**: vibex-frontend + vibex-backend 技术债务修复  
**有效期**: 本次修复工作期间（2026-04-06 起）

---

## 1. 强制规范

### 1.1 TypeScript 规范

- **所有 TypeScript 文件必须通过 `tsc --noEmit`**：任何 PR 在前后端 `tsc --noEmit` 未通过的情况下不得合并。
- **禁止使用 `any` 类型**：除非绝对必要，且必须附带 `// TODO: 明确类型` 注释。
- **类型必须先于实现定义**：新增 API 路由时，先定义 request/response 类型，再实现 handler。
- **测试文件同等要求**：`.test.ts` / `.test.tsx` 文件同样必须通过类型检查。

### 1.2 组件规范

- **组件文件行数上限**: 单一 React 组件文件（.tsx）不超过 **200 行**。超过则强制拆分。
- **Prompt 模板单一来源**：`generate-components` 的 Prompt 必须使用 `src/lib/prompts/generate-components.ts`，禁止在 route handler 中内联。
- **禁止重复实现**：相同业务逻辑只允许存在一个实现。两套实现并存时，必须在本次修复中合并或删除其一。

### 1.3 测试规范

- **重构必须有测试保护**：对 BusinessFlowTree 等核心组件重构前，必须先补充或确认现有测试通过。
- **新增 Hook 必须独立测试**：`use*.ts` 文件应配套 `use*.test.ts`，验证核心业务逻辑。
- **CI 测试必须通过**：PR 必须通过所有测试（包括 `npm test` 和 `tsc --noEmit`）才能合并。

### 1.4 API 规范

- **Prompt 约束强制声明**：generate-* API 的 Prompt 必须包含以下约束：
  - 禁止输出 `unknown`
  - 必须包含关联实体的 ID 字段（flowId、ctx.id 等）
  - 字段类型必须明确（禁止 `Record<string, unknown>` 无说明）
- **单一端点原则**：同一业务功能的 API 端点只允许存在一个（本次修复目标）。

### 1.5 提交规范

- **原子提交**：每次 commit 只做一件事（一个 BUG 修复 / 一个重构 / 一个测试补充）。
- **Commit message 格式**：
  ```
  <type>(<scope>): <subject>
  
  <type>: fix | feat | refactor | test | docs | chore
  <scope>: frontend | backend | common
  ```
- **示例**：
  ```
  fix(frontend): 修复 BusinessFlowTree 导出命名
  refactor(backend): 合并 generate-components 到统一端点
  test(common): 添加 useHandleContinueToComponents 单元测试
  ```

---

## 2. 禁止事项

### 2.1 绝对禁止

- 🚫 **禁止在 `tsc --noEmit` 未通过的情况下提交代码**
- 🚫 **禁止引入新的 TypeScript 错误**（每个 PR 新增错误 ≤ 0）
- 🚫 **禁止新增 `any` 类型**（rebase 修复除外）
- 🚫 **禁止创建超过 200 行的组件文件**
- 🚫 **禁止新增重复的 API 实现**（同一端点两套实现）
- 🚫 **禁止删除或跳过现有测试**
- 🚫 **禁止硬编码 secrets**（API key、token 等必须通过环境变量）
- 🚫 **禁止在 route handler 中内联 Prompt 模板**

### 2.2 强烈不建议

- ⚠️ 避免在组件中直接调用 API（使用 service 层封装）
- ⚠️ 避免裸 `try/catch`（catch 块必须有具体处理逻辑）
- ⚠️ 避免 `setTimeout` / `setInterval`（使用 AbortController 或 cleanup 机制）
- ⚠️ 避免在渲染层直接操作 DOM（使用 React 原生 API）

---

## 3. 审查清单

### 3.1 PR 合并前检查清单

执行 Dev Agent 或 Reviewer 在合并前必须逐项确认：

#### 代码质量
- [ ] `cd frontend && npx tsc --noEmit` 输出 `Found 0 errors`
- [ ] `cd backend && npx tsc --noEmit` 输出 `Found 0 errors`
- [ ] `cd frontend && npm test` 全部通过
- [ ] `cd backend && npm test` 全部通过
- [ ] ESLint 检查通过（无新增 warnings/errors）

#### 架构规范
- [ ] 组件文件 < 200 行（如有拆分，验证新文件存在）
- [ ] Prompt 模板引用 `src/lib/prompts/generate-components.ts`
- [ ] 无重复的 API 端点实现
- [ ] 新增文件符合项目结构（components/、hooks/、lib/、services/ 分离）

#### 业务正确性
- [ ] `generate-components` API 返回正确的 `flowId`（非 unknown）
- [ ] `contextSummary` 包含 `ctx.id` 字段
- [ ] BusinessFlowTree 重构后功能不受影响（手动验证）

#### 测试覆盖
- [ ] 新增/重构的 Hook 有对应测试文件
- [ ] 测试覆盖率未下降
- [ ] 集成测试覆盖关键路径

### 3.2 本次专项检查清单

针对本项目（vibex-dev-proposals-20260406）额外检查：

- [ ] `src/routes/v1/canvas/index.ts` 中的 generate-components 逻辑已移除
- [ ] `src/lib/prompts/generate-components.ts` 存在且被 `route.ts` 引用
- [ ] `route.ts` 中 `contextSummary` 包含 `ctx.id`
- [ ] `BusinessFlowTree/` 目录结构符合 architecture.md 定义
- [ ] `useHandleContinueToComponents.test.ts` 存在且通过
- [ ] `BusinessFlowTree.tsx` 入口文件 < 50 行

---

## 4. 违反处理

| 违规行为 | 处理方式 |
|----------|----------|
| CI 中 `tsc --noEmit` 失败 | 阻断合并，自动通知 |
| 组件文件超过 200 行 | Reviewer 强制要求拆分 |
| 重复 API 实现 | Reviewer 强制要求合并或删除 |
| 新增 `any` 类型 | Reviewer 要求明确类型定义 |
| 测试覆盖率下降 | CI 失败，禁止合并 |

---

## 5. 例外申请

如因特殊原因需要突破上述约束（如：紧急 hotfix 需要暂时绕过），必须：

1. 在 PR description 中明确说明例外原因
2. 附带 `// FIXME: <具体问题>` 注释并附上 ticket 链接
3. 在 24h 内提交后续修复 PR

---

*本文档由 Architect Agent 编制，作为 Dev Agent 的执行标准。所有约束在本次技术债务修复期间强制生效。*
