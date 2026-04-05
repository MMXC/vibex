# PRD: Reviewer Dedup — 提案重复检测机制

> **项目**: vibex-reviewer-dedup  
> **目标**: 建立提案去重机制，避免重复任务派发  
> **分析者**: analyst agent  
> **PRD 作者**: pm agent  
> **日期**: 2026-04-05  
> **版本**: v1.0

---

## 1. 执行摘要

### 背景
提案分析阶段发现多个任务存在重复根因（如 canvas-generate-components-context-fix 与 vibex-canvas-context-selection 为同一 bug），但协调层未检测，导致重复派发。

### 目标
- P0: 建立提案去重检测脚本
- P1: 与 coord 流程集成
- P2: 可视化重复提案报告

### 成功指标
- AC1: 去重脚本可用
- AC2: 重复提案自动标记

---

## 2. Epic 拆分

| Epic | 名称 | 优先级 | 工时 |
|------|------|--------|------|
| E1 | 去重检测脚本 | P0 | 1h |
| E2 | coord 集成 | P1 | 1h |
| E3 | 重复报告 | P2 | 0.5h |
| **合计** | | | **2.5h** |

---

### E1: 去重检测脚本

**根因**: 提案阶段未检测相似根因，导致重复派发。

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S1.1 | 文本相似度检测 | 0.5h | `expect(simScore).toBeGreaterThan(0.8)` ✓ |
| S1.2 | 根因聚类 | 0.5h | `expect(cluster).toContain(candidates)` ✓ |

**验收标准**:
- `expect(dedup).toBeDefined()` ✓
- `expect(clusterCount).toBeLessThan(rawCount)` ✓

**DoD**:
- [ ] 去重脚本存在
- [ ] 可检测相似提案

---

### E2: coord 集成

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S2.1 | 派发前检查 | 1h | `expect(coord).toCall(dedup)` ✓ |

**验收标准**:
- `expect(coord.blocksDuplicate).toBe(true)` ✓

**DoD**:
- [ ] coord 派发前调用去重检查

---

### E3: 重复报告

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S3.1 | 报告输出 | 0.5h | `expect(report).toContain(dupPairs)` ✓ |

**验收标准**:
- `expect(report.format).toBe('markdown')` ✓

**DoD**:
- [ ] 重复提案报告生成

---

## 3. 功能点汇总

| ID | 功能点 | Epic | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | 相似度检测 | E1 | expect(score).toBeGreaterThan(0.8) | 无 |
| F1.2 | 根因聚类 | E1 | expect(clusters).toBeDefined() | 无 |
| F2.1 | coord 集成 | E2 | expect(coord.blocks).toBe(true) | 无 |
| F3.1 | 报告生成 | E3 | expect(report).toBeDefined() | 无 |

---

## 4. DoD

- [ ] 去重检测脚本可用
- [ ] coord 派发前检查集成
- [ ] 重复提案报告生成

---

*文档版本: v1.0 | 最后更新: 2026-04-05*
