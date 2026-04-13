# AGENTS.md — vibex-canvas-history-projectid 实施指南

**项目**: vibex-canvas-history-projectid
**阶段**: 实施（Phase 1 止血 + Phase 2 根治）
**日期**: 2026-04-14
**基于**: architecture.md + IMPLEMENTATION_PLAN.md

---

## 角色与职责

| 角色 | 职责 |
|------|------|
| Architect | 提供架构方案、代码规范、验收清单 |
| Coder | Phase 1 + Phase 2 代码实现 |
| QA | E2E 测试编写与验证 |
| Reviewer | 代码审查 + 回归验证 |

---

## 实施顺序

### Phase 1（止血，优先级最高）

1. **Coder**: 修改 `useVersionHistory.ts`（Step 1）
2. **Coder**: 修改 `VersionHistoryPanel.tsx`（Step 2）
3. **Coder**: 构建验证 `pnpm build`
4. **Coder**: 编写单元测试 `useVersionHistory.test.ts`（Step 4）
5. **QA**: 编写 E2E 测试（Step 5）
6. **Reviewer**: 代码审查 + 合入

### Phase 2（根治）

1. **Coder**: CanvasPage URL 注入（Step 2.1）
2. **Coder**: projectId 合法性校验（Step 2.2）
3. **Coder**: 构建 + 测试验证
4. **Reviewer**: 代码审查 + 合入

---

## 关键文件清单

### 必改文件（Phase 1）

| 文件 | 改动类型 |
|------|----------|
| `src/hooks/canvas/useVersionHistory.ts` | 修改：空值拦截 + useEffect |
| `src/components/canvas/features/VersionHistoryPanel.tsx` | 修改：引导 UI |
| `src/hooks/canvas/useVersionHistory.test.ts` | 新建：单元测试 |
| `src/components/canvas/features/VersionHistoryPanel.module.css` | 修改：引导 UI 样式 |

### 新建文件

| 文件 | 说明 |
|------|------|
| `e2e/version-history-no-project.spec.ts` | E2E：无 projectId 场景测试 |

### 必读文件

| 文件 | 说明 |
|------|------|
| `docs/vibex-canvas-history-projectid/architecture.md` | 架构方案 |
| `docs/vibex-canvas-history-projectid/IMPLEMENTATION_PLAN.md` | 详细实施步骤 |
| `docs/vibex-canvas-history-projectid/analysis.md` | 根因分析 |
| `docs/vibex-canvas-history-projectid/prd.md` | PRD 验收标准 |

---

## 代码规范

### 原则

1. **不改后端 API**：所有修复在前端 Hook/UI 层完成
2. **防御性编程**：`projectId` 空值检查优先于 API 调用
3. **错误消息本地化**：引导消息使用中文，格式统一为"请先创建项目后再..."
4. **向后兼容**：Phase 1 不破坏已有功能
5. **无 TypeScript any 泄漏**

### 禁止

- 禁止在 `canvasApi` 层做空值转换（`?? undefined` / `?? null`）来掩盖问题
- 禁止直接修改 `sessionStore.ts` 改变 `projectId` 默认值（会影响其他依赖）
- 禁止忽略 `skipHydration` 机制（这是正确的 SSR 修复，不应撤回）

---

## 验收标准

### Phase 1 完成标准

- [ ] `useVersionHistory.ts` 中 `loadSnapshots()` 在 `projectId=null` 时：
  - [ ] 不调用 `canvasApi.listSnapshots`
  - [ ] 设置 error 消息包含"请先创建项目"
  - [ ] 设置 snapshots 为空数组
- [ ] `createSnapshot()` 在 `projectId=null` 时：
  - [ ] 不调用 `canvasApi.createSnapshot`
  - [ ] 设置 error 消息
  - [ ] 返回 `null`
- [ ] `projectId` 从 `null` → 有效值时，`useEffect` 自动调用 `loadSnapshots()`
- [ ] `VersionHistoryPanel` 在空 snapshots + error 时显示引导 UI
- [ ] `pnpm build` 通过（零 TypeScript 错误）
- [ ] 单元测试覆盖 3 个空值场景，全部通过
- [ ] E2E 测试场景 A/B 通过

### Phase 2 完成标准

- [ ] 访问 `/canvas?projectId=xxx` 时，`sessionStore.projectId` 自动设为 URL 值
- [ ] 访问 `/canvas`（无 URL）时，`projectId` 保持 `null`（不报错）
- [ ] 无效 projectId 时 toast 提示，项目不加载
- [ ] `pnpm build` 通过
- [ ] 相关测试通过

---

## 问题与升级

遇到以下情况需升级给 Architect：
1. 后端 API 行为与文档不符
2. `sessionStore` 被其他组件依赖，`projectId` 改动会影响其他功能
3. `skipHydration` 机制变更
4. 预估工时超出 PRD 估算（Phase 1 0.5d，Phase 2 2d）
