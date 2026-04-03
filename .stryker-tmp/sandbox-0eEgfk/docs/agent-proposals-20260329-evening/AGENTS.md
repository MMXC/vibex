# AGENTS.md — Agent 提案执行追踪与质量基线体系

**项目**: agent-proposals-20260329-evening  
**版本**: v1.0  
**日期**: 2026-03-29 晚间  
**作者**: Architect Agent

---

## 一、项目约束

### 1.1 范围约束

| 约束类型 | 描述 |
|---------|------|
| **包含** | proposal_tracker.py / Sprint 基线 / Epic 规模检查 / canvasStore 重构 / E2E 测试 / Review Gate / Phase 文件规范 / dedup 验证 |
| **不包含** | Canvas 功能演进 / 后端 API 重构 / 非 VibeX 项目 |
| **工作目录** | `/root/.openclaw/vibex` |

### 1.2 技术约束

| # | 约束 | 理由 |
|---|------|------|
| TC-01 | proposal_tracker.py 用 Python 实现，复用 scripts/task_state.py | task_manager.py 已用 Python，保持一致 |
| TC-02 | canvasStore 采用 Zustand slice pattern，不迁移框架 | 避免重构风险（PRD OQ3） |
| TC-03 | E2E 测试使用 Playwright（已有配置），不引入新框架 | 复用 vibex-fronted/playwright/ 配置 |
| TC-04 | Review Gate 存储为 Markdown 文件，不用数据库 | 复用 proposals/ 目录结构，文件版本控制 |
| TC-05 | Sprint 基线存储为 docs/SPRINT_BASELINE.md | 文档化管理，无需工具 |

### 1.3 质量约束

| # | 约束 | 验证方式 |
|---|------|---------|
| QC-01 | proposal_tracker.py 执行 < 10s | 手动计时 + CI 日志 |
| QC-02 | Canvas E2E 覆盖率 ≥ 80% | Playwright HTML 报告 |
| QC-03 | canvasStore 既有 useCanvasStore() 调用无需修改 | Vitest 既有测试全绿 |
| QC-04 | 所有 Phase 文件符合 kebab-case 命名 | scripts/phase-file-template.md 验证 |
| QC-05 | proposal_tracker 状态与 task_manager 一致性 > 95% | 抽样核对 |

### 1.4 红线约束（禁止事项）

| 红线 | 描述 | 违规处理 |
|------|------|---------|
| **RED-01** | 不得跳过 Sprint 0（E1.1 + E3.2）直接做 P1/P2 | 驳回 |
| **RED-02** | canvasStore 拆分时不得删除既有 API | 保留统一导出层 |
| **RED-03** | proposal_tracker 不得读取 task_manager 源码（只调用接口） | 通过 task_state.py 接口 |
| **RED-04** | dedup 压测不得使用真实用户提案内容（OQ2） | 匿名化合成数据 |
| **RED-05** | 性能基线测试不得在 CI 禁用 | 必须通过 |

---

## 二、Dev 自主认领规范（E2.1 产出）

### 2.1 触发条件

```
Dev 自主认领规范：
1. Dev 处于 idle 状态 > 30min
2. task_manager 有 pending 任务（dev 标签）
3. Dev 可直接认领，无需等待 Coord 派发

禁止事项：
❌ 不得跳过 phase1 直接认领 phase2 任务
❌ 不得认领非 dev 标签任务
❌ 不得在未确认上下文的情况下认领复杂 Epic
```

### 2.2 回报机制

| 阶段 | 执行 | 回报 |
|------|------|------|
| 认领 | `task_manager.py update <project> <task> in-progress` | — |
| 完成 | `task_manager.py update <project> <task> done` + #coord 回报 | 产出物路径 |
| 阻塞 | #coord 上报 | 说明原因 + 建议方案 |
| 放弃 | `task_manager.py update <project> <task> failed` + #coord 回报 | 说明原因 |

---

## 三、Epic 规模标准（E1.3 产出）

### 3.1 规模阈值

| 规模 | 功能点数 | 处理方式 |
|------|---------|---------|
| ✅ 标准 Epic | 3-8 | 直接进入 phase2 |
| ⚠️ 大 Epic | 9-15 | 必须拆分 sub-Epic |
| 🔴 超大 Epic | 16+ | 强制拆分 + Coord 审批 |

### 3.2 检查流程

```
PM 在 prd.md 标注功能点总数
    ↓
Architect 在 architecture.md 检查 Epic 数量
    ↓
epic_scale_check.py 自动验证
    ↓
不符合标准 → 打回 PM 重新拆分
```

---

## 四、四阶段 Review Gate（E4.2 产出）

### Gate 1: Analysis Review（Analyst → PM）
- [ ] 问题陈述清晰（能否用一句话描述）
- [ ] 影响范围量化（哪些项目/功能受影响）
- [ ] 数据支撑充分（有数据/无数据需说明）
- [ ] 分析方法论明确（归纳/演绎/类比）
- [ ] 假设条件列出

### Gate 2: PRD Review（PM → Architect）
- [ ] Story 数量在标准范围内（3-8 个/Epic）
- [ ] 验收标准全部为 expect() 格式
- [ ] 依赖关系图完整
- [ ] 优先级（P0/P1/P2）有理由支撑
- [ ] 驳回红线存在

### Gate 3: Architecture Review（Architect → Coord）
- [ ] 技术选型有 trade-off 分析
- [ ] 风险评估包含缓解措施
- [ ] Epic 拆分符合规模标准（3-8 功能点）
- [ ] 超大 Epic（16+）有 Coord 审批记录
- [ ] 向后兼容策略存在
- [ ] Open Questions 有状态更新

### Gate 4: Code Review（Dev → Reviewer → Coord）
- [ ] 无 P0/P1 违规项
- [ ] 测试覆盖率 ≥ 80%
- [ ] 无安全漏洞（无硬编码密码/SQL 注入/XSS）
- [ ] Review 报告有 P0-P2 分级
- [ ] 所有 P0-P1 问题有预计修复时间

---

## 五、Phase 文件格式标准（E4.1 产出）

### 5.1 命名规范
```bash
# ✅ 正确
analyze-requirements-phase1.md
implement-feature-phase2.md
fix-bug-phase1.md

# ❌ 错误
AnalyzeRequirements.md
implement_feature_phase2.md
```

### 5.2 元数据头部
```markdown
# {Task 名称} — Phase {N}

**状态**: in-progress | done
**开始时间**: YYYY-MM-DD HH:MM
**完成时间**: YYYY-MM-DD HH:MM
**负责人**: {Agent 名称}
```

### 5.3 内容结构
```markdown
## 执行摘要（3 句话内）

## 产出清单
- [x] 产出 1
- [x] 产出 2

## 发现与问题
### 发现
1. ...
### 问题
1. ...

## 下一步行动
1. ...

<!-- __FINAL__ -->
```

---

## 六、Sprint 基线参考（E1.2 产出）

| 类型 | 速度基线 | 复杂度系数 |
|------|---------|-----------|
| Bug Fix | 1-2h | 0.8 |
| UI 优化 | 2-4h | 1.0 |
| Feature 小 | 0.5-1d | 1.2 |
| Feature 中 | 2-3d | 1.5 |
| Feature 大 | 5-7d | 2.0 |

**工时估算公式**: `estimated_hours = base_hours × complexity_factor × (1 + rework_rate)`
- 当前团队 rework_rate ≈ 0.15

---

## 七、代码审查 Checklist（Dev + Reviewer 共用）

### 7.1 Python 脚本（proposal_tracker.py）
- [ ] 依赖已存在于 scripts/（复用 task_state.py）
- [ ] 无硬编码路径（使用 Path 对象）
- [ ] 错误处理（文件不存在 / 解析失败）
- [ ] 类型注解完整
- [ ] 执行时间 < 10s（大数据集时）
- [ ] 日志输出有分级（info/warn/error）

### 7.2 TypeScript 重构（canvasStore）
- [ ] 既有 useCanvasStore() API 保持不变
- [ ] 所有测试通过（Vitest）
- [ ] 类型定义完整（无 any）
- [ ] Zustand middleware 配置保留（devtools/persist）
- [ ] 向后兼容层（统一导出）存在

### 7.3 E2E 测试（canvas-phase2.spec.ts）
- [ ] 每个测试用例独立（无状态污染）
- [ ] 有适当的 waitFor 等待
- [ ] 有 describe 分组
- [ ] 覆盖 PRD E3.2 所有 5 个测试用例
- [ ] pointer-events: none 测试存在

### 7.4 性能测试（canvas-performance.spec.ts）
- [ ] BC20 < 100ms
- [ ] BC50 FPS ≥ 30
- [ ] BC100 无崩溃
- [ ] 测试数据注入方法安全

---

## 八、产出物清单

| Story | 产出物 | 路径 | 验收标准 |
|-------|-------|------|---------|
| E1.1 | proposal_tracker.py | scripts/ | 执行 < 10s |
| E1.1 | EXECUTION_TRACKER.json | proposals/ | 一致性 > 95% |
| E1.2 | SPRINT_BASELINE.md | docs/ | 5 类型 + 10+ 校准 |
| E1.3 | epic_scale_check.py | scripts/ | 平均 ≤ 8 功能点 |
| E1.4 | SPRINT_RETRO_TEMPLATE.md | docs/ | ≥ 2 跨项目模式 |
| E2.1 | AGENTS.md（更新） | vibex/ | 认领率 > 50% |
| E2.2 | REVIEW_REPORT_TEMPLATE.md | skills/gstack-review/ | P0-P2 分级 |
| E3.1 | canvasStore 4 切片 | src/lib/canvas/stores/ | 向后兼容 |
| E3.2 | canvas-phase2.spec.ts | playwright/ | 覆盖率 ≥ 80% |
| E3.3 | canvas-performance.spec.ts | playwright/ | 5 测试用例 |
| E3.4 | dedup 验证报告 | reports/ | 误报 < 1% |
| E4.1 | Phase 文件格式标准 | scripts/ | __FINAL__ > 95% |
| E4.2 | REVIEW_GATES.md | docs/ | 4 Gate + 20+ 检查 |

---

*AGENTS.md 完成 | Architect Agent | 2026-03-29 21:28 GMT+8*
