# 需求分析报告: vibex-dev-proposals-20260402_201318

**任务**: 需求分析：收集 dev 提案
**分析师**: analyst
**日期**: 2026-04-02

---

## 业务场景分析

### VibeX 项目背景

VibeX 是 AI 驱动的原型设计工具，核心流程：

```
需求输入 → 限界上下文 → 领域模型 → 业务流程 → 组件树 → 原型预览
```

技术栈：Next.js 16, Zustand, Tailwind, ReactFlow, Cloudflare Workers

### 当前痛点

从六方提案分析（Dev/Analyst/Architect/PM/Tester/Reviewer）识别出 3 类系统性风险：

1. **技术债务**: canvasStore 1433行、9个TS预存错误、DOMPurify XSS
2. **交互不一致**: 三树 checkbox 实现各异、toggle行为缺失
3. **质量门禁失效**: E2E 几乎无覆盖、CI 不稳定

---

## 核心 Jobs-To-Be-Done (JTBD)

### JTBD 1: 开发者需要可靠的 CI 门禁
**触发**: 每次 PR 都有隐藏 TS 错误，CI gate 形同虚设
**期望**: `npm run build` 0 error，`npm test` 通过率 > 95%
**对应**: D-001（TS错误）、D-002（DOMPurify）

### JTBD 2: 开发者需要可维护的代码结构
**触发**: canvasStore 修改牵一发动全身，不敢重构
**期望**: 每个模块独立可测试，修改影响范围可控
**对应**: D-003（canvasStore拆分）

### JTBD 3: 用户需要一致的操作体验
**触发**: 三树 checkbox 位置不同，确认状态反馈各异
**期望**: 所有树组件交互行为统一
**对应**: D-E1（checkbox合并）、D-E2（级联确认）

### JTBD 4: 开发者需要稳定的测试基础设施
**触发**: E2E 测试 flaky，CI 误报频繁
**期望**: 核心用户旅程有 E2E 覆盖，测试结果可信
**对应**: D-006（E2E框架）

### JTBD 5: 团队需要清晰的技术决策记录
**触发**: 不知道为什么要这样做，ADR 缺失
**期望**: 每个技术决策有文档，可追溯
**对应**: ADR checkbox语义、UI变更清单

---

## 技术方案选项

### 方案 A: 渐进式改良（推荐）

按依赖顺序逐个解决，每 1-2 周有可见交付。

| 阶段 | 提案 | 工时 | 输出 |
|------|------|------|------|
| Sprint 0 | D-001 + D-002 | 1.5h | CI 门禁有效 |
| Sprint 1 | D-E1 + D-E2 + D-004 | 2h | 三树交互统一 |
| Sprint 2 | D-003 Phase1 (contextStore) | 8-12h | Store 基础拆分 |
| Sprint 3 | D-005 + D-007 | 3h | API 防御 + 测试优化 |
| Sprint 4 | D-006 (E2E) | 6-9人天 | E2E 覆盖 |

### 方案 B: 大爆炸重构

冻结功能开发 2-3 周一次性解决所有问题。

| 阶段 | 提案 | 工时 | 输出 |
|------|------|------|------|
| Phase 1 (1周) | D-001 + D-002 + D-E1 + D-E2 + D-003 + D-006 | ~3周 | 全部解决 |
| Phase 2 (1周) | 回归验证 | - | - |

---

## 可行性评估

| 提案 | 可行性 | 评估依据 |
|------|--------|---------|
| D-001 TS错误修复 | ✅ 100% | 纯 lint/类型修复 |
| D-002 DOMPurify | ✅ 100% | npm overrides |
| D-E1 checkbox合并 | ✅ 100% | UI 重构，有验收标准 |
| D-E2 级联确认 | ✅ 100% | store 逻辑修改 |
| D-003 canvasStore拆分 | ⚠️ 90% | 有回归风险 |
| D-004 Migration修复 | ✅ 100% | store migration |
| D-005 API防御 | ✅ 100% | 防御性解析 |
| D-006 E2E框架 | ⚠️ 70% | 依赖 CI 稳定 |
| D-007 vitest优化 | ✅ 100% | 配置调整 |

---

## 风险识别

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| canvasStore 拆分引入回归 | 40% | 高 | 每阶段测试覆盖 |
| E2E 测试 flaky | 30% | 中 | Sprint 0 后再做 |
| monaco 与 DOMPurify 不兼容 | 20% | 中 | staging 验证 |
| Migration 修复影响旧数据 | 10% | 低 | version 检查确保只执行一次 |

---

## 验收标准

### Sprint 0 验收
- [ ] `npm run build` 输出 0 TypeScript error
- [ ] `npm audit` 无 DOMPurify 漏洞警告
- [ ] package.json 包含 dompurify overrides

### Sprint 1 验收
- [ ] 三树 checkbox 位置统一
- [ ] 流程卡片勾选 → 子步骤级联确认
- [ ] Migration 后旧节点 `status === 'confirmed'`
- [ ] `grep "window.confirm" == 0`

### Sprint 2 验收
- [ ] contextStore 独立可测试
- [ ] canvasStore < 500行（Phase1）
- [ ] 无循环依赖

### Sprint 3 验收
- [ ] API 非法 type/method 有 fallback
- [ ] vitest 运行时间 < 60s
- [ ] 快/慢测试套件分离

### Sprint 4 验收
- [ ] 核心用户旅程 E2E 通过率 > 90%
- [ ] CI 测试稳定性 > 95%

---

## 结论

**推荐方案 A（渐进式改良）**，理由：
1. 风险分散，每 1-2 周有交付
2. 不阻断功能开发
3. 团队压力小

**Sprint 0 必须立即执行**: D-001 + D-002（1.5h），是所有改进的基础设施。
