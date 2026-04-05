# PRD: TypeScript `as any` Cleanup

> **项目**: vibex-ts-any-cleanup  
> **目标**: 清除 33 个源码 `as any` 类型断言，降低类型安全债务  
> **分析者**: analyst agent  
> **PRD 作者**: pm agent  
> **日期**: 2026-04-05  
> **版本**: v1.0

---

## 1. 执行摘要

### 背景
`vibex-fronted` 启用 strict 模式但 ESLint `@typescript-eslint/no-explicit-any` 被关闭，导致 107 处 `as any` 蔓延，其中源码 33 处（高风险）。

### 根因
canvas store 类型不匹配（`setContextNodes` 签名与 history snapshot 类型不一致）导致 12/33 处 `as any` 集中于 useCanvasHistory。

### 目标
- P0: 修复 useCanvasHistory 相关 12 处
- P1: 修复剩余 21 处源码 as any
- P2: 启用 ESLint 规则

### 成功指标
- AC1: 源码 `as any` 从 33 → 0
- AC2: `@typescript-eslint/no-explicit-any` 规则启用
- AC3: `tsc --noEmit` 0 error

---

## 2. Epic 拆分

| Epic | 名称 | 优先级 | 工时 | 风险 |
|------|------|--------|------|------|
| E1 | Canvas History 类型修复 | P0 | 2h | 高 |
| E2 | 剩余源码清理 | P1 | 2h | 中 |
| E3 | ESLint 规则启用 | P2 | 0.5h | 低 |
| **合计** | | | **4.5h** | |

---

### E1: Canvas History 类型修复

**根因**: history snapshot 类型与 BoundedContextNode[] 不匹配。

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S1.1 | 定义 CanvasSnapshot 类型 | 1h | `expect(CanvasSnapshot).toBeDefined()` ✓ |
| S1.2 | 修复 useCanvasHistory | 1h | `expect(asAnyCount).toBe(0)` ✓ |

**验收标准**:
- `expect(tsc()).toHaveError(0)` ✓
- `expect(asAnyInHistory).toBe(0)` ✓

**DoD**:
- [ ] `CanvasSnapshot` 类型定义存在
- [ ] `useCanvasHistory.ts` 无 `as any`
- [ ] `UndoBar.tsx` 无 `as any`
- [ ] `ProjectBar.tsx` 无 `as any`

---

### E2: 剩余源码清理

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S2.1 | useDDDStateRestore | 0.5h | `expect(asAny).toBe(0)` ✓ |
| S2.2 | preview/page.tsx | 0.5h | `expect(asAny).toBe(0)` ✓ |
| S2.3 | CardTreeRenderer | 0.5h | `expect(asAny).toBe(0)` ✓ |
| S2.4 | 边界文件 | 0.5h | `expect(asAny).toBe(0)` ✓ |

**验收标准**:
- `expect(sourceAsAny).toBe(0)` ✓

**DoD**:
- [ ] 所有 .ts/.tsx 文件无 `as any`
- [ ] mock 文件标注 `// eslint-disable-next-line`

---

### E3: ESLint 规则启用

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S3.1 | 启用规则 | 0.5h | `expect(rule).toBe('error')` ✓ |

**验收标准**:
- `expect(eslint).toContain('no-explicit-any')` ✓
- `expect(eslint.level).toBe('error')` ✓

**DoD**:
- [ ] ESLint 规则从 `'off'` 改为 `'error'`

---

## 3. 功能点汇总

| ID | 功能点 | Epic | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | CanvasSnapshot 类型 | E1 | expect(type).toBeDefined() | 无 |
| F1.2 | useCanvasHistory 修复 | E1 | expect(asAny).toBe(0) | 无 |
| F1.3 | UndoBar/ProjectBar 修复 | E1 | expect(asAny).toBe(0) | 无 |
| F2.1 | DDD state 修复 | E2 | expect(asAny).toBe(0) | 无 |
| F2.2 | preview/page 修复 | E2 | expect(asAny).toBe(0) | 无 |
| F2.3 | CardTreeRenderer 修复 | E2 | expect(asAny).toBe(0) | 无 |
| F3.1 | ESLint 启用 | E3 | expect(level).toBe('error') | 无 |

---

## 4. 验收标准汇总

| ID | Given | When | Then |
|----|-------|------|------|
| AC1 | 源码文件 | `grep -r "as any"` | 0 matches |
| AC2 | ESLint | 运行 | 规则启用 |
| AC3 | 类型检查 | `tsc --noEmit` | 0 error |

---

## 5. DoD

- [ ] `CanvasSnapshot` 类型定义
- [ ] 所有 canvas history 相关 `as any` 清除
- [ ] 源码 33 处 `as any` → 0
- [ ] ESLint 规则启用

---

## 6. 风险缓解

| 风险 | 缓解 |
|------|------|
| 类型修复引入回归 | 先加类型再改实现，TDD |
| mock 文件误报 | 添加 eslint-disable 注释 |

---

*文档版本: v1.0 | 最后更新: 2026-04-05*
