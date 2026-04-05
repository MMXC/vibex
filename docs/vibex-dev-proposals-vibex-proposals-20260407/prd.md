# PRD: Vibex Proposals 2026-04-07

> **项目**: vibex-dev-proposals-vibex-proposals-20260407  
> **目标**: 基于 2026-04-06 工作汇总提案修复项  
> **来源**: proposals/20260406/ (analyst, architect, pm, tester, reviewer)  
> **PRD 作者**: pm agent  
> **日期**: 2026-04-05  
> **版本**: v1.0

---

## 1. 执行摘要

### 背景
2026-04-06 完成多个 Bug 修复任务（OPTIONS、Canvas Selection、flowId 等），提案汇总出待修复项需要持续推进。

### 来源
| Agent | 提案数 | 关键提案 |
|-------|--------|----------|
| analyst | 6 | P0×3, P1×3 |
| architect | 4 | P0×2, P1×2 |
| pm | 5 | P0×3, P1×2 |
| tester | 4 | P0×3, P1×1 |
| reviewer | 4 | P0×2, P1×2 |

### 目标
- P0: 继续推进 P0 修复项
- P1: 推进 P1 稳定性改进
- P2: 规划 P2 技术债务

### 成功指标
- AC1: P0 Bug 修复完成率 100%
- AC2: P1 改进项完成率 > 80%
- AC3: 提案去重机制落地

---

## 2. Epic 拆分

### Epic 总览

| Epic | 名称 | 优先级 | 工时 | 关联提案 |
|------|------|--------|------|----------|
| E1 | OPTIONS 预检路由修复 | P0 | 0.5h | A-P0-1 |
| E2 | Canvas Context 多选修复 | P0 | 0.3h | A-P0-2 |
| E3 | generate-components flowId | P0 | 0.3h | A-P0-3 |
| E4 | SSE 超时控制 | P1 | 1.5h | A-P1-1 |
| E5 | 分布式限流 | P1 | 1.5h | A-P1-2 |
| E6 | test-notify 去重 | P1 | 1h | A-P1-3 |
| E7 | 提案去重机制 | P2 | 2h | A-P2-1 |
| **合计** | | | **7.6h** | |

---

### Epic 1-3: P0 Bug 修复

**来源**: A-P0-1, A-P0-2, A-P0-3

| Story | 描述 | 验收标准 |
|-------|------|----------|
| S1.1 | OPTIONS 路由顺序 | `expect(status).toBe(204)` ✓ |
| S2.1 | Canvas checkbox | `expect(onToggleSelect).toHaveBeenCalled()` ✓ |
| S3.1 | flowId schema | `expect(flowId).toMatch(/^flow-/)` ✓ |

**DoD**: 所有 P0 Bug 修复测试通过

---

### Epic 4-6: P1 稳定性改进

| Story | 描述 | 验收标准 |
|-------|------|----------|
| S4.1 | SSE 超时 | `expect(timeout).toBe(10000)` ✓ |
| S5.1 | Cache API 限流 | `expect(caches.default).toBeDefined()` ✓ |
| S6.1 | test-notify 去重 | `expect(skipped).toBe(true)` ✓ |

**DoD**: P1 改进项完成率 > 80%

---

### Epic 7: 提案去重机制

| Story | 描述 | 验收标准 |
|-------|------|----------|
| S7.1 | 去重脚本 | `expect(dedup).toBeDefined()` ✓ |

**DoD**: 提案去重脚本可用

---

## 3. 功能点汇总

| ID | 功能点 | Epic | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | OPTIONS 路由 | E1 | expect(204).toBe(status) | 无 |
| F2.1 | Canvas checkbox | E2 | expect(onToggleSelect).toHaveBeenCalled() | 【需页面集成】 |
| F3.1 | flowId schema | E3 | expect(flowId).toMatch(/^flow-/) | 无 |
| F4.1 | SSE 超时 | E4 | expect(timeout).toBe(10000) | 无 |
| F5.1 | Cache 限流 | E5 | expect(caches.default).toBeDefined() | 无 |
| F6.1 | test-notify 去重 | E6 | expect(skipped).toBe(true) | 无 |
| F7.1 | 提案去重 | E7 | expect(dedupScript).toBeDefined() | 无 |

---

## 4. 验收标准汇总

| ID | Given | When | Then |
|----|-------|------|------|
| AC1 | OPTIONS 请求 | `/v1/projects` | 204 + CORS |
| AC2 | Canvas checkbox | 点击 | selectedNodeIds 更新 |
| AC3 | generate-components | AI 输出 | flowId 正确 |
| AC4 | SSE 流 | 10s 无响应 | 流关闭 |
| AC5 | 限流 | 100 并发 | 计数一致 |
| AC6 | test-notify | 5min 内重复 | 跳过 |
| AC7 | 提案收集 | 检测重复 | 自动标记 |

---

## 5. DoD

- [ ] 所有 P0 Bug 修复测试通过
- [ ] P1 改进项完成率 > 80%
- [ ] 提案去重脚本可用
- [ ] 无新增重复提案

---

## 6. 实施计划

### Sprint 1 (P0, 1.1h)
| Epic | 内容 | 工时 |
|------|------|------|
| E1 | OPTIONS 预检路由 | 0.5h |
| E2 | Canvas 多选修复 | 0.3h |
| E3 | flowId schema | 0.3h |

### Sprint 2 (P1, 4h)
| Epic | 内容 | 工时 |
|------|------|------|
| E4 | SSE 超时 | 1.5h |
| E5 | Cache 限流 | 1.5h |
| E6 | test-notify 去重 | 1h |

### Sprint 3 (P2, 2h)
| Epic | 内容 | 工时 |
|------|------|------|
| E7 | 提案去重机制 | 2h |

---

*文档版本: v1.0 | 最后更新: 2026-04-05*
