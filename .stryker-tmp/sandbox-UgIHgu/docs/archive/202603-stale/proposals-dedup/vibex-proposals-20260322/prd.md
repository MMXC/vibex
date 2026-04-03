# PRD: Agent 自进化工具集

**项目**: vibex-proposals-20260322
**版本**: v1.0
**日期**: 2026-03-22
**负责人**: PM Agent
**状态**: draft

---

## 执行摘要

### 背景
VibeX Agent 团队在日常运作中暴露出多个系统性问题：
1. **测试隔离缺陷**：`homepageAPI.test.ts` 在 `beforeAll` 修改全局 `fetch` 但未在 `afterAll` 恢复，导致 12 个测试泄漏失败
2. **知识断档**：MEMORY.md 断档 8 天（上次更新 2026-03-14），分析知识无法复用
3. **响应延迟**：Analyst 心跳仅检查 team-tasks，无法主动感知新问题，完全依赖 coord 派发

### 目标
通过 4 个工具/机制建设，实现 Agent 团队的自进化能力：
- 减少重复问题发生率
- 提升知识沉淀效率
- 缩短问题响应时间（小时级 → 分钟级）

### 成功指标
| 指标 | 当前基线 | 目标值 |
|------|---------|--------|
| 测试隔离问题导致的失败率 | 12 次/批次 | 0 |
| MEMORY.md 更新延迟 | 8 天 | < 1 天 |
| 问题首次响应时间 | > 60 分钟 | < 10 分钟 |
| 分析模板复用率 | ~0% | > 50% |

---

## Epic 1: 测试质量门禁

**目标**: 通过规范和自动化检查，防止测试隔离缺陷进入代码库

### Story 1.1: 创建测试隔离检查清单

| 字段 | 内容 |
|------|------|
| **Story ID** | F1.1 |
| **标题** | 创建 `test-quality-checklist.md` |
| **描述** | 创建测试质量检查清单，包含 beforeAll/afterAll 对称性、jest.clearAllMocks vs resetAllMocks 选择、模块状态隔离等规范 |
| **验收标准** | `expect(fs.existsSync('test-quality-checklist.md')).toBe(true)` |
| **DoD** | 文件存在于 `/root/.openclaw/vibex/docs/test-quality-checklist.md`，包含所有检查项，集成到分析模板 |
| **优先级** | P0 |
| **页面集成** | ❌ |

### Story 1.2: 集成检查清单到分析流程

| 字段 | 内容 |
|------|------|
| **Story ID** | F1.2 |
| **标题** | 检查清单集成到分析模板 |
| **描述** | 将 `test-quality-checklist.md` 集成到 Analyst 和 Reviewer 的工作模板 |
| **验收标准** | `expect(analysisTemplate.includes('test-quality-checklist')).toBe(true)` |
| **DoD** | Analyst 模板和 Reviewer 模板均引用检查清单 |
| **优先级** | P0 |
| **页面集成** | ❌ |

---

## Epic 2: MEMORY.md 自动化

**目标**: 实现知识沉淀零人工维护，解决 MEMORY.md 断档问题

### Story 2.1: task_manager.py 增加 `--log-analysis` 选项

| 字段 | 内容 |
|------|------|
| **Story ID** | F2.1 |
| **标题** | task_manager.py 自动追加分析日志到 MEMORY.md |
| **描述** | 在 `task_manager.py update` 增加 `--log-analysis` 选项，任务完成后自动追加摘要到 MEMORY.md |
| **验收标准** | `expect(output.includes('--log-analysis option available')).toBe(true)` |
| **DoD** | CLI 帮助文档包含新选项，调用后 MEMORY.md 有新条目追加 |
| **优先级** | P1 |
| **页面集成** | ❌ |

### Story 2.2: MEMORY.md 更新触发机制

| 字段 | 内容 |
|------|------|
| **Story ID** | F2.2 |
| **标题** | 任务完成自动触发 MEMORY.md 更新 |
| **描述** | team-tasks 任务完成后自动调用 `--log-analysis`，无需人工干预 |
| **验收标准** | `expect(logAnalysisCalled).toBe(true)` when task completes |
| **DoD** | 任务完成状态变更后，检查 MEMORY.md 文件 mtime 已更新 |
| **优先级** | P1 |
| **页面集成** | ❌ |

---

## Epic 3: 分析知识库建设

**目标**: 构建结构化的分析知识库，提升分析效率

### Story 3.1: 创建知识库目录结构

| 字段 | 内容 |
|------|------|
| **Story ID** | F3.1 |
| **标题** | 创建 `knowledge/patterns/` 和 `knowledge/templates/` |
| **描述** | 创建标准化知识库目录，包含 patterns（问题模式）和 templates（分析模板）两个子目录 |
| **验收标准** | `expect(fs.existsSync('knowledge/patterns/')).toBe(true) && expect(fs.existsSync('knowledge/templates/')).toBe(true)` |
| **DoD** | 两个目录均已创建，目录结构符合规范 |
| **优先级** | P1 |
| **页面集成** | ❌ |

### Story 3.2: 填充问题模式库（≥4 个）

| 字段 | 内容 |
|------|------|
| **Story ID** | F3.2 |
| **标题** | 填充 `knowledge/patterns/` 至少 4 个问题模式 |
| **描述** | 从历史分析中提取 4 个常见问题模式（如：测试隔离问题、API 版本不匹配、异步状态泄漏、配置漂移） |
| **验收标准** | `expect(patterns.length).toBeGreaterThanOrEqual(4)` |
| **DoD** | 每个模式包含：模式名称、触发条件、典型症状、根因分析、修复方案 |
| **优先级** | P1 |
| **页面集成** | ❌ |

### Story 3.3: 填充分析模板库（≥3 个）

| 字段 | 内容 |
|------|------|
| **Story ID** | F3.3 |
| **标题** | 填充 `knowledge/templates/` 至少 3 个分析模板 |
| **描述** | 创建 3 个标准化分析模板：问题分析报告模板、竞品分析模板、方案评估模板 |
| **验收标准** | `expect(templates.length).toBeGreaterThanOrEqual(3)` |
| **DoD** | 每个模板包含：输入字段、输出格式、示例、使用说明 |
| **优先级** | P2 |
| **页面集成** | ❌ |

---

## Epic 4: Analyst 心跳增强

**目标**: 让 Analyst 能够主动发现问题，而不是被动等待 coord 派发

### Story 4.1: Analyst 心跳增加主动扫描机制

| 字段 | 内容 |
|------|------|
| **Story ID** | F4.1 |
| **标题** | Analyst 心跳增加主动扫描 |
| **描述** | Analyst 心跳脚本增加"主动扫描"逻辑：发现 `docs/*test-fix*` 目录但无对应分析时，自动领取分析任务 |
| **验收标准** | `expect(scanLogicExists).toBe(true) && expect(claimOnDiscovery).toBe(true)` |
| **DoD** | 心跳脚本新增主动扫描函数，检测到新问题时自动领取并执行 |
| **优先级** | P2 |
| **页面集成** | ❌ |

### Story 4.2: 扫描冷却机制

| 字段 | 内容 |
|------|------|
| **Story ID** | F4.2 |
| **标题** | 防止扫描风暴 |
| **描述** | 同一目录 24 小时内不重复扫描，避免重复领取 |
| **验收标准** | `expect(cooldown24h).toBe(true)` |
| **DoD** | 冷却记录持久化到文件，重启后依然生效 |
| **优先级** | P2 |
| **页面集成** | ❌ |

---

## 功能点汇总

| ID | 功能点 | Epic | 优先级 | 验收标准可写 expect |
|----|--------|------|--------|---------------------|
| F1.1 | 测试隔离检查清单 | Epic1 | P0 | ✅ |
| F1.2 | 检查清单集成 | Epic1 | P0 | ✅ |
| F2.1 | --log-analysis 选项 | Epic2 | P1 | ✅ |
| F2.2 | MEMORY.md 自动更新触发 | Epic2 | P1 | ✅ |
| F3.1 | 知识库目录创建 | Epic3 | P1 | ✅ |
| F3.2 | 问题模式库填充 | Epic3 | P1 | ✅ |
| F3.3 | 分析模板库填充 | Epic3 | P2 | ✅ |
| F4.1 | 主动扫描机制 | Epic4 | P2 | ✅ |
| F4.2 | 扫描冷却机制 | Epic4 | P2 | ✅ |

---

## 非功能需求

| 需求 | 说明 |
|------|------|
| 兼容性 | 所有工具必须兼容现有 Agent 工作流 |
| 性能 | 主动扫描执行时间 < 5 秒 |
| 可维护性 | 每个工具独立，无循环依赖 |
| 文档完整性 | 每个功能必须有 README 说明用法 |

---

## 实施计划

| 阶段 | 内容 | 负责人 |
|------|------|--------|
| Phase 1 | Epic1 (测试质量门禁) | Dev + Reviewer |
| Phase 2 | Epic2 (MEMORY.md 自动化) | Dev + Coord |
| Phase 3 | Epic3 (知识库建设) | Analyst |
| Phase 4 | Epic4 (Analyst 心跳增强) | Dev + Analyst |

---

## 验收标准总览

### P0（必须发布前完成）
- [ ] F1.1: `test-quality-checklist.md` 存在且包含所有检查项
- [ ] F1.2: 分析模板引用检查清单

### P1（本周完成）
- [ ] F2.1: `task_manager.py --log-analysis` 选项可用
- [ ] F2.2: 任务完成后 MEMORY.md 自动更新
- [ ] F3.1: 知识库目录创建
- [ ] F3.2: 至少 4 个问题模式

### P2（下一批次）
- [ ] F3.3: 至少 3 个分析模板
- [ ] F4.1: Analyst 主动扫描上线
- [ ] F4.2: 冷却机制防止扫描风暴

---

## DoD (Definition of Done)

每个 Story 的 DoD 必须满足：
1. 代码/文档已提交到仓库
2. 验收标准中的 expect() 断言可执行并通过
3. README 或内联注释说明用法
4. 无未解决的依赖阻塞

---

*PRD 由 PM Agent 生成*
*数据来源: analyst-proposals.md (20260322) + tester-proposals-20260322.md*
