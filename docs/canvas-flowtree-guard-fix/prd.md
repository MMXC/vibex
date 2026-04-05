# PRD: canvas-flowtree-guard-fix

> **项目**: canvas-flowtree-guard-fix  
> **目标**: 修复 FlowTree 在 Canvas Tab 切换时消失的问题  
> **分析者**: analyst agent  
> **PRD 作者**: pm agent  
> **日期**: 2026-04-05  
> **版本**: v1.0

---

## 1. 执行摘要

### 背景
FlowTree 在 Canvas Tab 切换时消失，因为 guard 逻辑与 TabBar 状态不同步。PhaseProgressBar 和 TabBar 均控制 activeTree，但 guard 只监听 PhaseProgressBar。

### 目标
- P0: 修复 Tab 切换时 FlowTree 消失
- P0: 统一 guard 逻辑与 TabBar 状态

### 成功指标
- AC1: Tab 切换后 FlowTree 可见
- AC2: guard 逻辑与 TabBar 同步

---

## 2. Epic 拆分

| Epic | 名称 | 优先级 | 工时 |
|------|------|--------|------|
| E1 | guard 逻辑修复 | P0 | 1h |
| E2 | TabBar 状态同步 | P0 | 0.5h |
| E3 | 验证测试 | P0 | 0.5h |
| **合计** | | | **2h** |

---

### E1: guard 逻辑修复

**根因**: guard 只监听 PhaseProgressBar，TabBar 切换时 guard 不同步。

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S1.1 | guard 监听 TabBar | 1h | `expect(FlowTree.visible).toBe(true)` ✓ |

**验收标准**:
- `expect(flowTree).toBeVisible()` ✓

**DoD**:
- [ ] guard 逻辑修复
- [ ] FlowTree 切换后可见

---

### E2: TabBar 状态同步

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S2.1 | activeTree 同步 | 0.5h | `expect(activeTree).toBe('flow')` ✓ |

**验收标准**:
- `expect(activeTree).toMatch(/(context|flow|component)/)` ✓

**DoD**:
- [ ] activeTree 正确更新

---

### E3: 验证测试

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S3.1 | E2E 测试 | 0.5h | `expect(e2e).toPass()` ✓ |

**验收标准**:
- `expect(playwright.flowTree).toBeVisible()` ✓

**DoD**:
- [ ] E2E 测试通过

---

## 3. 功能点汇总

| ID | 功能点 | Epic | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | guard 修复 | E1 | expect(flowTree).toBeVisible() | 【需页面集成】 |
| F2.1 | TabBar 同步 | E2 | expect(activeTree).toBeDefined() | 【需页面集成】 |
| F3.1 | E2E 验证 | E3 | expect(test).toPass() | 无 |

---

## 4. DoD

- [ ] FlowTree 切换 Tab 后可见
- [ ] guard 逻辑与 TabBar 同步
- [ ] E2E 测试通过

---

*文档版本: v1.0 | 最后更新: 2026-04-05*
