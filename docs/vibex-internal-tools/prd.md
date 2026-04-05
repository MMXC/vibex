# PRD: Internal Tools Integration

> **项目**: vibex-internal-tools  
> **目标**: 将孤立的 dedup 工具集成到 coord 工作流  
> **分析者**: analyst agent  
> **PRD 作者**: pm agent  
> **日期**: 2026-04-05  
> **版本**: v1.0

---

## 1. 执行摘要

### 背景
项目已有 dedup 工具（`scripts/dedup/`），包含 Jaccard 相似度算法和规则引擎，但**均未集成到实际工作流**，属于孤立脚本。

### 目标
- P0: coord 集成 dedup 检查
- P1: 提案派发前自动去重
- P2: 告警通知

### 成功指标
- AC1: coord 派生前调用 dedup
- AC2: 重复提案自动标记

---

## 2. Epic 拆分

| Epic | 名称 | 优先级 | 工时 |
|------|------|--------|------|
| E1 | dedup API 封装 | P0 | 1h |
| E2 | coord 集成 | P1 | 2h |
| E3 | 告警通知 | P2 | 1h |
| **合计** | | | **4h** |

---

### E1: dedup API 封装

**根因**: dedup.py 是独立脚本，无 API 接口。

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S1.1 | CLI → API | 0.5h | `expect(api).toBeDefined()` ✓ |
| S1.2 | HTTP 接口 | 0.5h | `expect(endpoint).toBe('/dedup')` ✓ |

**验收标准**:
- `expect(dedup('test', 'goal')).toContain('similarity')` ✓

**DoD**:
- [ ] dedup 提供 API 接口

---

### E2: coord 集成

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S2.1 | 派生前检查 | 1h | `expect(coord).toCall(dedup)` ✓ |
| S2.2 | 自动标记 | 1h | `expect(project).toBeFlagged()` ✓ |

**验收标准**:
- `expect(coord.blocksDuplicate).toBe(true)` ✓

**DoD**:
- [ ] coord 派生前调用 dedup
- [ ] 重复提案自动标记

---

### E3: 告警通知

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S3.1 | 告警输出 | 1h | `expect(alert).toContain('duplicate')` ✓ |

**验收标准**:
- `expect(alert.sent).toBe(true)` ✓

**DoD**:
- [ ] 重复提案告警发送

---

## 3. 功能点汇总

| ID | 功能点 | Epic | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | dedup API | E1 | expect(api).toBeDefined() | 无 |
| F1.2 | HTTP 接口 | E1 | expect(endpoint).toBe('/dedup') | 无 |
| F2.1 | coord 集成 | E2 | expect(coord.calls).toContain('dedup') | 无 |
| F2.2 | 自动标记 | E2 | expect(flag).toBe(true) | 无 |
| F3.1 | 告警通知 | E3 | expect(alert).toContain('duplicate') | 无 |

---

## 4. DoD

- [ ] dedup API 存在
- [ ] coord 派生前调用 dedup
- [ ] 重复提案告警发送

---

*文档版本: v1.0 | 最后更新: 2026-04-05*
