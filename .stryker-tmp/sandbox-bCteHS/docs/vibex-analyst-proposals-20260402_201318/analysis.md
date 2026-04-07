# 需求分析报告: vibex-analyst-proposals-20260402_201318

**任务**: 需求分析：收集 analyst 提案
**分析师**: analyst
**日期**: 2026-04-02

---

## 业务场景分析

### VibeX 产品定位

AI 驱动的原型设计工具，核心用户是产品经理和开发团队。

### 当前三类系统性风险

| 风险类别 | 具体问题 |
|---------|---------|
| 技术债务 | canvasStore 1433行、TS预存错误9个、DOMPurify XSS |
| 交互不一致 | 三树checkbox各异、toggle行为缺失、确认状态不级联 |
| 质量门禁失效 | E2E几乎无覆盖、CI不稳定、Migration状态丢失 |

---

## 核心 JTBD

### JTBD 1: 用户需要一致的节点操作体验
**触发**: 三树checkbox位置/行为各异
**对应**: A-1 三树状态模型统一

### JTBD 2: 团队需要可扩展的架构
**触发**: canvasStore修改牵一发动全身
**对应**: A-2 canvasStore拆分

### JTBD 3: 开发者需要稳定的数据持久化
**触发**: 刷新页面后confirmed状态丢失
**对应**: A-3 Migration修复

### JTBD 4: 开发者需要清晰的交互反馈
**触发**: window.confirm弹窗、冗余视觉元素
**对应**: A-5 交互反馈标准化

### JTBD 5: 团队需要统一的工作规范
**触发**: 验收标准模糊、DoD缺失
**对应**: A-6 PRD模板规范

---

## 技术方案选项

### 方案 A: 渐进式改良（推荐）

| Sprint | Analyst提案 | Dev/PM提案 | 工时 |
|--------|------------|------------|------|
| Sprint 0 | - | D-001 + D-002 | 1.5h |
| Sprint 1 | A-3 + A-1 | P-001 + P-002 | 5h |
| Sprint 2 | A-2 Phase1 | P-003 | 11-15h |
| Sprint 3 | A-4 + A-5 | P-004 | 5h |
| Sprint 4 | A-6 + A-7 | P-005 + P-006 | 12h |

---

## 可行性评估

| 提案 | 可行性 | 评估依据 |
|------|--------|---------|
| A-1 三树状态统一 | ✅ 100% | UI重构，有验收标准 |
| A-2 canvasStore拆分 | ⚠️ 90% | 有回归风险 |
| A-3 Migration修复 | ✅ 100% | store migration |
| A-4 API防御 | ✅ 100% | 防御性解析 |
| A-5 交互标准化 | ✅ 100% | CSS+toast |
| A-6 PRD模板 | ✅ 100% | 流程规范 |
| A-7 设计审计 | ⚠️ 80% | 需designer参与 |

---

## 初步风险识别

| 风险 | 影响 | 缓解 |
|------|------|------|
| canvasStore拆分引入回归 | 高 | 每阶段测试 |
| Migration修复影响旧数据 | 低 | version检查 |

---

## 验收标准

### Sprint 1
- [ ] 三树checkbox位置统一
- [ ] Migration后旧节点status='confirmed'
- [ ] 面板状态刷新保持

### Sprint 2
- [ ] canvasStore < 500行（Phase1）
- [ ] 导出向导有Step指引

### Sprint 3
- [ ] window.confirm() == 0
- [ ] 空画布显示引导卡片

### Sprint 4
- [ ] 所有Epic有GIVEN/WHEN/THEN验收标准
- [ ] Spacing Token定义存在
