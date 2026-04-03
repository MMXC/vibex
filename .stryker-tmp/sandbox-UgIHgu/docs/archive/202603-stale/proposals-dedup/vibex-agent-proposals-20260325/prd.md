# PRD: OpenViking 工程质量提升 — 心跳状态一致性 + 提案标准化

**项目**: vibex-agent-proposals-20260325
**版本**: 1.0
**PM**: PM Agent
**日期**: 2026-03-25
**状态**: 🔴 草稿

---

## 1. 执行摘要

### 问题陈述
OpenViking 多智能体协作系统存在 **任务状态管理碎片化** 问题：
- 心跳脚本（bash）与任务管理器（Python）使用不同数据源
- 导致任务状态不同步、虚假完成驳回、`|| true` 静默失败
- 每日因此浪费约 2-4 小时调试时间

### 目标
两步走：① 快速止血（统一数据源），② 建立提案质量标准

### 成功指标
| 指标 | 目标 |
|------|------|
| 任务状态不一致次数 | ≤ 1 次/周（当前 4 次/天） |
| 虚假完成驳回次数 | 0 次/天 |
| PRD 验收标准断言化率 | 100% |
| Open Questions 确认率 | ≥ 80%（2 周内） |

---

## 2. 功能需求

### F1: 心跳状态双写一致性修复（P1）
**负责人**: Dev | **工时**: ~2h

**验收标准**:
- `expect(task_manager.py reads both old and new paths)` — 降级逻辑存在
- `expect(bash scripts call Python API only)` — 无直接 JSON 读写
- `expect(grep -r '|| true' scripts == 0)` — 无静默失败
- `expect(heartbeat scan accuracy >= 99%)` — 状态一致

**依赖**: 无外部依赖

### F2: 提案路径契约标准化（P1）
**负责人**: Reviewer | **工时**: ~1h

**验收标准**:
- `expect(grep 'proposals/YYYYMMDD' HEARTBEAT.md == proposals/*/YYYYMMDD/)` — 路径一致
- `expect(all agent proposals in same directory)` — 统一存储

**依赖**: F1 完成

### F3: ESLint 门禁增强（P1）
**负责人**: Dev | **工时**: ~1h

**验收标准**:
- `expect(exit_code == 0 when npm run lint -- --max-warnings=0)` — 无 warnings
- `expect(CI pipeline fails on lint warnings)` — 门禁生效

**依赖**: F1 完成

### F4: PRD 验收标准断言化（P1）
**负责人**: PM | **工时**: ~1h

**验收标准**:
- `expect(grep 'expect(' docs/prd/*.md | wc -l > 0)` — 断言存在
- `expect(all acceptance criteria in expect() format)` — 格式正确
- `expect(PR review checks for expect() format)` — 审查覆盖

**依赖**: 无

### F5: Open Questions 追踪机制（P2）
**负责人**: PM + Coord | **工时**: ~2h

**验收标准**:
- `expect(all PRD Open Questions have status emoji)` — 🔴🟡🟢
- `expect(Open Questions resolved within 2 weeks)` — 追踪有效
- `expect(weekly review of open OQs)` — 定期清点

**依赖**: F4 完成

### F6: AI 生成代码内容审查（P2）
**负责人**: Reviewer | **工时**: ~2h

**验收标准**:
- `expect(no eval/exec in generated tar)` — 安全过滤
- `expect(reviewer checks AI code content)` — 审查到位

**依赖**: F1 完成

---

## 3. Epic 拆分

### Epic 1: 状态一致性快速修复（P1）
**工时**: ~3h

| Story | 验收 |
|--------|------|
| S1.1 task_manager.py 双路径降级 | expect(降级逻辑存在且测试通过) |
| S1.2 bash 心跳统一调用 Python API | expect(无直接 JSON 读写) |
| S1.3 移除 `\|\| true` 静默失败 | expect(静默失败数 == 0) |

### Epic 2: 提案质量标准化（P1）
**工时**: ~2h

| Story | 验收 |
|--------|------|
| S2.1 路径契约标准化 | expect(all agents use same path) |
| S2.2 ESLint 门禁增强 | expect(CI fails on warnings) |
| S2.3 PRD 断言化规范 | expect(all PRD AC in expect() format) |

### Epic 3: 追踪与改进（P2）
**工时**: ~3h

| Story | 验收 |
|--------|------|
| S3.1 Open Questions 追踪机制 | expect(所有 OQ 有状态) |
| S3.2 AI 代码审查流程 | expect(eval/exec 过滤通过) |
| S3.3 提案模板标准化 | expect(PM 提案格式统一) |

---

## 4. UI/UX 流程

无用户界面，纯内部系统改进。

---

## 5. 非功能需求

| 类型 | 要求 |
|------|------|
| **兼容性** | 向后兼容，旧路径继续有效 |
| **可测试性** | 所有功能点可写 expect() 断言 |
| **可回滚** | 每次改动可单个撤销 |
| **监控** | 心跳扫描准确性可量化追踪 |

---

## 6. DoD

- [ ] Epic 1 全部 3 个 Story 完成
- [ ] Epic 2 全部 3 个 Story 完成
- [ ] Epic 3 全部 3 个 Story 完成（或 P2 延期决策）
- [ ] 无静默失败模式
- [ ] 任务状态一致性验证通过
- [ ] PRD 断言格式已在下次 PRD 中应用
