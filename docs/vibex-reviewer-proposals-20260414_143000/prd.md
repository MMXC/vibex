# PRD: VibeX Reviewer 提案质量评审系统

> **版本**: v1.0  
> **日期**: 2026-04-14  
> **作者**: PM Agent  
> **状态**: 已完成

---

## 执行摘要

本PRD定义VibeX **Reviewer提案质量评审系统**——一套针对所有进入Sprint的提案的多角色独立评审机制。核心目标是：在提案进入实施前，由Design/Architecture/Security/Performance四个专业视角完成结构化评审，确保不带缺陷的提案进入开发。

**核心约束**：
- 评审SLA：**4小时**，超时自动放行
- 每个提案**至少2个专业视角**评审
- 高风险提案（AI能力P-002、团队协作P-005）**必须通过Security Review**
- Bundle相关提案**必须通过Performance Review**
- 评审结论：**推荐 / 不推荐 / 有条件通过**

**Epic概览**：

| Epic | 名称 | 估算工时 | 优先级 |
|------|------|---------|--------|
| E1 | 评审流程标准化 | 2h | P0 |
| E2 | 评审基础设施 | 2h | P0 |
| E3 | 评审SLA与追踪 | 1h | P0 |

---

## 1. Feature List

| ID | 功能 | Epic | 优先级 |
|----|------|------|--------|
| F1 | 评审模板定义（Design/Architecture/Security/Performance四套模板） | E1 | P0 |
| F2 | 评审触发规则引擎（AI提案→Security，Bundle提案→Performance等） | E1 | P0 |
| F3 | Skill-based Reviewer集成（design-lens/security-sentinel/performance-oracle等） | E2 | P0 |
| F4 | Reviewer任务分发机制（并行分发+状态追踪） | E2 | P0 |
| F5 | 4h SLA超时机制（计时+自动放行） | E3 | P0 |
| F6 | 采纳率追踪与报告（Acceptance Rate Dashboard） | E3 | P1 |
| F7 | 评审结论汇总与冲突裁决（多结论→统一结论） | E2 | P0 |
| F8 | 评审历史归档（每个提案的完整评审记录） | E2 | P1 |

---

## 2. Epic / Story 拆分

### E1: 评审流程标准化

**目标**：建立统一、规范的评审流程规范，定义何时触发何种评审。

#### E1.S1: 评审模板标准化

| Feature ID | Story | 验收标准 |
|------------|-------|---------|
| E1.S1.F1.1 | 定义Design Review模板 | `expect(模板).toContain(['一致性检查项', 'VibeX品牌规范对照', '可访问性检查'])`，模板字段：提案ID、评审人、评审时间、结论、具体建议 |
| E1.S1.F1.2 | 定义Architecture Review模板 | `expect(模板).toContain(['架构边界检查', '技术栈约束合规', '依赖分析'])`，同上结构 |
| E1.S1.F1.3 | 定义Security Review模板 | `expect(模板).toContain(['AI行为边界', '数据泄露风险', '权限模型'])`，同上结构 |
| E1.S1.F1.4 | 定义Performance Review模板 | `expect(模板).toContain(['Bundle影响分析', '渲染性能', '用户感知影响'])`，同上结构 |

#### E1.S2: 评审触发规则引擎

| Feature ID | Story | 验收标准 |
|------------|-------|---------|
| E1.S2.F2.1 | 实现提案分类规则 | `expect(规则引擎).toResolveReviewer(['P-002'], ['Security Review'])`，AI相关提案自动触发Security Review |
| E1.S2.F2.2 | 实现Bundle提案规则 | `expect(规则引擎).toResolveReviewer(['P-001', 'DevP0-3'], ['Performance Review'])`，Bundle相关提案自动触发Performance Review |
| E1.S2.F2.3 | 实现最低评审数量规则 | `expect(规则引擎).toRequireMinReviewers(每个提案, 2)`，每个提案至少2个Reviewer |

---

### E2: 评审基础设施

**目标**：将Reviewer skill集成到提案评审流程，实现自动分发与结论汇总。

#### E2.S1: Skill-Based Reviewer集成

| Feature ID | Story | 验收标准 |
|------------|-------|---------|
| E2.S1.F3.1 | 集成design-lens-reviewer skill | `expect(designReviewer.run(提案)).toResolve({结论, 建议, 检查项})`，评审时间<30min |
| E2.S1.F3.2 | 集成architecture-strategist skill | `expect(archReviewer.run(提案)).toResolve({结论, 合规性, 风险})`，评审时间<30min |
| E2.S1.F3.3 | 集成security-sentinel skill | `expect(securityReviewer.run(提案)).toResolve({结论, 风险点, 缓解建议})`，评审时间<30min |
| E2.S1.F3.4 | 集成performance-oracle skill | `expect(perfReviewer.run(提案)).toResolve({结论, 性能影响, 优化建议})`，评审时间<30min |

#### E2.S2: Reviewer任务分发与汇总

| Feature ID | Story | 验收标准 |
|------------|-------|---------|
| E2.S2.F4.1 | 并行分发Reviewer任务 | `expect(分发器.run(提案)).toDispatch(['design', 'arch'])`，并行分发，不串行等待 |
| E2.S2.F4.2 | 追踪Reviewer状态（pending/in-progress/done/timeout） | `expect(stateStore.get(提案ID, reviewerID)).toBe('done')` |
| E2.S2.F4.3 | 多结论汇总为统一结论 | `expect(汇总器.run(结论列表)).toBeIn(['推荐', '不推荐', '有条件通过']))`，多数推荐→推荐，多数不推荐→不推荐，混合→有条件通过 |
| E2.S2.F4.4 | Coord冲突裁决机制 | 当多个Reviewer结论冲突时，`expect(coordAgent).toReceiveEscalation(提案ID, 冲突原因)` |

#### E2.S3: 评审历史归档

| Feature ID | Story | 验收标准 |
|------------|-------|---------|
| E2.S3.F5.1 | 每个提案生成评审记录文件 | `expect(fs.existsSync(proposal/{id}/review-history.md)).toBe(true)` |
| E2.S3.F5.2 | 评审结论写入提案元数据 | `expect(提案元数据.reviews).toContainEqual(expect.objectContaining({reviewer, 结论, 时间}))` |

---

### E3: 评审SLA与追踪

**目标**：保障评审流程不成为Sprint瓶颈，追踪Reviewer采纳率。

#### E3.S1: 4h SLA超时机制

| Feature ID | Story | 验收标准 |
|------------|-------|---------|
| E3.S1.F6.1 | SLA计时器启动（提案进入评审时） | `expect(timer.start(提案ID)).toSet('expiresAt', now+4h)` |
| E3.S1.F6.2 | 超时自动放行 | `expect(超时检查.run()).toAutoProceed(提案ID)`，`expect(结论).toBe('超时放行')` |
| E3.S1.F6.3 | 超时告警（提前30min提醒） | `expect(提醒器.run()).toAlert(提案ID)`，在3.5h时发送提醒 |

#### E3.S2: 采纳率追踪与报告

| Feature ID | Story | 验收标准 |
|------------|-------|---------|
| E3.S2.F7.1 | 统计Reviewer采纳率 | `expect(采纳率报告.totalReviewed).toBeGreaterThan(0)`，每个Reviewer独立统计 |
| E3.S2.F7.2 | 评审周期统计 | `expect(报告.avgReviewTime).toBeLessThan(4h)`，`expect(报告.timeoutRate).toBeLessThan(10%)` |
| E3.S2.F7.3 | 高风险提案强制报告 | `expect(P-002.reviewReport).toContain('Security结论')`，AI提案必须有Security Review记录 |

---

## 3. 验收标准汇总（Expect断言级）

### 3.1 提案评审覆盖率

```
expect(提案.reviewCoverage).toBeGreaterThanOrEqual(2)  // 每个提案至少2个专业视角
expect(AI提案.reviews).toContain('Security Review')   // P-002必须Security Review
expect(Bundle提案.reviews).toContain('Performance Review') // Bundle提案必须Performance Review
```

### 3.2 评审结论有效性

```
expect(结论列表).toBeSubsetOf(['推荐', '不推荐', '有条件通过', '超时放行'])
expect(结论).toContain('具体改进建议')  // 不推荐/有条件通过必须有建议
```

### 3.3 SLA合规性

```
expect(评审周期).toBeLessThanOrEqual(4 * 60 * 60 * 1000)  // 4h内完成
expect(超时率).toBeLessThan(5)  // 超时率<5%
```

### 3.4 评审质量

```
expect(设计评审模板).toContainAllKeys(['一致性检查', '品牌规范', '可访问性'])
expect(安全评审模板).toContainAllKeys(['AI行为边界', '数据安全', '权限模型'])
expect(性能评审模板).toContainAllKeys(['Bundle影响', '渲染性能', '用户体验影响'])
expect(架构评审模板).toContainAllKeys(['架构边界', '技术栈合规', '依赖分析'])
```

---

## 4. 依赖关系图

```
提案提交
    │
    ▼
触发规则引擎 (E1.S2) ──→ 确定需要哪些Reviewer
    │
    ├──→ Design Reviewer (E2.S1) ──→ 结论: 推荐/不推荐/有条件通过
    ├──→ Architecture Reviewer (E2.S1) ──→ 结论: 推荐/不推荐/有条件通过
    ├──→ Security Reviewer (E2.S1) ──→ 结论: 推荐/不推荐/有条件通过
    └──→ Performance Reviewer (E2.S1) ──→ 结论: 推荐/不推荐/有条件通过
    │
    ▼
结论汇总器 (E2.S2) ──→ 统一结论
    │
    ├── [无冲突] ──→ 进入Sprint / 返回给提案人
    │
    └── [有冲突] ──→ Coord Agent 裁决
    │
    ▼
SLA计时器 (E3.S1)
    │
    ├── 4h内完成 ──→ 采纳率统计 (E3.S2)
    │
    └── 超时 ──→ 自动放行 + 记录超时

采纳率报告 (E3.S2) ──→ Coord Dashboard
```

---

## 5. Definition of Done

| Epic | DoD |
|------|-----|
| **E1 评审流程标准化** | ✅ 四套评审模板已定义并文档化；✅ 触发规则引擎实现并通过单元测试；✅ 规则覆盖AI/Bundle/最低评审数量三种场景 |
| **E2 评审基础设施** | ✅ 四个Reviewer skill已集成并可调用；✅ 并行分发机制实现；✅ 多结论汇总逻辑实现；✅ 冲突裁决路径打通Coord Agent；✅ 评审历史归档文件生成 |
| **E3 评审SLA与追踪** | ✅ 4h SLA计时器实现；✅ 超时自动放行实现；✅ 采纳率统计报告生成；✅ 超时告警在3.5h时触发 |

**整体DoD**：完整流程端到端打通，模拟提案通过评审流程，所有expect断言通过。

---

## 6. 非功能性约束

| 约束 | 要求 |
|------|------|
| 评审延迟 | 单个Reviewer评审时间 < 30min |
| SLA合规率 | > 95%（4h内完成） |
| 超时率 | < 5% |
| Reviewer可扩展性 | 新增Reviewer类型只需实现skill接口，无需修改分发器 |
| 结论可追溯 | 每个评审结论关联到具体skill版本 |

---

## 7. 关键决策记录

| 决策 | 选择 | 理由 |
|------|------|------|
| 评审模式 | 方案A：多角色独立评审 | 覆盖面广，每个风险维度有专门负责 |
| 评审SLA | 4小时，超时自动放行 | 防止评审流程成为Sprint bottleneck |
| 高风险提案 | P-002/P-005强制Security Review | AI行为边界和协作权限是最高风险维度 |
| 评审结论状态 | 推荐/不推荐/有条件通过/超时放行 | 覆盖所有场景，包含超时兜底 |
| 采纳率追踪 | 每个Reviewer独立统计 | 发现哪个Reviewer成为瓶颈 |

---

*PRD完成 | PM Agent | 2026-04-14*
