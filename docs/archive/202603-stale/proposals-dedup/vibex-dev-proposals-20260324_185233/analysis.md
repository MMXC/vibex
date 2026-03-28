# 需求分析报告：Dev 提案（20260324_185233）

**项目**: vibex-dev-proposals-20260324_185233  
**分析日期**: 2026-03-24  
**分析师**: analyst agent  
**来源文档**: `/root/.openclaw/vibex/proposals/dev-proposal-20260324.md`  
**提案时间**: 2026-03-24 18:58 (Asia/Shanghai)

---

## 一、需求概述

本次 Dev Agent 自检提案共提出 **6 项改进**，涉及工具链自动化、前端质量、架构债务清理和 AI Agent 治理四个领域。提案基于当天 Epic1-4 的实际工作总结（工具链止血、packages/types 初始化、ErrorBoundary 去重、HEARTBEAT 话题追踪脚本）提炼而出。

---

## 二、提案清单与分类

### 2.1 问题分类

| 类别 | 数量 | 占比 |
|------|------|------|
| 🔧 工具链自动化 | 2 | 33% |
| 🏗️ 架构债务 | 2 | 33% |
| ✅ 测试质量 | 1 | 17% |
| 🤖 AI 治理 | 1 | 17% |

### 2.2 详细提案列表

| ID | 提案名称 | 优先级 | 工时 | 类型 |
|----|---------|--------|------|------|
| P1-1 | TypeScript Prop 一致性自动检查 | P1 | 2h | 工具链 |
| P1-2 | HEARTBEAT 话题追踪自动化 | P1 | 4h | 工具链 |
| P1-3 | confirmationStore.ts 拆分重构 | P1 | 1.5d | 架构债务 |
| P1-4 | E2E 测试纳入 CI | P1 | 2h | 测试质量 |
| P2-1 | JSON Schema 统一验证 | P2 | 4h | 工具链 |
| P2-2 | proposal_quality_check.py 增强 | P2 | 2h | AI 治理 |

---

## 三、可行性分析

### 3.1 P1 提案

#### P1-1: TypeScript Prop 一致性自动检查

**技术可行性**: ✅ 高
- 现有 `packages/types/` 已初始化，类型扫描基础设施就绪
- `tsx` 文件 interface 解析逻辑已有参考（dedup 机制的 AST 解析）
- CI pre-push hook 已有基础架构

**资源可行性**: ✅ 合理
- 工时 2h，dev 可独立完成

**风险**: 🟡 中
- prop 类型冲突检测可能产生误报（同名 prop 不同语义）
- 需明确定义"冲突"判定规则

#### P1-2: HEARTBEAT 话题追踪自动化

**技术可行性**: ✅ 高
- `get_task_thread_id` / `save_task_thread_id` 已实现
- 今天 Epic4 已完成话题追踪脚本，剩余工作为集成

**资源可行性**: ✅ 合理
- 工时 4h，需修改 `dev-heartbeat.sh` 和 `feishu_self_notify`

**风险**: 🟢 低
- 依赖 Slack API 响应格式稳定性
- 建议添加 thread ID 缓存容错

#### P1-3: confirmationStore.ts 拆分重构

**技术可行性**: ✅ 高
- Zustand slice pattern 是成熟模式，团队已有使用经验
- 保持主 API 不变的策略降低了回归风险

**资源可行性**: ⚠️ 需关注
- 工时 1.5d，规模较大
- 涉及 Store 状态迁移，需同步更新所有消费组件

**风险**: 🔴 高
- **破坏性变更风险高**：461 行 Store，5 个子流程，改动面大
- 需完整回归测试覆盖
- **建议**：拆分为小 PR 分批上线，每批只迁移一个 slice

#### P1-4: E2E 测试纳入 CI

**技术可行性**: ✅ 高
- Playwright 测试已存在（9 个）
- GitHub Actions workflow 已有基础

**资源可行性**: ✅ 合理
- 工时 2h

**风险**: 🟡 中
- CI runner 需安装 Playwright browsers（可能超时）
- E2E 测试不稳定（flaky tests）可能导致 CI 误报

---

### 3.2 P2 提案

#### P2-1: JSON Schema 统一验证

**技术可行性**: ✅ 高
- 已有 `task_manager.py` 可扩展

**资源可行性**: ✅ 合理
- 工时 4h

**风险**: 🟢 低
- 需统一两个 schema 版本，字段对齐需人工确认

#### P2-2: proposal_quality_check.py 增强

**技术可行性**: ⚠️ 中
- 需定义"提案影响力评分"量化标准

**资源可行性**: ✅ 合理
- 工时 2h

**风险**: 🟡 中
- 评分算法主观性强，需与 Coord 确认评价维度

---

## 四、技术风险汇总

| 风险 | 影响 | 概率 | 等级 | 缓解措施 |
|------|------|------|------|----------|
| confirmationStore 拆分引发回归 | 高 | 高 | 🔴 High | 分批 PR + 完整测试覆盖 |
| E2E 测试 flaky 导致 CI 误报 | 中 | 中 | 🟡 Medium | 添加 flaky test retry 机制 |
| prop 一致性检测误报 | 低 | 中 | 🟡 Medium | 人工 review 阶段过滤 |
| JSON Schema 字段冲突 | 中 | 低 | 🟢 Low | 先验证再合并 |
| HEARTBEAT 话题追踪 thread ID 丢失 | 低 | 低 | 🟢 Low | 添加缓存容错 |

---

## 五、优先级建议

### 优先级矩阵

```
        高价值
           ↑
           │  ★ P1-3(架构债)  ★ P1-4(测试质量)
           │
低价值 ←———┼—————————————→ 高价值
           │
           │  ○ P2-1(JSON验证)  ○ P2-2(QC增强)
           │
           ↓
        低价值
   ← 低紧急度           高紧急度 →
```

### 推荐执行顺序

| 顺序 | 提案 | 理由 |
|------|------|------|
| 1 | P1-4 E2E 纳入 CI | 2h 投入，快速见效，保护已有工作 |
| 2 | P1-2 HEARTBEAT 自动化 | 4h，消除每日手动操作 |
| 3 | P1-1 Prop 一致性检查 | 2h，防止未来重构回归 |
| 4 | P2-1 JSON Schema 验证 | 4h，工具链质量保障 |
| 5 | P1-3 confirmationStore 拆分 | 1.5d，架构债务，需要分批执行 |
| 6 | P2-2 proposal_quality_check 增强 | 2h，AI 治理，长期收益 |

---

## 六、实现方案概述

### P1-1: TypeScript Prop 一致性自动检查

**实现路径**:
1. 创建 `scripts/ts-prop-audit.js`，使用 TypeScript AST 解析器
2. 扫描 `.tsx` 文件的 `interface Props`，提取 prop 名称和类型
3. 按 prop 名称聚合，检测类型签名冲突
4. 输出冲突报告（JSON + human-readable）
5. 集成到 CI pre-push hook

**关键文件**:
- `scripts/ts-prop-audit.js`（新建）
- `.husky/pre-push`（修改）

### P1-2: HEARTBEAT 话题追踪自动化

**实现路径**:
1. 修改 `dev-heartbeat.sh`，任务领取成功后调用 `create_thread_and_save`
2. 修改 `feishu_self_notify`，从 Slack 响应提取 thread ID 并保存
3. 添加容错：thread ID 不存在时不阻塞心跳

### P1-3: confirmationStore.ts 拆分重构

**实现路径**:
1. 识别 5 个子流程边界（RequirementStep / ContextStep / ModelStep / FlowStep / 共享状态）
2. 按 Zustand slice pattern 创建独立 store 文件
3. 迁移每个子流程的状态和 action
4. 创建 re-export 层保持 `useConfirmationStore` API 兼容
5. 分 3 个 PR 提交：基础结构 → 数据迁移 → 清理废弃代码

### P1-4: E2E 纳入 CI

**实现路径**:
1. GitHub Actions workflow 添加 Playwright 安装 step
2. 添加 `npm run test:e2e:ci` 命令（headless + 快速模式）
3. 配置 flaky test retry（最多 2 次）
4. E2E 测试失败不阻塞 merge，但需通知 team

### P2-1: JSON Schema 统一验证

**实现路径**:
1. 创建 `schemas/task.schema.json` 作为权威 schema
2. 在 `task_manager.py` 读写操作前验证 schema
3. 添加 `validate` 子命令供调试使用

### P2-2: proposal_quality_check.py 增强

**实现路径**:
1. 定义提案影响力评分维度（实现难度、影响范围、战略价值）
2. 检测提案间依赖关系，输出依赖图
3. 与 MEMORY.md 失败模式库联动

---

## 七、工时汇总

| 优先级 | 提案数 | 总工时 |
|--------|--------|--------|
| P1 | 4 | 2d+4h（≈ 2d） |
| P2 | 2 | 6h |
| **合计** | **6** | **~2.5d** |

---

## 八、质量评分（INVEST）

| 维度 | 得分 | 说明 |
|------|------|------|
| 独立性 | 4/5 | 各提案独立，少数有依赖（P1-3 依赖 P3-1 共享类型包）|
| 可协商性 | 4/5 | 方案有替代空间 |
| 价值明确 | 5/5 | 均有明确问题-收益描述 |
| 可估算性 | 4/5 | 工时有估算，架构债存在不确定性 |
| 粒度适中 | 4/5 | 均为 0.5d-2d 规模，可执行 |
| 可测试性 | 5/5 | 每项均可定义验收标准 |
| **总分** | **26/30** | **通过（≥21）** |

---

## 九、下一步建议

- [ ] **PM**: 为 P1 提案编写 PRD，重点关注 confirmationStore 拆分范围界定
- [ ] **Architect**: 审查 confirmationStore 拆分方案，提供 Zustand slice 最佳实践指导
- [ ] **Coord**: 确认 P2-2 提案影响力评分维度是否对齐团队价值标准
- [ ] **Dev**: 优先执行 P1-4 和 P1-2（工具链，快速见效）
