# PRD: Analyst 自检任务 2026-03-19

## 1. 执行摘要

| 属性 | 值 |
|------|-----|
| **项目** | analyst-self-check-20260319 |
| **类型** | 内部自检 |
| **目标** | 验证 Analyst Agent 工作流程完整性，识别改进机会 |
| **完成标准** | 自检清单 100% 通过，产出改进报告 |

## 2. 问题陈述

Analyst Agent 需要定期验证自身工作产出的质量与完整性，确保：
- 分析模板和工具处于可用状态
- 知识库索引准确且最新
- 提案收集流程标准化

## 3. 功能需求

### F1: 分析报告模板自检
- **描述**: 验证 `docs/templates/analysis-template-v2.md` 存在且格式正确
- **验收标准**:
  - `expect(fs.existsSync('docs/templates/analysis-template-v2.md')).toBe(true)`
  - `expect(content).toContain('# 需求分析报告')`
  - `expect(content).toContain('## 1. 执行摘要')`
  - `expect(content).toContain('## 验收标准')`

### F2: 根因分析工具自检
- **描述**: 验证 RCA 工具脚本存在且可执行
- **验收标准**:
  - `expect(fs.existsSync('docs/knowledge-base/scripts/rca-tool.sh')).toBe(true)`
  - `expect(await exec('bash rca-tool.sh --help').exitCode).toBe(0)`

### F3: 知识库索引自检
- **描述**: 验证知识库索引文档存在
- **验收标准**:
  - `expect(fs.existsSync('docs/knowledge-base/index.md')).toBe(true)`
  - `expect(content).toContain('问题分类')`
  - `expect(content).toContain('严重级别')`

### F4: 提案收集流程自检
- **描述**: 验证今日提案文件存在且格式正确
- **验收标准**:
  - `expect(fs.existsSync('proposals/20260319/analyst-proposals.md')).toBe(true)`
  - `expect(content).toContain('## 1. 自我检查清单')`

### F5: 改进报告生成
- **描述**: 生成今日自检改进报告
- **验收标准**:
  - `expect(report).toContain('自检结论')`
  - `expect(report).toContain('状态总结')`

## 4. Epic 拆分

### Epic 1: 自检工具建设
- **Story 1.1**: 配置自检清单检查项
- **Story 1.2**: 实现自动检查脚本
- **Story 1.3**: 生成自检报告

### Epic 2: 流程标准化
- **Story 2.1**: 制定自检频率规范
- **Story 2.2**: 建立改进跟踪机制

## 5. UI/UX 流程

```
每日定时触发 → 自动检查清单 → 生成报告 → 发送 Slack 通知
```

## 6. 验收标准汇总

| ID | Given | When | Then |
|----|-------|------|------|
| AC1 | 分析报告模板存在 | 读取模板 | 包含标准章节 |
| AC2 | RCA 工具存在 | 执行 --help | 退出码为 0 |
| AC3 | 知识库索引存在 | 读取索引 | 包含分类信息 |
| AC4 | 提案文件存在 | 读取提案 | 格式正确 |
| AC5 | 自检完成 | 生成报告 | 包含结论 |

## 7. 非功能需求

- **可靠性**: 自检脚本成功率 > 99%
- **及时性**: 每日 UTC 00:00 前完成
- **可观测性**: 结果记录到日志

## 8. DoD

- [ ] 所有 5 个检查项通过
- [ ] 自检报告生成完成
- [ ] Slack 通知发送成功
- [ ] 改进点已记录
