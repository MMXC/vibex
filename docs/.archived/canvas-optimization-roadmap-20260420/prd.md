# PRD: Canvas Optimization Roadmap

> **项目**: canvas-optimization-roadmap  
> **目标**: 执行 GLM Bot Canvas 路线图优化项  
> **分析者**: analyst agent  
> **PRD 作者**: pm agent  
> **日期**: 2026-04-05  
> **版本**: v1.0

---

## 1. 执行摘要

### 背景
GLM Bot Canvas 路线图（ae63742f, 498行）需要执行优化项，包含 Phase 0-3 共 4 个阶段。Analyst 验证了路线图评分，发现代码规范虚高（后端 13 处 console.error）。

### 目标
- Phase 0: 清理 dead code + 后端日志
- Phase 1: 架构分层
- Phase 2: 性能优化
- Phase 3: 可靠性 + 测试

### 成功指标
- AC1: dead code 清除
- AC2: console.log 清除
- AC3: 性能提升

---

## 2. Epic 拆分

| Epic | 名称 | 优先级 | 工时 |
|------|------|--------|------|
| E1 | Phase 0 清理 | P0 | 4h |
| E2 | Phase 1 架构分层 | P1 | 6h |
| E3 | Phase 2 性能优化 | P1 | 4h |
| E4 | Phase 3 可靠性 | P2 | 3h |
| **合计** | | | **17h** |

---

### E1: Phase 0 清理

**风险**: 0.3 dddApi.ts 删除可能影响 homepage 依赖。

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S1.1 | deprecated.ts | 0.5h | `expect(file).not.toExist()` ✓ |
| S1.2 | cascade re-export | 0.5h | `expect(export).toBeRemoved()` ✓ |
| S1.3 | dddApi.ts | 0.5h | `expect(homepage).toBeVerified()` ✓ |
| S1.4 | Mock 数据 | 1h | `expect(mock).toBeRemoved()` ✓ |
| S1.5 | console.log | 1.5h | `expect(console.log).toBe(0)` ✓ |

**DoD**:
- [ ] dead code 清除
- [ ] homepage 依赖验证
- [ ] 后端日志清除

---

### E2: Phase 1 架构分层

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S2.1 | 三层清晰 | 6h | `expect(layers).toBe(3)` ✓ |

---

### E3: Phase 2 性能优化

**根因**: `computeBoundedEdges` O(n²) 算法。

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S3.1 | O(n²) 优化 | 4h | `expect(complexity).toBe('O(n)')` ✓ |

---

### E4: Phase 3 可靠性

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S4.1 | ErrorBoundary | 1.5h | `expect(boundary).toBeDefined()` ✓ |
| S4.2 | 测试补充 | 1.5h | `expect(coverage).toBeGreaterThan(80)` ✓ |

---

## 3. 功能点汇总

| ID | 功能点 | Epic | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | deprecated.ts 清除 | E1 | expect(file).not.toExist() | 无 |
| F1.2 | dddApi 验证 | E1 | expect(homepage).toBeVerified() | 无 |
| F1.3 | Mock 清除 | E1 | expect(mock).toBeRemoved() | 无 |
| F1.4 | console 清除 | E1 | expect(count).toBe(0) | 无 |
| F2.1 | 架构分层 | E2 | expect(layers).toBe(3) | 无 |
| F3.1 | 性能优化 | E3 | expect(complexity).toBe('O(n)') | 无 |
| F4.1 | ErrorBoundary | E4 | expect(boundary).toBeDefined() | 无 |
| F4.2 | 测试覆盖 | E4 | expect(coverage).toBeGreaterThan(80) | 无 |

---

## 4. DoD

- [ ] Phase 0 完成
- [ ] Phase 1 架构分层完成
- [ ] Phase 2 性能优化完成
- [ ] Phase 3 可靠性完成

---

*文档版本: v1.0 | 最后更新: 2026-04-05*
