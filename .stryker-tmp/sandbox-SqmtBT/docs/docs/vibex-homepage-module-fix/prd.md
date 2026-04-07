# PRD: vibex-homepage-module-fix

**状态**: 已完成（修复执行中）  
**创建日期**: 2026-03-21  
**项目经理**: PM Agent

---

## 执行摘要

修复 `vibex-homepage-redesign-v2` 实现阶段引入的 4 个孤儿测试文件导致的模块解析错误。根因已定位，Dev Agent 已通过删除孤儿测试文件完成修复（P0），建议后续添加预防措施（P1-P2）。

| 指标 | 目标 | 当前状态 |
|------|------|----------|
| 测试通过率 | 100% | ✅ 已达成 |
| 孤儿测试数量 | 0 | ✅ 已达成 |
| 预防措施落地 | 实施中 | 🔄 进行中 |

---

## 1. 问题背景

### 1.1 错误现象

```
测试阶段 4 个测试套件失败，错误类型：模块解析错误 (Cannot find module)
```

### 1.2 受影响的测试文件

| 文件路径 | 问题 |
|----------|------|
| `src/hooks/__tests__/useConfirmationStep.test.ts` | 引用已删除的 `useConfirmationStep` hook |
| `src/hooks/__tests__/useConfirmationState.test.ts` | 引用已删除的 `useConfirmationState` hook |
| `src/stores/confirmationStore.extended.test.ts` | 引用已重构的 `confirmationStore` |
| `src/app/domain/page.test.tsx` | 引用已迁移/删除的 domain 模块 |

### 1.3 根本原因

| 原因分类 | 说明 |
|----------|------|
| **架构重构遗留** | 首页重构过程中，模块被重构或迁移，但相关测试文件未同步更新 |
| **孤儿测试文件** | 测试文件与源码不同步更新，成为"孤儿"测试 |
| **CI 缺失** | 缺少 PR 阶段模块存在性检查 |

---

## 2. Epic 拆分

### Epic 1: 孤儿测试清理（P0 — 已完成）

| Story ID | 描述 | 状态 | 验收标准 |
|----------|------|------|----------|
| ST-1.1 | 删除 4 个孤儿测试文件 | ✅ done | `expect(testFiles.length).toBe(4)` 验证删除数量 |
| ST-1.2 | 验证测试通过率 100% | ✅ done | `expect(passedTests).toBe(totalTests)` |
| ST-1.3 | E2E 测试验证首页功能正常 | ✅ done | `expect(homepageE2E).toPass()` |

### Epic 2: 预防机制建设（P1）

| Story ID | 描述 | 状态 | 验收标准 |
|----------|------|------|----------|
| ST-2.1 | 添加 pre-commit 孤儿测试检测 | 🔄 pending | `expect(hookInstalled).toBe(true)` |
| ST-2.2 | 审查相关模块的测试覆盖完整性 | 🔄 pending | `expect(coverage >= 0.8).toBe(true)` |
| ST-2.3 | 原子提交规范文档化 | 🔄 pending | `expect(docExists).toBe(true)` |

### Epic 3: 长期治理（P2）

| Story ID | 描述 | 状态 | 验收标准 |
|----------|------|------|----------|
| ST-3.1 | 建立测试-模块依赖映射 | 🔄 pending | `expect(mappingExists).toBe(true)` |
| ST-3.2 | 定期孤儿测试检测 CI Job | 🔄 pending | `expect(ciJobConfigured).toBe(true)` |

---

## 3. 功能需求

### F1: 孤儿测试自动检测

| 属性 | 值 |
|------|-----|
| 功能点 | 在 pre-commit hook 中检测测试引用的模块是否存在 |
| 验收标准 | `expect(moduleResolver.findMissing()).toEqual([])` |
| 页面集成 | 不涉及 UI |

### F2: 测试覆盖完整性审查

| 属性 | 值 |
|------|-----|
| 功能点 | 定期审查核心模块的测试覆盖完整性 |
| 验收标准 | `expect(coreModuleCoverage).toBeGreaterThanOrEqual(80)` |
| 页面集成 | 不涉及 UI |

### F3: 原子提交规范

| 属性 | 值 |
|------|-----|
| 功能点 | 文档化重构模块时必须同步更新测试的规范 |
| 验收标准 | `expect(guidelineDocExists).toBe(true)` |
| 页面集成 | 不涉及 UI |

---

## 4. 非功能需求

| 类型 | 要求 |
|------|------|
| **性能** | pre-commit hook 检测时间 < 5s |
| **可靠性** | CI 必须阻断有孤儿测试的 PR |
| **可维护性** | 规范文档必须包含实际案例 |
| **覆盖** | 核心业务模块测试覆盖率 ≥ 80% |

---

## 5. 验收标准

### P0 — 必须完成（已达成）

| ID | 验收项 | 状态 |
|----|--------|------|
| AC-P0-1 | 4 个孤儿测试文件已删除 | ✅ |
| AC-P0-2 | `npm test` 全部通过 | ✅ |
| AC-P0-3 | E2E 测试验证首页正常 | ✅ |

### P1 — 建议完成

| ID | 验收项 | 状态 |
|----|--------|------|
| AC-P1-1 | pre-commit hook 已安装 | 🔄 |
| AC-P1-2 | 测试覆盖审查完成 | 🔄 |
| AC-P1-3 | 原子提交规范已文档化 | 🔄 |

### P2 — 规划中

| ID | 验收项 | 状态 |
|----|--------|------|
| AC-P2-1 | 测试-模块依赖映射已建立 | 🔄 |
| AC-P2-2 | 定期检测 CI Job 已配置 | 🔄 |

---

## 6. 工作量评估

| 任务 | 负责人 | 工时 | 状态 |
|------|--------|------|------|
| 定位根因 | Analyst | 0.5h | ✅ |
| 删除孤儿测试 | Dev | 0.5h | ✅ |
| 验证修复 | Dev | 0.5h | ✅ |
| 添加 pre-commit hook | Dev | 1h | 🔄 |
| 审查测试覆盖 | Tester | 2h | 🔄 |
| 文档化规范 | PM | 0.5h | 🔄 |
| 建立依赖映射 | Architect | 2h | 🔄 |

**已完成**: 1.5h  
**待完成**: 5.5h  
**总计**: 7h

---

## 7. 依赖关系

| 前置任务 | 依赖方 | 说明 |
|----------|--------|------|
| 无 | create-prd | 本 PRD |
| create-prd | design-architecture | Architect 架构设计 |
| design-architecture | coord-decision | Coord 决策审批 |

---

## 8. 产出物

| 产出物 | 路径 | 状态 |
|--------|------|------|
| 分析报告 | `docs/docs/vibex-homepage-module-fix/analysis.md` | ✅ |
| 架构文档 | `docs/docs/vibex-homepage-module-fix/architecture.md` | ✅ |
| 实施计划 | `docs/docs/vibex-homepage-module-fix/IMPLEMENTATION_PLAN.md` | ✅ |
| 本 PRD | `docs/docs/vibex-homepage-module-fix/prd.md` | ✅ |
| 规范文档 | `docs/docs/vibex-homepage-module-fix/guidelines.md` | 🔄 |

---

**文档状态**: PRD 完成  
**下一步**: Architect 架构设计 → Coord 决策审批
