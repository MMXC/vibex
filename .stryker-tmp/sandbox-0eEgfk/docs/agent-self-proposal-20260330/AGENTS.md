# 开发约束 (AGENTS.md): Agent 自我演进系统

> **项目**: agent-self-proposal-20260330  
> **阶段**: Phase1 — 状态分层 + 模板 + Epic 检查  
> **版本**: 1.0.0  
> **日期**: 2026-03-30  
> **Architect**: Architect Agent  
> **工作目录**: /root/.openclaw/vibex

---

## 1. 技术栈约束

| 维度 | 约束 |
|------|------|
| **状态管理** | Zustand（现有），只追加不修改 |
| **模板系统** | 原生 TypeScript（无额外依赖） |
| **Pre-commit** | Husky（现有），只追加 hook |
| **测试框架** | Vitest + Testing Library + Playwright |
| **CLI 工具** | TypeScript（ts-node 执行） |

---

## 2. 文件操作约束

### 2.1 允许修改

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/lib/canvas/state-layers.ts` | 新建 | 状态分层管理 |
| `src/lib/canvas/__tests__/state-layers.test.ts` | 新建 | 单元测试 |
| `src/lib/templates/analysis-template.ts` | 新建 | 模板系统 |
| `src/lib/templates/__tests__/analysis-template.test.ts` | 新建 | 模板测试 |
| `src/scripts/epic-check.ts` | 新建 | Epic 检查 CLI |
| `src/scripts/__tests__/epic-check.test.ts` | 新建 | CLI 测试 |
| `.husky/pre-commit` | 修改 | 添加 Epic 检查 |

### 2.2 禁止操作

| 操作 | 原因 |
|------|------|
| ❌ 修改 `canvasStore` 现有结构 | 保持向后兼容 |
| ❌ 删除现有状态字段 | 向后兼容要求 |
| ❌ 引入新状态管理库 | 已有 Zustand |
| ❌ 引入新 CSS 方案 | 已有 CSS Modules |
| ❌ 修改现有模板文件 | 模板为可选采用 |

---

## 3. 代码规范

### 3.1 TypeScript 类型定义

```typescript
// ✅ 正确：显式类型 + 不可空
export interface StateConflict {
  nodeId: string;
  issue: 'selected_but_not_confirmed';
  suggestion: string;
}

// ❌ 错误：any
function validate(conflicts: any): any
```

### 3.2 状态分层规范

```typescript
// ✅ 正确：分层管理
const nodeConfirmed = getNodeConfirmed(nodeId, dataState);
const nodeSelected = getNodeSelected(nodeId, selectionState);

// ❌ 错误：混用状态
const isSelected = node.confirmed && selection.has(node.id);
```

### 3.3 测试命名

```typescript
// ✅ 正确：描述性测试名
it('应检测到 selectedNodeIds 与 node.confirmed 冲突');

// ❌ 错误：模糊命名
it('冲突检测1');
```

---

## 4. 测试要求

### 4.1 覆盖率门禁

```bash
# 必须通过的门禁
pnpm test --coverage --reporter=text
# 覆盖率要求:
# - state-layers.ts: ≥ 80%
# - analysis-template.ts: ≥ 90%
# - epic-check.ts: ≥ 85%
```

### 4.2 E2E 检查清单

```bash
# 运行 Playwright E2E
pnpm playwright test

# 检查项:
# [ ] 状态冲突检测无漏报
# [ ] 模板验证行数准确
# [ ] Pre-commit hook 触发检查
# [ ] 规模超限时正确阻断
```

### 4.3 性能要求

| 操作 | 阈值 |
|------|------|
| 状态验证 | < 5ms |
| 模板验证 | < 5ms |
| Pre-commit hook | < 500ms |

---

## 5. 提交流程

```
1. dev 完成代码
2. 运行: pnpm test -- --coverage
3. 覆盖率检查通过
4. 运行: pnpm playwright test
5. 提交: git commit -m "feat(self-evolution): <功能描述>"
6. 推送: git push
7. tester 审查 → reviewer 二审 → 合并
```

---

## 6. 冲突解决指南

### 6.1 状态冲突处理流程

```
1. 检测到冲突（selected_but_not_confirmed）
2. 询问用户意图：
   - 如果是预选择 → 将 node.confirmed 设为 true
   - 如果是误选 → 从 selectedNodeIds 中移除
3. 更新状态
4. 重新验证
```

### 6.2 Epic 规模超限处理

```
1. 检查失败，显示警告
2. 开发者决策：
   - 拆分 Epic（推荐）
   - 申请豁免（需要理由）
   - 忽略警告（不推荐）
3. 如果拆分，更新 epic.json
4. 重新提交
```

---

## 7. 回滚计划

| 场景 | 应对 |
|------|------|
| 状态验证破坏现有功能 | 移除 state-layers 集成，保留原逻辑 |
| 模板验证误报 | 放宽阈值或添加白名单 |
| Pre-commit hook 阻断正常提交 | 使用 `git commit --no-verify` 临时绕过 |

---

## 8. 相关文档

| 文档 | 路径 |
|------|------|
| 架构文档 | `docs/agent-self-proposal-20260330/architecture.md` |
| PRD | `docs/agent-self-proposal-20260330/prd.md` |
| 实现计划 | `docs/agent-self-proposal-20260330/IMPLEMENTATION_PLAN.md` |

---

*本文档由 Architect Agent 生成，用于约束 dev 和 tester 的开发行为。*
