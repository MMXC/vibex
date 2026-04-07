# AGENTS.md: VibeX 技术改进开发约束

**项目**: vibex-analyst-proposals-20260402_201318
**版本**: v1.0
**日期**: 2026-04-02
**架构师**: architect
**状态**: ✅ 约束文档完成

---

## 角色约束概述

| 角色 | 核心职责 | 约束重点 |
|------|---------|---------|
| **Dev** | 实现代码 + 单元测试 | 遵循架构决策 + 覆盖率门槛 |
| **Reviewer** | 代码质量审查 + ADR 合规 | 无 GIVEN/WHEN/THEN 不可合入 |
| **Tester** | E2E + 回归测试 | 每次 Sprint DoD 全部通过 |

---

## 1. Dev 约束

### 1.1 代码规范

- **TypeScript 严格模式**: 所有新文件启用 `strict: true`
- **无 `any` 类型**: 禁止使用 `any`，使用 `unknown` + 类型守卫
- **store 命名**: Zustand store 必须以 `use` 前缀（React hooks 规范）
- **CSS 类名**: 使用 kebab-case，禁止内联 style（除动态值）
- **无魔法数字**: 所有常量定义于 `src/constants/` 目录

### 1.2 架构决策遵守

| ADR | 决策 | Dev 行为约束 |
|-----|------|-------------|
| ADR-001 | NodeState 枚举统一三树语义 | 三树必须使用 `nodeState.ts` 中的枚举，禁止自行定义状态常量 |
| ADR-002 | canvasStore 按领域拆分 | 新增 context 相关状态必须写到 `contextStore.ts`，禁止追加到 canvasStore |
| ADR-003 | Migration status 字段修复 | 禁止在 migration 函数中删除或覆盖 status 字段 |
| ADR-004 | FeedbackToken 替换 window.confirm | 禁止使用 `window.confirm/alert/prompt`，全部改用 ConfirmToast |
| ADR-005 | API 防御性解析白名单 | 禁止绕过 sanitizeComponent 直接赋值 API 响应 |

### 1.3 覆盖率要求

| 文件类型 | 覆盖率门槛 |
|---------|-----------|
| `migration.ts` | ≥ 90% |
| `sanitizeComponent.ts` | ≥ 90% |
| `nodeState.ts` | ≥ 80% |
| `contextStore.ts` | ≥ 80% |
| UI 组件 | 关键路径覆盖 |
| 整体 | ≥ 80% |

### 1.4 Git 约束

- **分支命名**: `feat/E1-nodestate-unify`、`fix/E1-migration-status`
- **Commit Message 格式**: `<type>(<scope>): <subject>`，type ∈ {feat,fix,docs,test,refactor}
- **PR 描述**: 必须包含关联的 Epic/Feature/Story ID（如 `F1.1.1`）
- **PR 大小**: 单个 PR 不超过 400 行变更，超出则拆分
- **回归测试**: PR 合并前必须通过 E2E 回归测试

### 1.5 禁止事项

- ❌ 在 `canvasStore.ts` 中新增 context/flow/component 状态字段（Phase 1 范围）
- ❌ 硬编码像素值（必须使用 CSS token）
- ❌ `console.log` 提交到代码库（使用 logger）
- ❌ 绕过单元测试直接提交 E2E-only 测试
- ❌ 修改 Migration 逻辑而不更新版本号

---

## 2. Reviewer 约束

### 2.1 审查清单

#### 架构合规检查

- [ ] **ADR-001**: 三树使用 `NodeState` 枚举，未自行定义
- [ ] **ADR-002**: context 状态在 `contextStore.ts`，未追加到 canvasStore
- [ ] **ADR-003**: migration.ts 中 status 字段正确映射
- [ ] **ADR-004**: 无 `window.confirm/alert/prompt` 调用
- [ ] **ADR-005**: API 响应通过 `sanitizeComponent` 处理

#### 代码质量检查

- [ ] 无 `any` 类型
- [ ] 无硬编码像素值
- [ ] CSS 类名使用 kebab-case
- [ ] 常量定义于 `src/constants/`
- [ ] 函数/变量命名清晰，符合团队规范

#### 测试质量检查

- [ ] 单元测试覆盖率 ≥ 门槛
- [ ] E2E 测试覆盖核心用户路径
- [ ] 危险操作（删除/覆盖）有确认流程测试
- [ ] Migration 有边界情况测试（null/undefined/历史数据）

### 2.2 GIVEN/WHEN/THEN 验收标准强制

**触发条件**: PR 包含功能代码变更

**审查规则**:
- 功能变更必须有对应的 GIVEN/WHEN/THEN 验收标准
- 缺少 GIVEN/WHEN/THEN → **Review 结果: Request Changes**
- 格式不正确（缺少 Given/When/Then 任一项）→ **Request Changes**

**格式模板**:
```markdown
| ID | Given | When | Then |
|----|-------|------|------|
| F1.1.1-AC1 | 应用初始化 | 三树组件渲染 | 每个节点状态为 idle 或上一轮持久化状态 |
```

### 2.3 审查通过条件

满足以下全部条件方可 Approve：

1. ✅ 架构合规检查全部通过
2. ✅ 代码质量检查全部通过
3. ✅ 测试质量检查全部通过
4. ✅ GIVEN/WHEN/THEN 验收标准完整
5. ✅ E2E 回归测试通过（CI 绿）
6. ✅ 单元测试覆盖率达标

### 2.4 审查禁止

- ❌ Approve 包含 `any` 类型的 PR
- ❌ Approve 绕过 `sanitizeComponent` 的 API 响应处理
- ❌ Approve 包含 `window.confirm` 的代码
- ❌ Approve 缺少测试的功能变更
- ❌ Approve 违反 ADR 决策的代码

---

## 3. Tester 约束

### 3.1 测试优先级

| 优先级 | 场景 | 测试方式 |
|--------|------|---------|
| P0 | Migration Bug 修复 | E2E（刷新后状态保持）+ 单元测试 |
| P0 | canvasStore 拆分 | E2E（三树 CRUD）+ 单元测试 |
| P1 | API 防御性解析 | 单元测试（白名单覆盖）+ E2E |
| P1 | 三树状态统一 | E2E（状态转换）+ 视觉截图 |
| P1 | 交互反馈标准化 | E2E（确认流程）+ 单元测试 |
| P2 | 设计系统审计 | 截图对比 + 手动验证 |

### 3.2 E2E 测试要求

**必须创建的测试文件**:

| 文件 | 覆盖场景 | 触发 Sprint |
|------|---------|------------|
| `journey-context-crud.spec.ts` | 创建→确认→删除 | Sprint 2 |
| `journey-confirm-flow.spec.ts` | 选中→确认→状态保持 | Sprint 1 |
| `journey-migration-regression.spec.ts` | 刷新→状态不丢失 | Sprint 0 |
| `journey-api-sanitize.spec.ts` | 非法响应 fallback | Sprint 0 |
| `journey-feedback-toast.spec.ts` | toast 确认/取消流程 | Sprint 3 |

**E2E 通过率门槛**: ≥ 95%（按测试用例计数）

### 3.3 回归测试策略

**Sprint 0 完成后**:
- [ ] `journey-migration-regression.spec.ts` 100% 通过
- [ ] `journey-api-sanitize.spec.ts` 100% 通过

**Sprint 1 完成后**:
- [ ] `journey-confirm-flow.spec.ts` ≥ 95% 通过
- [ ] 三树 checkbox 位置视觉对比通过

**Sprint 2 完成后**:
- [ ] `journey-context-crud.spec.ts` ≥ 95% 通过
- [ ] 全量 E2E suite 无新增失败

**Sprint 3 完成后**:
- [ ] `journey-feedback-toast.spec.ts` ≥ 95% 通过
- [ ] `window.confirm` 全局搜索结果 = 0

**Sprint 4 完成后**:
- [ ] 设计系统截图对比全部通过
- [ ] Spacing Token 使用规范验证通过

### 3.4 缺陷管理

**缺陷分类**:

| 严重度 | 定义 | 处理要求 |
|--------|------|---------|
| **Critical** | 数据丢失、页面崩溃 | Sprint 内必须修复 |
| **High** | 核心功能失效 | Sprint 内必须修复 |
| **Medium** | 非核心功能异常 | Sprint 结束前修复或记录 |
| **Low** | 视觉/体验问题 | 下个 Sprint 规划 |

**Bug 报告模板**:
```markdown
### [Bug] <标题>

**严重度**: Critical | High | Medium | Low
**Sprint**: S0 | S1 | S2 | S3 | S4
**Epic**: E1 | E2 | E3
**Feature**: F1.1 | F1.2.1 | F1.2.2 | F2.1 | F2.2 | F3.1 | F3.2

**复现步骤**:
1. 打开页面
2. 执行操作 X
3. 观察到错误 Y

**预期行为**: ...
**实际行为**: ...
**截图**: ...

**根因分析**: ...
```

### 3.5 测试禁止

- ❌ 跳过 Migration 边界情况测试（null/undefined/历史数据）
- ❌ 跳过 E2E 回归测试就合入
- ❌ 跳过视觉截图对比就合入 store 拆分 PR
- ❌ 降低 E2E 通过率门槛（低于 95%）
- ❌ 测试用例覆盖非核心路径而忽略核心路径

---

## 4. 跨角色协作规则

### 4.1 PR 生命周期

```
Dev 实现 → Dev 自测 → PR 打开 → Reviewer 审查 → 修复 → Reviewer Approve → 合并 → Tester E2E 验证
```

### 4.2 Sprint 交付门禁

每个 Sprint 交付必须满足：

1. ✅ 所有 Step 完成（勾选状态）
2. ✅ 所有验收清单通过
3. ✅ DoD 全部达成
4. ✅ E2E 回归测试通过（CI 绿）
5. ✅ Reviewer 签署 Sprint 验收报告

### 4.3 阻塞上报

| 阻塞方 | 被阻塞方 | 上报机制 |
|--------|---------|---------|
| Dev | Reviewer | PR 评论 @reviewer + 任务状态 blocked |
| Reviewer | Dev | Request Changes + 说明原因 |
| Tester | Dev | Bug 报告 + 优先级分类 |
| Sprint N | Sprint N+1 | PM 协调推迟或调整范围 |

---

## 5. 文档维护

| 文档 | 维护者 | 更新时机 |
|------|--------|---------|
| `docs/feedback-tokens.md` | Dev | Feedback Token 新增或变更时 |
| `docs/PRDs/TEMPLATE.md` | PM | 模板变更时 |
| `docs/DESIGN.md` | Dev + Designer | Sprint 4 完成后 |
| `AGENTS.md` | Architect | 项目启动时 |
| `IMPLEMENTATION_PLAN.md` | Architect | Sprint 范围调整时 |
| `architecture.md` | Architect | 架构重大变更时 |

---

*本文档约束适用于 vibex-analyst-proposals-20260402_201318 项目所有参与者*
