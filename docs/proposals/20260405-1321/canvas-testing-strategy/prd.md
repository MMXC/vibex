# PRD: Canvas Testing Strategy

> **项目**: canvas-testing-strategy  
> **目标**: 为 canvas-split-hooks 重构补充测试覆盖  
> **分析者**: analyst agent  
> **PRD 作者**: pm agent  
> **日期**: 2026-04-05  
> **版本**: v1.0

---

## 1. 执行摘要

### 背景
`CanvasPage.tsx`（1120 行）正在被拆分为 7 个 hooks，其中 6 个**无测试覆盖**。重构过程中边界条件遗漏不会被自动发现，直到人工 QA 阶段才暴露——成本极高。

### 目标
- P0: 为 3 个高风险 hook 补充测试（useCanvasRenderer, useDndSortable, useDragSelection）
- P1: 为 2 个中风险 hook 补充测试（useCanvasSearch, useTreeToolbarActions）
- P2: 为 1 个低风险 hook 补充测试（useVersionHistory）

### 成功指标
- AC1: 3 个 P0 hook 测试覆盖率 > 80%
- AC2: 2 个 P1 hook 测试覆盖率 > 60%
- AC3: 重构后所有测试通过
- AC4: CI 集成测试通过

---

## 2. Epic 拆分

### Epic 总览

| Epic | 名称 | 优先级 | 工时 | 风险 |
|------|------|--------|------|------|
| E1 | useCanvasRenderer 测试 | P0 | 3h | 静默数据损坏 |
| E2 | useDndSortable 测试 | P0 | 3h | 拖拽竞态 |
| E3 | useDragSelection 测试 | P0 | 2h | 框选逻辑 |
| E4 | useCanvasSearch 测试 | P1 | 1.5h | 搜索过滤 |
| E5 | useTreeToolbarActions 测试 | P1 | 1.5h | 工具栏操作 |
| E6 | useVersionHistory 测试 | P2 | 1h | 历史版本 |
| **合计** | | | **12h** | |

---

### Epic 1: useCanvasRenderer 测试

**问题根因**: 所有渲染计算（node rects、edges、TreeNode 数组）均为 `useMemo`，重构时引用丢失会静默损坏数据。

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S1.1 | 渲染计算测试 | 3h | 见下方 |

**S1.1 验收标准**:
- `expect(renderer).toMatchSnapshot()` ✓
- `expect(nodeRects).toBeDefined()` ✓
- `expect(edges).toHaveLength(expectedLength)` ✓
- 边界条件：nodes=[] / nodes=null / nodes=undefined ✓

**DoD**:
- [ ] 测试文件创建: `hooks/canvas/__tests__/useCanvasRenderer.test.ts`
- [ ] 覆盖率 > 80%
- [ ] 边界条件测试通过

---

### Epic 2: useDndSortable 测试

**问题根因**: 拖拽排序有竞态风险，无测试保护。

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S2.1 | 拖拽排序测试 | 3h | 见下方 |

**S2.1 验收标准**:
- `expect(sortedItems).toBeSorted()` ✓
- `expect(swapCount).toBe(expected)` ✓
- 竞态条件：快速连续拖拽 ✓

**DoD**:
- [ ] 测试文件创建: `hooks/canvas/__tests__/useDndSortable.test.ts`
- [ ] 覆盖率 > 80%
- [ ] 竞态测试通过

---

### Epic 3: useDragSelection 测试

**问题根因**: 框选逻辑无测试，可能静默失效。

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S3.1 | 框选逻辑测试 | 2h | 见下方 |

**S3.1 验收标准**:
- `expect(selectedNodes).toContain(nodeId)` ✓
- `expect(selectionRect).toBeDefined()` ✓
- 边界：selectionStart === selectionEnd ✓

**DoD**:
- [ ] 测试文件创建: `hooks/canvas/__tests__/useDragSelection.test.ts`
- [ ] 覆盖率 > 80%
- [ ] 边界条件测试通过

---

### Epic 4: useCanvasSearch 测试

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S4.1 | 搜索过滤测试 | 1.5h | 见下方 |

**S4.1 验收标准**:
- `expect(results).toContain(searchTerm)` ✓
- `expect(debounce).toHaveBeenCalled()` ✓

**DoD**:
- [ ] 测试文件创建
- [ ] 覆盖率 > 60%

---

### Epic 5: useTreeToolbarActions 测试

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S5.1 | 工具栏操作测试 | 1.5h | 见下方 |

**S5.1 验收标准**:
- `expect(action).toHaveBeenCalledWith(expected)` ✓
- `expect(storeUpdate).toHaveBeenCalled()` ✓

**DoD**:
- [ ] 测试文件创建
- [ ] 覆盖率 > 60%

---

### Epic 6: useVersionHistory 测试

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------||------|------|----------|
| S6.1 | 历史版本测试 | 1h | 见下方 |

**S6.1 验收标准**:
- `expect(versions).toHaveLength(expected)` ✓
- `expect(currentVersion).toBeDefined()` ✓

**DoD**:
- [ ] 测试文件创建
- [ ] 覆盖率 > 50%

---

## 3. 功能点汇总

| ID | 功能点 | Epic | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | useCanvasRenderer 测试 | E1 | expect(coverage).toBeGreaterThan(80) | 无 |
| F2.1 | useDndSortable 测试 | E2 | expect(coverage).toBeGreaterThan(80) | 无 |
| F3.1 | useDragSelection 测试 | E3 | expect(coverage).toBeGreaterThan(80) | 无 |
| F4.1 | useCanvasSearch 测试 | E4 | expect(coverage).toBeGreaterThan(60) | 无 |
| F5.1 | useTreeToolbarActions 测试 | E5 | expect(coverage).toBeGreaterThan(60) | 无 |
| F6.1 | useVersionHistory 测试 | E6 | expect(coverage).toBeGreaterThan(50) | 无 |

---

## 4. 验收标准汇总

| ID | Given | When | Then |
|----|-------|------|------|
| AC1 | P0 hook 测试 | 运行 jest | 覆盖率 > 80% |
| AC2 | P1 hook 测试 | 运行 jest | 覆盖率 > 60% |
| AC3 | 重构完成 | 所有测试运行 | 全部通过 |
| AC4 | CI 环境 | push 代码 | 测试通过 |

---

## 5. DoD (Definition of Done)

### E1-E3: P0 Hook 测试
- [ ] 测试文件创建
- [ ] 覆盖率 > 80%
- [ ] 边界条件覆盖
- [ ] 竞态条件覆盖

### E4-E5: P1 Hook 测试
- [ ] 测试文件创建
- [ ] 覆盖率 > 60%

### E6: P2 Hook 测试
- [ ] 测试文件创建
- [ ] 覆盖率 > 50%

---

## 6. 实施计划

### Sprint 1 (P0, 8h)
| Epic | 内容 | 工时 |
|------|------|------|
| E1 | useCanvasRenderer 测试 | 3h |
| E2 | useDndSortable 测试 | 3h |
| E3 | useDragSelection 测试 | 2h |

### Sprint 2 (P1-P2, 4h)
| Epic | 内容 | 工时 |
|------|------|------|
| E4 | useCanvasSearch 测试 | 1.5h |
| E5 | useTreeToolbarActions 测试 | 1.5h |
| E6 | useVersionHistory 测试 | 1h |

---

## 7. 非功能需求

| 需求 | 描述 |
|------|------|
| 性能 | 测试运行 < 5 分钟 |
| 可靠性 | CI 稳定，无 flaky 测试 |

---

## 8. 风险缓解

| 风险 | 缓解措施 |
|------|----------|
| 重构引入回归 | 测试先行，TDD 流程 |
| Flaky 测试 | 添加 retry/flaky 检测 |
| 覆盖率虚高 | 要求分支覆盖率 > 70% |

---

*文档版本: v1.0 | 最后更新: 2026-04-05*
