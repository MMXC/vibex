# PRD: vibex-daily-proposals-20260319

## 1. 执行摘要

| 属性 | 值 |
|------|-----|
| **项目** | vibex-daily-proposals-20260319 |
| **类型** | 提案综合实施 |
| **目标** | 综合 Architect × 3 + PM × 1 共 7 个提案，形成实施路线图 |
| **完成标准** | P0 提案进入开发阶段，P1 提案完成 PRD |
| **上游来源** | `/root/.openclaw/vibex/docs/vibex-daily-proposals-20260319/analysis.md` |
| **工作量** | 10-15 人天 |

---

## 2. 问题陈述

- API 服务层耦合过高，单文件 api.ts 无法按需加载和独立测试
- 问题排查依赖人工日志分析，缺乏系统性根因分析工具
- PRD 模板不统一，验收标准缺乏可测试性
- 用户故事地图工具缺失，需求沟通效率低

---

## 3. Epic 拆分

### Epic 1: API 服务层拆分 (A-001) 🔴 P0

**Story F1.1**: 服务模块化拆分
- 将 `api.ts` 拆分为 `auth.ts`, `project.ts`, `message.ts`, `flowchart.ts`
- **验收标准**:
  - `expect(fs.existsSync('src/services/auth.ts')).toBe(true)`
  - `expect(fs.existsSync('src/services/project.ts')).toBe(true)`
  - `expect(fs.existsSync('src/services/message.ts')).toBe(true)`
  - `expect(fs.existsSync('src/services/flowchart.ts')).toBe(true)`
  - `expect(fs.existsSync('src/services/index.ts')).toBe(true)`

**Story F1.2**: 兼容层实现
- 保留 `api.ts` 作为兼容层，支持现有调用方式
- **验收标准**:
  - `expect(import api from '@/services/api').not.toThrow()`
  - `expect(existingCalls.length).toBe(0)` // 无破坏性变更

**Story F1.3**: 独立测试验证
- **验收标准**:
  - `expect(exec('npm test -- src/services').exitCode).toBe(0)`
  - `expect(coverage).toBeGreaterThanOrEqual(80)`

**Story F1.4**: 性能验证
- **验收标准**:
  - `expect(apiResponseTime).toBeLessThan(baseline * 0.8)` // 降低 20%

**页面集成**: 【需页面集成】ProjectPage, FlowchartEditor, MessageThread

---

### Epic 2: 首页五步流程重构 (A-002) 🔴 P0

> ⚠️ **依赖**: Epic 1 (API 拆分) 完成后再启动

**Story F2.1**: 流程架构扩展
- 支持最多 7 步可配置流程
- **验收标准**:
  - `expect(maxSteps).toBeGreaterThanOrEqual(7)`
  - `expect(validateStepTransition(1, 3)).toBe(true)` // 支持跳过

**Story F2.2**: Step 3 - 需求澄清
- **验收标准**:
  - `expect(hasStep('requirement-clarification')).toBe(true)`

**Story F2.3**: Step 4 - 限界上下文定义
- **验收标准**:
  - `expect(hasStep('bounded-context')).toBe(true)`

**Story F2.4**: 向后兼容
- **验收标准**:
  - `expect(legacy3StepFlow).toWork()` // 现有 3 步流程正常

**Story F2.5**: 用户转化率验证
- **验收标准**:
  - `expect(completionRate).toBeGreaterThan(baseline * 1.15)` // +15%

**页面集成**: 【需页面集成】HomePage (/), StepNavigation, FlowContainer

---

### Epic 3: RCA CLI 根因分析工具 (A-003) 🟡 P1

**Story F3.1**: 日志聚合功能
- 按时间/严重度/模块聚合日志
- **验收标准**:
  - `expect(parseLog('info', '2026-03-19 10:00')).toBeDefined()`
  - `expect(aggregateBySeverity(['error', 'warn', 'info']).error.length).toBeGreaterThan(0)`

**Story F3.2**: 异常模式识别
- **验收标准**:
  - `expect(detectPattern(logs)).toContain('repeated_error')`

**Story F3.3**: 报告生成
- 输出 Markdown 格式分析报告
- **验收标准**:
  - `expect(exec('rca --log-dir ./logs --date 2026-03-19 --severity error')).toContain('## 分析报告')`
  - `expect(exec('rca --help').exitCode).toBe(0)`

**Story F3.4**: 执行性能
- **验收标准**:
  - `expect(exec('rca --analyze .').duration).toBeLessThan(30000)` // < 30s

**页面集成**: 【无需页面集成】独立 CLI 工具

---

### Epic 4: PM 提案组 (P-001 ~ P-004) 🟡 P1

**Story F4.1**: PRD 自动化验证工具 (P-001)
- 检查 expect() 断言格式
- **验收标准**:
  - `expect(validatePRD(prdContent).warningCount).toBe(0)` // 格式正确
  - `expect(checkExpectFormat(prd)).accuracy).toBeGreaterThanOrEqual(95)`

**Story F4.2**: PRD 模板标准化 (P-004)
- 统一模板 + 填写指南
- **验收标准**:
  - `expect(fs.existsSync('docs/templates/prd-template.md')).toBe(true)`
  - `expect(templateCoverage).toBe(100)` // 所有项目使用模板

**Story F4.3**: 用户故事地图工具 (P-003)
- 层级映射模板
- **验收标准**:
  - `expect(fs.existsSync('docs/templates/user-story-map.md')).toBe(true)`
  - `expect(hasEpicStoryTaskStructure(template)).toBe(true)`

**Story F4.4**: 需求变更追踪系统 (P-002) 🟢 P2
- **验收标准**:
  - `expect(changelog自动化).toBe(true)` // Git 版本控制

**页面集成**: 【无需页面集成】文档/工具类

---

## 4. 优先级矩阵

| 优先级 | Epic | Story | 工作量 | 依赖 |
|--------|------|-------|--------|------|
| 🔴 P0 | Epic 1 | F1.1-1.4 | 3-5天 | 无 |
| 🔴 P0 | Epic 2 | F2.1-2.5 | 2-3周 | Epic 1 |
| 🟡 P1 | Epic 3 | F3.1-3.4 | 2-3天 | 无 |
| 🟡 P1 | Epic 4 | F4.1-4.3 | 5-8天 | 无 |
| 🟢 P2 | Epic 4 | F4.4 | 3-4天 | 无 |

---

## 5. 实施路线图

```
Week 1:
├── Epic 3 (A-003 RCA CLI) — 独立工具，快速产出
└── Epic 4 Story F4.2 (P-004 PRD 模板) — 文档工作

Week 2-3:
└── Epic 1 (A-001 API 拆分 Phase1) — auth.ts

Week 4-6:
├── Epic 1 (A-001 剩余服务拆分)
└── Epic 4 Story F4.1 (P-001 PRD 验证工具)

Week 7-12:
└── Epic 2 (A-002 五步流程) — 分阶段实施
```

---

## 6. 验收标准汇总

| ID | Given | When | Then |
|----|-------|------|------|
| AC1.1 | 服务拆分完成 | 检查文件 | 5 个服务文件存在 |
| AC1.2 | 现有调用 | 测试 | 无破坏性变更 |
| AC2.1 | 流程配置 | 设置 7 步 | 流程正常加载 |
| AC2.2 | 现有 3 步流程 | 用户操作 | 向后兼容 |
| AC3.1 | `rca --help` | CLI 执行 | 退出码 0 |
| AC3.2 | 分析日志 | `rca --analyze .` | < 30s 完成 |
| AC4.1 | PRD 模板 | 检查 | 格式完整 |

---

## 7. 非功能需求

- **可维护性**: 服务模块独立，无循环依赖
- **性能**: API 响应时间降低 20%，RCA 分析 < 30s
- **可用性**: CLI 跨平台支持（Linux/Mac/Windows）
- **兼容性**: 向后兼容现有 API 调用

---

## 8. 风险评估

| 风险 | 缓解措施 |
|------|----------|
| API 迁移破坏现有功能 | 完整测试覆盖 + 兼容层 |
| 用户习惯变更抵触 | A/B 测试 + 渐进切换 |
| 工具使用率低 | 团队培训 + CI 集成 |

---

## 9. DoD

- [ ] Epic 1 (API 拆分): 5 个服务文件，测试通过，向后兼容
- [ ] Epic 2 (五步流程): 可配置 7 步，向后兼容 3 步
- [ ] Epic 3 (RCA CLI): --help 正常，分析 < 30s
- [ ] Epic 4 (PM 工具): PRD 模板 100% 覆盖
- [ ] 所有 P0 项目已完成或进入开发
